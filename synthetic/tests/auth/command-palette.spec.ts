/**
 * Command Palette Tests (CMD-K)
 * Verify role-based access control in search/command palette.
 */

import { test, expect } from "../../fixtures/index.js";

// OS-aware keyboard shortcut
const cmdK = process.platform === "darwin" ? "Meta+k" : "Control+k";

/**
 * Open the command palette and wait for it to be ready.
 * Returns the palette locator.
 */
async function openCommandPalette(page: any) {
  await page.keyboard.press(cmdK);

  // Wait for palette to appear — try dialog role first, then common fallbacks
  const palette = page
    .locator('[role="dialog"]')
    .or(page.locator('[data-testid="command-palette"]'))
    .first();

  await palette.waitFor({ state: "visible", timeout: 5000 });
  return palette;
}

test.describe("Command Palette (CMD-K)", () => {
  test.describe("Admin User", () => {
    test('can search for "admin" and see results', async ({
      adminPage,
      envConfig,
    }) => {
      await adminPage.goto(envConfig.baseUrls.web);
      await adminPage.waitForLoadState("networkidle");

      console.log("Pressing CMD-K to open command palette...");
      const palette = await openCommandPalette(adminPage);
      console.log("✓ Command palette opened");

      await adminPage.keyboard.type("admin");
      await adminPage.waitForTimeout(1000);

      // Admin should see admin-specific navigation results inside the palette
      const hasAdminResults =
        (await palette.locator('a[href*="/admin"]').count()) > 0 ||
        (await palette.locator('[data-testid*="admin"]').count()) > 0 ||
        (await adminPage
          .locator(
            '[role="option"]:has-text("Admin"), [role="listitem"]:has-text("Admin")',
          )
          .count()) > 0;

      console.log(`Admin results found: ${hasAdminResults}`);
      expect(hasAdminResults).toBe(true);
    });
  });

  test.describe("Regular User", () => {
    test('cannot search for "admin" - no admin nav results', async ({
      userPage,
      envConfig,
    }) => {
      await userPage.goto(envConfig.baseUrls.web);
      await userPage.waitForLoadState("networkidle");

      console.log("Pressing CMD-K to open command palette...");
      const palette = await openCommandPalette(userPage);
      console.log("✓ Command palette opened");

      await userPage.keyboard.type("admin");
      await userPage.waitForTimeout(1000);

      // Regular user should NOT see admin navigation links inside the palette
      const hasAdminNavResults =
        (await palette.locator('a[href*="/admin"]').count()) > 0 ||
        (await palette.locator('[data-testid*="admin"]').count()) > 0;

      console.log(`Admin nav results found: ${hasAdminNavResults}`);
      expect(hasAdminNavResults).toBe(false);
    });
  });

  test.describe("Command Palette Basics", () => {
    test("opens and closes with CMD-K", async ({ adminPage, envConfig }) => {
      await adminPage.goto(envConfig.baseUrls.web);
      await adminPage.waitForLoadState("networkidle");

      // Open
      const palette = await openCommandPalette(adminPage);
      await expect(palette).toBeVisible({ timeout: 5000 });
      console.log("✓ Command palette opened");

      // Close with Escape
      await adminPage.keyboard.press("Escape");
      await expect(palette).toBeHidden({ timeout: 3000 });
      console.log("✓ Command palette closed");

      // Re-open
      await openCommandPalette(adminPage);
      await expect(palette).toBeVisible({ timeout: 5000 });
      console.log("✓ Command palette re-opened");
    });
  });
});
