/**
 * Simple Performance Test POC
 *
 * Tests homepage and public endpoints to demonstrate k6 performance testing.
 * This is a simplified version without authentication for POC purposes.
 *
 * Run: k6 run performance/tests/api-load/simple-baseline.js
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ============================================================================
// Custom Metrics
// ============================================================================

const errorRate = new Rate("errors");
const pageLoadTime = new Trend("page_load_time");
const totalRequests = new Counter("total_requests");

// ============================================================================
// Test Configuration
// ============================================================================

export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up to 10 users
    { duration: "1m", target: 10 }, // Stay at 10 users
    { duration: "20s", target: 20 }, // Spike to 20 users
    { duration: "20s", target: 20 }, // Hold spike
    { duration: "20s", target: 0 }, // Ramp down
  ],

  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<3000"],
    http_req_failed: ["rate<0.1"],
    errors: ["rate<0.1"],
    page_load_time: ["p(95)<2000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://lium-web:3000";

// ============================================================================
// Setup
// ============================================================================

export function setup() {
  console.log("🚀 Starting Simple Performance Test");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Duration: ~3 minutes`);
  console.log("");

  return { baseUrl: BASE_URL };
}

// ============================================================================
// Main Test
// ============================================================================

export default function (data) {
  const userBehavior = Math.floor(Math.random() * 100) + 1;

  if (userBehavior <= 60) {
    // 60% - Homepage visitors
    testHomepage(data);
  } else if (userBehavior <= 85) {
    // 25% - Navigate to specific pages
    testNavigation(data);
  } else {
    // 15% - Quick browsing
    testQuickBrowse(data);
  }

  sleep(Math.floor(Math.random() * 3) + 1); // 1-4 seconds think time
}

// ============================================================================
// Test Scenarios
// ============================================================================

function testHomepage(data) {
  group("Homepage Visit", () => {
    const startTime = new Date();
    const res = http.get(data.baseUrl);
    const loadTime = new Date() - startTime;

    totalRequests.add(1);
    pageLoadTime.add(loadTime);

    const success = check(res, {
      "Homepage: status 200": (r) => r.status === 200,
      "Homepage: load time < 2s": (r) => r.timings.duration < 2000,
      "Homepage: has content": (r) => r.body && r.body.length > 1000,
    });

    errorRate.add(!success ? 1 : 0);
  });
}

function testNavigation(data) {
  group("Page Navigation", () => {
    // Homepage
    let res = http.get(data.baseUrl);
    check(res, { "Nav: homepage OK": (r) => r.status === 200 });
    sleep(1);

    // Navigate to a page (dashboard, chats, etc.)
    res = http.get(`${data.baseUrl}/dashboard`);
    totalRequests.add(2);

    const success = check(res, {
      "Nav: dashboard OK": (r) => r.status === 200 || r.status === 302,
    });

    errorRate.add(!success ? 1 : 0);
  });
}

function testQuickBrowse(data) {
  group("Quick Browse", () => {
    const pages = ["/", "/chats", "/agents", "/tools"];
    let successCount = 0;

    pages.forEach((page) => {
      const res = http.get(`${data.baseUrl}${page}`);
      totalRequests.add(1);

      if (
        check(res, {
          [`Quick: ${page} OK`]: (r) => r.status === 200 || r.status === 302,
        })
      ) {
        successCount++;
      }

      sleep(0.5);
    });

    errorRate.add(successCount === pages.length ? 0 : 1);
  });
}

// ============================================================================
// Teardown
// ============================================================================

export function teardown(data) {
  console.log("");
  console.log("✅ Test Complete");
}

// ============================================================================
// Summary
// ============================================================================

export function handleSummary(data) {
  const metrics = data.metrics;

  let summary = "\n";
  summary += "━".repeat(70) + "\n";
  summary += "📊 PERFORMANCE TEST RESULTS\n";
  summary += "━".repeat(70) + "\n\n";

  // Overview
  summary += "📈 OVERVIEW\n";
  summary += `   Total Requests:   ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `   Requests/sec:     ${(metrics.http_reqs?.values?.rate || 0).toFixed(2)}\n`;
  summary += `   Data Received:    ${formatBytes(metrics.data_received?.values?.count || 0)}\n`;
  summary += "\n";

  // Response Times
  if (metrics.http_req_duration) {
    const d = metrics.http_req_duration.values;
    summary += "⚡ RESPONSE TIMES\n";
    summary += `   Average:          ${formatDuration(d.avg)}\n`;
    summary += `   Median (p50):     ${formatDuration(d["p(50)"])}\n`;
    summary += `   95th %ile:        ${formatDuration(d["p(95)"])} ${d["p(95)"] < 2000 ? "✅" : "❌"}\n`;
    summary += `   99th %ile:        ${formatDuration(d["p(99)"])} ${d["p(99)"] < 3000 ? "✅" : "❌"}\n`;
    summary += `   Max:              ${formatDuration(d.max)}\n`;
    summary += "\n";
  }

  // Reliability
  const httpFailRate = (metrics.http_req_failed?.values?.rate || 0) * 100;
  const customErrorRate = (metrics.errors?.values?.rate || 0) * 100;

  summary += "🎯 RELIABILITY\n";
  summary += `   HTTP Failures:    ${httpFailRate.toFixed(2)}% ${httpFailRate < 10 ? "✅" : "❌"}\n`;
  summary += `   Custom Errors:    ${customErrorRate.toFixed(2)}% ${customErrorRate < 10 ? "✅" : "❌"}\n`;
  summary += "\n";

  // Checks
  const checks = data.root_group?.checks || [];
  if (checks.length > 0) {
    summary += "✅ CHECKS\n";
    let passedChecks = 0;
    let totalChecks = 0;

    checks.forEach((check) => {
      const passes = check.passes || 0;
      const fails = check.fails || 0;
      const total = passes + fails;
      const passRate = total > 0 ? (passes / total) * 100 : 0;

      totalChecks += total;
      passedChecks += passes;

      const status = passRate === 100 ? "✅" : passRate > 90 ? "⚠️ " : "❌";
      summary += `   ${status} ${check.name}: ${passes}/${total} (${passRate.toFixed(1)}%)\n`;
    });

    const overallRate =
      totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
    summary += `\n   Overall Pass Rate: ${overallRate.toFixed(1)}% (${passedChecks}/${totalChecks})\n`;
    summary += "\n";
  }

  // VUs
  if (metrics.vus) {
    summary += "👥 VIRTUAL USERS\n";
    summary += `   Max:              ${metrics.vus.values.max || 0}\n`;
    summary += `   Min:              ${metrics.vus.values.min || 0}\n`;
    summary += "\n";
  }

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
