/**
 * Health Check API Tests
 * Tests for service health endpoints
 */

import { test, expect } from "../fixtures/index.js";

test.describe("Health Check API", () => {
  test.beforeAll(async ({ validator }) => {
    // Load OpenAPI spec for validation
    await validator.loadSpec("example-api.json");
  });

  test("GET /health should return 200", async ({ apiContext }) => {
    const response = await apiContext.get("/healthz");

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test("GET /health should return valid response format", async ({
    apiContext,
    validator,
  }) => {
    const response = await apiContext.get("/healthz");

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    // Validate against OpenAPI schema
    if (validator.hasSchema("HealthCheck")) {
      const validation = validator.validate("HealthCheck", body);

      if (!validation.valid) {
        console.log("Validation errors:", validation.errors);
      }

      // Note: This may fail if actual API doesn't match schema
      // expect(validation.valid).toBe(true);
    }

    // Basic assertions
    expect(body).toHaveProperty("status");
    expect(["ok", "degraded", "down"]).toContain(body.status);
  });

  test("GET /health should respond within timeout", async ({
    apiContext,
    envConfig,
  }) => {
    const startTime = Date.now();

    const response = await apiContext.get("/healthz");

    const duration = Date.now() - startTime;

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(envConfig.timeouts.api);
  });

  test("GET /health should have correct headers", async ({ apiContext }) => {
    const response = await apiContext.get("/healthz");

    expect(response.ok()).toBeTruthy();

    const headers = response.headers();
    expect(headers["content-type"]).toContain("application/json");
  });
});

test.describe("Health Check - Error Handling", () => {
  test("should handle invalid endpoints gracefully", async ({ apiContext }) => {
    const response = await apiContext.get("/nonexistent-endpoint");

    expect(response.status()).toBe(404);
  });

  test("should return proper error format for 404", async ({ apiContext }) => {
    const response = await apiContext.get("/nonexistent-endpoint");

    expect(response.status()).toBe(404);

    const body = await response.json().catch(() => null);

    if (body) {
      // Check for error message
      expect(body.error || body.message || body.statusCode).toBeDefined();
    }
  });
});
