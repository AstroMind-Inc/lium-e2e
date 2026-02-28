# Lium E2E Testing Framework

> **Fast, modular, auto-discoverable** end-to-end testing for the Lium platform.
> Browser tests · API tests · Performance tests · Zero configuration.

## Pillars

| Pillar | Tool | What it tests |
|--------|------|---------------|
| **Synthetic** | Playwright (browser) | Full user flows — UI, auth, navigation |
| **Integration** | Playwright (API) | REST API endpoints directly |
| **Performance** | k6 | Load, spike, and stress tests |

---

## Quick Start (First Time)

```bash
make setup           # Install deps, browsers, k6
make auth-setup-all  # Sign in once — opens a browser (Google OAuth works)
make test-syn-basic  # Verify everything works
```

All `make` commands default to the **local** environment (Docker at `http://lium-web:3000`).

---

## Authentication

Understanding auth is the key to running tests effectively across environments.

### How it works

The app uses Auth0 with HTTP-only encrypted cookies. There is no raw JWT token that can be
injected — the session lives in a server-encrypted cookie. Playwright saves that complete
browser session (cookies + storage state) to a file after a real login. Tests load the file
and start already authenticated — no Auth0 redirect, no login delay.

```
playwright/.auth/
  admin-local.json      ← local environment, admin session
  user-local.json       ← local environment, user session
  admin-staging.json    ← staging environment, admin session
  user-staging.json     ← staging environment, user session
  ...
```

Sessions are **per-environment** — authenticating for staging does not overwrite your local
session. All session files are **gitignored** and stay only on your machine.

### Three layers — pick the right one

| Layer | How set up | Best for | Supports Google OAuth? |
|-------|-----------|----------|----------------------|
| **Sessions** (browser) | `make auth-setup-all` | Local dev, any environment | ✅ Yes |
| **Credentials file** | `make creds-setup` | Headless refresh, avoiding browser popups | ❌ Email+password only |
| **ENV vars** | `E2E_ADMIN_EMAIL` etc. | CI pipelines | ❌ Email+password only |

**If you use Google OAuth (most developers):** rely on sessions only.
Run `make auth-setup-all [env=<env>]` once per environment, sign in with Google in the
browser that opens. That's it — you won't be prompted again until the session expires
(typically days to weeks).

**If you run CI:** create a dedicated Auth0 test account with email+password (not Google
SSO), and pass credentials via ENV vars. See [CI Setup](#ci-setup).

**`make creds-setup` is optional** even for local use. It only helps if you want the
framework to silently refresh expired sessions without ever opening a browser window.

### Session fallback chain

Before every test run, global-setup checks sessions automatically:

```
1. playwright/.auth/{role}-{env}.json present and valid?
      ✅  → tests run, no action needed

2. Email/password credentials available?
   (ENV vars  E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
    or file   credentials/{env}.json)
      ✅  → headless login, session refreshed silently

3. No credentials available
      →  prints: "run make auth-setup-admin"
         opens a browser, Google OAuth works there
```

You only need to act when you reach step 3, and only then if your session has expired.

### Setting up sessions per environment

```bash
# Local (default)
make auth-setup-all

# Any other environment
make auth-setup-all env=dev
make auth-setup-all env=staging
make auth-setup-all env=production

# Check what sessions you have
make auth-status
make auth-status env=staging

# Remove sessions for an environment (forces re-auth next run)
make auth-clear
make auth-clear env=staging
```

---

## Environments

| Environment | Web URL | API | Notes |
|-------------|---------|-----|-------|
| `local` | `http://lium-web:3000` | `http://lium-api:8000` | Docker — default |
| `dev` | `https://app.dev.lium.ai` | VPN required | |
| `sandbox` | `https://app.sandbox.lium.ai` | VPN required | |
| `staging` | `https://app.staging.lium.ai` | VPN required | |
| `production` | `https://app.lium.ai` | VPN required | |

All `make` commands accept `env=` to target a different environment:

```bash
make test-syn-all env=staging
make test-syn-auth env=dev
make auth-setup-all env=production
make auth-status env=sandbox
```

### VPN and integration tests

**Synthetic (browser) tests** use the public web URL — no VPN needed for any environment.

**Integration (API) tests** call the API directly. For every environment except `local`,
the API requires VPN:

```bash
# Fails fast with a clear message if VPN is not connected:
make test-api-all env=staging

# With VPN connected, provide the real API URL:
BASE_API_URL=https://api.staging.lium.ai make test-api-all env=staging
```

### Local Docker hostname

The local environment uses `lium-web` as the hostname (Docker service name). Running tests
from your host machine requires either:
- `/etc/hosts` entry: `127.0.0.1 lium-web lium-api`
- Or URL override: `E2E_BASE_URL=http://localhost:3000 make test-syn-all`

---

## Make Command Reference

### Setup

| Command | Description |
|---------|-------------|
| `make setup` | First-time: installs deps, browsers, k6, prompts for auth |
| `make install` | Install/update npm deps and Playwright browsers |
| `make configure` | Sync Auth0 config from `../lium/apps/web/.env.local` |
| `make preflight` | Format + lint + unit tests — run before committing |

### Authentication

All commands accept `env=` (default: `local`).

| Command | Description |
|---------|-------------|
| `make auth-setup-admin` | Open browser → sign in as admin → save session |
| `make auth-setup-user` | Open browser → sign in as regular user → save session |
| `make auth-setup-all` | Both admin and user in one step |
| `make auth-status` | Show session status for current env |
| `make auth-status env=staging` | Show session status for staging |
| `make auth-clear` | Delete sessions for current env |
| `make auth-clear env=staging` | Delete staging sessions only |

### Credentials (email+password)

Only needed for CI or local headless auto-refresh. Skippable for Google OAuth users.

| Command | Description |
|---------|-------------|
| `make creds-setup` | Save email+password for current env (prompted interactively) |
| `make creds-setup env=staging` | Save credentials for staging |
| `make creds-status` | Show which environments have credentials saved |

### Running Tests

All test commands accept `env=` (default: `local`).

#### Full suite

| Command | Description |
|---------|-------------|
| `make test-syn-all` | All synthetic browser tests |
| `make test-api-all` | All integration API tests |
| `make test-perf-all` | All performance tests (requires k6) |

#### By module

Test modules are auto-discovered from the filesystem — add a folder, get a command:

```
synthetic/tests/<module>/    →  make test-syn-<module>
integration/tests/<module>/  →  make test-api-<module>
performance/tests/<module>/  →  make test-perf-<module>
```

Current synthetic modules:

| Command | What it tests |
|---------|---------------|
| `make test-syn-basic` | Smoke tests — is the app up? |
| `make test-syn-auth` | RBAC, CMD-K command palette |
| `make test-syn-chats` | Chat create / message / rename / delete |
| `make test-syn-storage` | File upload, preview, download, delete — all browsers |
| `make test-syn-tenant-management` | Add/remove users from tenants |
| `make test-syn-workflows` | Workflow functionality |

#### Interactive runner

```bash
make test   # (or: make up)
```

Prompts for pillar, module, and environment. Good for exploration.

### Results and Reports

| Command | Description |
|---------|-------------|
| `make report` | Open latest HTML report (screenshots, traces, videos) |
| `make results` | JSONL summary — synthetic tests |
| `make results-api` | JSONL summary — integration tests |
| `make results-flaky` | Find tests that flip between pass/fail |

Reports open automatically after `make test-syn-all` / `make test-api-all` on non-CI runs.

### Cleanup

| Command | Description |
|---------|-------------|
| `make clean` | Remove node_modules, dist, coverage, reports |
| `make clean-reports` | Remove HTML reports only (JSONL preserved) |
| `make down` | Kill any running Playwright / k6 processes |

---

## CI Setup

```bash
# Required
export E2E_ENVIRONMENT=staging
export E2E_ADMIN_EMAIL=admin@astromind.com
export E2E_ADMIN_PASSWORD=<secret>
export E2E_USER_EMAIL=test-user@astromind.com
export E2E_USER_PASSWORD=<secret>

# Integration tests only (API requires VPN in CI too)
export BASE_API_URL=https://api.staging.lium.ai

# Run
make test-syn-all
```

Global-setup detects the ENV vars on first run, performs headless login, and saves sessions
automatically. No `make auth-setup-*` needed.

**Important:** CI accounts must use **email+password login in Auth0**, not Google OAuth.
Google OAuth requires an interactive browser — it cannot be automated headlessly.

---

## Writing Tests

### Use the right fixture

```typescript
import { test, expect } from "../../fixtures/index.js";

// Admin-authenticated browser (session from playwright/.auth/admin-{env}.json)
test("admin can access dashboard", async ({ adminPage, envConfig }) => {
  await adminPage.goto(`${envConfig.baseUrls.web}/admin`);
  expect(adminPage.url()).toContain("/admin");
});

// User-authenticated browser (session from playwright/.auth/user-{env}.json)
test("user can view chats", async ({ userPage, envConfig }) => {
  await userPage.goto(`${envConfig.baseUrls.web}/chats`);
  expect(userPage.url()).toContain("/chats");
});

// Unauthenticated browser — tests the login redirect
test("unauthenticated redirects to login", async ({ page, envConfig }) => {
  await page.goto(`${envConfig.baseUrls.web}/admin`);
  expect(page.url()).toContain("auth0.com");
});
```

### Available fixtures

| Fixture | Type | Description |
|---------|------|-------------|
| `adminPage` | `Page` | Browser with admin session loaded |
| `userPage` | `Page` | Browser with user session loaded |
| `page` | `Page` | Unauthenticated browser |
| `envConfig` | `EnvironmentConfig` | URLs, Auth0 config, timeouts |
| `environment` | `Environment` | Current environment name (`"local"`, `"staging"`, …) |
| `credentials` | object | Email+password credentials (if configured) |
| `auth0Helper` | `Auth0Helper` | Programmatic Auth0 operations |

### File naming drives project assignment

Playwright assigns the right session automatically based on the spec filename:

| Filename contains | Playwright project | Session loaded |
|------------------|--------------------|----------------|
| `admin` | `chromium-admin` | `admin-{env}.json` |
| `user` | `chromium-user` | `user-{env}.json` |
| `tenant-management` | `chromium-tenant` | Both admin and user (manual contexts) |
| Neither | `chromium` | None (unauthenticated) |

For tests requiring both roles in one file (e.g. `member-lifecycle.spec.ts`), create
contexts manually using `browser.newContext({ storageState: <path> })`.

**Test execution order:** The `chromium-tenant` project declares `dependencies` on all other
projects (`chromium`, `chromium-admin`, `chromium-user`, `firefox`, `webkit`). Tenant-management
tests therefore run only after the full suite completes. This prevents the member-lifecycle
test — which removes a user from a tenant during setup — from interfering with concurrent
user-authenticated tests running in other projects.

### Test file locations

```
synthetic/tests/
  basic/               ← smoke tests, no auth required
  auth/                ← RBAC, command palette
  chats/               ← chat lifecycle
  storage/             ← file/folder management
  tenant-management/   ← multi-user admin flows
  workflows/           ← workflow tests
```

---

## Project Structure

```
lium-e2e/
├── config/environments/         Environment configs (committed — public Auth0 values)
│   ├── local.json
│   ├── dev.json
│   ├── sandbox.json
│   ├── staging.json
│   └── production.json
│
├── playwright/.auth/            Saved browser sessions (gitignored, per-environment)
│   ├── admin-local.json
│   ├── user-local.json
│   ├── admin-staging.json
│   └── ...
│
├── credentials/                 Email+password credentials (gitignored, per-environment)
│   ├── local.json
│   ├── staging.json
│   └── ...
│
├── synthetic/                   Pillar 1: Browser tests (Playwright)
│   ├── tests/                   Auto-discovered test modules
│   ├── fixtures/index.ts        adminPage, userPage, envConfig fixtures
│   ├── global-setup.ts          Health check + session validation
│   ├── auth-setup/              Session setup scripts
│   └── playwright.config.ts
│
├── integration/                 Pillar 2: API tests (Playwright)
│   ├── tests/                   Auto-discovered test modules
│   ├── global-setup.ts          API reachability + VPN check
│   └── playwright.config.ts
│
├── performance/                 Pillar 3: Load tests (k6)
│   └── tests/                   Auto-discovered test modules
│
├── shared/
│   ├── auth/
│   │   └── headless-login.ts    Core headless login engine + session management
│   ├── credentials/
│   │   └── credential-manager.ts
│   ├── environment/
│   │   └── env-selector.ts
│   └── types/index.ts
│
├── results/                     JSONL test results (gitignored)
├── playwright-report/           HTML reports (gitignored)
├── test-results/                Screenshots, videos, traces (gitignored)
└── Makefile
```

---

## Preflight (Framework Health)

Validates the framework itself before running tests:

```bash
make preflight
```

Runs: Prettier format → ESLint → 122 unit tests → coverage check (≥ 80%).

---

## Troubleshooting

**"session expired or missing — run make auth-setup-admin"**
→ Run `make auth-setup-admin [env=<env>]`. Sign in with Google OAuth or email+password.

**"Cannot reach host: http://lium-web:3000"**
→ Start Docker: `cd ../lium && docker compose up -d`
→ Or use: `E2E_BASE_URL=http://localhost:3000 make test-syn-all`

**"API requires VPN access for staging"**
→ Connect to VPN, then: `BASE_API_URL=https://api.staging.lium.ai make test-api-all env=staging`

**"k6 is not installed"**
→ `brew install k6`

**Tests hang or redirect to Auth0 unexpectedly**
→ Check `make auth-status` — the session may be expired.
→ Run `make auth-setup-all` to refresh.

**Download events not firing in webkit**
→ This is expected. Webkit handles some downloads natively without emitting a Playwright
`download` event. The storage tests catch this with a try/catch: if the event times out,
the click is still considered successful (the browser initiated the download natively).
