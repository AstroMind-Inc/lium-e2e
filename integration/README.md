# Integration Tests - API Testing

API testing for Lium backend services with OpenAPI spec validation.

## 🎯 POC Status

**Currently:** Basic API health checks
**Coming:** Full OpenAPI validation, modular tests, contract testing

## Backend API

Main backend API: `../lium/apps/backend`

- **OpenAPI Spec:** `backend/api.yml`
- **Local URL:** `http://lium-api:8000`
- **Production APIs:** All behind VPN

## Structure

```
integration/
├── schemas/              # OpenAPI specs from backend
│   └── backend-api.yml   # Main backend API spec (copied from ../lium/apps/backend/api.yml)
└── tests/                # API tests organized by domain
    ├── health/           # Health checks & smoke tests
    ├── users/            # User API tests (add here)
    ├── tenants/          # Tenant API tests (add here)
    ├── chats/            # Chat API tests (add here)
    ├── agents/           # Agent API tests (add here)
    └── tools/            # Tool API tests (add here)
```

## Quick Start

### 1. Update OpenAPI Spec

When backend API changes, update the spec:

```bash
cp ../lium/apps/backend/api.yml integration/schemas/backend-api.yml
```

### 2. Run Tests

```bash
make test-integration    # Run all API tests
```

## Writing Tests

### Basic API Health Check

```typescript
// integration/tests/health/api-health.spec.ts
import { test, expect } from "@playwright/test";

test("API is accessible", async ({ request }) => {
  const baseUrl = process.env.API_BASE_URL || "http://lium-api:8000";

  const response = await request.get(`${baseUrl}/health`);

  expect(response.status()).toBeLessThan(500);
});
```

### API Endpoint Test

```typescript
// integration/tests/users/get-users.spec.ts
import { test, expect } from "@playwright/test";

test("GET /api/users returns user list", async ({ request }) => {
  const baseUrl = process.env.API_BASE_URL || "http://lium-api:8000";

  const response = await request.get(`${baseUrl}/api/users`, {
    headers: {
      Authorization: `Bearer ${process.env.API_TOKEN}`,
    },
  });

  expect(response.ok()).toBeTruthy();

  const users = await response.json();
  expect(Array.isArray(users)).toBe(true);
});
```

## Authentication

API tests need authentication tokens. Currently using saved auth from synthetic tests.

**Future:** Dedicated API token management for service-to-service calls.

## Environments

Configure in `config/environments/*.json`:

- **local.json:** `http://lium-api:8000` (Docker)
- **dev.json:** VPN required
- **sandbox.json:** VPN required
- **staging.json:** VPN required

## OpenAPI Validation (Coming)

Future implementation will validate responses against OpenAPI spec:

```typescript
import { validateResponse } from "../helpers/openapi-validator";

test("response matches OpenAPI spec", async ({ request }) => {
  const response = await request.get("/api/users");

  const validation = await validateResponse(
    "backend-api.yml",
    "GET",
    "/api/users",
    response,
  );

  expect(validation.valid).toBe(true);
});
```

## Test Organization

Organize tests by API domain:

- `health/` - Health checks, smoke tests
- `users/` - User CRUD, authentication
- `tenants/` - Tenant management
- `chats/` - Chat/message operations
- `agents/` - AI agent APIs
- `tools/` - Tool management

## TODO

- [ ] Add OpenAPI validation helpers
- [ ] Add example tests for each domain
- [ ] Set up API token management
- [ ] Add contract testing (schema validation)
- [ ] Add test data factories
- [ ] Add response time assertions
- [ ] Add concurrent request testing

## Resources

- Backend API: `../lium/apps/backend`
- OpenAPI Spec: `../lium/apps/backend/api.yml`
- Playwright API Testing: https://playwright.dev/docs/api-testing
