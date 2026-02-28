/**
 * Role-Based Access Control Tests
 * Comprehensive tests for admin vs user permissions using saved browser sessions.
 */

import { test, expect } from "../../fixtures/index.js";

// OS-aware keyboard shortcut
const cmdK = process.platform === "darwin" ? "Meta+k" : "Control+k";

test.describe("Admin Access", () => {
  test("admin can access /admin page", async ({ adminPage, envConfig }) => {
    console.log("🎯 Testing admin access to /admin...");

    await adminPage.goto(`${envConfig.baseUrls.web}/admin`);
    await adminPage.waitForLoadState("networkidle");

    expect(adminPage.url()).toContain("/admin");
    expect(adminPage.url()).not.toContain("auth0.com");
    expect(adminPage.url()).not.toContain("/login");

    console.log("✅ Admin accessed /admin");
  });

  test("admin can access dashboard", async ({ adminPage, envConfig }) => {
    console.log("🎯 Testing admin access to dashboard...");

    await adminPage.goto(`${envConfig.baseUrls.web}/chats`, {
      waitUntil: "domcontentloaded",
    });
    await adminPage.waitForTimeout(1000);

    const url = adminPage.url();
    expect(url.includes("/chats") || url.includes("/chat")).toBe(true);
    expect(url).not.toContain("auth0.com");

    console.log("✅ Admin accessed dashboard");
  });

  test("admin can search for admin in CMD-K", async ({
    adminPage,
    envConfig,
  }) => {
    console.log("🎯 Testing admin CMD-K search...");

    await adminPage.goto(envConfig.baseUrls.web);
    await adminPage.waitForLoadState("networkidle");
    await adminPage.keyboard.press(cmdK);

    // Wait for command palette to open
    const palette = adminPage
      .locator('[role="dialog"], [data-testid="command-palette"]')
      .first();
    await palette.waitFor({ state: "visible", timeout: 5000 });

    await adminPage.keyboard.type("admin");
    await adminPage.waitForTimeout(1000);

    // Check for admin-specific results inside the palette
    const hasAdminResults =
      (await palette.locator('a[href*="/admin"]').count()) > 0 ||
      (await palette.locator('[data-testid*="admin"]').count()) > 0 ||
      (await adminPage
        .locator(
          '[role="option"]:has-text("Admin"), [role="listitem"]:has-text("Admin")',
        )
        .count()) > 0;

    expect(hasAdminResults).toBe(true);
    console.log("✅ Admin can search for admin features");
  });
});

test.describe("Regular User Access", () => {
  test("user can access dashboard", async ({ userPage, envConfig }) => {
    console.log("🎯 Testing user access to dashboard...");

    await userPage.goto(`${envConfig.baseUrls.web}/chats`, {
      waitUntil: "domcontentloaded",
    });
    await userPage.waitForTimeout(1000);

    const url = userPage.url();
    expect(url.includes("/chats") || url.includes("/chat")).toBe(true);
    expect(url).not.toContain("auth0.com");

    console.log("✅ User accessed dashboard");
  });

  test("user CANNOT access /admin page", async ({ userPage, envConfig }) => {
    console.log("🎯 Testing user blocked from /admin...");

    await userPage.goto(`${envConfig.baseUrls.web}/admin`);
    await userPage.waitForLoadState("networkidle");

    const url = userPage.url();
    const isOnAdminPage = url.endsWith("/admin") || url.includes("/admin/");
    expect(isOnAdminPage).toBe(false);

    console.log("✅ User correctly blocked from /admin");
  });

  test("user CANNOT search for admin in CMD-K", async ({
    userPage,
    envConfig,
  }) => {
    console.log("🎯 Testing user CMD-K search (no admin results)...");

    await userPage.goto(envConfig.baseUrls.web);
    await userPage.waitForLoadState("networkidle");
    await userPage.keyboard.press(cmdK);

    // Wait for command palette to open
    const palette = userPage
      .locator('[role="dialog"], [data-testid="command-palette"]')
      .first();
    await palette.waitFor({ state: "visible", timeout: 5000 });

    await userPage.keyboard.type("admin");
    await userPage.waitForTimeout(1000);

    // Check ONLY inside the palette for admin-specific navigation items (not page text)
    const hasAdminNavResults =
      (await palette.locator('a[href*="/admin"]').count()) > 0 ||
      (await palette.locator('[data-testid*="admin"]').count()) > 0;

    expect(hasAdminNavResults).toBe(false);

    console.log("✅ User cannot navigate to admin features via CMD-K");
  });
});

test.describe("Unauthenticated Access", () => {
  test("unauthenticated users redirected to login", async ({
    context,
    page,
    envConfig,
  }) => {
    console.log("🎯 Testing unauthenticated access...");

    // Clear all cookies to ensure truly unauthenticated
    await context.clearCookies();

    await page.goto(`${envConfig.baseUrls.web}/admin`);
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const isRedirectedToAuth =
      url.includes("auth0.com") ||
      url.includes("/login") ||
      url.includes("/api/auth/signin");

    expect(isRedirectedToAuth).toBe(true);
    console.log("✅ Unauthenticated access properly blocked");
  });
});

test.describe("Common Features", () => {
  test("both admin and user can access chats", async ({
    adminPage,
    userPage,
    envConfig,
  }) => {
    console.log("🔄 Testing common features for both roles...");

    await adminPage.goto(`${envConfig.baseUrls.web}/chats`, {
      waitUntil: "domcontentloaded",
    });
    await userPage.goto(`${envConfig.baseUrls.web}/chats`, {
      waitUntil: "domcontentloaded",
    });

    await adminPage.waitForTimeout(1000);
    await userPage.waitForTimeout(1000);

    const adminUrl = adminPage.url();
    const userUrl = userPage.url();

    expect(adminUrl.includes("/chats") || adminUrl.includes("/chat")).toBe(
      true,
    );
    expect(userUrl.includes("/chats") || userUrl.includes("/chat")).toBe(true);

    console.log("✅ Both roles can access common features");
  });
});
