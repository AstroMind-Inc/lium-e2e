# API Load Testing

Comprehensive performance testing for authenticated API endpoints using k6.

## Overview

This test suite validates API performance under various load conditions:

- **Baseline**: Constant load to establish baseline metrics
- **Spike**: Sudden traffic increases (simulating viral events)
- **Stress**: Gradually increasing load to find breaking points

## Test Scenarios

### 1. Baseline (2 minutes)

- **Load**: 10 constant virtual users
- **Purpose**: Establish normal operating performance
- **Threshold**: p95 < 800ms

### 2. Spike (50 seconds)

- **Load**: 0 → 50 → 0 users in 50s
- **Purpose**: Test system resilience to sudden traffic spikes
- **Use case**: Viral feature, marketing campaign, breaking news

### 3. Stress (4.5 minutes)

- **Load**: Gradually ramp from 0 → 80 users
- **Purpose**: Find system breaking point and scalability limits
- **Stages**: 20 → 40 → 60 → 80 users

## User Behaviors

The test simulates realistic user patterns:

- **50% Read-Heavy**: Browsing chats, viewing data, listing resources
- **30% Balanced**: Mix of reads and writes
- **20% Write-Heavy**: Creating chats, sending messages, uploading data

## Metrics Tracked

### Response Times

- Average, Median (p50), p95, p99, Max
- Per-scenario breakdown
- Per-endpoint tracking

### Reliability

- HTTP failure rate (target: < 1%)
- Custom error rate (target: < 5%)
- Auth failure count

### Throughput

- Requests per second
- API calls per virtual user
- Total request count

## Thresholds

Performance thresholds that must pass:

```javascript
{
  'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
  'http_req_duration{scenario:baseline}': ['p(95)<800'],
  'http_req_failed': ['rate<0.01'],
  'errors': ['rate<0.05'],
  'auth_failures': ['count<10'],
}
```

## Running the Tests

```bash
# Run API load test (simple baseline)
make test-perf-api-load

# Run advanced test directly
k6 run performance/tests/api-load/advanced.js

# Run with custom duration
k6 run --duration 5m performance/tests/api-load/test.js

# Run with custom VUs
k6 run --vus 50 performance/tests/api-load/test.js

# Run against specific environment
BASE_URL=https://staging.lium.app k6 run performance/tests/api-load/test.js
```

## Interpreting Results

### Good Performance

```
✓ p95 < 1000ms
✓ p99 < 2000ms
✓ Error rate < 1%
✓ No auth failures
✓ Linear scaling with load
```

### Warning Signs

```
⚠️ p95 > 1000ms but < 1500ms
⚠️ Error rate 1-5%
⚠️ Response time degradation under spike
```

### Critical Issues

```
✗ p95 > 2000ms
✗ Error rate > 5%
✗ Auth failures
✗ Requests timing out
✗ Non-linear degradation
```

## Customization

### Add New Endpoint

```javascript
testEndpoint("GET", `${data.apiUrl}/your-endpoint`, "Your endpoint name");
```

### Add New Scenario

```javascript
scenarios: {
  your_scenario: {
    executor: 'constant-vus',
    vus: 20,
    duration: '3m',
    tags: { scenario: 'your_scenario' },
  }
}
```

### Adjust Thresholds

```javascript
thresholds: {
  'http_req_duration': ['p(95)<500'],  // Stricter: 500ms
  'errors': ['rate<0.01'],             // Stricter: 1%
}
```

## Output

The test generates:

- **Console**: Real-time summary with pass/fail indicators
- **JSON**: Detailed metrics saved to `performance/results/api-load-summary.json`

## Best Practices

1. **Run baseline first** - Establish normal performance before stress testing
2. **Monitor infrastructure** - Watch CPU, memory, database during tests
3. **Test incrementally** - Start small, gradually increase load
4. **Compare results** - Track performance over time
5. **Test realistic scenarios** - Use actual user behavior patterns

## Next Steps

- [ ] Add authentication token handling
- [ ] Include database query performance
- [ ] Add custom business metrics
- [ ] Integrate with monitoring (Datadog, New Relic)
- [ ] Set up CI/CD performance gates
- [ ] Create performance dashboards
