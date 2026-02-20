# Lium E2E Testing Framework - Setup Guide

This guide walks you through setting up the framework with **real** configuration values.

## Prerequisites

1. **Node.js >= 18.0.0** and **npm >= 9.0.0**
2. **k6** for performance tests: https://k6.io/docs/get-started/installation/
   - macOS: `brew install k6`
   - Linux: See installation guide
3. **lium repository** with `.env.local` configured
4. **VPN access** (for API testing against dev/staging/sandbox)

## Step 1: Install Dependencies

```bash
make install
```

This installs:
- Node modules
- Playwright browsers (chromium, firefox, webkit)

## Step 2: Configure Auth0

The framework needs Auth0 configuration from your `lium` repository.

```bash
make configure
```

This will:
1. Ask where your `lium` repo is located
2. Read `lium/apps/web/.env.local`
3. Extract Auth0 settings:
   - `AUTH0_DOMAIN`
   - `AUTH0_CLIENT_ID`
   - `AUTH0_AUDIENCE`
4. Update all environment configs automatically

**What gets configured:**
- `config/environments/local.json` - Local Docker environment
- `config/environments/dev.json` - Dev environment
- `config/environments/sandbox.json` - Sandbox environment
- `config/environments/staging.json` - Staging environment

## Step 3: Environment URLs (Already Configured)

The environment configs are already set with correct URLs:

**Local:**
- Web: `http://lium-web:3000` (Docker service)
- API: `http://lium-api:8000` (Docker service)

**Dev:**
- Web: `https://app.dev.lium.ai`
- API: VPN Required

**Sandbox:**
- Web: `https://app.sandbox.lium.ai`
- API: VPN Required

**Staging:**
- Web: `https://app.staging.lium.ai`
- API: VPN Required

## Step 4: Setup Credentials

```bash
make credentials
```

This will prompt you for:
- Username (your email)
- Password
- Optional: Elevated/admin credentials

Credentials are stored locally in `./credentials/{environment}.json` and are **never committed** to git.

## Step 5: Verify Setup

Run a simple test to verify everything works:

```bash
# Try the manual login POC (browser will open)
npx playwright test synthetic/tests/auth/manual-login-poc.spec.ts --headed
```

You should see:
1. Browser opens to your environment
2. You can manually log in
3. Test verifies you reached the dashboard

## Testing Against Different Environments

### Local Testing

Requirements:
- Docker containers running (`lium-web` and `lium-api` services)
- Network connectivity to `http://lium-web:3000`

```bash
make test
# Select: Synthetic
# Select: local
```

### Dev/Sandbox/Staging Testing

Requirements:
- **VPN connected** (APIs are not publicly exposed)
- Credentials set up for the environment
- Network access to `app.{env}.lium.ai`

```bash
make test
# Select: Synthetic (browser tests work without VPN)
# Select: dev (or sandbox/staging)
```

**Note:** Integration tests (API tests) require VPN connection since APIs are not publicly exposed.

## Important Limitations

### API Testing Requires VPN

All non-local API endpoints require VPN:
- `dev` - VPN required
- `sandbox` - VPN required
- `staging` - VPN required

**Without VPN:**
- ✅ Synthetic tests (browser) work fine
- ❌ Integration tests (API) will fail
- ❌ Performance tests (k6) will fail

**With VPN:**
- ✅ All test types work

### Local Testing Requirements

For local testing:
- Docker must be running
- `lium-web` and `lium-api` containers must be accessible
- Tests run from host machine connecting to Docker services

## Troubleshooting

### "Auth0 configuration not found"

Run `make configure` and provide the correct path to `lium` repository.

### "No credentials found"

Run `make credentials` to set up credentials for the environment.

### "Connection refused" on local tests

Ensure Docker containers are running:
```bash
docker ps | grep lium
```

You should see `lium-web` and `lium-api` containers.

### API tests failing on dev/sandbox/staging

Ensure you're connected to VPN. API endpoints are not publicly accessible.

### k6 not found

Install k6:
- macOS: `brew install k6`
- Linux: https://k6.io/docs/get-started/installation/

## Next Steps

Once setup is complete:

```bash
# Interactive test runner
make test

# Run specific test types
make test-synthetic      # Browser tests
make test-integration    # API tests (requires VPN for non-local)
make test-performance    # Load tests (requires VPN for non-local)

# View results
make results

# Run internal framework tests
make test-framework
```

## Quick Reference

```bash
make configure          # Configure Auth0 from lium
make credentials        # Setup credentials
make test               # Interactive test runner
make test-synthetic     # Run browser tests
make results            # View test results
```

## File Locations

- **Environment configs:** `config/environments/*.json`
- **Credentials:** `credentials/*.json` (gitignored)
- **Test results:** `results/*.jsonl` (gitignored)
- **Auth0 source:** `../lium/apps/web/.env.local`

## Support

If you encounter issues:
1. Check this setup guide
2. Verify Docker containers are running (for local)
3. Verify VPN connection (for remote environments)
4. Check credentials are set: `ls -la credentials/`
5. Contact Lium Engineering team
