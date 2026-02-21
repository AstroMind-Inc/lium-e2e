/**
 * API Spike Test
 *
 * Tests API resilience to sudden traffic spikes.
 * Simulates viral events, marketing campaigns, or sudden user influx.
 *
 * Run: k6 run performance/tests/api-spike/spike-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ============================================================================
// Custom Metrics
// ============================================================================

const errorRate = new Rate("errors");
const spikeLatency = new Trend("spike_latency");
const spikeRequests = new Counter("spike_requests");

// ============================================================================
// Test Configuration
// ============================================================================

export const options = {
  stages: [
    { duration: "30s", target: 5 }, // Baseline
    { duration: "15s", target: 100 }, // 🚀 Sudden spike!
    { duration: "1m", target: 100 }, // Sustain spike
    { duration: "30s", target: 5 }, // Recovery
    { duration: "30s", target: 0 }, // Ramp down
  ],

  thresholds: {
    http_req_duration: ["p(95)<3000"], // Spike may cause slowdown
    http_req_failed: ["rate<0.05"], // <5% failure during spike
    errors: ["rate<0.1"], // <10% errors acceptable
  },
};

const BASE_URL = __ENV.BASE_URL || "http://lium-api:8000";

// ============================================================================
// Setup
// ============================================================================

export function setup() {
  console.log("🚀 Starting API Spike Test");
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Duration: ~3 minutes`);
  console.log(`   Spike: 5 → 100 users in 15 seconds!`);
  console.log("");

  return { baseUrl: BASE_URL };
}

// ============================================================================
// Main Test
// ============================================================================

export default function (data) {
  // Simulate different user behaviors during spike
  const behavior = Math.random();

  let endpoint;
  if (behavior < 0.6) {
    // 60% - Health checks / browsing
    endpoint = "/healthz";
  } else if (behavior < 0.9) {
    // 30% - API reads
    endpoint = "/api/chats";
  } else {
    // 10% - API writes (creates more load)
    endpoint = "/api/users";
  }

  const startTime = Date.now();
  const res = http.get(`${data.baseUrl}${endpoint}`);
  const duration = Date.now() - startTime;

  spikeLatency.add(duration);
  spikeRequests.add(1);

  const success = check(res, {
    "status is 2xx or 3xx": (r) => r.status >= 200 && r.status < 400,
    "response under 3s": (r) => r.timings.duration < 3000,
  });

  errorRate.add(!success ? 1 : 0);

  sleep(Math.random()); // Minimal think time during spike
}

// ============================================================================
// Teardown
// ============================================================================

export function teardown(data) {
  console.log("");
  console.log("✅ Spike Test Complete");
  console.log("   Check how well the API handled sudden traffic surge");
}

// ============================================================================
// Summary
// ============================================================================

export function handleSummary(data) {
  const metrics = data.metrics;

  let summary = "\n";
  summary += "━".repeat(70) + "\n";
  summary += "🚀 API SPIKE TEST RESULTS\n";
  summary += "━".repeat(70) + "\n\n";

  summary += "📈 OVERVIEW\n";
  summary += `   Total Requests:   ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `   Peak VUs:         ${metrics.vus?.values?.max || 0}\n`;
  summary += `   Requests/sec:     ${(metrics.http_reqs?.values?.rate || 0).toFixed(2)}\n`;
  summary += "\n";

  if (metrics.http_req_duration) {
    const d = metrics.http_req_duration.values;
    summary += "⚡ RESPONSE TIMES DURING SPIKE\n";
    summary += `   Average:          ${formatDuration(d.avg)}\n`;
    summary += `   95th %ile:        ${formatDuration(d["p(95)"])} ${d["p(95)"] < 3000 ? "✅" : "⚠️"}\n`;
    summary += `   99th %ile:        ${formatDuration(d["p(99)"])}\n`;
    summary += `   Max:              ${formatDuration(d.max)}\n`;
    summary += "\n";
  }

  const httpFailRate = (metrics.http_req_failed?.values?.rate || 0) * 100;
  const customErrorRate = (metrics.errors?.values?.rate || 0) * 100;

  summary += "🎯 SPIKE RESILIENCE\n";
  summary += `   HTTP Failures:    ${httpFailRate.toFixed(2)}% ${httpFailRate < 5 ? "✅" : "❌"}\n`;
  summary += `   Custom Errors:    ${customErrorRate.toFixed(2)}% ${customErrorRate < 10 ? "✅" : "⚠️"}\n`;
  summary += "\n";

  summary += "💡 ANALYSIS\n";
  if (httpFailRate < 5 && d["p(95)"] < 3000) {
    summary += "   ✅ API handled spike well - good auto-scaling!\n";
  } else if (httpFailRate < 10) {
    summary +=
      "   ⚠️  API struggled but recovered - consider scaling improvements\n";
  } else {
    summary += "   ❌ API failed under spike - immediate action needed!\n";
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
