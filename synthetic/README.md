# Synthetic Tests (Browser Automation)

Playwright-based browser automation tests simulating real user interactions with the Lium Next.js frontend.

## Overview

Synthetic tests use Playwright to:

- Test user flows through the application
- Validate Auth0 authentication
- Verify UI behavior and navigation
- Test cross-service interactions from user perspective

## Structure

```
synthetic/
├── tests/              # Test suites
│   ├── auth/          # Authentication tests
│   ├── user-flows/    # User journey tests
│   └── cross-service/ # Cross-service workflow tests
├── page-objects/      # Page Object Model classes
├── fixtures/          # Custom Playwright fixtures
└── playwright.config.ts
```

## Running Tests

### Via Makefile

```bash
# Run all synthetic tests
make test-synthetic

# Run with specific environment
E2E_ENVIRONMENT=dev make test-synthetic
```

### Via npm

```bash
# Run all tests
cd synthetic && npx playwright test

# Run specific test file
cd synthetic && npx playwright test tests/auth/login.spec.ts

# Run tests in headed mode (see browser)
cd synthetic && npx playwright test --headed

# Run tests in specific browser
cd synthetic && npx playwright test --project=chromium
```

### Via Playwright UI

```bash
# Open Playwright UI for debugging
cd synthetic && npx playwright test --ui
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from "../fixtures/index.js";
import { DashboardPage } from "../page-objects/DashboardPage.js";

test.describe("My Feature", () => {
  test("should do something", async ({ page, envConfig }) => {
    const dashboardPage = new DashboardPage(page, envConfig);

    await dashboardPage.goto();
    expect(await dashboardPage.isOnDashboard()).toBe(true);
  });
});
```

### Using Authenticated Page Fixture

```typescript
test("should access protected feature", async ({
  page,
  authenticatedPage, // Page is already logged in
  envConfig,
}) => {
  // Your test code - user is already authenticated
  await page.goto(`${envConfig.baseUrls.web}/protected-page`);
  // ...
});
```

### Using Page Objects

```typescript
import { LoginPage } from "../page-objects/LoginPage.js";

test("should login", async ({ page, envConfig, credentials }) => {
  const loginPage = new LoginPage(page, envConfig);

  await loginPage.goto();
  await loginPage.loginWithAuth0(credentials.username, credentials.password);

  expect(await loginPage.isOnLoginPage()).toBe(false);
});
```

## Custom Fixtures

Our tests include custom fixtures that provide:

- **`environment`**: Current environment (local, dev, sandbox, staging)
- **`envConfig`**: Environment configuration with URLs and settings
- **`credentials`**: User credentials for the environment
- **`auth0Helper`**: Auth0 helper for authentication flows
- **`authenticatedPage`**: Page with user already authenticated

## Page Objects

All page objects extend `BasePage` which provides:

- Navigation helpers
- Element interaction methods
- Wait utilities
- Screenshot capabilities

### Creating a Page Object

```typescript
import { BasePage } from "./BasePage.js";
import type { Page } from "@playwright/test";
import type { EnvironmentConfig } from "../../shared/types/index.js";

export class MyPage extends BasePage {
  private selectors = {
    myButton: '[data-testid="my-button"]',
  };

  constructor(page: Page, envConfig: EnvironmentConfig) {
    super(page, envConfig);
  }

  async goto(): Promise<void> {
    await super.goto("/my-page");
  }

  async clickMyButton(): Promise<void> {
    await this.click(this.selectors.myButton);
  }
}
```

## Environment Setup

Set environment via environment variable:

```bash
# Use dev environment
export E2E_ENVIRONMENT=dev
npx playwright test

# Or inline
E2E_ENVIRONMENT=staging npx playwright test
```

## Credentials

Tests automatically load credentials from `./credentials/{environment}.json`.

Setup credentials:

```bash
make credentials
```

## Debugging

### Debug in headed mode

```bash
cd synthetic && npx playwright test --headed --debug
```

### View trace files

```bash
cd synthetic && npx playwright show-trace ../test-results/trace.zip
```

### Screenshots on failure

Screenshots are automatically saved to `../reports/screenshots/` on test failure.

## CI/CD

Tests are configured to run in CI with:

- Retries: 2
- Workers: 1 (sequential)
- Video: On failure
- Trace: On failure

## Best Practices

1. **Use Page Objects**: Keep test logic separate from selectors
2. **Use data-testid**: Prefer `[data-testid="..."]` selectors
3. **Wait for navigation**: Use `waitForNavigation()` after actions that trigger navigation
4. **Use fixtures**: Leverage custom fixtures for auth and config
5. **Descriptive tests**: Write clear test descriptions
6. **Keep tests independent**: Each test should be able to run in isolation
7. **Clean up**: Use fixtures for setup/teardown (e.g., `authenticatedPage` clears session)

## Common Issues

**"Cannot find credentials"**

- Solution: Run `make credentials` to setup credentials

**"Navigation timeout"**

- Solution: Increase timeout in `playwright.config.ts` or specific test
- Check if the URL in `envConfig` is correct

**"Auth0 login failed"**

- Solution: Verify credentials are correct for the environment
- Check Auth0 domain in environment config

## Learn More

- [Playwright Documentation](https://playwright.dev)
- [Auth0 Documentation](https://auth0.com/docs)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
