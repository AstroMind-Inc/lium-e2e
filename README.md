# Lium E2E Testing Framework

End-to-end testing framework for the Lium application. Fast, headless browser tests using saved authentication sessions.

## 🚀 Quick Start

```bash
# 1. Setup (installs dependencies, creates directories)
make setup

# 2. Authenticate once (opens browser for OAuth login)
make auth-setup-admin

# 3. Run tests (fast, headless)
make test-basic
make report
```

That's it! Tests now run headless using your saved session.

## ✨ Key Features

- **One-time auth**: Log in once via browser, tests reuse your session forever
- **Headless by default**: 10x faster than headed mode
- **Modular tests**: Test only what you need (chats, storage, agents, etc.)
- **Interactive CLI**: Select modules and environments interactively
- **HTML reports**: Beautiful interactive reports with screenshots

## 📦 Test Modules

Tests organized by domain for fast, focused testing:

```bash
make test-basic      # Health checks & smoke tests (7s)
make test-auth       # Authentication verification
make test-chats      # Chat functionality (add tests here)
make test-storage    # Storage & uploads (add tests here)
make test-agents     # AI agents (add tests here)
make test-tools      # Tools (add tests here)
make test-tenants    # Multi-tenancy (add tests here)
```

**Or use interactive CLI:**
```bash
make test
# Select: Synthetic → Module → Environment → Run!
```

## 🔐 Authentication

### Initial Setup
```bash
make auth-setup-admin    # Login as @astromind.com admin
make auth-setup-user     # Login as regular user (optional)
```

Opens a browser, you log in via OAuth, session is saved to `playwright/.auth/` (gitignored).

### Check Status
```bash
make auth-status         # See which sessions are saved
make auth-clear          # Clear sessions (to re-authenticate)
```

All tests automatically use your saved session - no login needed!

## 📊 View Results

```bash
make report              # Opens interactive HTML report
```

Shows:
- ✅ Pass/fail status
- 📸 Screenshots (on failure)
- 🎥 Videos (on failure)
- 📊 Timeline and details

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| **Setup** | |
| `make setup` | Install dependencies, setup directories, authenticate |
| **Authentication** | |
| `make auth-setup-admin` | Login as admin (@astromind.com) |
| `make auth-setup-user` | Login as regular user |
| `make auth-status` | Check saved sessions |
| `make auth-clear` | Clear saved sessions |
| **Testing** | |
| `make test` | Interactive test runner (pick module/env) |
| `make test-basic` | Health checks & smoke tests |
| `make test-auth` | Auth verification tests |
| `make test-chats` | Chat functionality |
| `make test-storage` | Storage & uploads |
| `make test-agents` | AI agents |
| `make test-tools` | Tools |
| `make test-tenants` | Multi-tenancy |
| **Results** | |
| `make report` | Open interactive HTML report |
| **Cleanup** | |
| `make clean` | Remove node_modules and temp files |
| `make down` | Stop any running tests |

## 📁 Project Structure

```
lium-e2e/
├── config/environments/  # Environment configs (local, dev, sandbox, staging)
├── playwright/.auth/     # Saved auth sessions (gitignored)
├── synthetic/
│   ├── auth-setup/       # Auth setup scripts
│   └── tests/            # Tests organized by module
│       ├── basic/        # Health checks & smoke tests
│       ├── auth/         # Auth verification
│       ├── chats/        # Chat tests (add here)
│       ├── storage/      # Storage tests (add here)
│       ├── agents/       # Agent tests (add here)
│       ├── tools/        # Tool tests (add here)
│       └── tenants/      # Tenant tests (add here)
├── ui/cli/               # Interactive CLI
└── Makefile              # All commands
```

## ✍️ Writing Tests

Create tests in the appropriate module directory:

```typescript
// synthetic/tests/chats/send-message.spec.ts
import { test, expect } from '../../fixtures/index.js';

test('can send a message', async ({ page, envConfig }) => {
  // Already authenticated via saved session!
  await page.goto(`${envConfig.baseUrls.web}/chats`);

  await page.locator('[data-testid="message-input"]').fill('Hello!');
  await page.locator('[data-testid="send-button"]').click();

  await expect(page.locator('.message').last()).toContainText('Hello!');
});
```

Tests run **headless by default** using your saved auth session. Fast and simple!

## 🌍 Environments

Configure in `config/environments/`:
- `local.json` - Local Docker (http://lium-web:3000)
- `dev.json` - Development environment
- `sandbox.json` - Sandbox environment
- `staging.json` - Staging environment

Select environment interactively with `make test` or set explicitly:
```bash
E2E_ENVIRONMENT=dev make test-basic
```

## 🐛 Troubleshooting

**"No auth session found"**
```bash
make auth-setup-admin
```

**Tests failing with auth errors**
```bash
# Clear and re-authenticate
make auth-clear
make auth-setup-admin
```

**No HTML report found**
```bash
# Run tests first
make test-basic
make report
```

**Browser doesn't open for auth setup**
```bash
# Check Playwright is installed
npx playwright install chromium
```

## 📚 Documentation

- `synthetic/auth-setup/README.md` - Authentication system details
- `synthetic/tests/README.md` - Test module organization
- `synthetic/tests/_examples/` - Example tests (not run)
- `synthetic/tests/_future/` - Complex tests (for later)

## 🔒 Security

- ✅ Auth sessions stored locally (never committed)
- ✅ `playwright/.auth/` is gitignored
- ✅ No passwords stored in code
- ✅ Interactive OAuth login (secure)

---

**Quick workflow:**
1. `make auth-setup-admin` (once)
2. `make test-basic` (verify it works)
3. Write tests in module directories
4. `make test` (run your tests)
5. `make report` (see results)

🎯 Focus is on **fast, simple, POC testing** - not comprehensive coverage yet.
