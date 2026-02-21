# Performance Test Modules

All performance tests target the API at `http://lium-api:8000` by default.

## Available Modules

### 🏥 API Health (`api-health`)

**Purpose**: Health endpoint availability and load testing
**Target**: `/healthz`
**Duration**: ~2.5 minutes
**Load**: 10 → 25 → 0 users
**Run**: `make test-perf-api-health`

Fast check to ensure the API health endpoint can handle basic load.

---

### ⚡ API Load (`api-load`)

**Purpose**: Comprehensive load testing with multiple scenarios
**Target**: Various API endpoints
**Duration**: 3-8 minutes (depending on test file)
**Load**: Up to 80 concurrent users
**Run**: `make test-perf-api-load`

**Files**:

- `test.js` - Simple baseline (default, 3 min)
- `advanced.js` - Production-ready with baseline/spike/stress scenarios (8 min)

Simulates realistic user behavior (60% browsing, 25% balanced, 15% writes).

---

### 🚀 API Spike (`api-spike`)

**Purpose**: Test resilience to sudden traffic spikes
**Target**: Health + API endpoints
**Duration**: ~3 minutes
**Load**: 5 → 100 → 5 users (spike in 15 seconds!)
**Run**: `make test-perf-api-spike`

Simulates viral events, marketing campaigns, or sudden user influx.

---

### 💪 API Stress (`api-stress`)

**Purpose**: Find the API's breaking point
**Target**: Multiple API endpoints
**Duration**: ~6.5 minutes
**Load**: Gradually ramps to 125 concurrent users
**Run**: `make test-perf-api-stress`

Helps identify maximum capacity and performance degradation patterns.

---

## Quick Start

```bash
# Interactive selection
make test

# Direct execution
make test-perf-api-health   # Start with health check
make test-perf-api-load     # Then try load test
make test-perf-api-spike    # Test spike handling
make test-perf-api-stress   # Find breaking point

# Custom target URL
BASE_URL=http://localhost:8000 make test-perf-api-health
```

## Test Structure

Each module follows this structure:

```
api-{name}/
├── test.js         # Main test file (required)
└── manifest.yml    # Module metadata (name, description, icon, tags)
```

## Adding New Tests

1. Create a new directory: `performance/tests/api-{name}/`
2. Add `test.js` with k6 test script
3. Add `manifest.yml` with module metadata
4. Run: `make test-perf-api-{name}`

Tests are auto-discovered immediately!

## Interpreting Results

### ✅ Good Performance

- p95 < 500ms (health endpoint)
- p95 < 1000ms (API endpoints)
- Error rate < 1%
- No timeouts

### ⚠️ Warning

- p95: 1000-2000ms
- Error rate: 1-5%
- Some degradation under spike

### ❌ Critical

- p95 > 2000ms
- Error rate > 5%
- Timeouts or connection errors
- API unavailable

## Performance Thresholds

All tests enforce these thresholds:

- **Response Time**: p95 < 500-2000ms (depending on test)
- **Error Rate**: < 1-10% (depending on test intensity)
- **Availability**: > 99% for health checks

If thresholds are breached, the test FAILS and returns non-zero exit code.
