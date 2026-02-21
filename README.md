# Lium E2E Testing Framework

> **Fast, modular, auto-discoverable** end-to-end testing for the Lium platform
> Browser tests • API tests • Performance tests • Zero configuration

## 🎯 Philosophy

**Turn-key operation** - Simple `make` commands, no Node.js knowledge required
**Auto-discovery** - Add test folders, they appear automatically. No config changes needed
**Fast by default** - Headless tests using saved auth sessions, 10x faster than headed mode
**Three pillars** - Synthetic (browser), Integration (API), Performance (load testing)

---

## 🚀 Quick Start

```bash
# 1. Initial setup (one time)
make setup

# 2. Authenticate (one time)
make auth-setup-admin

# 3. Run tests
make test               # Interactive menu
make test-syn-basic     # Run specific module
make report             # View results
```

That's it! Add test files to any module folder and they're automatically discovered.

---

## ✨ What's New

### Auto-Opening HTML Reports ⭐ NEW

**Tests now automatically open the interactive report when complete!**

```bash
make test-syn-all   # Runs tests → Opens report automatically
make test-api-all   # Runs tests → Opens report automatically
```

No manual steps - just run tests and view rich HTML results with screenshots, traces, and videos.

### Unified Authentication

**One auth setup works for ALL test types!**

```bash
make auth-setup-admin   # Authenticate once

# Now both work with same session:
make test-syn-all       # Browser tests ✓
make test-api-all       # API tests ✓ (uses same cookies)
```

Integration tests extract auth cookies from saved browser sessions - no duplicate credential management!

### Auto-Discovery System

**Add a folder → Tests appear automatically**

```bash
# Create new module
mkdir synthetic/tests/my-feature
touch synthetic/tests/my-feature/test.spec.ts

# Instantly available!
make test-syn-my-feature  # ← Auto-discovered
make test                 # ← Shows in CLI menu
```

No code changes. No config updates. Just works.

### Smart Pre-Flight Checks

Before every test run:

1. 🏥 **Server health check** - Ensures app/API is running (fails fast if down)
2. 🔍 **Token validation** - Auto-refreshes expired auth sessions
3. 🚀 **Tests** - Only runs if checks pass

No more mysterious failures from expired tokens or servers being down!

### Three Test Pillars

| Pillar          | What It Tests                  | Command Pattern           |
| --------------- | ------------------------------ | ------------------------- |
| **Synthetic**   | Browser automation, user flows | `make test-syn-<module>`  |
| **Integration** | API endpoints, contracts       | `make test-api-<module>`  |
| **Performance** | Load, stress, throughput       | `make test-perf-<module>` |

---

## 📦 Test Modules

### Synthetic (Browser Tests)

Auto-discovered from `synthetic/tests/`:

```bash
make test-syn-basic              # Health checks & smoke tests
make test-syn-auth               # Authentication flows
make test-syn-tenant-management  # Multi-tenant member lifecycle
make test-syn-chats              # Chat functionality
make test-syn-storage            # File uploads & storage
make test-syn-agents             # AI agent tests
make test-syn-tools              # Tool functionality
make test-syn-tenants            # Multi-tenancy
```

### Integration (API Tests)

Auto-discovered from `integration/tests/`:

```bash
make test-api-health     # API health checks
make test-api-users      # User endpoints
make test-api-chats      # Chat API
make test-api-agents     # Agent API
make test-api-tools      # Tool API
make test-api-tenants    # Tenant API
```

### Performance (Load Tests)

Auto-discovered from `performance/tests/`:

```bash
make test-perf-api-health  # API health endpoint load test
make test-perf-api-load    # API comprehensive load testing
make test-perf-api-spike   # API sudden traffic spike testing
make test-perf-api-stress  # API stress test (find breaking point)
```

**Or use the interactive menu:**

```bash
make test
# → Select pillar → Select module → Select environment → Run!
```

### Customizing Module Metadata

Each test module can optionally include a `manifest.yml` file to customize its display:

```yaml
# synthetic/tests/auth/manifest.yml
name: Authentication
description: OAuth2/Auth0 login flows and session management
icon: 🔐
tags:
  - critical
  - auth
  - oauth
```

**Benefits:**

- **Self-documenting**: Test modules describe themselves
- **Customizable display**: Control name, icon, description shown in CLI
- **Tags**: Organize and filter tests (e.g., "critical", "slow")
- **Fallback**: If no manifest exists, uses directory name with defaults

---

## 🔐 Authentication

### One-Time Setup

```bash
make auth-setup-admin    # Login as @astromind.com admin
make auth-setup-user     # Login as regular user (optional)
```

Opens browser → You log in via OAuth → Session saved forever

### Automatic Token Management

**The framework now handles token expiry automatically!**

Before each test run:

- ✓ Checks if tokens are still valid
- ✓ Auto-refreshes if expired (when possible)
- ✓ Prompts you to re-auth if refresh fails

No more "authentication (logged out)" surprises mid-test!

### Utility Commands

```bash
make auth-status         # Check which sessions are saved
make auth-clear          # Clear sessions (to re-authenticate)
```

---

## 🛠️ All Commands

### Setup

```bash
make setup               # Initial setup (deps, dirs, k6, auth)
make install             # Install/update dependencies
make configure           # Configure Auth0 from lium-web
```

### Authentication

```bash
make auth-setup-admin    # Admin (@astromind.com) authentication
make auth-setup-user     # Regular user authentication
make auth-setup-all      # Both admin and user
make auth-status         # Check saved sessions
make auth-clear          # Clear all saved sessions
```

### Testing - Interactive

```bash
make test                # Interactive test runner (recommended!)
make up                  # Alias for 'make test'
```

### Testing - Direct (Auto-Discovered)

**Pattern rules** - Just add folders, commands work automatically:

```bash
make test-syn-<module>   # Synthetic: synthetic/tests/<module>/
make test-api-<module>   # Integration: integration/tests/<module>/
make test-perf-<module>  # Performance: performance/tests/<module>/
```

Examples:

```bash
make test-syn-basic      # Basic health checks
make test-api-users      # User API tests
make test-perf-homepage  # Homepage load test
```

### Testing - Full Suites

```bash
make test-syn-all        # Run ALL synthetic tests (fast, headless)
make test-api-all        # Run ALL integration tests (fast, headless)
make test-perf-all       # Run ALL performance tests
```

### Quality Checks

```bash
make preflight           # Run all quality checks (format, lint, test, coverage)
```

### Results

```bash
make report              # Open interactive HTML report (opens automatically after test runs)
make results             # CLI summary (JSONL - future: automated tracking)
make results-flaky       # Find flaky tests (future)
```

**Note:** HTML reports now open automatically after running `make test-syn-all` or `make test-api-all`!

### Cleanup

```bash
make clean               # Remove node_modules & artifacts
make down                # Stop running tests
```

---

## 📁 Project Structure

```
lium-e2e/
├── config/
│   └── environments/        # Environment configs (local, dev, sandbox, staging)
│       ├── local.json
│       ├── dev.json
│       ├── sandbox.json
│       └── staging.json
│
├── playwright/
│   └── .auth/               # Saved auth sessions (gitignored)
│       ├── admin.json
│       └── user.json
│
├── synthetic/               # Pillar 1: Browser tests (Playwright)
│   ├── auth-setup/          # Authentication setup scripts
│   ├── fixtures/            # Custom Playwright fixtures
│   ├── tests/               # 📂 Auto-discovered modules
│   │   ├── basic/           # Health checks
│   │   ├── auth/            # Auth flows
│   │   ├── tenant-management/ # Multi-tenant member lifecycle
│   │   ├── chats/           # Chat functionality
│   │   ├── storage/         # File uploads
│   │   ├── agents/          # AI agents
│   │   ├── tools/           # Tools
│   │   └── tenants/         # Multi-tenancy
│   └── playwright.config.ts
│
├── integration/             # Pillar 2: API tests (Playwright)
│   ├── fixtures/            # API test fixtures
│   ├── tests/               # 📂 Auto-discovered modules
│   │   ├── health/          # API health checks
│   │   ├── users/           # User endpoints
│   │   ├── chats/           # Chat API
│   │   ├── agents/          # Agent API
│   │   ├── tools/           # Tool API
│   │   └── tenants/         # Tenant API
│   └── playwright.config.ts
│
├── performance/             # Pillar 3: Performance tests (k6)
│   └── tests/               # 📂 Auto-discovered modules
│       ├── api-health/      # Health endpoint load test
│       │   ├── test.js
│       │   └── manifest.yml
│       ├── api-load/        # Comprehensive load testing
│       │   ├── test.js              # Simple baseline (default)
│       │   ├── advanced.js          # Production-ready scenarios
│       │   ├── manifest.yml
│       │   ├── README.md
│       │   └── POC-SUMMARY.md
│       ├── api-spike/       # Spike testing
│       │   ├── test.js
│       │   └── manifest.yml
│       └── api-stress/      # Stress testing
│           ├── test.js
│           └── manifest.yml
│
├── shared/                  # Shared utilities
│   ├── auth/                # Auth helpers (Auth0, OAuth, JWT)
│   ├── credentials/         # Credential management
│   ├── environment/         # Environment config loader
│   ├── results/             # Result persistence (JSONL)
│   ├── reporting/           # Reporters (Slack, HTML)
│   └── test-discovery/      # Auto-discovery system ⭐
│       └── module-scanner.ts
│
├── ui/
│   └── cli/                 # Interactive CLI
│       ├── index.ts
│       ├── prompts.ts
│       ├── test-runner.ts   # Pre-flight checks, execution
│       └── results-viewer.ts
│
├── tests/                   # Internal framework tests
│   └── unit/                # Unit tests for the framework itself
│
├── playwright-report/       # Consolidated HTML reports
├── test-results/            # Test artifacts (screenshots, videos)
├── Makefile                 # Turn-key commands
└── package.json
```

---

## ✍️ Writing Tests

### Synthetic (Browser) Tests

Create tests in any module under `synthetic/tests/`:

```typescript
// synthetic/tests/my-feature/test.spec.ts
import { test, expect } from "../../fixtures/index.js";

test.describe("My Feature", () => {
  test("can do something", async ({ page, envConfig }) => {
    // Already authenticated via saved session!
    await page.goto(`${envConfig.baseUrls.web}/my-feature`);

    await page.click('[data-testid="action-button"]');
    await expect(page.locator(".result")).toBeVisible();
  });
});
```

**Auto-discovered immediately:**

- `make test-syn-my-feature` works
- Shows in `make test` menu

### UI Discovery Methodology

When writing tests for new UI features, use automated discovery tests to find correct selectors:

1. **Create discovery test** to explore the UI:

```typescript
test("discover UI elements", async ({ page }) => {
  await page.goto("/");

  // Log all buttons
  const buttons = await page.locator("button").all();
  for (const btn of buttons) {
    const text = await btn.textContent();
    const ariaLabel = await btn.getAttribute("aria-label");
    console.log(`Button: "${text}" [aria-label="${ariaLabel}"]`);
  }

  // Take screenshot for reference
  await page.screenshot({ path: "discovery.png", fullPage: true });
});
```

2. **Run the discovery test** to examine output
3. **Document verified selectors** in `SELECTORS.md`
4. **Write production tests** using verified selectors

**Example**: See `synthetic/tests/tenant-management/SELECTORS.md` for documented selectors

### Integration (API) Tests

Create tests in any module under `integration/tests/`:

```typescript
// integration/tests/my-api/test.spec.ts
import { test, expect } from "@playwright/test";

test("GET /my-endpoint returns 200", async ({ request }) => {
  const response = await request.get("/my-endpoint");

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toHaveProperty("data");
});
```

**Auto-discovered immediately:**

- `make test-api-my-api` works
- Shows in `make test` menu

### Performance (k6) Tests

Create tests in any module under `performance/tests/`:

```javascript
// performance/tests/my-load/test.js
import http from "k6/http";
import { check } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up
    { duration: "1m", target: 10 }, // Stay
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% < 500ms
  },
};

export default function () {
  const res = http.get(process.env.BASE_URL || "http://localhost:3000");
  check(res, { "status is 200": (r) => r.status === 200 });
}
```

**Auto-discovered immediately:**

- `make test-perf-my-load` works
- Shows in `make test` menu

### Performance Testing Features

Comprehensive k6 performance testing with multiple scenarios:

**Test Scenarios:**

- **Baseline** (Constant Load) - Establish normal performance

  ```javascript
  executor: "constant-vus";
  vus: 10;
  duration: "2m";
  ```

- **Spike** (Sudden Traffic) - Test system resilience

  ```javascript
  stages: [
    { duration: "10s", target: 50 }, // Spike up
    { duration: "30s", target: 50 }, // Sustain
    { duration: "10s", target: 0 }, // Ramp down
  ];
  ```

- **Stress** (Find Limits) - Gradually increase to find breaking point
  ```javascript
  stages: [
    { duration: "1m", target: 20 },
    { duration: "1m", target: 40 },
    { duration: "1m", target: 60 },
    { duration: "1m", target: 80 },
  ];
  ```

**User Behavior Simulation:**

- 50% Read-Heavy: Browsing, listing, viewing
- 30% Balanced: Mix of reads and writes
- 20% Write-Heavy: Creating, updating, uploading

**Custom Metrics:**

```javascript
const errorRate = new Rate("errors");
const apiLatency = new Trend("api_latency");
const authFailures = new Counter("auth_failures");
```

**See**: `performance/tests/api-load/POC-SUMMARY.md` for full details

---

## 🌍 Environments

Configure in `config/environments/`:

| Environment | File           | URL Example                     |
| ----------- | -------------- | ------------------------------- |
| Local       | `local.json`   | `http://lium-web:3000` (Docker) |
| Dev         | `dev.json`     | `https://dev.lium.app`          |
| Sandbox     | `sandbox.json` | `https://sandbox.lium.app`      |
| Staging     | `staging.json` | `https://staging.lium.app`      |

Select environment:

- **Interactively**: `make test` → Choose environment
- **Directly**: `E2E_ENVIRONMENT=dev make test-syn-basic`

---

## 📊 Viewing Results

### Interactive HTML Report (Recommended)

```bash
make report
```

Shows:

- ✅ Pass/fail status for all tests
- 📸 Screenshots (for failed tests)
- 🎥 Videos (for failed tests)
- 📊 Timeline, duration, retries
- 🔍 Detailed error messages

**Consolidated view**: All test runs (synthetic + integration) in one report!

### CLI Summary (Coming Soon)

```bash
make results
```

Future: JSONL-based historical tracking and trend analysis.

---

## 🐛 Troubleshooting

### "No auth session found"

```bash
make auth-setup-admin
```

### "Authentication expired"

**The framework now auto-checks this before tests!**

If auto-refresh fails, you'll see:

```
⚠️  Authentication sessions expired and could not be refreshed
? Would you like to re-authenticate now? (Y/n)
```

Choose Yes, then run the suggested command.

### "Web app is not accessible"

**The framework now checks server health before tests!**

Make sure your app is running:

```bash
cd lium/apps/web && npm run dev
# or
docker-compose up
```

### "k6 is not installed"

```bash
brew install k6  # macOS
```

During `make setup`, k6 install is prompted automatically.

### "No HTML report found"

```bash
make test-syn-basic  # Run tests first
make report          # Then view report
```

### Tests running in headed mode (browser visible)

By default, tests run **headless** (fast, no browser window).

To run headed (browser visible):

```bash
# Add --headed flag in playwright.config.ts or:
npx playwright test --headed synthetic/tests/basic/
```

---

## 🔒 Security

- ✅ Auth sessions stored locally (`playwright/.auth/` - gitignored)
- ✅ No passwords in code or config
- ✅ OAuth login (secure, interactive)
- ✅ Credentials never committed (`.gitignore` enforced)
- ✅ File permissions restricted (`chmod 700 credentials/`)

---

## 🧪 Quality Checks (Preflight)

The framework has **internal quality checks** to ensure reliability:

```bash
make preflight           # Run all checks (format + lint + test + coverage)
```

**Preflight checks:**

1. **Formatting** - Prettier auto-formats all code
2. **Linting** - ESLint with auto-fix for code quality
3. **Unit Tests** - 122 tests ensuring framework reliability
4. **Coverage** - 88.55% coverage (exceeds 80% goal)

Tests cover:

- Credential management
- Environment selection
- Result persistence (JSONL)
- Auth helpers (Auth0, OAuth, JWT)
- CLI utilities
- Slack reporting

**Current Coverage**: 88.55% (✅ exceeds 80% threshold)

---

## 🚦 How It Works

### Pre-Flight Checks (Automatic)

Every test run performs these checks:

1. **🏥 Server Health Check**
   - Pings web app (for synthetic tests)
   - Pings API (for integration tests)
   - Prompts if server is down

2. **🔍 Token Validation**
   - Checks if auth sessions are valid
   - Auto-refreshes if expired (when possible)
   - Prompts to re-auth if refresh fails

3. **🚀 Test Execution**
   - Only runs if above checks pass
   - Clear error messages if something's wrong

### Auto-Discovery System

The `ModuleScanner` class automatically finds test modules:

```typescript
// Scans: synthetic/tests/
// Finds: basic/, auth/, chats/, storage/, ...
// Generates: test-syn-basic, test-syn-auth, test-syn-chats, ...
```

**Magic happens in:**

- `shared/test-discovery/module-scanner.ts` - Filesystem scanning
- `Makefile` - Pattern rules (`test-syn-%`, `test-api-%`, `test-perf-%`)
- `ui/cli/prompts.ts` - Dynamic menu generation

**Benefits:**

- Add folder → Command works immediately
- No code changes needed
- Scalable to unlimited modules
- Clean UI (empty modules auto-hidden)

---

## 📚 Additional Documentation

- `synthetic/tests/README.md` - Test module auto-discovery details
- `ROADMAP.md` - Future enhancements and priorities
- `SETUP.md` - Detailed setup guide (for new team members)

---

## 🎯 Quick Workflow

```bash
# One-time setup
make setup
make auth-setup-admin

# Daily workflow
make test                   # Interactive menu
# or
make test-syn-basic         # Direct command
make report                 # View results

# Add new tests
mkdir synthetic/tests/my-feature
touch synthetic/tests/my-feature/test.spec.ts
make test-syn-my-feature    # ← Auto-discovered!
```

---

## 💡 Design Principles

1. **Turn-key operation** - Simple `make` commands, minimal hand-holding
2. **Open/Closed Principle** - Add tests without modifying framework code
3. **Fast by default** - Headless tests, saved sessions, parallel execution
4. **Auto-discovery** - Zero-config test organization
5. **Fail-fast with context** - Pre-flight checks, clear error messages
6. **Security-first** - Local credentials, OAuth, gitignored secrets

---

**Focus**: Fast, simple, modular POC testing for internal teams

🚀 **Get started**: `make setup` → `make test`
