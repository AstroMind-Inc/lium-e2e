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
 */

import { test, expect } from "../../fixtures/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_USER_EMAIL = "test-user@astromind.com";
const TENANT_NAME = "seismic";

/**
 * Helper: Switch to Admin workspace
 */
async function switchToAdminWorkspace(page: any, baseUrl: string) {
  await page.goto(baseUrl);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Click account menu (verified selector)
  await page.locator('[aria-label="Account menu"]').click();
  await page.waitForTimeout(500);

  // Click "Admin" link (verified selector)
  await page.locator('a:has-text("Admin")').click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
}

/**
 * Helper: Open Seismic tenant management
 */
async function openSeismicTenantManagement(page: any) {
  // Find Seismic tenant row (verified selector)
  const seismicRow = page.locator('tr:has-text("Seismic")');

  // Click three-dot actions menu (verified selector)
  await seismicRow.locator('button[aria-label*="more" i]').click();
  await page.waitForTimeout(500);

  // Click "Manage" option (verified selector)
  await page.locator("text=/^Manage$/i").click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
}

test.describe("Tenant Member Management Flow", () => {
  // Increase timeout for this complex multi-step test
  test.setTimeout(120000); // 2 minutes

  let adminContext: any;
  let userContext: any;
  let adminPage: any;
  let userPage: any;

  // Setup: Create browser contexts for both users
  test.beforeAll(async ({ browser }) => {
    console.log("🔧 Setting up browser contexts...");

    // Create admin context
    adminContext = await browser.newContext({
      storageState: path.resolve(
        __dirname,
        "../../../playwright/.auth/admin.json",
      ),
    });
    adminPage = await adminContext.newPage();

    // Create user context
    userContext = await browser.newContext({
      storageState: path.resolve(
        __dirname,
        "../../../playwright/.auth/user.json",
      ),
    });
    userPage = await userContext.newPage();

    console.log("✅ Browser contexts ready\n");
  });

  // Cleanup: Close contexts
  test.afterAll(async () => {
    console.log("\n🧹 Cleaning up browser contexts...");
    await adminContext?.close();
    await userContext?.close();
  });

  test("Complete tenant member management flow", async ({ envConfig }) => {
    const baseUrl = envConfig.baseUrls.web;

    // ============================================================
    // SETUP: Remove test-user@astromind.com if exists
    // ============================================================
    console.log("📋 SETUP: Removing test user from tenant if exists...\n");

    await adminPage.goto(baseUrl);
    await adminPage.waitForLoadState("networkidle");

    // Navigate to Admin workspace and open Seismic management
    console.log(
      "1️⃣-3️⃣  Navigating to Admin and opening Seismic tenant management...",
    );
    await switchToAdminWorkspace(adminPage, baseUrl);
    await openSeismicTenantManagement(adminPage);
    console.log("   ✓ Seismic tenant management opened\n");

    // Try to remove test user if present (setup cleanup)
    console.log("4️⃣  Checking if test user exists...");
    const testUserExists =
      (await adminPage.locator(`text=${TEST_USER_EMAIL}`).count()) > 0;

    if (testUserExists) {
      console.log(`   ℹ️  Test user found, removing...`);
      // Click remove button (trash icon) - verified selector
      const removeButton = adminPage.locator(
        `button[aria-label="Remove ${TEST_USER_EMAIL}"]`,
      );
      await removeButton.click();
      await adminPage.waitForTimeout(1000);

      console.log("   ✓ Test user removed (cleanup)\n");
    } else {
      console.log("   ✓ Test user not present (clean state)\n");
    }

    // Close modal
    await adminPage.locator('button:has-text("Close")').first().click();
    await adminPage.waitForTimeout(500);

    // ============================================================
    // STORY STEP 1-6: Admin adds user
    // ============================================================
    console.log("📖 STORY: Starting tenant member management flow...\n");

    console.log("1️⃣  Admin signing in...");
    await adminPage.goto(baseUrl);
    await adminPage.waitForLoadState("networkidle");
    expect(adminPage.url()).not.toContain("auth0.com");
    console.log("   ✓ Admin authenticated\n");

    console.log("2️⃣  Admin navigating to Admin workspace...");
    await switchToAdminWorkspace(adminPage, baseUrl);
    console.log("   ✓ Switched to Admin workspace\n");

    console.log("3️⃣-4️⃣  Opening seismic tenant management...");
    await openSeismicTenantManagement(adminPage);
    console.log("   ✓ Tenant management opened\n");

    console.log("5️⃣  Adding test-user@astromind.com as member...");

    // Fill in email in the "Add Invitee" section - verified selector
    const emailInput = adminPage.locator('input[placeholder="Email"]');
    await emailInput.fill(TEST_USER_EMAIL);

    // Click "Invite user to tenant" button - verified selector
    await adminPage.locator('button:has-text("Invite user to tenant")').click();
    await adminPage.waitForTimeout(2000);

    // Verify user added (should appear in Tenant Users section)
    const userAdded = await adminPage
      .locator(`text=${TEST_USER_EMAIL}`)
      .isVisible({ timeout: 5000 });
    expect(userAdded).toBe(true);
    console.log("   ✓ Test user added as member\n");

    console.log("6️⃣  Admin signing out...");
    // Close modal
    await adminPage.locator('button:has-text("Close")').first().click();
    await adminPage.waitForTimeout(500);

    // Sign out
    await adminPage.goto(`${baseUrl}/api/auth/logout`);
    await adminPage.waitForLoadState("networkidle");
    console.log("   ✓ Admin signed out\n");

    // ============================================================
    // STORY STEP 7-9: User verifies access
    // ============================================================
    console.log("7️⃣  test-user@astromind.com signing in...");
    await userPage.goto(baseUrl);
    await userPage.waitForLoadState("networkidle");
    expect(userPage.url()).not.toContain("auth0.com");
    console.log("   ✓ Test user authenticated\n");

    console.log("8️⃣  Verifying user is part of seismic tenant...");
    // User should NOT be stuck at /beta
    await userPage.waitForTimeout(2000);
    const userUrl = userPage.url();
    expect(userUrl).not.toContain("/beta");

    // Should be able to access chats or other tenant features
    await userPage.goto(`${baseUrl}/chats`);
    await userPage.waitForLoadState("networkidle");
    expect(userPage.url()).toContain("/chats");
    console.log("   ✓ User has access to seismic tenant (can access /chats)\n");

    console.log("9️⃣  User signing out...");
    await userPage.goto(`${baseUrl}/api/auth/logout`);
    await userPage.waitForLoadState("networkidle");
    console.log("   ✓ User signed out\n");

    // ============================================================
    // STORY STEP 10-15: Admin removes user
    // ============================================================
    console.log("🔟 Admin signing in again...");
    await adminPage.goto(baseUrl);
    await adminPage.waitForLoadState("networkidle");
    console.log("   ✓ Admin authenticated\n");

    console.log("1️⃣1️⃣-1️⃣3️⃣  Admin navigating to tenant management...");
    await switchToAdminWorkspace(adminPage, baseUrl);
    await openSeismicTenantManagement(adminPage);
    console.log("   ✓ Tenant management opened\n");

    console.log("1️⃣4️⃣  Removing test-user@astromind.com as member...");

    // Click remove button (trash icon) - verified selector
    await adminPage
      .locator(`button[aria-label="Remove ${TEST_USER_EMAIL}"]`)
      .click();
    await adminPage.waitForTimeout(2000);

    // Verify user removed
    const userRemoved =
      (await adminPage.locator(`text=${TEST_USER_EMAIL}`).count()) === 0;
    expect(userRemoved).toBe(true);
    console.log("   ✓ Test user removed from tenant\n");

    console.log("1️⃣5️⃣  Admin signing out...");
    await adminPage.locator('button:has-text("Close")').first().click();
    await adminPage.waitForTimeout(500);

    await adminPage.goto(`${baseUrl}/api/auth/logout`);
    await adminPage.waitForLoadState("networkidle");
    console.log("   ✓ Admin signed out\n");

    // ============================================================
    // STORY STEP 16-17: User verifies access revoked
    // ============================================================
    console.log("1️⃣6️⃣  test-user@astromind.com signing in...");
    await userPage.goto(baseUrl);
    await userPage.waitForLoadState("networkidle");
    console.log("   ✓ Test user authenticated\n");

    console.log("1️⃣7️⃣  Verifying user is stuck at /beta screen...");
    await userPage.waitForTimeout(2000);
    const stuckUrl = userPage.url();
    expect(stuckUrl).toContain("/beta");
    console.log("   ✓ User stuck at /beta (access revoked)\n");

    // ============================================================
    // TEARDOWN: Restore test user for other tests
    // ============================================================
    console.log("📋 TEARDOWN: Restoring test user to tenant...\n");

    // Admin signs in and opens tenant management
    await switchToAdminWorkspace(adminPage, baseUrl);
    await openSeismicTenantManagement(adminPage);

    // Add user back
    await adminPage.locator('input[placeholder="Email"]').fill(TEST_USER_EMAIL);
    await adminPage.locator('button:has-text("Invite user to tenant")').click();
    await adminPage.waitForTimeout(2000);

    // Verify restored
    const userRestored = await adminPage
      .locator(`text=${TEST_USER_EMAIL}`)
      .isVisible({ timeout: 5000 });
    expect(userRestored).toBe(true);
    console.log("   ✓ Test user restored to tenant for other tests\n");

    console.log("✅ COMPLETE: All steps verified successfully!");
  });
});
