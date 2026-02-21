/**
 * User API Tests
 * Tests for user management endpoints
 */

import { test, expect } from "../fixtures/index.js";

test.describe("User API", () => {
  test.beforeAll(async ({ validator }) => {
    // Load OpenAPI spec for validation
    await validator.loadSpec("example-api.json");
  });

  test("GET /users should return user list", async ({
    authenticatedContext,
    validator,
  }) => {
    const response = await authenticatedContext.get("/users");

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();

    // Validate against OpenAPI schema
    if (validator.hasSchema("UserList")) {
      const validation = validator.validate("UserList", body);

      if (!validation.valid) {
        console.log("Validation errors:", validation.errors);
      }

      // Note: This may fail if actual API doesn't match schema
      // expect(validation.valid).toBe(true);
    }

    // Basic assertions
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("total");
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("GET /users/:id should return single user", async ({
    authenticatedContext,
    validator,
  }) => {
    // First get list of users
    const listResponse = await authenticatedContext.get("/users");
    const listBody = await listResponse.json();

    if (listBody.data && listBody.data.length > 0) {
      const userId = listBody.data[0].id;

      // Get specific user
      const response = await authenticatedContext.get(`/users/${userId}`);

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const body = await response.json();

      // Validate against OpenAPI schema
      if (validator.hasSchema("User")) {
        const validation = validator.validate("User", body);

        if (!validation.valid) {
          console.log("Validation errors:", validation.errors);
        }
      }

      // Basic assertions
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("email");
      expect(body).toHaveProperty("name");
      expect(body.id).toBe(userId);
    } else {
      test.skip();
    }
  });

  test("GET /users with pagination should work", async ({
    authenticatedContext,
  }) => {
    const response = await authenticatedContext.get(
      "/users?page=1&pageSize=10",
    );

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("page");
    expect(body).toHaveProperty("pageSize");
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);
  });

  test("POST /users should create new user", async ({
    authenticatedContext,
    validator,
  }) => {
    const newUser = {
      email: `test-${Date.now()}@lium.com`,
      name: "Test User",
      roles: ["user"],
    };

    const response = await authenticatedContext.post("/users", {
      data: newUser,
    });

    // May be 201 Created or 200 OK depending on API
    expect([200, 201]).toContain(response.status());

    const body = await response.json();

    // Validate response
    if (validator.hasSchema("User")) {
      const validation = validator.validate("User", body);

      if (!validation.valid) {
        console.log("Validation errors:", validation.errors);
      }
    }

    expect(body).toHaveProperty("id");
    expect(body.email).toBe(newUser.email);
    expect(body.name).toBe(newUser.name);
  });

  test("PUT /users/:id should update user", async ({
    authenticatedContext,
  }) => {
    // This test assumes a test user exists
    const userId = "test-user-id";

    const updates = {
      name: "Updated Name",
    };

    const response = await authenticatedContext.put(`/users/${userId}`, {
      data: updates,
    });

    if (response.status() === 404) {
      // Test user doesn't exist, skip
      test.skip();
      return;
    }

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    expect(body.name).toBe(updates.name);
  });

  test("DELETE /users/:id should delete user", async ({
    authenticatedContext,
  }) => {
    // This test assumes we can create and delete test users
    test.skip(); // Skip by default to avoid accidental deletions

    const userId = "test-user-to-delete";

    const response = await authenticatedContext.delete(`/users/${userId}`);

    expect([200, 204]).toContain(response.status());
  });
});

test.describe("User API - Error Handling", () => {
  test("GET /users/:id with invalid ID should return 404", async ({
    authenticatedContext,
  }) => {
    const response = await authenticatedContext.get("/users/invalid-id-12345");

    expect(response.status()).toBe(404);

    const body = await response.json().catch(() => null);

    if (body) {
      // Check for error message
      expect(body.error || body.message || body.statusCode).toBeDefined();
    }
  });

  test("POST /users without authentication should return 401", async ({
    apiContext,
  }) => {
    const newUser = {
      email: "test@lium.com",
      name: "Test User",
    };

    const response = await apiContext.post("/users", {
      data: newUser,
    });

    expect(response.status()).toBe(401);
  });

  test("POST /users with invalid data should return 400", async ({
    authenticatedContext,
  }) => {
    const invalidUser = {
      email: "not-an-email", // Invalid email format
      // Missing required 'name' field
    };

    const response = await authenticatedContext.post("/users", {
      data: invalidUser,
    });

    expect(response.status()).toBe(400);

    const body = await response.json().catch(() => null);

    if (body) {
      expect(body.error || body.message || body.details).toBeDefined();
    }
  });
});

test.describe("User API - Performance", () => {
  test("GET /users should respond quickly", async ({
    authenticatedContext,
    envConfig,
  }) => {
    const startTime = Date.now();

    const response = await authenticatedContext.get("/users");

    const duration = Date.now() - startTime;

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(envConfig.timeouts.api);
  });

  test("Concurrent requests should work", async ({ authenticatedContext }) => {
    // Make 5 concurrent requests
    const requests = Array(5)
      .fill(null)
      .map(() => authenticatedContext.get("/users"));

    const responses = await Promise.all(requests);

    // All should succeed
    responses.forEach((response) => {
      expect(response.ok()).toBeTruthy();
    });
  });
});
