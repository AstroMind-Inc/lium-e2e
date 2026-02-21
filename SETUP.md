# Setup Guide

Quick setup guide for the Lium E2E Testing Framework.

## Prerequisites

- **Node.js >= 18.0.0** and **npm >= 9.0.0**
- **Docker** running (for local testing)
- **Auth0 account** with @astromind.com or access to Lium app

## One-Command Setup

```bash
make setup
```

This will:

1. Install Node dependencies
2. Install Playwright browsers
3. Create necessary directories
4. **Prompt you to authenticate** (opens browser for OAuth)

That's it! You're ready to test.

## Manual Setup (Step by Step)

If you prefer step-by-step setup:

### 1. Install Dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Authenticate

```bash
make auth-setup-admin
```

- Opens browser to `http://lium-web:3000` (or configured URL)
- You log in via OAuth (Google)
- Session saved to `playwright/.auth/admin.json` (gitignored)
- All future tests use this saved session automatically

### 3. Verify It Works

```bash
make test-basic
```

Should show 8 tests passing in ~7 seconds. All tests run **headless** using your saved auth!

### 4. View Results

```bash
make report
```

Opens interactive HTML report with pass/fail status, screenshots, and timeline.

## Environment Configuration

Auth0 configuration needs to be copied from your `lium-web` repo:

```bash
make configure
```

This reads `lium/apps/web/.env.local` and updates all environment configs automatically.

**Already configured:**

- `local.json` - Docker services (http://lium-web:3000)
- `dev.json` - Dev environment (https://app.dev.lium.ai)
- `sandbox.json` - Sandbox (https://app.sandbox.lium.ai)
- `staging.json` - Staging (https://app.staging.lium.ai)

## Testing Different Environments

### Local (Default)

```bash
make test-basic          # Uses local environment by default
```

**Requirements:**

- Docker running with `lium-web` and `lium-api` containers
- Accessible at `http://lium-web:3000` and `http://lium-api:8000`

### Other Environments

```bash
make test                # Interactive - select environment
# Or:
E2E_ENVIRONMENT=dev make test-basic
```

**Requirements for dev/sandbox/staging:**

- VPN connected (APIs not public)
- Authenticated for that environment
- Network access to `app.{env}.lium.ai`

## Authentication Management

### Check Auth Status

```bash
make auth-status
```

Shows which sessions are saved and when they were last updated.

### Re-authenticate

```bash
make auth-clear          # Clear saved sessions
make auth-setup-admin    # Log in again
```

### Multiple Users

```bash
make auth-setup-admin    # Admin (@astromind.com)
make auth-setup-user     # Regular user (non-@astromind.com)
```

Tests will use admin auth by default. Multi-user tests are in `synthetic/tests/auth/`.

## File Structure After Setup

```
lium-e2e/
├── node_modules/          # Dependencies (installed)
├── playwright/.auth/      # Saved sessions (gitignored)
│   └── admin.json         # Your saved auth session
├── playwright-report/     # HTML reports (after running tests)
├── test-results/          # Test artifacts
└── config/environments/   # Environment configs
    ├── local.json         # ✅ Ready
    ├── dev.json           # ⚠️  Needs auth0 config
    ├── sandbox.json       # ⚠️  Needs auth0 config
    └── staging.json       # ⚠️  Needs auth0 config
```

## Troubleshooting

### "No auth session found"

```bash
make auth-setup-admin
```

Make sure you complete the login in the browser window.

### Browser doesn't open

```bash
npx playwright install chromium
```

### "Connection refused" (local tests)

Check Docker containers are running:

```bash
docker ps | grep lium
```

Should see `lium-web` and `lium-api`.

### Tests fail with 401/403 errors

Session expired. Re-authenticate:

```bash
make auth-clear
make auth-setup-admin
```

### "No report found"

Run tests first:

```bash
make test-basic
make report
```

### VPN Issues (dev/sandbox/staging)

- Synthetic tests (browser) work without VPN
- API tests **require VPN** for dev/sandbox/staging

## Quick Start Commands

```bash
# Initial setup
make setup                  # One-time setup + auth

# Run tests
make test-basic            # Quick smoke tests (7s)
make test-auth             # Auth verification
make test                  # Interactive (pick module)

# View results
make report                # HTML report

# Manage auth
make auth-status           # Check saved sessions
make auth-clear            # Clear and re-auth
```

## Next Steps

1. ✅ Run `make test-basic` to verify setup
2. ✅ Run `make report` to see the HTML report
3. ✅ Write tests in `synthetic/tests/chats/` (or other modules)
4. ✅ Run `make test` and select your module

See README.md for full documentation.
