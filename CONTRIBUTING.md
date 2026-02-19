# Contributing to Lium E2E Testing Framework

Thank you for contributing to the Lium E2E Testing Framework! This guide will help you write tests, add new utilities, and maintain the codebase.

## 🏗️ Architecture Overview

The framework is organized into three discrete testing pillars:

1. **Synthetic Tests** (`synthetic/`) - Playwright browser automation
2. **Integration Tests** (`integration/`) - Playwright API testing
3. **Performance Tests** (`performance/`) - k6 load testing

Shared utilities live in `shared/`:
- `auth/` - Authentication helpers (Auth0, OAuth, JWT)
- `credentials/` - Credential management
- `environment/` - Environment configuration
- `results/` - Test result persistence
- `reporting/` - Slack and HTML reporting

## 📝 Writing Tests

### Synthetic Tests (Browser Automation)

Synthetic tests simulate real user interactions through the browser.

**Location**: `synthetic/tests/`

**Example Structure**:
```typescript
// synthetic/tests/user-flows/checkout.spec.ts
import { test, expect } from '../fixtures/index.js';
import { DashboardPage } from '../page-objects/DashboardPage.js';
import { CheckoutPage } from '../page-objects/CheckoutPage.js';

test.describe('Checkout Flow', () => {
  test('user can complete purchase', async ({ authenticatedPage, envConfig }) => {
    const dashboardPage = new DashboardPage(authenticatedPage, envConfig);
    await dashboardPage.goto();

    // Navigate to checkout
    const checkoutPage = new CheckoutPage(authenticatedPage, envConfig);
    await checkoutPage.goto();

    // Complete purchase
    await checkoutPage.fillPaymentInfo({
      cardNumber: '4242424242424242',
      expiry: '12/25',
      cvc: '123',
    });

    await checkoutPage.submitOrder();

    // Verify success
    await expect(authenticatedPage).toHaveURL(/order-confirmation/);
  });
});
```

**Best Practices**:
- Use Page Object Model pattern
- Use custom fixtures for authenticated tests
- Add descriptive test names
- Capture screenshots on failure (automatic)
- Test both happy and error paths

### Integration Tests (API Testing)

Integration tests validate API contracts without mocking.

**Location**: `integration/tests/`

**Example Structure**:
```typescript
// integration/tests/orders/create-order.spec.ts
import { test, expect } from '../fixtures/index.js';

test.describe('Order API', () => {
  test('POST /orders creates new order', async ({ authenticatedContext, validator }) => {
    const orderData = {
      items: [
        { productId: '123', quantity: 2 },
        { productId: '456', quantity: 1 },
      ],
      shippingAddress: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
      },
    };

    const response = await authenticatedContext.post('/orders', {
      data: orderData,
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    // Validate against OpenAPI schema
    if (validator.hasSchema('Order')) {
      const validation = validator.validate('Order', body);
      expect(validation.valid).toBe(true);
    }

    expect(body).toHaveProperty('orderId');
    expect(body).toHaveProperty('total');
  });

  test('POST /orders with invalid data returns 400', async ({ authenticatedContext }) => {
    const invalidData = {
      items: [], // Empty items should fail
    };

    const response = await authenticatedContext.post('/orders', {
      data: invalidData,
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('error');
  });
});
```

**Best Practices**:
- Use OpenAPI validation for responses
- Test error cases (400, 401, 404, 500)
- Use authenticated context for protected endpoints
- Test pagination, filtering, and sorting
- Verify response headers and content-type

### Performance Tests (Load Testing)

Performance tests measure system behavior under load.

**Location**: `performance/tests/`

**Example Structure**:
```javascript
// performance/tests/load/order-api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getEnvironment, getAuthToken } from '../../k6.config.js';
import { baselineLoad } from '../../scenarios/load-profile.js';

// Custom metrics
const errorRate = new Rate('errors');
const orderCreationDuration = new Trend('order_creation_duration');

export const options = {
  scenarios: {
    baseline: baselineLoad,
  },
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'errors': ['rate<0.01'],
    'order_creation_duration': ['p(95)<1000'],
  },
};

export function setup() {
  const env = getEnvironment();
  return {
    baseUrl: env.baseUrl,
    authToken: getAuthToken(),
  };
}

export default function(data) {
  const { baseUrl, authToken } = data;

  const payload = JSON.stringify({
    items: [{ productId: '123', quantity: 1 }],
    shippingAddress: {
      street: '123 Main St',
      city: 'SF',
      state: 'CA',
      zip: '94105',
    },
  });

  const startTime = Date.now();

  const res = http.post(`${baseUrl}/orders`, payload, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    tags: { name: 'create_order' },
  });

  const duration = Date.now() - startTime;
  orderCreationDuration.add(duration);

  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'has order id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.orderId !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(1);
}
```

**Best Practices**:
- Define clear thresholds (SLAs)
- Use custom metrics for domain-specific measurements
- Start with realistic load patterns
- Monitor system resources during tests
- Test realistic user scenarios, not just endpoints

## 🔧 Adding Shared Utilities

Shared utilities should be:
- **Reusable** across all test pillars
- **Well-tested** with unit tests
- **Documented** with JSDoc comments
- **Type-safe** using TypeScript

**Example**: Adding a new helper

```typescript
// shared/helpers/data-generator.ts
/**
 * Generate random test data
 */

export class DataGenerator {
  /**
   * Generate random email address
   */
  static randomEmail(): string {
    const timestamp = Date.now();
    return `test-${timestamp}@lium.com`;
  }

  /**
   * Generate random product
   */
  static randomProduct() {
    return {
      name: `Product ${Math.random().toString(36).substring(7)}`,
      price: Math.floor(Math.random() * 100) + 1,
      description: 'Test product',
    };
  }
}
```

**Don't forget the unit tests**:

```typescript
// tests/unit/helpers/data-generator.test.ts
import { DataGenerator } from '../../../shared/helpers/data-generator';

describe('DataGenerator', () => {
  describe('randomEmail', () => {
    it('should generate valid email', () => {
      const email = DataGenerator.randomEmail();
      expect(email).toMatch(/test-\d+@lium\.com/);
    });

    it('should generate unique emails', () => {
      const email1 = DataGenerator.randomEmail();
      const email2 = DataGenerator.randomEmail();
      expect(email1).not.toBe(email2);
    });
  });
});
```

## 🧪 Testing the Framework

The framework itself has unit tests to ensure reliability. **Always run tests before committing**:

```bash
# Run framework unit tests
npm run test:unit

# Run with coverage
npm run test:unit

# Watch mode for development
npm run test:unit:watch
```

**Coverage Requirements**:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## 📋 Code Style

### TypeScript

- Use TypeScript for all shared utilities
- Use ES modules (`import`/`export`)
- Enable strict mode
- Prefer `interface` over `type` for objects
- Use `const` over `let` when possible

### Naming Conventions

- **Files**: kebab-case (`auth0-helper.ts`)
- **Classes**: PascalCase (`Auth0Helper`)
- **Functions**: camelCase (`loadCredentials`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- **Types**: PascalCase (`EnvironmentConfig`)

### Comments

Use JSDoc for public APIs:

```typescript
/**
 * Load credentials for an environment
 *
 * @param environment - Environment name (local, dev, sandbox, staging)
 * @param elevated - Whether to load elevated credentials
 * @returns Credentials object
 * @throws Error if credentials file doesn't exist
 */
async loadCredentials(environment: string, elevated: boolean): Promise<Credentials>
```

## 🔀 Git Workflow

### Branches

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commits

Use conventional commits:

```
feat: Add user registration test suite
fix: Handle Auth0 timeout errors
docs: Update API testing guide
test: Add unit tests for credential manager
refactor: Simplify environment selector logic
```

### Pull Requests

1. Create a feature branch
2. Write tests for new functionality
3. Ensure all tests pass: `npm run test:unit`
4. Run linter: `npm run lint`
5. Format code: `npm run format`
6. Create pull request with clear description
7. Request review from team member

## 🚨 Common Pitfalls

### 1. Don't Commit Credentials

**Bad**:
```bash
git add credentials/dev.json  # ❌ Never do this!
```

**Good**:
```bash
# Credentials are automatically gitignored
# Use make credentials to set them up locally
```

### 2. Don't Skip Error Testing

**Bad**:
```typescript
test('create order', async ({ authenticatedContext }) => {
  const response = await authenticatedContext.post('/orders', { data: orderData });
  expect(response.status()).toBe(201);
});
```

**Good**:
```typescript
test.describe('Order API', () => {
  test('should create order with valid data', ...);
  test('should return 400 for invalid data', ...);
  test('should return 401 without authentication', ...);
  test('should return 409 for duplicate order', ...);
});
```

### 3. Don't Hardcode URLs

**Bad**:
```typescript
await page.goto('https://dev.lium.app/dashboard');
```

**Good**:
```typescript
const dashboardPage = new DashboardPage(page, envConfig);
await dashboardPage.goto();
```

### 4. Don't Share Test Data Between Tests

**Bad**:
```typescript
let orderId: string;

test('create order', async () => {
  orderId = '123'; // Shared state!
});

test('get order', async () => {
  // Depends on previous test
  await request.get(`/orders/${orderId}`);
});
```

**Good**:
```typescript
test('create and get order', async ({ authenticatedContext }) => {
  // Create
  const createRes = await authenticatedContext.post('/orders', { data: orderData });
  const { orderId } = await createRes.json();

  // Get
  const getRes = await authenticatedContext.get(`/orders/${orderId}`);
  expect(getRes.ok()).toBeTruthy();
});
```

## 🐛 Debugging

### Enable Playwright Debug Mode

```bash
# Headed browser with inspector
PWDEBUG=1 npx playwright test synthetic/tests/auth/login.spec.ts

# Save traces
npx playwright test --trace on

# View traces
npx playwright show-trace trace.zip
```

### Enable k6 Debug Output

```bash
# Verbose output
k6 run --verbose performance/tests/load/api-baseline.js

# HTTP debug
k6 run --http-debug performance/tests/load/api-baseline.js
```

### View Detailed Test Results

```bash
# View all results for a test
grep "auth/login.spec.ts" results/*.jsonl | jq .

# View failures only
grep '"status":"failed"' results/*.jsonl | jq .
```

## 📚 Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [k6 Best Practices](https://k6.io/docs/using-k6/k6-best-practices/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Jest Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 💬 Questions?

If you have questions or need help:
1. Check existing tests for examples
2. Review the README files in each directory
3. Reach out to the Lium Engineering team

## 📝 License

Internal use only - UNLICENSED
