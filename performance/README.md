# Performance Tests (Pillar 3)

Load and performance testing using k6 by Grafana.

## Overview

Performance tests validate system behavior under load. They measure:

- Response times under various load conditions
- System throughput and capacity
- Breaking points and bottlenecks
- Recovery and resilience
- Scalability characteristics

## Why k6?

k6 is purpose-built for performance testing:

- **High performance**: Written in Go, can generate massive load
- **JavaScript/ES6**: Familiar scripting language
- **Built-in metrics**: Request duration, throughput, error rates
- **Thresholds**: Define SLAs and fail tests automatically
- **Scenarios**: Complex load patterns (ramp, spike, soak)
- **Cloud integration**: Export to Grafana, InfluxDB, Prometheus
- **CLI-friendly**: Perfect for CI/CD pipelines

## Directory Structure

```
performance/
├── tests/              # Test scripts
│   ├── load/           # Load tests (baseline)
│   ├── stress/         # Stress tests (find breaking point)
│   └── spike/          # Spike tests (sudden traffic)
├── scenarios/          # Reusable load profiles
│   └── load-profile.js
├── k6.config.js        # Base configuration
└── README.md
```

## Installation

### macOS (Homebrew)

```bash
brew install k6
```

### Linux (Debian/Ubuntu)

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Windows (Chocolatey)

```bash
choco install k6
```

### Docker

```bash
docker pull grafana/k6:latest
```

### Verify Installation

```bash
k6 version
```

## Test Types

### 1. Load Tests (Baseline)

Establish performance baseline with constant load:

- **Goal**: Understand normal performance characteristics
- **When**: Before and after releases
- **Example**: `performance/tests/load/api-baseline.js`

### 2. Stress Tests

Gradually increase load to find breaking point:

- **Goal**: Identify system limits and bottlenecks
- **When**: Capacity planning, architecture changes
- **Example**: `performance/tests/stress/api-stress.js`

### 3. Spike Tests

Sudden traffic spike to test resilience:

- **Goal**: Verify system handles sudden load increases
- **When**: Before major launches, sales events
- **Example**: `performance/tests/spike/api-spike.js`

### 4. Soak Tests (Endurance)

Sustained load over extended period:

- **Goal**: Detect memory leaks, resource exhaustion
- **When**: Major releases, infrastructure changes
- **Example**: Use `soakTest` scenario

## Running Tests

### Basic Execution

```bash
# Run a test
k6 run performance/tests/load/api-baseline.js

# Set environment
E2E_ENVIRONMENT=dev k6 run performance/tests/load/api-baseline.js

# Set custom base URL
API_BASE_URL=https://api-dev.lium.app k6 run performance/tests/load/api-baseline.js
```

### With Authentication

```bash
# Provide auth token
AUTH_TOKEN=your-token-here k6 run performance/tests/load/api-baseline.js
```

### Override VUs and Duration

```bash
# 50 VUs for 5 minutes
k6 run --vus 50 --duration 5m performance/tests/load/api-baseline.js
```

### Custom Stages

```bash
# Custom ramp pattern
k6 run --stage 1m:10,3m:50,1m:0 performance/tests/load/api-baseline.js
```

### Output Results

```bash
# JSON output
k6 run --out json=results.json performance/tests/load/api-baseline.js

# CSV output
k6 run --out csv=results.csv performance/tests/load/api-baseline.js

# InfluxDB (requires InfluxDB running)
k6 run --out influxdb=http://localhost:8086/k6 performance/tests/load/api-baseline.js
```

### Cloud Integration

```bash
# k6 Cloud (requires account)
k6 cloud performance/tests/load/api-baseline.js
```

## Writing Tests

### Basic Test Structure

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const res = http.get("https://api.example.com/health");

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Using Custom Metrics

```javascript
import { Rate, Trend, Counter, Gauge } from "k6/metrics";

// Define metrics
const errorRate = new Rate("errors");
const apiDuration = new Trend("api_duration");
const successCounter = new Counter("successes");
const activeUsers = new Gauge("active_users");

export default function () {
  const res = http.get(url);

  // Record metrics
  errorRate.add(res.status !== 200);
  apiDuration.add(res.timings.duration);

  if (res.status === 200) {
    successCounter.add(1);
  }

  activeUsers.add(1);
}
```

### Thresholds (SLAs)

```javascript
export const options = {
  thresholds: {
    // 95th percentile < 500ms
    http_req_duration: ["p(95)<500"],

    // 99th percentile < 1s
    "http_req_duration{name:users}": ["p(99)<1000"],

    // Error rate < 1%
    http_req_failed: ["rate<0.01"],

    // Successful requests > 95%
    checks: ["rate>0.95"],

    // Custom metric threshold
    errors: ["rate<0.05"],
  },
};
```

### Scenarios

```javascript
import {
  baselineLoad,
  stressTest,
  spikeTest,
} from "../scenarios/load-profile.js";

export const options = {
  scenarios: {
    // Use predefined scenario
    baseline: baselineLoad,

    // Or define inline
    custom: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 50 },
        { duration: "3m", target: 50 },
        { duration: "1m", target: 0 },
      ],
      tags: { test_type: "custom" },
    },
  },
};
```

### Setup and Teardown

```javascript
export function setup() {
  // Runs once before test
  const env = getEnvironment();
  console.log(`Testing: ${env.baseUrl}`);

  // Return data for test
  return {
    baseUrl: env.baseUrl,
    token: authenticateAndGetToken(),
  };
}

export default function (data) {
  // Main test - runs repeatedly
  const { baseUrl, token } = data;
  // Test code...
}

export function teardown(data) {
  // Runs once after test
  console.log("Test complete");
  cleanupTestData();
}
```

### Authenticated Requests

```javascript
export default function () {
  const token = getAuthToken();

  const res = http.get("https://api.example.com/users", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  check(res, {
    "authenticated successfully": (r) => r.status === 200,
  });
}
```

### POST Requests

```javascript
export default function () {
  const payload = JSON.stringify({
    email: "test@example.com",
    name: "Test User",
  });

  const res = http.post("https://api.example.com/users", payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  check(res, {
    "created successfully": (r) => r.status === 201,
    "has user id": (r) => JSON.parse(r.body).id !== undefined,
  });
}
```

### Batch Requests

```javascript
export default function () {
  const requests = {
    health: {
      method: "GET",
      url: "https://api.example.com/health",
    },
    users: {
      method: "GET",
      url: "https://api.example.com/users",
      params: {
        headers: { Authorization: `Bearer ${token}` },
      },
    },
  };

  const responses = http.batch(requests);

  check(responses.health, {
    "health ok": (r) => r.status === 200,
  });

  check(responses.users, {
    "users ok": (r) => r.status === 200,
  });
}
```

## Load Profiles

### Constant Load

```javascript
{
  executor: 'constant-vus',
  vus: 50,
  duration: '5m',
}
```

### Ramping VUs

```javascript
{
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 },
  ],
}
```

### Constant Arrival Rate

```javascript
{
  executor: 'constant-arrival-rate',
  rate: 100, // 100 requests per second
  timeUnit: '1s',
  duration: '5m',
  preAllocatedVUs: 50,
  maxVUs: 100,
}
```

### Per-VU Iterations

```javascript
{
  executor: 'per-vu-iterations',
  vus: 10,
  iterations: 100, // Each VU runs 100 iterations
  maxDuration: '10m',
}
```

## Interpreting Results

### Key Metrics

**Request Metrics:**

- `http_req_duration`: Total request time
- `http_req_waiting`: Time to first byte (TTFB)
- `http_req_connecting`: Connection establishment time
- `http_req_blocked`: Time blocked waiting for connection
- `http_req_sending`: Time sending data
- `http_req_receiving`: Time receiving response

**Response Metrics:**

- `http_reqs`: Total HTTP requests
- `http_req_failed`: Failed requests
- `checks`: Check pass rate

**VU Metrics:**

- `vus`: Current virtual users
- `vus_max`: Max VUs allocated
- `iterations`: Total iterations completed

### Summary Output

After test completion, k6 shows:

```
     ✓ status is 200
     ✓ response time < 500ms

     checks.........................: 100.00% ✓ 2000      ✗ 0
     data_received..................: 2.3 MB  38 kB/s
     data_sent......................: 234 kB  3.9 kB/s
     http_req_blocked...............: avg=1.2ms    min=0s    med=1ms     max=15ms
     http_req_connecting............: avg=800µs    min=0s    med=700µs   max=10ms
     http_req_duration..............: avg=150ms    min=80ms  med=140ms   max=450ms
       { expected_response:true }...: avg=150ms    min=80ms  med=140ms   max=450ms
     http_req_failed................: 0.00%   ✓ 0         ✗ 2000
     http_req_receiving.............: avg=500µs    min=100µs med=400µs   max=5ms
     http_req_sending...............: avg=200µs    min=50µs  med=150µs   max=2ms
     http_req_waiting...............: avg=149ms    min=79ms  med=139ms   max=449ms
     http_reqs......................: 2000    33.333333/s
     iterations.....................: 1000    16.666667/s
```

### What to Look For

**Good Performance:**

- ✓ All checks passing
- ✓ p(95) < threshold
- ✓ Low error rate (<1%)
- ✓ Consistent response times

**Warning Signs:**

- ✗ Checks failing
- ✗ Increasing response times
- ✗ Rising error rates
- ✗ Timeouts
- ✗ 5xx errors

## Best Practices

### 1. Start Small

```javascript
// Start with low load
export const options = {
  vus: 5,
  duration: "1m",
};
```

### 2. Gradually Increase Load

```javascript
// Ramp up slowly
stages: [
  { duration: "5m", target: 50 }, // Gradual ramp
  { duration: "10m", target: 50 }, // Sustain
  { duration: "5m", target: 0 }, // Ramp down
];
```

### 3. Define Clear Thresholds

```javascript
thresholds: {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
}
```

### 4. Use Realistic Think Time

```javascript
// Users don't spam requests
sleep(Math.random() * 3 + 2); // 2-5 seconds
```

### 5. Tag Your Requests

```javascript
http.get(url, {
  tags: { name: "health", critical: "true" },
});
```

### 6. Monitor System Resources

- Watch CPU, memory, disk I/O during tests
- Monitor database connections
- Track API server metrics
- Check load balancer stats

### 7. Test Realistic Scenarios

```javascript
// User journey
export default function () {
  // 1. Browse products
  http.get(`${baseUrl}/products`);
  sleep(3);

  // 2. View product details
  http.get(`${baseUrl}/products/123`);
  sleep(2);

  // 3. Add to cart
  http.post(`${baseUrl}/cart`, product);
  sleep(1);

  // 4. Checkout
  http.post(`${baseUrl}/checkout`, payment);
}
```

## Integration with Framework

### Environment Configuration

Tests automatically load environment config:

```javascript
import { getEnvironment } from "../k6.config.js";

const env = getEnvironment();
// env.baseUrl, env.name, env.apiTimeout
```

### Authentication

Get auth token from environment:

```javascript
import { getAuthToken } from "../k6.config.js";

const token = getAuthToken();
```

Set token when running:

```bash
AUTH_TOKEN=$(get-token) k6 run test.js
```

### Results Persistence

k6 doesn't directly write to our JSONL format, but we can:

1. **Export JSON and process:**

```bash
k6 run --out json=results.json test.js
node scripts/k6-to-jsonl.js results.json
```

2. **Use custom summary:**

```javascript
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "results/k6-summary.json": JSON.stringify(data),
  };
}
```

## Troubleshooting

### High Error Rates

**Cause**: System overwhelmed, configuration issues
**Solution**:

- Reduce VUs
- Check API logs
- Verify authentication
- Check rate limiting

### Slow Response Times

**Cause**: Database bottleneck, insufficient resources
**Solution**:

- Profile database queries
- Scale infrastructure
- Add caching
- Optimize endpoints

### Connection Refused

**Cause**: System down, wrong URL
**Solution**:

- Verify baseURL
- Check API is running
- Test with curl/httpie first

### Out of Memory

**Cause**: Too many VUs for local machine
**Solution**:

- Reduce VUs
- Use k6 cloud
- Run on dedicated test server

## Examples

See the following test files:

- `performance/tests/load/api-baseline.js` - Baseline load test
- `performance/tests/stress/api-stress.js` - Stress test to breaking point
- `performance/tests/spike/api-spike.js` - Sudden traffic spike
- `performance/scenarios/load-profile.js` - Reusable load patterns

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [k6 Cloud](https://k6.io/cloud/)
- [Grafana k6 Extensions](https://k6.io/docs/extensions/)

## Next Steps

1. **Verify k6 installation**: `k6 version`
2. **Run baseline test**: `k6 run performance/tests/load/api-baseline.js`
3. **Customize scenarios**: Edit `performance/scenarios/load-profile.js`
4. **Add domain tests**: Create tests for your specific APIs
5. **Set SLA thresholds**: Define acceptable performance levels
6. **Integrate into CI/CD**: Run performance tests in pipeline
