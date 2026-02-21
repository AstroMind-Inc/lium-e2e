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
1. 🏥 **Server health check** - Ensures app/API is running
2. 🔍 **Token validation** - Auto-refreshes expired auth sessions
3. 🚀 **Tests** - Only runs if checks pass

No more mysterious failures from expired tokens or servers being down!

### Three Test Pillars

| Pillar | What It Tests | Command Pattern |
|--------|---------------|-----------------|
| **Synthetic** | Browser automation, user flows | `make test-syn-<module>` |
| **Integration** | API endpoints, contracts | `make test-api-<module>` |
| **Performance** | Load, stress, throughput | `make test-perf-<module>` |

---

## 📦 Test Modules

### Synthetic (Browser Tests)

Auto-discovered from `synthetic/tests/`:

```bash
make test-syn-basic      # Health checks & smoke tests
make test-syn-auth       # Authentication flows
make test-syn-chats      # Chat functionality
make test-syn-storage    # File uploads & storage
make test-syn-agents     # AI agent tests
make test-syn-tools      # Tool functionality
make test-syn-tenants    # Multi-tenancy
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
make test-perf-homepage  # Homepage load test
make test-perf-api       # API baseline performance
```

**Or use the interactive menu:**
```bash
make test
# → Select pillar → Select module → Select environment → Run!
```

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
make test-synthetic      # All browser tests
make test-integration    # All API tests
make test-performance    # All performance tests
make test-framework      # Internal framework tests
```

### Special Tests
```bash
make test-multi-user     # Admin + user flow (headless)
```

### Results
```bash
make report              # Open interactive HTML report ⭐
make results             # CLI summary (future: requires JSONL)
```

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
│       └── homepage/        # Homepage load test
│           └── homepage.js
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
import { test, expect } from '../../fixtures/index.js';

test.describe('My Feature', () => {
  test('can do something', async ({ page, envConfig }) => {
    // Already authenticated via saved session!
    await page.goto(`${envConfig.baseUrls.web}/my-feature`);

    await page.click('[data-testid="action-button"]');
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

**Auto-discovered immediately:**
- `make test-syn-my-feature` works
- Shows in `make test` menu

### Integration (API) Tests

Create tests in any module under `integration/tests/`:

```typescript
// integration/tests/my-api/test.spec.ts
import { test, expect } from '@playwright/test';

test('GET /my-endpoint returns 200', async ({ request }) => {
  const response = await request.get('/my-endpoint');

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toHaveProperty('data');
});
```

**Auto-discovered immediately:**
- `make test-api-my-api` works
- Shows in `make test` menu

### Performance (k6) Tests

Create tests in any module under `performance/tests/`:

```javascript
// performance/tests/my-load/test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '1m', target: 10 },   // Stay
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% < 500ms
  },
};

export default function () {
  const res = http.get(process.env.BASE_URL || 'http://localhost:3000');
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

**Auto-discovered immediately:**
- `make test-perf-my-load` works
- Shows in `make test` menu

---

## 🌍 Environments

Configure in `config/environments/`:

| Environment | File | URL Example |
|-------------|------|-------------|
| Local | `local.json` | `http://lium-web:3000` (Docker) |
| Dev | `dev.json` | `https://dev.lium.app` |
| Sandbox | `sandbox.json` | `https://sandbox.lium.app` |
| Staging | `staging.json` | `https://staging.lium.app` |

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

## 🧪 Testing the Framework Itself

The framework has **internal unit tests** to ensure reliability:

```bash
make test-framework
```

Tests coverage:
- Credential management
- Environment selection
- Result persistence (JSONL)
- Auth helpers
- CLI utilities

**Goal**: 80%+ coverage for critical utilities

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
