/**
 * Homepage Performance Test
 * Basic load test for the Lium homepage
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp up to 5 users over 10s
    { duration: '20s', target: 5 },   // Stay at 5 users for 20s
    { duration: '10s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.1'],     // Error rate should be less than 10%
    errors: ['rate<0.1'],              // Custom error rate
  },
};

// Get base URL from environment or use default
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test homepage
  const res = http.get(BASE_URL);

  // Checks
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'has HTML content': (r) => r.body && (r.body.includes('html') || r.body.includes('HTML')),
  });

  // Record errors
  errorRate.add(!success);

  // Think time (simulate user reading page)
  sleep(1);
}

// Summary handler
export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Simple text summary
function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors !== false;

  const metrics = data.metrics;
  const checks = data.root_group.checks || [];

  let summary = `\n${indent}📊 Performance Test Summary\n`;
  summary += `${indent}${'━'.repeat(50)}\n\n`;

  // Test duration
  if (metrics.iteration_duration) {
    summary += `${indent}Duration:        ${formatDuration(metrics.iteration_duration.values.avg)}\n`;
  }

  // Requests
  if (metrics.http_reqs) {
    summary += `${indent}Total Requests:  ${metrics.http_reqs.values.count}\n`;
  }

  // Response time
  if (metrics.http_req_duration) {
    summary += `\n${indent}Response Times:\n`;
    summary += `${indent}  Average:       ${formatDuration(metrics.http_req_duration.values.avg)}\n`;
    summary += `${indent}  95th %ile:     ${formatDuration(metrics.http_req_duration.values['p(95)'])}\n`;
    summary += `${indent}  Max:           ${formatDuration(metrics.http_req_duration.values.max)}\n`;
  }

  // Error rate
  if (metrics.http_req_failed) {
    const failRate = metrics.http_req_failed.values.rate * 100;
    const status = failRate < 10 ? '✓' : '✗';
    summary += `\n${indent}Error Rate:      ${status} ${failRate.toFixed(2)}%\n`;
  }

  // Checks
  if (checks.length > 0) {
    summary += `\n${indent}Checks:\n`;
    checks.forEach(check => {
      const passRate = (check.passes / (check.passes + check.fails)) * 100;
      const status = passRate === 100 ? '✓' : '✗';
      summary += `${indent}  ${status} ${check.name}: ${passRate.toFixed(1)}%\n`;
    });
  }

  summary += `\n${indent}${'━'.repeat(50)}\n`;

  return summary;
}

function formatDuration(ms) {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}
