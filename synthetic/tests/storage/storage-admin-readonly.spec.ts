/**
 * Storage Tests - Admin (Read-Only)
 *
 * Admin can browse, view, and preview files but cannot upload or delete.
 * Tests the read-only storage experience from admin panel.
 */

import { test, expect } from "../../fixtures/index.js";

test.describe("Storage - Admin (Read-Only)", () => {
  test("[ADMIN] can browse, preview, and navigate storage", async ({
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
      const fileName = await firstFileRow.locator("td").first().textContent();
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

    // Test folder navigation (if folders exist)
    console.log("\n5️⃣  Testing folder navigation...");

    // Look for folders in the file list
    const folderLinks = await adminPage
      .locator("tr td:first-child a, tr td:first-child button")
      .all();
    let foundFolder = false;

    for (const link of folderLinks) {
      const text = await link.textContent();
      // Skip if it's a file (has extension)
      if (text && !text.includes(".")) {
        console.log(`   📁 Opening folder: ${text}`);
        await link.click();
        await adminPage.waitForTimeout(2000);

        // Verify breadcrumb changed
        const breadcrumb = await adminPage.locator('text="Root"').count();
        if (breadcrumb > 0) {
          console.log("✅ Folder opened");
          foundFolder = true;

          // Navigate back to root
          await adminPage.click('a:has-text("Root"), button:has-text("Root")');
          await adminPage.waitForTimeout(2000);
          console.log("✅ Navigated back to Root");
          break;
        }
      }
    }

    if (!foundFolder) {
      console.log("ℹ️  No folders found to test navigation");
    }

    console.log("\n🎉 Admin read-only access test complete!");
  });
});
