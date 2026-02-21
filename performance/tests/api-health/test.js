/**
 * API Health Endpoint Load Test
 *
 * Tests the /healthz endpoint to ensure API can handle load.
 * Simple baseline test for API availability under load.
 *
 * Run: k6 run performance/tests/api-health/healthz.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ============================================================================
// Custom Metrics
// ============================================================================

const errorRate = new Rate("errors");
const responseTime = new Trend("response_time");
const totalRequests = new Counter("total_requests");

// ============================================================================
// Test Configuration
// ============================================================================

export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up to 10 users
    { duration: "1m", target: 10 }, // Stay at 10 users
    { duration: "20s", target: 25 }, // Spike to 25 users
    { duration: "20s", target: 25 }, // Hold spike
    { duration: "20s", target: 0 }, // Ramp down
  ],

  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"], // Health check should be fast
    http_req_failed: ["rate<0.01"], // <1% error rate
    errors: ["rate<0.01"], // <1% custom errors
    response_time: ["p(95)<500"], // 95% < 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || "http://lium-api:8000";

// ============================================================================
// Setup
// ============================================================================

export function setup() {
  console.log("🚀 Starting API Health Endpoint Load Test");
  console.log(`   Target: ${BASE_URL}/healthz`);
  console.log(`   Duration: ~2.5 minutes`);
  console.log("");

  return { baseUrl: BASE_URL };
}

// ============================================================================
// Main Test
// ============================================================================

export default function (data) {
  const startTime = Date.now();
  const res = http.get(`${data.baseUrl}/healthz`);
  const duration = Date.now() - startTime;

  totalRequests.add(1);
  responseTime.add(duration);

  const success = check(res, {
    "Health: status 200": (r) => r.status === 200,
    "Health: response time < 500ms": (r) => r.timings.duration < 500,
    "Health: has status field": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success ? 1 : 0);

  sleep(Math.floor(Math.random() * 2) + 1); // 1-3 seconds think time
}

// ============================================================================
// Teardown
// ============================================================================

export function teardown(data) {
  console.log("");
  console.log("✅ Health Endpoint Test Complete");
}

// ============================================================================
// Summary
// ============================================================================

export function handleSummary(data) {
  const metrics = data.metrics;

  let summary = "\n";
  summary += "━".repeat(70) + "\n";
  summary += "🏥 API HEALTH ENDPOINT - PERFORMANCE TEST RESULTS\n";
  summary += "━".repeat(70) + "\n\n";

  // Overview
  summary += "📈 OVERVIEW\n";
  summary += `   Total Requests:   ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `   Requests/sec:     ${(metrics.http_reqs?.values?.rate || 0).toFixed(2)}\n`;
  summary += `   Data Received:    ${formatBytes(metrics.data_received?.values?.count || 0)}\n`;
  summary += `   Test Duration:    ${formatDuration(metrics.iteration_duration?.values?.avg || 0)}\n`;
  summary += "\n";

  // Response Times
  if (metrics.http_req_duration) {
    const d = metrics.http_req_duration.values;
    summary += "⚡ RESPONSE TIMES\n";
    summary += `   Average:          ${formatDuration(d.avg)}\n`;
    summary += `   Median (p50):     ${formatDuration(d["p(50)"])}\n`;
    summary += `   95th %ile:        ${formatDuration(d["p(95)"])} ${d["p(95)"] < 500 ? "✅" : "❌"}\n`;
    summary += `   99th %ile:        ${formatDuration(d["p(99)"])} ${d["p(99)"] < 1000 ? "✅" : "❌"}\n`;
    summary += `   Max:              ${formatDuration(d.max)}\n`;
    summary += "\n";
  }

  // Reliability
  const httpFailRate = (metrics.http_req_failed?.values?.rate || 0) * 100;
  const customErrorRate = (metrics.errors?.values?.rate || 0) * 100;

  summary += "🎯 RELIABILITY\n";
  summary += `   HTTP Failures:    ${httpFailRate.toFixed(2)}% ${httpFailRate < 1 ? "✅" : "❌"}\n`;
  summary += `   Custom Errors:    ${customErrorRate.toFixed(2)}% ${customErrorRate < 1 ? "✅" : "❌"}\n`;
  summary += "\n";

  // VUs
  if (metrics.vus) {
    summary += "👥 VIRTUAL USERS\n";
    summary += `   Peak Load:        ${metrics.vus.values.max || 0} concurrent users\n`;
    summary += `   Min Load:         ${metrics.vus.values.min || 0} concurrent users\n`;
    summary += "\n";
  }

  // Health Status
  summary += "💚 HEALTH ENDPOINT STATUS\n";
  const healthChecks = data.root_group?.checks || [];
  const healthOk = healthChecks.filter((c) => c.name.includes("status 200"))[0];
  if (healthOk) {
    const passes = healthOk.passes || 0;
    const total = (healthOk.passes || 0) + (healthOk.fails || 0);
    const passRate = total > 0 ? (passes / total) * 100 : 0;
    summary += `   Availability:     ${passRate.toFixed(2)}% ${passRate >= 99 ? "✅" : "❌"}\n`;
  }
  summary += "\n";

  summary += "━".repeat(70) + "\n";

  return { stdout: summary };
}

function formatDuration(ms) {
  if (!ms && ms !== 0) return "N/A";
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
