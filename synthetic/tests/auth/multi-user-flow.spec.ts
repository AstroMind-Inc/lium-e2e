/**
 * Multi-User Test Flow (Headless)
 * Tests with different user roles using saved auth sessions
 */

import { test, expect } from "../../fixtures/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe("Multi-User Flow (Headless)", () => {
  test("Admin user can access admin features", async ({
    browser,
    envConfig,
  }) => {
    // Create context with admin session
    const adminContext = await browser.newContext({
      storageState: path.resolve(
        __dirname,
        "../../../playwright/.auth/admin.json",
      ),
    });
    const adminPage = await adminContext.newPage();

    console.log("🔐 Testing admin user...");

    // Navigate to app
    await adminPage.goto(envConfig.baseUrls.web);
    await adminPage.waitForLoadState("networkidle");

    // Should be authenticated
    const adminUrl = adminPage.url();
    expect(adminUrl).not.toContain("auth0.com");
    expect(adminUrl).not.toContain("/login");
    console.log("✓ Admin authenticated");

    // Can access /admin
    await adminPage.goto(`${envConfig.baseUrls.web}/admin`);
    await adminPage.waitForLoadState("networkidle");
    expect(adminPage.url()).toContain("/admin");
    console.log("✓ Admin can access /admin");

    // Can search for admin in CMD-K
    await adminPage.goto(envConfig.baseUrls.web);
    await adminPage.waitForLoadState("networkidle");
    await adminPage.keyboard.press("Meta+k");

    // Wait for command palette to be visible
    await adminPage.waitForTimeout(1000);
    await adminPage.keyboard.type("admin");
    await adminPage.waitForTimeout(1500);

    const hasAdminResults =
      (await adminPage.locator("text=/admin/i").count()) > 0;
    expect(hasAdminResults).toBe(true);
    console.log("✓ Admin can search for admin features\n");

    await adminContext.close();
  });

  test("Regular user cannot access admin features", async ({
    browser,
    envConfig,
  }) => {
    // Create context with user session
    const userContext = await browser.newContext({
      storageState: path.resolve(
        __dirname,
        "../../../playwright/.auth/user.json",
      ),
    });
    const userPage = await userContext.newPage();

    console.log("👤 Testing regular user...");

    // Navigate to app
    await userPage.goto(envConfig.baseUrls.web);
    await userPage.waitForLoadState("networkidle");

    // Should be authenticated
    const userUrl = userPage.url();
    expect(userUrl).not.toContain("auth0.com");
    expect(userUrl).not.toContain("/login");
    console.log("✓ User authenticated");

    // Cannot access /admin (redirected)
    await userPage.goto(`${envConfig.baseUrls.web}/admin`);
    await userPage.waitForLoadState("networkidle");
    const finalUrl = userPage.url();
    expect(finalUrl).not.toMatch(/\/admin$/);
    console.log("✓ User blocked from /admin");

    // Cannot search for admin in CMD-K
    await userPage.goto(envConfig.baseUrls.web);
    await userPage.keyboard.press("Meta+k");
    await userPage.waitForTimeout(500);
    await userPage.keyboard.type("admin");
    await userPage.waitForTimeout(1000);

    const hasAdminResults =
      (await userPage.locator("text=/admin/i").count()) > 0;
    expect(hasAdminResults).toBe(false);
    console.log("✓ User cannot search for admin features\n");

    await userContext.close();
  });

  test("Both users can access common features", async ({
    browser,
    envConfig,
  }) => {
    console.log("🔄 Testing common features accessible to both users...");

    // Admin context
    const adminContext = await browser.newContext({
      storageState: path.resolve(
        __dirname,
        "../../../playwright/.auth/admin.json",
      ),
    });
    const adminPage = await adminContext.newPage();

    // User context
    const userContext = await browser.newContext({
      storageState: path.resolve(
        __dirname,
        "../../../playwright/.auth/user.json",
      ),
    });
    const userPage = await userContext.newPage();

    // Both can access chats
    await adminPage.goto(`${envConfig.baseUrls.web}/chats`);
    await userPage.goto(`${envConfig.baseUrls.web}/chats`);

    await adminPage.waitForLoadState("networkidle");
    await userPage.waitForLoadState("networkidle");

    expect(adminPage.url()).toContain("/chats");
    expect(userPage.url()).toContain("/chats");
    console.log("✓ Both users can access /chats");

    await adminContext.close();
    await userContext.close();
  });
});
