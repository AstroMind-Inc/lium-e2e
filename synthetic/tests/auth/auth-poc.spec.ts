/**
 * Auth POC - Proof of Concept
 * Simple test to verify saved auth state works
 */

import { test, expect } from "../../fixtures/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe("Auth POC", () => {
  // Use saved admin session
  test.use({
    storageState: path.resolve(
      __dirname,
      "../../../playwright/.auth/admin.json",
    ),
  });
  test("can access app with saved auth", async ({ page, envConfig }) => {
    // Navigate to app - should be authenticated via saved state
    await page.goto(envConfig.baseUrls.web);

    // Wait a moment for page to load
    await page.waitForTimeout(2000);

    // Check we're not on login/auth page
    const url = page.url();
    const isAuthenticated =
      !url.includes("auth0.com") && !url.includes("/login");

    // Take a screenshot for visual verification
    await page.screenshot({
      path: "reports/auth-poc-screenshot.png",
      fullPage: false,
    });

    console.log(`Current URL: ${url}`);
    console.log(`Authenticated: ${isAuthenticated}`);

    expect(isAuthenticated).toBe(true);
  });

  test("can access /chats route", async ({ page, envConfig }) => {
    // Navigate to chats
    await page.goto(`${envConfig.baseUrls.web}/chats`);

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Should be on chats page (not redirected to login)
    const url = page.url();
    const onChats = url.includes("/chats");

    console.log(`Current URL: ${url}`);
    console.log(`On chats page: ${onChats}`);

    // Take screenshot
    await page.screenshot({
      path: "reports/chats-screenshot.png",
      fullPage: false,
    });

    expect(onChats).toBe(true);
  });
});
