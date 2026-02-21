# JSONL Test Results System

## Overview

This framework uses **dual reporting** for the best of both worlds:

- **HTML Reports** - Rich UI with screenshots, videos, traces (overwrites each run)
- **JSONL Results** - Append-only historical tracking (never loses data)

## Quick Start

### View Results

```bash
# Synthetic tests summary
make results

# Find flaky tests
make results-flaky

# Integration tests
make results-api

# Performance tests
make results-perf
```

### Manual Result Recording

```bash
# Record a test result
node scripts/save-test-result.js synthetic local "auth/login › user can login" passed 1234 alice null

# With error
node scripts/save-test-result.js synthetic local "checkout › payment" failed 5000 bob "Timeout waiting for element"
```

## Use Cases

### 1. Track Performance Over Time

```bash
# View duration trends for a specific test
node scripts/view-results.js trends synthetic local "auth/login › user can login"
```

Output:

```
Performance trend for: auth/login › user can login

✅ 2/20/2026, 7:23:56 PM: 1234ms
✅ 2/20/2026, 7:24:38 PM: 980ms
❌ 2/20/2026, 7:24:38 PM: 2100ms  ← Regression!
✅ 2/20/2026, 7:24:38 PM: 1050ms
```

### 2. Detect Flaky Tests

```bash
make results-flaky
```

Shows tests that sometimes pass, sometimes fail:

```
⚠️  Found 1 flaky tests:

  75.0% pass rate (4 runs)
  auth/login › user can login
```

### 3. Compare Environments

```bash
# Local environment
node scripts/view-results.js summary synthetic local

# Dev environment
node scripts/view-results.js summary synthetic dev

# Production
node scripts/view-results.js summary synthetic staging
```

### 4. Track Regression

After deploying a change, compare historical results:

```bash
# Before deployment (baseline)
make results
# Total Tests: 50, ✅ Passed: 48 (96%)

# After deployment
make results
# Total Tests: 50, ✅ Passed: 45 (90%) ← Regression!
```

## JSONL Format

Each line is a JSON object:

```json
{
  "timestamp": "2026-02-20T19:30:00Z",
  "pillar": "synthetic",
  "environment": "local",
  "test": "auth/login › user can login",
  "status": "passed",
  "duration": 1234,
  "user": "alice",
  "error": null
}
```

## Files

- `results/synthetic-local.jsonl` - Synthetic tests on local environment
- `results/integration-local.jsonl` - Integration tests on local
- `results/performance-local.jsonl` - Performance tests on local
- `results/synthetic-dev.jsonl` - Synthetic tests on dev environment
- ... (one file per pillar/environment combination)

## Integration with Tests (Future)

To automatically record results from Playwright tests, add to fixtures:

```typescript
// synthetic/fixtures/index.ts
test.afterEach(async ({}, testInfo) => {
  const { spawn } = await import("child_process");
  spawn("node", [
    "scripts/save-test-result.js",
    "synthetic",
    process.env.TEST_ENV || "local",
    testInfo.title,
    testInfo.status,
    String(testInfo.duration),
    process.env.USER || "unknown",
    testInfo.error?.message || "null",
  ]);
});
```

## Advanced Queries

The JSONL format makes it easy to query with standard tools:

```bash
# Count failures in last 100 tests
tail -100 results/synthetic-local.jsonl | grep '"status":"failed"' | wc -l

# Find slowest tests
cat results/synthetic-local.jsonl | jq -r '[.test, .duration] | @tsv' | sort -k2 -nr | head -10

# Get pass rate for specific test
grep "auth/login" results/synthetic-local.jsonl | jq -s '[.[] | select(.status=="passed")] | length'
```

## Benefits

✅ **Never lose test data** - Append-only format preserves all history
✅ **Detect regressions** - Compare performance over time
✅ **Find flaky tests** - See inconsistent test behavior
✅ **Track trends** - Monitor test suite health over weeks/months
✅ **Environment comparison** - Compare stability across environments
✅ **Lightweight** - Plain text, git-friendly, no database required
✅ **Query with standard tools** - grep, jq, awk work perfectly

## Workflow

1. **Run tests** → `make test-syn-all`
2. **View rich HTML report** → `make report` (screenshots, videos, traces)
3. **Check historical trends** → `make results` (JSONL summary)
4. **Find flaky tests** → `make results-flaky`
5. **Track performance** → `node scripts/view-results.js trends ...`

Best of both worlds! 🎉
