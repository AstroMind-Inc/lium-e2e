/**
 * Backend API Health Check
 * Verifies the backend API is accessible and responding
 */

import { test, expect } from "@playwright/test";

test.describe("Backend API Health", () => {
  test("API responds to health check", async ({ request }) => {
    const baseUrl = process.env.API_BASE_URL || "http://lium-api:8000";

    console.log(`Checking API health at: ${baseUrl}`);

    // Try health endpoint
    const response = await request.get(`${baseUrl}/health`);

    console.log(`Response status: ${response.status()}`);

    // API should respond (even if 404, it means API is reachable)
    expect(response.status()).toBeLessThan(500);
  });

  test("API is reachable", async ({ request }) => {
    const baseUrl = process.env.API_BASE_URL || "http://lium-api:8000";

    try {
      const response = await request.get(baseUrl);
      console.log(`API base URL responded with: ${response.status()}`);
      expect(response.status()).toBeLessThan(500);
    } catch (error) {
      console.error("API not reachable:", (error as Error).message);
      throw error;
    }
  });
});
