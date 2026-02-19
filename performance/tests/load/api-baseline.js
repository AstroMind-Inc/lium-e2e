/**
 * API Baseline Load Test
 * Establishes performance baseline for API endpoints
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { getEnvironment, getAuthToken } from '../../k6.config.js';
import { baselineLoad } from '../../scenarios/load-profile.js';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const successfulRequests = new Counter('successful_requests');

// Test configuration
export const options = {
  scenarios: {
    baseline: baselineLoad,
  },
  thresholds: {
    // 95% of requests should be below 500ms
    http_req_duration: ['p(95)<500'],

    // Error rate should be less than 1%
    errors: ['rate<0.01'],

    // Successful requests should be > 95%
    'successful_requests': ['count>950'],
  },
};

// Setup function - runs once before test
export function setup() {
  const env = getEnvironment();
  console.log(`Testing against: ${env.baseUrl}`);
  console.log(`Environment: ${env.name}`);

  return {
    baseUrl: env.baseUrl,
    authToken: getAuthToken(),
  };
}

// Main test function - runs repeatedly for each VU
export default function (data) {
  const { baseUrl, authToken } = data;

  // Test 1: Health check endpoint
  const healthRes = http.get(`${baseUrl}/health`, {
    tags: { name: 'health' },
  });

  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
    'health has status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  apiDuration.add(healthRes.timings.duration);

  if (healthRes.status === 200) {
    successfulRequests.add(1);
  }

  sleep(1); // Wait 1 second between iterations

  // Test 2: Authenticated endpoint (if token available)
  if (authToken) {
    const usersRes = http.get(`${baseUrl}/users`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'users' },
    });

    check(usersRes, {
      'users status is 200': (r) => r.status === 200,
      'users response time < 500ms': (r) => r.timings.duration < 500,
      'users has data field': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined;
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);

    apiDuration.add(usersRes.timings.duration);

    if (usersRes.status === 200) {
      successfulRequests.add(1);
    }

    sleep(1);
  }
}

// Teardown function - runs once after test
export function teardown(data) {
  console.log('Test completed');
}
