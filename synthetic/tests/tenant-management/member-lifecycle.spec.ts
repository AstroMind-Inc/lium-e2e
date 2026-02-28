/**
 * Tenant Member Management Test Story
 *
 * This test verifies the complete flow of adding and removing users from tenants:
 * 1. Admin adds a user to a tenant
 * 2. User verifies access to the tenant
 * 3. Admin removes the user from the tenant
 * 4. User verifies access is revoked (stuck at /beta)
 *
 * Setup: Removes test user from tenant if exists
 * Teardown: Restores test user to tenant for other tests
 *
 * NOTE: No explicit logout/login cycles — the app checks tenant membership
 * per-request. Logging out via /api/auth/logout invalidates the Auth0
 * server-side session, breaking subsequent interactions in the same context.
 */

import { test, expect } from "../../fixtures/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_USER_EMAIL = "test-user@astromind.com";
const TENANT_NAME = "seismic";

/**
 * Helper: Switch to Admin workspace.
 * Uses "load" (not networkidle — hangs in firefox/webkit with long-polling,
 * not domcontentloaded — React hasn't hydrated yet when that fires).
 */
async function switchToAdminWorkspace(page: any, baseUrl: string) {
  await page.goto(baseUrl, { waitUntil: "load" });

  // Wait for account menu — original verified selector
  // 30s — server may be slow under full-suite parallel test load
  await page.locator('[aria-label="Account menu"]').waitFor({
    state: "visible",
    timeout: 30000,
  });
  await page.locator('[aria-label="Account menu"]').click();
  await page.waitForTimeout(500);

  // Click "Admin" link in the dropdown
  await page.locator('a:has-text("Admin")').waitFor({
    state: "visible",
    timeout: 10000,
  });
  await page.locator('a:has-text("Admin")').click();

  // Wait for tenants table to confirm we landed in Admin workspace
  // 60s — full-suite parallel load can make the admin page significantly slower
  await page.locator('tr:has-text("Seismic")').waitFor({
    state: "visible",
    timeout: 60000,
  });
}

/**
 * Helper: Open Seismic tenant management
 */
async function openSeismicTenantManagement(page: any) {
  const seismicRow = page.locator('tr:has-text("Seismic")');
  await seismicRow.waitFor({ state: "visible", timeout: 10000 });

  // Click three-dot actions menu (case-sensitive — avoid CSS4 i-flag)
  const moreButton = seismicRow.locator(
    'button[aria-label*="more"], button[aria-label*="More"], button[aria-label*="actions"], button[aria-label*="Actions"]',
  );
  await moreButton.waitFor({ state: "visible", timeout: 5000 });
  await moreButton.click();
  await page.waitForTimeout(500);

  // Click "Manage" option
  await page.locator('[role="menuitem"]:has-text("Manage")').waitFor({
    state: "visible",
    timeout: 5000,
  });
  await page.locator('[role="menuitem"]:has-text("Manage")').click();

  // Wait for the Email input inside the dialog — concrete signal the dialog opened
  await page.locator('input[placeholder="Email"]').waitFor({
    state: "visible",
    timeout: 10000,
  });
}

const sessionEnv = process.env.E2E_ENVIRONMENT || "local";
const ADMIN_AUTH = path.resolve(
  __dirname,
  `../../../playwright/.auth/admin-${sessionEnv}.json`,
);
const USER_AUTH = path.resolve(
  __dirname,
  `../../../playwright/.auth/user-${sessionEnv}.json`,
);

test.describe("Tenant Member Management Flow", () => {
  // This test modifies shared server state (tenant membership).
  // It runs exclusively in the chromium-tenant project (see playwright.config.ts),
  // which depends on all other projects completing first — preventing parallel conflicts.
  test.setTimeout(180000); // 3 min — multi-step flow with multiple page navigations

  let adminContext: any;
  let userContext: any;
  let adminPage: any;
  let userPage: any;

  test.beforeAll(async ({ browser }) => {
    console.log("🔧 Setting up browser contexts...");

    adminContext = await browser.newContext({ storageState: ADMIN_AUTH });
    adminPage = await adminContext.newPage();

    userContext = await browser.newContext({ storageState: USER_AUTH });
    userPage = await userContext.newPage();

    console.log("✅ Browser contexts ready\n");
  });

  test.afterAll(async () => {
    console.log("\n🧹 Cleaning up browser contexts...");
    await adminContext?.close();
    await userContext?.close();
  });

  test("Complete tenant member management flow", async ({ envConfig }) => {
    const baseUrl = envConfig.baseUrls.web;

    // ============================================================
    // SETUP: Remove test-user@astromind.com if already in tenant
    // ============================================================
    console.log("📋 SETUP: Removing test user from tenant if exists...\n");

    await switchToAdminWorkspace(adminPage, baseUrl);
    await openSeismicTenantManagement(adminPage);
    console.log("   ✓ Seismic tenant management opened\n");

    const testUserExists =
      (await adminPage.locator(`text=${TEST_USER_EMAIL}`).count()) > 0;

    if (testUserExists) {
      console.log(`   ℹ️  Test user found, removing...`);
      const removeButton = adminPage.locator(
        `button[aria-label="Remove ${TEST_USER_EMAIL}"]`,
      );
      await removeButton.waitFor({ state: "visible", timeout: 5000 });
      await removeButton.click();
      // Wait for the user to actually disappear from the list before proceeding
      await adminPage
        .locator(`text=${TEST_USER_EMAIL}`)
        .waitFor({ state: "hidden", timeout: 10000 });
      console.log("   ✓ Test user removed (setup cleanup)\n");
    } else {
      console.log("   ✓ Test user not present (clean state)\n");
    }

    await adminPage.locator('button:has-text("Close")').first().click();
    // Extra pause to let the server-side removal fully propagate before re-inviting
    await adminPage.waitForTimeout(2000);

    // ============================================================
    // STEP 1: Admin adds test user to seismic tenant
    // ============================================================
    console.log("1️⃣  Admin adding test user to seismic tenant...");

    await switchToAdminWorkspace(adminPage, baseUrl);
    await openSeismicTenantManagement(adminPage);

    const emailInput = adminPage.locator('input[placeholder="Email"]');
    await emailInput.waitFor({ state: "visible", timeout: 5000 });
    await emailInput.fill(TEST_USER_EMAIL);
    // Wait for input change event and React validation before submitting
    await adminPage.waitForTimeout(1000);

    const inviteButton = adminPage.locator('button:has-text("Invite user to tenant")');
    await inviteButton.waitFor({ state: "visible", timeout: 5000 });
    await inviteButton.click();
    await adminPage.waitForTimeout(5000);

    // Wait up to 10s for the user to appear (server-side async operation)
    const userAdded = await adminPage
      .locator(`text=${TEST_USER_EMAIL}`)
      .isVisible({ timeout: 10000 });
    expect(userAdded).toBe(true);
    console.log("   ✓ Test user added as member\n");

    await adminPage.locator('button:has-text("Close")').first().click();
    await adminPage.waitForTimeout(500);

    // ============================================================
    // STEP 2: User verifies tenant access
    // Tenant membership is checked per-request — no re-login needed.
    // ============================================================
    console.log("2️⃣  Verifying user has access to seismic tenant...");

    await userPage.goto(`${baseUrl}/chats`, { waitUntil: "domcontentloaded" });
    await userPage.waitForTimeout(2000);

    expect(userPage.url()).not.toContain("/beta");
    expect(userPage.url()).toContain("/chats");
    console.log("   ✓ User has access (can reach /chats)\n");

    // ============================================================
    // STEP 3: Admin removes test user from seismic tenant
    // ============================================================
    console.log("3️⃣  Admin removing test user from seismic tenant...");

    await switchToAdminWorkspace(adminPage, baseUrl);
    await openSeismicTenantManagement(adminPage);

    await adminPage
      .locator(`button[aria-label="Remove ${TEST_USER_EMAIL}"]`)
      .click();
    await adminPage.waitForTimeout(2000);

    const userRemoved =
      (await adminPage.locator(`text=${TEST_USER_EMAIL}`).count()) === 0;
    expect(userRemoved).toBe(true);
    console.log("   ✓ Test user removed from tenant\n");

    await adminPage.locator('button:has-text("Close")').first().click();
    await adminPage.waitForTimeout(500);

    // ============================================================
    // STEP 4: User verifies access is revoked
    // ============================================================
    console.log("4️⃣  Verifying user access is revoked...");

    await userPage.goto(`${baseUrl}/chats`, { waitUntil: "domcontentloaded" });
    await userPage.waitForTimeout(2000);

    expect(userPage.url()).toContain("/beta");
    console.log("   ✓ User stuck at /beta (access revoked)\n");

    // ============================================================
    // TEARDOWN: Restore test user so other tests continue to work
    // Uses a fresh admin context from the saved session file since
    // the active adminPage context may have navigated away.
    // ============================================================
    console.log("📋 TEARDOWN: Restoring test user to tenant...\n");

    const teardownAdminContext = await adminPage
      .context()
      .browser()!
      .newContext({ storageState: ADMIN_AUTH });
    const teardownPage = await teardownAdminContext.newPage();

    try {
      await switchToAdminWorkspace(teardownPage, baseUrl);
      await openSeismicTenantManagement(teardownPage);

      await teardownPage
        .locator('input[placeholder="Email"]')
        .fill(TEST_USER_EMAIL);
      await teardownPage
        .locator('button:has-text("Invite user to tenant")')
        .click();
      await teardownPage.waitForTimeout(2000);

      const userRestored = await teardownPage
        .locator(`text=${TEST_USER_EMAIL}`)
        .isVisible({ timeout: 5000 });
      expect(userRestored).toBe(true);
      console.log("   ✓ Test user restored to tenant\n");
    } finally {
      await teardownAdminContext.close();
    }

    console.log("✅ COMPLETE: All steps verified successfully!");
  });
});
