/**
 * Role-Based Access Control Tests (JWT Token Injection)
 * Comprehensive tests for admin vs user permissions
 * Fast, reliable, headless - no Auth0 OAuth flow
 */

import { test, expect } from "../../fixtures/index.js";

test.describe("Admin Access", () => {
  test("admin can access /admin page", async ({ adminPage, envConfig }) => {
    console.log("🎯 Testing admin access to /admin...");

    await adminPage.goto(`${envConfig.baseUrls.web}/admin`);
    await adminPage.waitForLoadState("networkidle");

    expect(adminPage.url()).toContain("/admin");
    expect(adminPage.url()).not.toContain("auth0.com");
    expect(adminPage.url()).not.toContain("/login");

    console.log("✅ Admin accessed /admin via JWT");
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

    console.log("✅ Admin accessed dashboard via JWT");
  });

  test("admin can search for admin in CMD-K", async ({
    adminPage,
    envConfig,
  }) => {
    console.log("🎯 Testing admin CMD-K search...");

    await adminPage.goto(envConfig.baseUrls.web);
    await adminPage.waitForLoadState("networkidle");
    await adminPage.keyboard.press("Meta+k");
    await adminPage.waitForTimeout(1000);
    await adminPage.keyboard.type("admin");
    await adminPage.waitForTimeout(1500);

    const hasAdminResults =
      (await adminPage.locator("text=/admin/i").count()) > 0;
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

    console.log("✅ User accessed dashboard via JWT");
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
    await userPage.keyboard.press("Meta+k");
    await userPage.waitForTimeout(500);
    await userPage.keyboard.type("admin");
    await userPage.waitForTimeout(1000);

    const hasAdminResults =
      (await userPage.locator("text=/admin/i").count()) > 0;
    expect(hasAdminResults).toBe(false);

    console.log("✅ User cannot search for admin features");
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

test.describe("Common Features", () => {
  test("both admin and user can access chats", async ({
    adminPage,
    userPage,
    envConfig,
  }) => {
    console.log("🔄 Testing common features for both roles...");

    // Navigate both pages sequentially (more reliable than parallel)
    await adminPage.goto(`${envConfig.baseUrls.web}/chats`, {
      waitUntil: "domcontentloaded",
    });
    await userPage.goto(`${envConfig.baseUrls.web}/chats`, {
      waitUntil: "domcontentloaded",
    });

    // Wait a bit for any redirects to complete
    await adminPage.waitForTimeout(2000);
    await userPage.waitForTimeout(2000);

    const adminUrl = adminPage.url();
    const userUrl = userPage.url();

    console.log(`Admin URL: ${adminUrl}`);
    console.log(`User URL: ${userUrl}`);

    expect(adminUrl.includes("/chats") || adminUrl.includes("/chat")).toBe(
      true,
    );
    expect(userUrl.includes("/chats") || userUrl.includes("/chat")).toBe(true);

    console.log("✅ Both roles can access common features");
  });
});
