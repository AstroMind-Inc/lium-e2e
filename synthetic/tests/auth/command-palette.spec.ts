/**
 * Command Palette Tests (CMD-K)
 * Verify role-based access control in search/command palette
 */

import { test, expect } from "../../fixtures/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe("Command Palette (CMD-K)", () => {
  test.describe("Admin User", () => {
    test.use({
      storageState: path.resolve(
        __dirname,
        "../../../playwright/.auth/admin.json",
      ),
    });

    test('can search for "admin" and see results', async ({
      page,
      envConfig,
    }) => {
      // Navigate to app
      await page.goto(envConfig.baseUrls.web);
      await page.waitForLoadState("networkidle");

      console.log("Pressing CMD-K to open command palette...");

      // Press CMD-K (Meta+K on Mac, Ctrl+K on Windows/Linux)
      await page.keyboard.press("Meta+k");

      // Wait for command palette to appear
      // Adjust selector based on your app's command palette element
      const commandPalette = page
        .locator('[role="dialog"]')
        .or(page.locator('[data-testid="command-palette"]'))
        .or(page.locator('input[type="search"]'))
        .or(page.locator('input[placeholder*="Search"]'))
        .first();

      await commandPalette.waitFor({ state: "visible", timeout: 5000 });
      console.log("✓ Command palette opened");

      // Type "admin" in search
      await page.keyboard.type("admin");
      console.log('✓ Typed "admin"');

      // Wait a moment for search results
      await page.waitForTimeout(1000);

      // Take screenshot for verification
      await page.screenshot({
        path: "reports/admin-cmd-k-search.png",
        fullPage: false,
      });

      // Check for admin-related results
      // Adjust these selectors based on your app's structure
      const hasAdminResults =
        (await page.locator("text=/admin/i").count()) > 0 ||
        (await page.locator('[data-testid*="admin"]').count()) > 0 ||
        (await page.locator('[href*="/admin"]').count()) > 0;

      console.log(`Admin results found: ${hasAdminResults}`);

      // Admin should see admin-related options
      expect(hasAdminResults).toBe(true);
    });
  });

  test.describe("Regular User", () => {
    test.use({
      storageState: path.resolve(
        __dirname,
        "../../../playwright/.auth/user.json",
      ),
    });

    test('cannot search for "admin" - no results shown', async ({
      page,
      envConfig,
    }) => {
      // Navigate to app
      await page.goto(envConfig.baseUrls.web);
      await page.waitForLoadState("networkidle");

      console.log("Pressing CMD-K to open command palette...");

      // Press CMD-K
      await page.keyboard.press("Meta+k");

      // Wait for command palette to appear
      const commandPalette = page
        .locator('[role="dialog"]')
        .or(page.locator('[data-testid="command-palette"]'))
        .or(page.locator('input[type="search"]'))
        .or(page.locator('input[placeholder*="Search"]'))
        .first();

      await commandPalette.waitFor({ state: "visible", timeout: 5000 });
      console.log("✓ Command palette opened");

      // Type "admin" in search
      await page.keyboard.type("admin");
      console.log('✓ Typed "admin"');

      // Wait a moment for search (or no) results
      await page.waitForTimeout(1000);

      // Take screenshot for verification
      await page.screenshot({
        path: "reports/user-cmd-k-search.png",
        fullPage: false,
      });

      // Check for admin-related results (should be none for regular user)
      const hasAdminResults =
        (await page.locator("text=/admin/i").count()) > 0 ||
        (await page.locator('[data-testid*="admin"]').count()) > 0 ||
        (await page.locator('[href*="/admin"]').count()) > 0;

      console.log(`Admin results found: ${hasAdminResults}`);

      // Regular user should NOT see admin-related options
      expect(hasAdminResults).toBe(false);

      // Alternatively, check for "no results" message
      const hasNoResults =
        (await page.locator("text=/no results/i").count()) > 0 ||
        (await page.locator("text=/nothing found/i").count()) > 0 ||
        (await page.locator('[data-testid="no-results"]').count()) > 0;

      // Either no results shown OR explicit "no results" message
      const properlyFiltered = !hasAdminResults || hasNoResults;
      expect(properlyFiltered).toBe(true);
    });
  });

  test.describe("Command Palette Basics", () => {
    test.use({
      storageState: path.resolve(
        __dirname,
        "../../../playwright/.auth/admin.json",
      ),
    });

    test("opens and closes with CMD-K", async ({ page, envConfig }) => {
      await page.goto(envConfig.baseUrls.web);
      await page.waitForLoadState("networkidle");

      // Open with CMD-K
      await page.keyboard.press("Meta+k");

      const commandPalette = page
        .locator('[role="dialog"]')
        .or(page.locator('[data-testid="command-palette"]'))
        .or(page.locator('input[type="search"]'))
        .first();

      // Should be visible
      await expect(commandPalette).toBeVisible({ timeout: 5000 });
      console.log("✓ Command palette opened");

      // Close with Escape
      await page.keyboard.press("Escape");

      // Should be hidden
      await expect(commandPalette).toBeHidden({ timeout: 2000 });
      console.log("✓ Command palette closed");

      // Can re-open
      await page.keyboard.press("Meta+k");
      await expect(commandPalette).toBeVisible({ timeout: 5000 });
      console.log("✓ Command palette re-opened");
    });
  });
});
