/**
 * API Spike Test
 * Tests system behavior under sudden traffic spikes
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { getEnvironment, getAuthToken } from '../../k6.config.js';
import { spikeTest } from '../../scenarios/load-profile.js';

// Custom metrics
const errorRate = new Rate('errors');
const spikeErrors = new Counter('spike_errors');
const recoveryErrors = new Counter('recovery_errors');
const apiDuration = new Trend('api_duration');

// Test configuration
export const options = {
  scenarios: {
    spike: spikeTest,
  },
  thresholds: {
    // System should recover within acceptable timeframes
    http_req_duration: ['p(95)<3000'],

    // Higher error tolerance during spike, but should recover
    errors: ['rate<0.10'],

    // Track spike vs recovery errors separately
    spike_errors: ['count<100'],
    recovery_errors: ['count<10'],
  },
};

// Setup
export function setup() {
  const env = getEnvironment();
  console.log(`Spike testing against: ${env.baseUrl}`);

  return {
    baseUrl: env.baseUrl,
    authToken: getAuthToken(),
    startTime: Date.now(),
  };
}

// Main test
export default function (data) {
  const { baseUrl, authToken, startTime } = data;

  // Calculate elapsed time to detect spike vs recovery phase
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const isSpike = elapsed > 40 && elapsed < 110; // Spike phase

  const res = http.get(`${baseUrl}/health`, {
    tags: {
      name: 'health',
      phase: isSpike ? 'spike' : 'normal',
    },
  });

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 3000,
    'has valid body': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);

    // Track errors by phase
    if (isSpike) {
      spikeErrors.add(1);
    } else {
      recoveryErrors.add(1);
    }

    console.log(`[${isSpike ? 'SPIKE' : 'NORMAL'}] Error at ${elapsed}s: Status ${res.status}`);
  }

  apiDuration.add(res.timings.duration);

  // Test authenticated endpoint if token available
  if (authToken && Math.random() > 0.5) {
    const usersRes = http.get(`${baseUrl}/users`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      tags: {
        name: 'users',
        phase: isSpike ? 'spike' : 'normal',
      },
    });

    check(usersRes, {
      'users status ok': (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  // Very short sleep - we want rapid requests
  sleep(0.1);
}

// Teardown
export function teardown(data) {
  console.log('Spike test completed');
  console.log('Check metrics for:');
  console.log('  - Errors during spike phase');
  console.log('  - Recovery time after spike');
  console.log('  - System stability post-spike');
}
