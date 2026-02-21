/**
 * Admin Access Control Test (Simplified)
 * Tests admin access without requiring a separate regular user account
 */

import { test, expect } from "../../fixtures/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe("Admin Access Control (Simplified)", () => {
  test.use({
    storageState: path.resolve(
      __dirname,
      "../../../playwright/.auth/admin.json",
    ),
  });

  test("admin can access /admin page", async ({ page, envConfig }) => {
    // Navigate to admin page
    await page.goto(`${envConfig.baseUrls.web}/admin`);

    // Wait for navigation to complete
    await page.waitForLoadState("networkidle");

    // Should be on admin page (not redirected)
    expect(page.url()).toContain("/admin");

    // Should not see login or error pages
    expect(page.url()).not.toContain("auth0.com");
    expect(page.url()).not.toContain("/login");
    expect(page.url()).not.toContain("/unauthorized");

    console.log("✅ Admin successfully accessed /admin");
  });

  test("admin page requires authentication (logged out)", async ({
    page,
    envConfig,
    context,
  }) => {
    // Clear authentication
    await context.clearCookies();
    await context.clearPermissions();

    // Try to access admin page without auth
    await page.goto(`${envConfig.baseUrls.web}/admin`);

    await page.waitForLoadState("networkidle");

    // Should be redirected to login
    const url = page.url();
    const isRedirectedToAuth =
      url.includes("auth0.com") ||
      url.includes("/login") ||
      url.includes("/api/auth/signin");

    expect(isRedirectedToAuth).toBe(true);

    console.log("✅ Unauthenticated access properly blocked");
  });
});
