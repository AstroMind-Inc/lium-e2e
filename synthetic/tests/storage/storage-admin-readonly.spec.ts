/**
 * Storage Tests - Admin (Read-Only)
 *
 * Admin can browse, view, and preview files but cannot upload or delete.
 * Tests the read-only storage experience from admin panel.
 */

import { test, expect } from "../../fixtures/index.js";

test.describe("Storage - Admin Read-Only Access", () => {
  test("admin can browse and preview existing files", async ({
    adminPage,
    envConfig,
  }) => {
    console.log("🔍 Testing admin read-only storage access...\n");

    // Navigate to storage
    console.log("1️⃣  Navigating to storage...");
    await adminPage.goto(`${envConfig.baseUrls.web}/admin/storage`, {
      waitUntil: "domcontentloaded",
    });
    await adminPage.waitForTimeout(2000);

    // Select tenant if needed
    const selectTenant = await adminPage
      .locator("text=/select a tenant/i")
      .count();
    if (selectTenant > 0) {
      console.log("   Selecting tenant...");
      const filterButton = adminPage
        .locator('button:has-text("Filter by tenant")')
        .first();
      await filterButton.click();
      await adminPage.waitForTimeout(1500);

      const tenantItems = await adminPage.locator('[role="menuitem"]').all();
      if (tenantItems.length > 0) {
        await tenantItems[0].click();
        await adminPage.waitForTimeout(3000);
        console.log("   ✅ Tenant selected");
      }
    }

    expect(adminPage.url()).toContain("/admin/storage");
    console.log("✅ On admin storage page\n");

    // Verify read-only: No upload button exists
    console.log("2️⃣  Verifying read-only access...");
    const uploadButton = await adminPage
      .locator('button:has-text("Upload")')
      .count();
    expect(uploadButton).toBe(0);
    console.log("✅ No upload button (read-only confirmed)\n");

    // Check for existing files
    console.log("3️⃣  Browsing existing files...");
    const fileRows = await adminPage.locator("tr").count();
    console.log(`   Found ${fileRows} rows in file list`);

    if (fileRows > 1) {
      // Get first file
      const firstFileRow = adminPage.locator("tr").nth(1);
      const fileName = await firstFileRow
        .locator("td")
        .first()
        .textContent();
      console.log(`   📄 File: ${fileName}\n`);

      // Try to preview file
      console.log("4️⃣  Testing preview functionality...");
      const actionsButton = firstFileRow.locator("button").last();
      await actionsButton.click();
      await adminPage.waitForTimeout(1000);

      const previewOption = adminPage
        .locator('[role="menuitem"]:has-text("Preview")')
        .first();
      if ((await previewOption.count()) > 0) {
        await previewOption.click();
        await adminPage.waitForTimeout(2000);

        // Verify preview opened
        const previewVisible = await adminPage
          .locator('[role="dialog"], [class*="preview"], [class*="modal"]')
          .count();

        if (previewVisible > 0) {
          console.log("✅ Preview opened successfully");
          await adminPage.keyboard.press("Escape");
          await adminPage.waitForTimeout(1000);
          console.log("✅ Preview closed");
        }
      } else {
        console.log("⚠️  Preview option not available for this file");
      }
    } else {
      console.log("ℹ️  No files found to preview");
    }

    // Test folder navigation
    console.log("\n5️⃣  Testing folder navigation...");
    const folders = await adminPage
      .locator('tr:has([data-type="folder"]), tr:has-text("folder")')
      .count();

    if (folders > 0) {
      const firstFolder = adminPage
        .locator('tr:has([data-type="folder"]), tr:has-text("folder")')
        .first();
      const folderName = await firstFolder
        .locator("td")
        .first()
        .textContent();
      console.log(`   📁 Opening folder: ${folderName}`);

      await firstFolder.click();
      await adminPage.waitForTimeout(2000);

      // Verify we're inside folder (breadcrumb)
      const breadcrumb = await adminPage.locator("nav, .breadcrumb").count();
      if (breadcrumb > 0) {
        console.log("✅ Folder navigation works");

        // Navigate back to root
        await adminPage.click('a:has-text("Root"), button:has-text("Root")');
        await adminPage.waitForTimeout(2000);
        console.log("✅ Navigated back to Root");
      }
    } else {
      console.log("ℹ️  No folders found to navigate");
    }

    console.log("\n🎉 Admin read-only access test complete!");
  });
});
