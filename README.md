# Lium E2E Testing Framework

A comprehensive end-to-end testing framework for the Lium service-oriented architecture (SOA). Tests user flows, API integrations, and performance across multiple environments.

## 🎯 Overview

This framework provides three discrete testing pillars:

1. **Synthetic Tests** - Headless browser automation using Playwright
2. **Integration Tests** - API testing without mocks using Playwright's API capabilities
3. **Performance Tests** - Load testing using k6

Tests can be executed across multiple environments: `local`, `dev`, `sandbox`, and `staging`.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- k6 (for performance tests) - [Installation Guide](https://k6.io/docs/get-started/installation/)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd lium-e2e

# Run setup (installs deps, creates dirs, prompts for credentials)
make setup
```

### Running Tests

```bash
# Interactive test runner (prompts for pillar and environment)
make test

# Or use the alias
make up

# Run specific test pillars
make test-synthetic
make test-integration
make test-performance

# View recent results
make results
```

## 📁 Project Structure

```
lium-e2e/
├── config/              # Environment and Slack configurations
├── credentials/         # Local credentials (gitignored)
├── results/             # Test results in JSONL format (gitignored)
├── synthetic/           # Playwright browser tests
├── integration/         # Playwright API tests
├── performance/         # k6 performance tests
├── shared/              # Shared utilities (auth, credentials, results, reporting)
├── ui/                  # CLI interface
├── tests/               # Internal unit tests for the framework
└── reports/             # Generated HTML reports
```

## 🔐 Credential Management

Credentials are stored **locally** in `./credentials/` and are **never committed** to git.

### Setup Credentials

```bash
# Interactive credential setup
make credentials
```

Credentials are stored per environment:
- `credentials/local.json`
- `credentials/dev.json`
- `credentials/sandbox.json`
- `credentials/staging.json`

See `credentials/README.md` for detailed information.

## 🌍 Environment Configuration

Environments are configured in `config/environments/`:

- `local.json` - Local development
- `dev.json` - Development environment
- `sandbox.json` - Sandbox environment
- `staging.json` - Staging environment

Each config file contains:
- Base URLs for web, API, and services
- Auth0 configuration
- Timeout settings

## 🧪 Test Pillars

### Synthetic Tests (Playwright)

Browser automation testing user flows through the Next.js frontend with Auth0 authentication.

**Location**: `synthetic/tests/`

**Example**:
```bash
make test-synthetic
```

### Integration Tests (Playwright API)

Direct API testing validating service contracts using OpenAPI specs.

**Location**: `integration/tests/`

**Example**:
```bash
make test-integration
```

### Performance Tests (k6)

Load, stress, and spike testing to measure system performance.

**Location**: `performance/tests/`

**Example**:
```bash
make test-performance
```

## 📊 Results

Test results are stored in JSONL (JSON Lines) format in `./results/`.

**View results**:
```bash
make results
```

**Query manually**:
```bash
# View last 10 results
tail -10 results/synthetic-dev-$(date +%Y-%m-%d).jsonl | jq .

# Find all failures
grep '"status":"failed"' results/*.jsonl

# Get pass rate
echo "Passed: $(grep -c '"status":"passed"' results/*.jsonl)"
echo "Failed: $(grep -c '"status":"failed"' results/*.jsonl)"
```

See `results/README.md` for detailed format and query examples.

## 📈 Reporting

### HTML Reports

Playwright generates HTML reports automatically:
```bash
npx playwright show-report reports/playwright-report
```

### Slack Integration

Configure Slack notifications in `config/slack.json`:

```json
{
  "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "enabled": true,
  "channel": "#lium-e2e-tests"
}
```

Results will be posted to Slack automatically when enabled.

## 🛠️ Makefile Commands

| Command | Description |
|---------|-------------|
| `make setup` | Initial setup (install deps, create dirs, setup creds) |
| `make install` | Install/update dependencies only |
| `make test` | Interactive test runner |
| `make up` | Alias for `make test` |
| `make test-synthetic` | Run synthetic tests |
| `make test-integration` | Run integration tests |
| `make test-performance` | Run performance tests |
| `make test-framework` | Run internal framework unit tests |
| `make credentials` | Setup credentials for an environment |
| `make results` | View recent test results |
| `make clean` | Remove node_modules and generated files |
| `make down` | Stop any running tests/processes |

## 🧰 Development

### Internal Framework Tests

The framework itself has unit tests to ensure reliability:

```bash
# Run framework tests
make test-framework

# Or directly with npm
npm run test:unit

# Watch mode
npm run test:unit:watch
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 🔒 Security

- ✅ Credentials stored locally, never committed
- ✅ Results directory gitignored
- ✅ Pre-commit hooks prevent credential leaks
- ✅ Environment isolation (no production config by default)
- ✅ Audit logging in results JSONL

**Important**: Never commit:
- `credentials/*.json`
- `results/*.jsonl`
- `.env` files

## 🏗️ Architecture

### Authentication

- **Frontend (Next.js)**: Auth0 integration via browser automation
- **API**: JWT tokens obtained via Auth0 password grant
- **Token Management**: Auto-refresh, secure storage

### Results Storage

- **Format**: JSONL (JSON Lines)
- **Location**: `./results/`
- **Benefits**: Append-only, git-friendly, multi-user safe

### Three-Pillar Approach

1. **Synthetic**: User perspective, browser automation
2. **Integration**: Service-to-service, contract validation
3. **Performance**: Load capacity, response times

## 📝 Writing Tests

### Synthetic Test Example

```typescript
// synthetic/tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  // Auth0 login flow handled by fixture
  await expect(page).toHaveURL(/dashboard/);
});
```

### Integration Test Example

```typescript
// integration/tests/users/get-users.spec.ts
import { test, expect } from '@playwright/test';

test('GET /users returns valid response', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.ok()).toBeTruthy();

  const users = await response.json();
  expect(users).toBeInstanceOf(Array);
});
```

### Performance Test Example

```javascript
// performance/tests/load/api-baseline.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  const res = http.get('https://api-dev.lium.app/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

## 🐛 Troubleshooting

### Tests failing with authentication errors

- Verify credentials are setup: `make credentials`
- Check `credentials/{environment}.json` exists
- Ensure Auth0 client ID is correct in `config/environments/{environment}.json`

### k6 not found

Install k6:
- macOS: `brew install k6`
- Linux: [Installation Guide](https://k6.io/docs/get-started/installation/)

### Permission denied errors

- Check directory permissions: `ls -la credentials/`
- Ensure credentials directory is writable: `chmod 700 credentials/`

### Tests hanging or timing out

- Check network connectivity
- Verify environment URLs in `config/environments/{environment}.json`
- Increase timeouts in environment config

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [k6 Documentation](https://k6.io/docs)
- [Auth0 Documentation](https://auth0.com/docs)
- [JSONL Specification](https://jsonlines.org)

## 🤝 Contributing

See `CONTRIBUTING.md` for guidelines on:
- Writing tests
- Adding new utilities
- Submitting pull requests
- Code style and conventions

## 📄 License

Internal use only - UNLICENSED

---

**Questions?** Contact the Lium Engineering team.
