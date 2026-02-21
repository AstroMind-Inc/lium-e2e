/**
 * API Baseline Performance Test
 *
 * Tests authenticated API endpoints with realistic load patterns.
 * Measures response times, throughput, and error rates for critical APIs.
 *
 * Run: make test-perf-api-load
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ============================================================================
// Custom Metrics
// ============================================================================

const errorRate = new Rate("errors");
const apiLatency = new Trend("api_latency");
const authFailures = new Counter("auth_failures");
const apiCallsPerVU = new Counter("api_calls_per_vu");

// ============================================================================
// Test Configuration
// ============================================================================

export const options = {
  scenarios: {
    // Scenario 1: Baseline - Constant load to establish baseline performance
    baseline: {
      executor: "constant-vus",
      vus: 10,
      duration: "2m",
      tags: { scenario: "baseline" },
    },

    // Scenario 2: Spike - Test how system handles sudden traffic spike
    spike: {
      executor: "ramping-vus",
      startTime: "2m",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 50 }, // Spike up
        { duration: "30s", target: 50 }, // Sustain spike
        { duration: "10s", target: 0 }, // Spike down
      ],
      tags: { scenario: "spike" },
    },

    // Scenario 3: Stress - Gradually increase load to find breaking point
    stress: {
      executor: "ramping-vus",
      startTime: "3m",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 20 },
        { duration: "1m", target: 40 },
        { duration: "1m", target: 60 },
        { duration: "1m", target: 80 },
        { duration: "30s", target: 0 },
      ],
      tags: { scenario: "stress" },
    },
  },

  // Performance thresholds - test fails if these are breached
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"], // 95% < 1s, 99% < 2s
    "http_req_duration{scenario:baseline}": ["p(95)<800"], // Baseline should be faster
    http_req_failed: ["rate<0.01"], // Error rate < 1%
    errors: ["rate<0.05"], // Custom errors < 5%
    auth_failures: ["count<10"], // Max 10 auth failures
    api_latency: ["p(95)<1000"], // API latency < 1s
  },
};

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = __ENV.BASE_URL || "http://lium-web:3000";
const API_URL = `${BASE_URL}/api`;

// Simulated auth tokens (in real scenario, you'd get these from auth endpoint)
// For POC, we'll use the session cookie approach
let authHeaders = {};

// ============================================================================
// Setup - Runs once per VU before test
// ============================================================================

export function setup() {
  console.log("🚀 Starting API Performance Test");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Scenarios: baseline, spike, stress`);
  console.log("");

  // In a real scenario, you might authenticate here and share tokens
  // For this POC, we'll demonstrate both approaches
  return {
    baseUrl: BASE_URL,
    apiUrl: API_URL,
  };
}

// ============================================================================
// Main Test Function - Runs repeatedly for each VU
// ============================================================================

export default function (data) {
  // Simulate different user behaviors with weighted distribution
  const userBehavior = Math.floor(Math.random() * 100) + 1;

  if (userBehavior <= 50) {
    // 50% - Read-heavy user (browsing chats, viewing data)
    readHeavyUser(data);
  } else if (userBehavior <= 80) {
    // 30% - Balanced user (mix of reads and writes)
    balancedUser(data);
  } else {
    // 20% - Write-heavy user (creating content, uploading data)
    writeHeavyUser(data);
  }

  // Think time - simulate user reading/processing
  sleep(Math.floor(Math.random() * 3) + 2); // 2-5 seconds
}

// ============================================================================
// User Behavior Scenarios
// ============================================================================

function readHeavyUser(data) {
  group("Read-Heavy User Flow", () => {
    // 1. List chats
    testEndpoint("GET", `${data.apiUrl}/chats`, "List chats");

    sleep(1);

    // 2. Get specific chat
    testEndpoint("GET", `${data.apiUrl}/chats/recent`, "Get recent chats");

    sleep(0.5);

    // 3. List agents
    testEndpoint("GET", `${data.apiUrl}/agents`, "List agents");
  });
}

function balancedUser(data) {
  group("Balanced User Flow", () => {
    // Mix of reads and writes
    testEndpoint("GET", `${data.apiUrl}/chats`, "List chats");
    sleep(1);

    testEndpoint("POST", `${data.apiUrl}/chats`, "Create chat", {
      title: `Test chat ${Date.now()}`,
    });
    sleep(1);

    testEndpoint("GET", `${data.apiUrl}/datasets`, "List datasets");
  });
}

function writeHeavyUser(data) {
  group("Write-Heavy User Flow", () => {
    // Create multiple resources
    testEndpoint("POST", `${data.apiUrl}/chats`, "Create chat", {
      title: `Performance test ${Date.now()}`,
    });
    sleep(0.5);

    testEndpoint("POST", `${data.apiUrl}/chats/message`, "Send message", {
      content: "Test message for performance testing",
    });
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Test an API endpoint with automatic metrics tracking
 */
function testEndpoint(method, url, name, payload = null) {
  const params = {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    tags: { endpoint: name },
  };

  let res;
  const startTime = Date.now();

  try {
    if (method === "GET") {
      res = http.get(url, params);
    } else if (method === "POST") {
      res = http.post(url, JSON.stringify(payload), params);
    } else if (method === "PUT") {
      res = http.put(url, JSON.stringify(payload), params);
    } else if (method === "DELETE") {
      res = http.del(url, null, params);
    }

    const latency = Date.now() - startTime;
    apiLatency.add(latency);
    apiCallsPerVU.add(1);

    // Checks
    const success = check(res, {
      [`${name}: status 2xx or 3xx`]: (r) => r.status >= 200 && r.status < 400,
      [`${name}: response time < 2s`]: (r) => r.timings.duration < 2000,
      [`${name}: has response body`]: (r) => r.body && r.body.length > 0,
    });

    // Handle auth failures
    if (res.status === 401 || res.status === 403) {
      authFailures.add(1);
      console.warn(`⚠️  Auth failure on ${name}: ${res.status}`);
    }

    // Track errors
    if (!success || res.status >= 400) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }

    return res;
  } catch (error) {
    console.error(`❌ Error testing ${name}:`, error);
    errorRate.add(1);
    return null;
  }
}

// ============================================================================
// Teardown - Runs once at the end
// ============================================================================

export function teardown(data) {
  console.log("");
  console.log("✅ API Performance Test Complete");
}

// ============================================================================
// Custom Summary - Enhanced reporting
// ============================================================================

export function handleSummary(data) {
  const summary = generateSummary(data);

  // Only return stdout (don't try to write file, k6 will handle that if needed)
  return {
    stdout: summary,
  };
}

function generateSummary(data) {
  const metrics = data.metrics;

  let output = "\n";
  output += "📊 API Load Test Results\n";
  output += "━".repeat(60) + "\n\n";

  // Overview
  output += "📈 OVERVIEW\n";
  output += `   Total VUs:        ${data.state?.vus || "N/A"}\n`;
  output += `   Total Requests:   ${metrics.http_reqs?.values?.count || 0}\n`;
  output += `   Test Duration:    ${formatDuration(metrics.iteration_duration?.values?.avg)}\n`;
  output += `   Requests/sec:     ${(metrics.http_reqs?.values?.rate || 0).toFixed(2)}\n`;
  output += "\n";

  // Response Times
  if (metrics.http_req_duration) {
    const d = metrics.http_req_duration.values;
    output += "⚡ RESPONSE TIMES\n";
    output += `   Average:          ${formatDuration(d.avg)}\n`;
    output += `   Median (p50):     ${formatDuration(d["p(50)"])}\n`;
    output += `   95th %ile:        ${formatDuration(d["p(95)"])} ${d["p(95)"] < 1000 ? "✓" : "✗"}\n`;
    output += `   99th %ile:        ${formatDuration(d["p(99)"])} ${d["p(99)"] < 2000 ? "✓" : "✗"}\n`;
    output += `   Max:              ${formatDuration(d.max)}\n`;
    output += "\n";
  }

  // Error Rates
  output += "🎯 RELIABILITY\n";
  const httpFailRate = (metrics.http_req_failed?.values?.rate || 0) * 100;
  const customErrorRate = (metrics.errors?.values?.rate || 0) * 100;
  output += `   HTTP Failures:    ${httpFailRate.toFixed(2)}% ${httpFailRate < 1 ? "✓" : "✗"}\n`;
  output += `   Custom Errors:    ${customErrorRate.toFixed(2)}% ${customErrorRate < 5 ? "✓" : "✗"}\n`;
  output += `   Auth Failures:    ${metrics.auth_failures?.values?.count || 0}\n`;
  output += "\n";

  // Scenario Breakdown
  output += "🔬 SCENARIO BREAKDOWN\n";
  ["baseline", "spike", "stress"].forEach((scenario) => {
    const scenarioMetric = metrics[`http_req_duration{scenario:${scenario}}`];
    if (scenarioMetric) {
      output += `   ${scenario.toUpperCase()}:\n`;
      output += `     Avg:            ${formatDuration(scenarioMetric.values.avg)}\n`;
      output += `     p95:            ${formatDuration(scenarioMetric.values["p(95)"])}\n`;
    }
  });
  output += "\n";

  // Thresholds
  output += "✅ THRESHOLDS\n";
  Object.entries(data.thresholds || {}).forEach(([name, result]) => {
    const status = result.ok ? "✓" : "✗";
    output += `   ${status} ${name}\n`;
  });

  output += "\n" + "━".repeat(60) + "\n";

  return output;
}

function formatDuration(ms) {
  if (!ms && ms !== 0) return "N/A";
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
