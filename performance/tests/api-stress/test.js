/**
 * API Stress Test
 *
 * Gradually increases load to find the API's breaking point.
 * Helps identify maximum capacity and performance degradation patterns.
 *
 * Run: k6 run performance/tests/api-stress/stress-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ============================================================================
// Custom Metrics
// ============================================================================

const errorRate = new Rate("errors");
const apiLatency = new Trend("api_latency");

// ============================================================================
// Test Configuration
// ============================================================================

export const options = {
  stages: [
    { duration: "1m", target: 10 }, // Start light
    { duration: "1m", target: 25 }, // Increase
    { duration: "1m", target: 50 }, // Keep increasing
    { duration: "1m", target: 75 }, // Stress level
    { duration: "1m", target: 100 }, // High stress
    { duration: "1m", target: 125 }, // Breaking point
    { duration: "30s", target: 0 }, // Ramp down
  ],

  thresholds: {
    http_req_duration: ["p(95)<2000"], // Accept degradation
    http_req_failed: ["rate<0.1"], // <10% failure acceptable under stress
  },
};

const BASE_URL = __ENV.BASE_URL || "http://lium-api:8000";

// ============================================================================
// Setup
// ============================================================================

export function setup() {
  console.log("💪 Starting API Stress Test");
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Duration: ~6.5 minutes`);
  console.log(`   Peak Load: 125 concurrent users`);
  console.log("");

  return { baseUrl: BASE_URL };
}

// ============================================================================
// Main Test
// ============================================================================

export default function (data) {
  const endpoints = ["/healthz", "/api/users", "/api/chats", "/api/agents"];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const startTime = Date.now();
  const res = http.get(`${data.baseUrl}${endpoint}`);
  const duration = Date.now() - startTime;

  apiLatency.add(duration);

  const success = check(res, {
    "status is 2xx or 3xx": (r) => r.status >= 200 && r.status < 400,
    "response time reasonable": (r) => r.timings.duration < 3000,
  });

  errorRate.add(!success ? 1 : 0);

  sleep(Math.random() * 2); // Variable think time
}

// ============================================================================
// Teardown
// ============================================================================

export function teardown(data) {
  console.log("");
  console.log("✅ Stress Test Complete");
  console.log("   Review results to identify breaking point");
}
