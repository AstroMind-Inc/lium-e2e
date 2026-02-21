# Authentication Setup

This directory contains scripts for one-time interactive authentication that saves your session for all future tests.

## Why This Approach?

**Problem:** OAuth login is secure but slow. Doing it for every test run wastes time.

**Solution:**

1. You log in **once** via browser (interactive, secure, guided)
2. Your authenticated session is saved locally
3. All future tests reuse that session and run **headless** (fast!)

## Quick Start

### Setup Both (Recommended)

```bash
make auth-setup-all
```

**Credentials**: Check **1Password > Test Accounts**
- **Admin**: Use your @astromind.com account (via Google OAuth)
- **User**: `test-user@astromind.com` (password in 1Password)

This sets up both admin and user sessions. Most test scenarios need both.

### Setup Admin Authentication Only

```bash
make auth-setup-admin
```

- Opens browser with clear prompt
- You log in with @astromind.com account via Google OAuth
- Session saved to `playwright/.auth/admin.json` (gitignored)
- All admin tests will now run headless

### Setup Regular User Authentication Only

```bash
make auth-setup-user
```

- Opens browser with clear prompt
- You log in with `test-user@astromind.com` (credentials in 1Password)
- Session saved to `playwright/.auth/user.json` (gitignored)
- All user tests will now run headless

### Legacy: Setup Both Individually

```bash
make auth-setup-all
```

Sets up both admin and user sessions in sequence.

## Managing Authentication

### Check Status

```bash
make auth-status
```

Shows which auth sessions are saved and when they were last updated.

### Clear Sessions

```bash
make auth-clear
```

Removes all saved sessions. Useful when:

- Tokens expire
- You want to test with a different account
- You're troubleshooting auth issues

## How It Works

1. **First Time:** Run `make auth-setup-admin` or `make auth-setup-user`
   - Browser opens in headed mode
   - Large, colored banner appears telling you what to do
   - You complete OAuth login normally
   - Once you reach the dashboard, session is captured and saved
   - Browser closes automatically

2. **Subsequent Tests:** Run any test command
   - Tests load your saved session
   - No login needed - you're already authenticated
   - Tests run headless for maximum speed
   - Session includes cookies, localStorage, JWT tokens

3. **When Tokens Expire:**
   - Tests may start failing with auth errors
   - Run `make auth-clear` then re-run setup
   - Or just re-run `make auth-setup-admin` to overwrite

## File Locations

- `playwright/.auth/admin.json` - Admin session (gitignored)
- `playwright/.auth/user.json` - User session (gitignored)

**These files are automatically gitignored and never committed to the repository.**

## Writing Tests with Saved Auth

Tests automatically use saved auth based on their filename:

```typescript
// tests/admin-dashboard.spec.ts
// This will automatically use admin.json (chromium-admin project)

test("admin can access settings", async ({ page }) => {
  // Already logged in as admin!
  await page.goto("/settings");
  await expect(page.locator("h1")).toContainText("Settings");
});
```

```typescript
// tests/user-profile.spec.ts
// This will automatically use user.json (chromium-user project)

test("user can view profile", async ({ page }) => {
  // Already logged in as user!
  await page.goto("/profile");
  await expect(page.locator("h1")).toContainText("Profile");
});
```

## Manual Auth in Tests

If you need to test the login flow itself (not just authenticated features):

```typescript
// tests/auth/manual-login-poc.spec.ts
// No saved auth - tests the login flow itself

test("user can log in via OAuth", async ({ page }) => {
  await page.goto("/");
  // Test will wait for manual login
  // See manual-login-poc.spec.ts for examples
});
```

## Troubleshooting

**Browser doesn't open:**

- Check that you have Playwright browsers installed: `npx playwright install`

**"Auth session not found" error:**

- Run `make auth-setup-admin` or `make auth-setup-user` first

**Tests fail with 401/403 errors:**

- Your session may have expired
- Run `make auth-clear` then re-run setup

**Want to test with different account:**

- Run `make auth-clear`
- Re-run `make auth-setup-admin` or `make auth-setup-user`
- Log in with the new account

## Benefits

✅ **Security:** You provide credentials interactively (never stored in code)
✅ **Speed:** Tests run headless after initial setup (10x faster)
✅ **Simplicity:** One command to set up, tests just work
✅ **Flexibility:** Easy to switch accounts or re-authenticate
✅ **Trust:** You see the OAuth flow, no hidden password grants
