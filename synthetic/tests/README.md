# Test Modules

Tests are organized by domain/feature for fast, focused testing.

## Module Structure

```
tests/
├── basic/      - Health checks, smoke tests (run these first!)
├── auth/       - Authentication, sessions, login/logout
├── chats/      - Chat functionality, messages, conversations
├── storage/    - File storage, uploads, downloads
├── agents/     - AI agents, agent creation, management
├── tools/      - Tool functionality, tool execution
└── tenants/    - Multi-tenancy, organization management
```

## Running Tests

**Run a specific module:**
```bash
make test-chats      # Just chat tests (fast!)
make test-storage    # Just storage tests
make test-agents     # Just agent tests
```

**Run all synthetic tests:**
```bash
make test-synthetic  # All modules
```

**Run basic health checks first:**
```bash
make test-basic      # Quick smoke tests
```

## Writing New Tests

**Where to put your test:**
1. **Basic** - Quick health/smoke tests that verify app is running
2. **Auth** - Login, logout, session management
3. **Chats** - Chat UI, sending messages, conversations
4. **Storage** - File uploads, downloads, browsing
5. **Agents** - Creating, managing, running AI agents
6. **Tools** - Tool installation, configuration, execution
7. **Tenants** - Organization/tenant management

**Example test:**
```typescript
// tests/chats/send-message.spec.ts
import { test, expect } from '../../fixtures/index.js';

test.describe('Send Message', () => {
  test('should send a text message', async ({ page, envConfig }) => {
    await page.goto(`${envConfig.baseUrls.web}/chats`);

    await page.locator('[data-testid="message-input"]').fill('Hello!');
    await page.locator('[data-testid="send-button"]').click();

    await expect(page.locator('.message').last()).toContainText('Hello!');
  });
});
```

## Benefits

✅ **Fast** - Run only what you need (chats = 30s vs all tests = 5min)
✅ **Focused** - Quickly verify a specific feature area
✅ **Organized** - Easy to find tests for a feature
✅ **Scalable** - Add tests to the right module as app grows
