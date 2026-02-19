/**
 * API Stress Test
 * Gradually increases load to find system breaking point
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getEnvironment, getAuthToken } from '../../k6.config.js';
import { stressTest } from '../../scenarios/load-profile.js';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

// Test configuration
export const options = {
  scenarios: {
    stress: stressTest,
  },
  thresholds: {
    // Relax thresholds for stress testing
    http_req_duration: ['p(95)<2000'], // 2 seconds acceptable under stress
    errors: ['rate<0.05'], // 5% error rate acceptable
  },
};

// Setup
export function setup() {
  const env = getEnvironment();
  console.log(`Stress testing against: ${env.baseUrl}`);

  return {
    baseUrl: env.baseUrl,
    authToken: getAuthToken(),
  };
}

// Main test
export default function (data) {
  const { baseUrl, authToken } = data;

  // Mix of endpoints to stress the system
  const endpoints = [
    { url: `${baseUrl}/health`, name: 'health', requiresAuth: false },
    { url: `${baseUrl}/users`, name: 'users', requiresAuth: true },
  ];

  // Randomly pick an endpoint
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  // Skip authenticated endpoints if no token
  if (endpoint.requiresAuth && !authToken) {
    sleep(0.5);
    return;
  }

  const headers = endpoint.requiresAuth
    ? {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    : {
        'Content-Type': 'application/json',
      };

  const res = http.get(endpoint.url, {
    headers,
    tags: { name: endpoint.name },
  });

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 5000,
  });

  if (!success) {
    errorRate.add(1);
  }

  apiDuration.add(res.timings.duration);

  // Log errors for analysis
  if (res.status !== 200) {
    console.log(`Error: ${endpoint.name} returned ${res.status}`);
  }

  // Shorter sleep during stress test
  sleep(Math.random() * 0.5);
}

// Teardown
export function teardown(data) {
  console.log('Stress test completed');
  console.log('Review metrics to identify breaking point');
}
