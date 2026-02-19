# Integration Tests (Pillar 2)

API integration testing using Playwright's request API and OpenAPI validation.

## Overview

Integration tests validate API endpoints directly without UI interaction. They test:
- Service-to-service communication
- API contract compliance (OpenAPI/Swagger)
- Request/response validation
- Authentication/authorization
- Error handling
- Performance characteristics

## Directory Structure

```
integration/
├── tests/              # Test suites
│   ├── health-check.spec.ts
│   ├── users.spec.ts
│   └── ...
├── schemas/            # OpenAPI specifications
│   └── example-api.json
├── fixtures/           # Custom Playwright fixtures
│   ├── index.ts        # Main fixtures
│   └── openapi-validator.ts
├── playwright.config.ts
└── README.md
```

## Key Features

- **Direct API Testing**: Use Playwright's `request` API for HTTP calls
- **OpenAPI Validation**: Validate responses against OpenAPI/Swagger schemas
- **Authentication**: Built-in fixtures for authenticated requests
- **Environment Support**: Test against local, dev, sandbox, staging
- **Type Safety**: Full TypeScript support
- **Parallel Execution**: Fast test runs with parallelization

## Custom Fixtures

### Available Fixtures

```typescript
import { test, expect } from '../fixtures/index.js';

test('example', async ({
  environment,          // Current environment name
  envConfig,            // Environment configuration
  credentials,          // User credentials
  auth0Helper,          // Auth0 authentication helper
  apiContext,           // Unauthenticated API context
  authenticatedContext, // Authenticated API context with Bearer token
  accessToken,          // JWT access token
  validator,            // OpenAPI validator
}) => {
  // Test code here
});
```

### Using API Context

**Unauthenticated requests:**
```typescript
test('public endpoint', async ({ apiContext }) => {
  const response = await apiContext.get('/health');
  expect(response.ok()).toBeTruthy();
});
```

**Authenticated requests:**
```typescript
test('protected endpoint', async ({ authenticatedContext }) => {
  const response = await authenticatedContext.get('/users');
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
});
```

**Custom headers:**
```typescript
test('with custom headers', async ({ apiContext }) => {
  const response = await apiContext.get('/endpoint', {
    headers: {
      'X-Custom-Header': 'value',
    },
  });
});
```

**POST requests:**
```typescript
test('create resource', async ({ authenticatedContext }) => {
  const response = await authenticatedContext.post('/users', {
    data: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).toHaveProperty('id');
});
```

## OpenAPI Validation

### Loading Schemas

Place OpenAPI specifications in `integration/schemas/`:

```typescript
test.describe('My API', () => {
  test.beforeAll(async ({ validator }) => {
    await validator.loadSpec('my-api.json');
  });

  // Tests...
});
```

### Validating Responses

```typescript
test('validate response schema', async ({ authenticatedContext, validator }) => {
  const response = await authenticatedContext.get('/users');
  const body = await response.json();

  // Check if schema exists
  if (validator.hasSchema('UserList')) {
    const validation = validator.validate('UserList', body);

    if (!validation.valid) {
      console.log('Validation errors:', validation.errors);
    }

    expect(validation.valid).toBe(true);
  }
});
```

### Validating and Throwing

```typescript
test('validate or throw', async ({ authenticatedContext, validator }) => {
  const response = await authenticatedContext.get('/users/123');
  const body = await response.json();

  // Throws error if validation fails
  validator.validateOrThrow('User', body);

  // If we reach here, validation passed
  expect(body.id).toBe('123');
});
```

## Testing Patterns

### Basic GET Request

```typescript
test('GET /resource should return 200', async ({ authenticatedContext }) => {
  const response = await authenticatedContext.get('/resource');

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty('id');
});
```

### Testing Error Responses

```typescript
test('invalid request should return 400', async ({ authenticatedContext }) => {
  const response = await authenticatedContext.post('/users', {
    data: { invalid: 'data' },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body).toHaveProperty('error');
});
```

### Testing Authentication

```typescript
test('unauthenticated request should return 401', async ({ apiContext }) => {
  const response = await apiContext.get('/protected-endpoint');

  expect(response.status()).toBe(401);
});

test('authenticated request should succeed', async ({ authenticatedContext }) => {
  const response = await authenticatedContext.get('/protected-endpoint');

  expect(response.ok()).toBeTruthy();
});
```

### Testing Pagination

```typescript
test('pagination should work', async ({ authenticatedContext }) => {
  const response = await authenticatedContext.get('/users?page=1&pageSize=10');

  const body = await response.json();

  expect(body).toHaveProperty('data');
  expect(body).toHaveProperty('page');
  expect(body).toHaveProperty('pageSize');
  expect(body.page).toBe(1);
  expect(body.pageSize).toBe(10);
  expect(body.data.length).toBeLessThanOrEqual(10);
});
```

### Testing Response Times

```typescript
test('should respond quickly', async ({ authenticatedContext, envConfig }) => {
  const startTime = Date.now();

  const response = await authenticatedContext.get('/endpoint');

  const duration = Date.now() - startTime;

  expect(response.ok()).toBeTruthy();
  expect(duration).toBeLessThan(envConfig.timeouts.api);
});
```

### Testing Concurrent Requests

```typescript
test('concurrent requests should work', async ({ authenticatedContext }) => {
  const requests = Array(10)
    .fill(null)
    .map(() => authenticatedContext.get('/endpoint'));

  const responses = await Promise.all(requests);

  responses.forEach((response) => {
    expect(response.ok()).toBeTruthy();
  });
});
```

### Testing Idempotency

```typescript
test('PUT should be idempotent', async ({ authenticatedContext }) => {
  const updates = { name: 'Updated Name' };

  // First request
  const response1 = await authenticatedContext.put('/users/123', {
    data: updates,
  });
  const body1 = await response1.json();

  // Second request with same data
  const response2 = await authenticatedContext.put('/users/123', {
    data: updates,
  });
  const body2 = await response2.json();

  // Both should succeed with same result
  expect(response1.status()).toBe(response2.status());
  expect(body1.name).toBe(body2.name);
});
```

## Creating OpenAPI Schemas

### Schema File Format

Create schema files in `integration/schemas/`:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "My API",
    "version": "1.0.0"
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "required": ["id", "email", "name"],
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "email": {
            "type": "string",
            "format": "email"
          },
          "name": {
            "type": "string"
          }
        }
      }
    }
  }
}
```

### Generating from Existing API

If your API already has OpenAPI/Swagger documentation:

1. **Export from Swagger UI**: Visit `/swagger.json` or `/api-docs`
2. **Copy spec file**: Place in `integration/schemas/`
3. **Reference in tests**: Load with `validator.loadSpec('your-api.json')`

## Running Tests

### Run all integration tests:
```bash
npx playwright test integration/
```

### Run specific test file:
```bash
npx playwright test integration/tests/users.spec.ts
```

### Run with specific environment:
```bash
E2E_ENVIRONMENT=dev npx playwright test integration/
```

### Run in debug mode:
```bash
npx playwright test integration/ --debug
```

### View HTML report:
```bash
npx playwright show-report
```

## Configuration

Integration tests use `integration/playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: {
    baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  // ...
});
```

Configuration is merged with environment-specific settings from `config/environments/`.

## Best Practices

### 1. Use Descriptive Test Names
```typescript
// Good
test('GET /users should return paginated list with valid schema', ...)

// Bad
test('test users', ...)
```

### 2. Test Both Success and Failure Cases
```typescript
test.describe('User API', () => {
  test('should create user with valid data', ...);
  test('should return 400 for invalid email', ...);
  test('should return 401 without authentication', ...);
  test('should return 404 for non-existent user', ...);
});
```

### 3. Validate Against OpenAPI Schemas
```typescript
// Always validate responses when schemas are available
if (validator.hasSchema('User')) {
  const validation = validator.validate('User', body);
  expect(validation.valid).toBe(true);
}
```

### 4. Clean Up Test Data
```typescript
test('user lifecycle', async ({ authenticatedContext }) => {
  // Create
  const createRes = await authenticatedContext.post('/users', { data: userData });
  const user = await createRes.json();

  try {
    // Test operations
    // ...
  } finally {
    // Cleanup
    await authenticatedContext.delete(`/users/${user.id}`);
  }
});
```

### 5. Use Retries for Flaky External Services
```typescript
test('external service integration', async ({ authenticatedContext }) => {
  test.retries(2); // Retry up to 2 times

  const response = await authenticatedContext.get('/external-data');
  expect(response.ok()).toBeTruthy();
});
```

### 6. Test Performance Characteristics
```typescript
test('should handle load', async ({ authenticatedContext }) => {
  const startTime = Date.now();

  // Make requests
  const requests = Array(50)
    .fill(null)
    .map(() => authenticatedContext.get('/endpoint'));

  await Promise.all(requests);

  const duration = Date.now() - startTime;

  // Should complete in reasonable time
  expect(duration).toBeLessThan(10000); // 10 seconds
});
```

## Troubleshooting

### Authentication Issues

If tests fail with 401 errors:

1. **Check credentials**: Verify `credentials/{environment}.json` exists
2. **Check Auth0 config**: Verify `config/environments/{environment}.json` has correct Auth0 settings
3. **Check token**: Print token to console (remove before committing):
   ```typescript
   test('debug auth', async ({ accessToken }) => {
     console.log('Token:', accessToken);
   });
   ```

### Schema Validation Failures

If schema validation fails unexpectedly:

1. **Check schema path**: Verify file exists in `integration/schemas/`
2. **Check schema name**: Ensure schema name matches in spec file
3. **Print errors**:
   ```typescript
   const validation = validator.validate('User', body);
   if (!validation.valid) {
     console.log('Validation errors:', validation.errors);
     console.log('Body:', JSON.stringify(body, null, 2));
   }
   ```

### Network Issues

If requests timeout or fail:

1. **Check baseURL**: Verify environment config has correct API URL
2. **Check network**: Ensure you can reach the API (try curl/httpie)
3. **Increase timeout**: Adjust in `playwright.config.ts`

## Examples

See the following test files for examples:
- `integration/tests/health-check.spec.ts` - Basic API testing
- `integration/tests/users.spec.ts` - CRUD operations, error handling, performance

## Next Steps

1. **Add more test suites**: Create tests for your specific API endpoints
2. **Add OpenAPI specs**: Import your actual API specifications
3. **Customize fixtures**: Add domain-specific fixtures as needed
4. **Configure environments**: Update environment configs with real API URLs
5. **Run tests regularly**: Integrate into CI/CD pipeline
