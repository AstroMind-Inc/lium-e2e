/**
 * Command Palette Tests (CMD-K) with JWT Auth
 * Verify role-based access control in search/command palette
 * Fast, reliable testing via JWT token injection
 */

import { test, expect } from "../../fixtures/index.js";

test.describe("Command Palette (CMD-K)", () => {
  test.describe("Admin User", () => {
    test('can search for "admin" and see results', async ({
      adminPage,
      envConfig,
    }) => {
      // Navigate to app (already authenticated via JWT)
      await adminPage.goto(envConfig.baseUrls.web);
      await adminPage.waitForLoadState("networkidle");

      console.log("Pressing CMD-K to open command palette...");

      // Press CMD-K (Meta+K on Mac, Ctrl+K on Windows/Linux)
      await adminPage.keyboard.press("Meta+k");

      // Wait for command palette to appear
      const commandPalette = adminPage
        .locator('[role="dialog"]')
        .or(adminPage.locator('[data-testid="command-palette"]'))
        .or(adminPage.locator('input[type="search"]'))
        .or(adminPage.locator('input[placeholder*="Search"]'))
        .first();

      await commandPalette.waitFor({ state: "visible", timeout: 5000 });
      console.log("✓ Command palette opened");

      // Type "admin" in search
      await adminPage.keyboard.type("admin");
      console.log('✓ Typed "admin"');

      // Wait a moment for search results
      await adminPage.waitForTimeout(1000);

      // Check for admin-related results
      const hasAdminResults =
        (await adminPage.locator("text=/admin/i").count()) > 0 ||
        (await adminPage.locator('[data-testid*="admin"]').count()) > 0 ||
        (await adminPage.locator('[href*="/admin"]').count()) > 0;

      console.log(`Admin results found: ${hasAdminResults}`);

      // Admin should see admin-related options
      expect(hasAdminResults).toBe(true);
    });
  });

  test.describe("Regular User", () => {
    test('cannot search for "admin" - no results shown', async ({
      userPage,
      envConfig,
    }) => {
      // Navigate to app (already authenticated via JWT)
      await userPage.goto(envConfig.baseUrls.web);
      await userPage.waitForLoadState("networkidle");

      console.log("Pressing CMD-K to open command palette...");

      // Press CMD-K
      await userPage.keyboard.press("Meta+k");

      // Wait for command palette to appear
      const commandPalette = userPage
        .locator('[role="dialog"]')
        .or(userPage.locator('[data-testid="command-palette"]'))
        .or(userPage.locator('input[type="search"]'))
        .or(userPage.locator('input[placeholder*="Search"]'))
        .first();

      await commandPalette.waitFor({ state: "visible", timeout: 5000 });
      console.log("✓ Command palette opened");

      // Type "admin" in search
      await userPage.keyboard.type("admin");
      console.log('✓ Typed "admin"');

      // Wait a moment for search (or no) results
      await userPage.waitForTimeout(1000);

      // Check for admin-related results (should be none for regular user)
      const hasAdminResults =
        (await userPage.locator("text=/admin/i").count()) > 0 ||
        (await userPage.locator('[data-testid*="admin"]').count()) > 0 ||
        (await userPage.locator('[href*="/admin"]').count()) > 0;

      console.log(`Admin results found: ${hasAdminResults}`);

      // Regular user should NOT see admin-related options
      expect(hasAdminResults).toBe(false);

      // Alternatively, check for "no results" message
      const hasNoResults =
        (await userPage.locator("text=/no results/i").count()) > 0 ||
        (await userPage.locator("text=/nothing found/i").count()) > 0 ||
        (await userPage.locator('[data-testid="no-results"]').count()) > 0;

      // Either no results shown OR explicit "no results" message
      const properlyFiltered = !hasAdminResults || hasNoResults;
      expect(properlyFiltered).toBe(true);
    });
  });

  test.describe("Command Palette Basics", () => {
    test("opens and closes with CMD-K", async ({ adminPage, envConfig }) => {
      await adminPage.goto(envConfig.baseUrls.web);
      await adminPage.waitForLoadState("networkidle");

      // Open with CMD-K
      await adminPage.keyboard.press("Meta+k");

      const commandPalette = adminPage
        .locator('[role="dialog"]')
        .or(adminPage.locator('[data-testid="command-palette"]'))
        .or(adminPage.locator('input[type="search"]'))
        .first();

      // Should be visible
      await expect(commandPalette).toBeVisible({ timeout: 5000 });
      console.log("✓ Command palette opened");

      // Close with Escape
      await adminPage.keyboard.press("Escape");

      // Should be hidden
      await expect(commandPalette).toBeHidden({ timeout: 2000 });
      console.log("✓ Command palette closed");

      // Can re-open
      await adminPage.keyboard.press("Meta+k");
      await expect(commandPalette).toBeVisible({ timeout: 5000 });
      console.log("✓ Command palette re-opened");
    });
  });
});
