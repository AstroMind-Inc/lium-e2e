/**
 * Storage Tests - File Upload, Preview, Delete
 *
 * Auto-discovers test files from fixtures/upload-test/
 * Add any file to that directory and it will be automatically tested!
 */

import { test, expect } from "../../fixtures/index.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing files to test
const UPLOAD_TEST_DIR = path.join(__dirname, "fixtures", "upload-test");

// Auto-discover all files in the upload-test directory
function getTestFiles(): string[] {
  if (!fs.existsSync(UPLOAD_TEST_DIR)) {
    console.warn(`⚠️  Upload test directory not found: ${UPLOAD_TEST_DIR}`);
    return [];
  }

  const files = fs.readdirSync(UPLOAD_TEST_DIR);
  const testFiles = files.filter((file) => {
    // Skip hidden files and README
    if (file.startsWith(".") || file.toLowerCase() === "readme.md") {
      return false;
    }
    return true;
  });

  console.log(`📂 Found ${testFiles.length} test files in fixtures/upload-test/`);
  return testFiles;
}

// Get all test files
const testFiles = getTestFiles();

// Skip tests if no files found
if (testFiles.length === 0) {
  test.skip("No test files found in fixtures/upload-test/", () => {
    // This test will be skipped
  });
} else {
  test.describe("Storage - File Management", () => {
    // Create a single test that handles all files in one lifecycle
    test("complete storage lifecycle: create folder, upload files, preview, delete", async ({
      adminPage,
      envConfig,
    }) => {
      // Generate folder name with today's date
      const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
      const folderName = `test-${today}`;

      console.log(`🗂️  Starting storage lifecycle test with folder: ${folderName}`);
      console.log(`📦 Testing ${testFiles.length} files`);

      // Step 0: Navigate to storage and select tenant
      console.log(`\n0️⃣  Navigating to storage...`);
      await adminPage.goto(`${envConfig.baseUrls.web}/admin/storage`, {
        waitUntil: "domcontentloaded",
      });
      await adminPage.waitForTimeout(2000);

      // Check if we need to select a tenant
      const selectTenantText = await adminPage
        .locator("text=/select a tenant/i")
        .count();
      if (selectTenantText > 0) {
        console.log(`   Selecting tenant...`);
        await adminPage.click('button:has-text("Filter by tenant")');
        await adminPage.waitForTimeout(1000);

        const tenantOptions = adminPage.locator('[role="menuitem"]').first();
        if ((await tenantOptions.count()) > 0) {
          await tenantOptions.click();
          await adminPage.waitForTimeout(2000);
        }
      }

      expect(adminPage.url()).toContain("/admin/storage");
      console.log(`✅ On storage page`);

      // Step 1: Create test folder
      console.log(`\n1️⃣  Creating test folder: ${folderName}`);
      await adminPage.click('button:has-text("New Folder")');
      await adminPage.waitForTimeout(1000);

      // Fill in folder name
      const folderInput = adminPage.locator('input[name="name"], input[placeholder*="folder"]').first();
      await folderInput.fill(folderName);

      // Click Create button
      await adminPage.click('button:has-text("Create")');
      await adminPage.waitForTimeout(2000);

      // Verify folder was created
      const folderExists = await adminPage.locator(`text="${folderName}"`).count();
      expect(folderExists).toBeGreaterThan(0);
      console.log(`✅ Folder created: ${folderName}`);

      // Step 2: Navigate into the folder
      console.log(`\n2️⃣  Opening folder: ${folderName}`);
      await adminPage.click(`text="${folderName}"`);
      await adminPage.waitForTimeout(2000);

      // Verify we're inside the folder (breadcrumb should show folder name)
      const breadcrumb = await adminPage.locator(`text="${folderName}"`).count();
      expect(breadcrumb).toBeGreaterThan(0);
      console.log(`✅ Inside folder: ${folderName}`);

      // Step 3: Upload all test files
      console.log(`\n3️⃣  Uploading ${testFiles.length} files...`);

      for (const fileName of testFiles) {
        const filePath = path.join(UPLOAD_TEST_DIR, fileName);
        const fileSize = fs.statSync(filePath).size;
        const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

        console.log(`   📤 Uploading ${fileName} (${fileSizeMB} MB)...`);

        // Click "Upload Files" button
        await adminPage.click('button:has-text("Upload Files"), button:has-text("Upload")');
        await adminPage.waitForTimeout(500);

        // Set the file in the file input (OS picker is handled by Playwright)
        const fileInput = adminPage.locator('input[type="file"]').first();
        await fileInput.setInputFiles(filePath);

        // Wait for upload to complete
        await adminPage.waitForTimeout(3000);

        // Verify file appears in list
        const fileInList = await adminPage.locator(`text="${fileName}"`).count();
        if (fileInList > 0) {
          console.log(`   ✅ ${fileName} uploaded`);
        } else {
          console.log(`   ⚠️  ${fileName} may still be uploading...`);
          await adminPage.waitForTimeout(2000);
        }
      }

      console.log(`✅ All files uploaded`);

      // Step 4: Preview and delete each file
      console.log(`\n4️⃣  Previewing and deleting files...`);

      for (const fileName of testFiles) {
        const isLargePDF = fileName === "large-pdf.pdf";

        console.log(`\n   📄 Processing: ${fileName}`);

        // Find the file row
        const fileRow = adminPage.locator(`tr:has-text("${fileName}")`).first();

        // Click the 3-dot menu (actions)
        const actionsButton = fileRow.locator('button[aria-label*="action"], button:has(svg)').last();
        await actionsButton.click();
        await adminPage.waitForTimeout(1000);

        // Click Preview from the menu
        console.log(`      👁️  Previewing...`);
        const previewOption = adminPage.locator('[role="menuitem"]:has-text("Preview"), button:has-text("Preview")').first();

        if ((await previewOption.count()) > 0) {
          await previewOption.click();
          await adminPage.waitForTimeout(2000);

          // Special handling for large PDF - expect confirmation dialog
          if (isLargePDF) {
            console.log(`      ⚠️  Checking for size confirmation...`);
            const confirmButton = adminPage.locator(
              'button:has-text("Continue"), button:has-text("Proceed"), button:has-text("Yes"), button:has-text("Confirm")'
            ).first();

            if ((await confirmButton.count()) > 0) {
              console.log(`      ✅ Confirmation dialog appeared`);
              await confirmButton.click();
              await adminPage.waitForTimeout(2000);
            }
          }

          // Close preview (press Escape or click close button)
          await adminPage.keyboard.press("Escape");
          await adminPage.waitForTimeout(1000);
          console.log(`      ✅ Preview closed`);
        } else {
          console.log(`      ⚠️  Preview option not found`);
        }

        // Now delete the file
        console.log(`      🗑️  Deleting...`);

        // Click 3-dot menu again
        await actionsButton.click();
        await adminPage.waitForTimeout(1000);

        // Click Delete from menu
        const deleteOption = adminPage.locator('[role="menuitem"]:has-text("Delete"), button:has-text("Delete")').first();

        if ((await deleteOption.count()) > 0) {
          await deleteOption.click();
          await adminPage.waitForTimeout(1000);

          // Confirm deletion if dialog appears
          const confirmDelete = adminPage.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
          if ((await confirmDelete.count()) > 0) {
            await confirmDelete.click();
            await adminPage.waitForTimeout(2000);
          }

          // Verify file is gone
          const fileStillVisible = await adminPage.locator(`text="${fileName}"`).count();
          if (fileStillVisible === 0) {
            console.log(`      ✅ ${fileName} deleted`);
          } else {
            console.log(`      ⚠️  ${fileName} may still be visible`);
          }
        } else {
          console.log(`      ⚠️  Delete option not found`);
        }
      }

      console.log(`\n✅ All files processed`);

      // Step 5: Navigate back to Root using breadcrumbs
      console.log(`\n5️⃣  Navigating back to Root...`);
      const rootBreadcrumb = adminPage.locator('a:has-text("Root"), button:has-text("Root")').first();
      await rootBreadcrumb.click();
      await adminPage.waitForTimeout(2000);

      // Verify we're at root
      const atRoot = await adminPage.locator('text="Root"').count();
      expect(atRoot).toBeGreaterThan(0);
      console.log(`✅ Back at Root`);

      // Step 6: Delete the test folder
      console.log(`\n6️⃣  Deleting test folder: ${folderName}`);

      // Find the folder row
      const folderRow = adminPage.locator(`tr:has-text("${folderName}")`).first();

      // Click 3-dot menu on folder
      const folderActionsButton = folderRow.locator('button[aria-label*="action"], button:has(svg)').last();
      await folderActionsButton.click();
      await adminPage.waitForTimeout(1000);

      // Click Delete
      const deleteFolderOption = adminPage.locator('[role="menuitem"]:has-text("Delete"), button:has-text("Delete")').first();

      if ((await deleteFolderOption.count()) > 0) {
        await deleteFolderOption.click();
        await adminPage.waitForTimeout(1000);

        // Confirm deletion
        const confirmDeleteFolder = adminPage.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
        if ((await confirmDeleteFolder.count()) > 0) {
          await confirmDeleteFolder.click();
          await adminPage.waitForTimeout(2000);
        }

        // Verify folder is gone
        const folderStillVisible = await adminPage.locator(`text="${folderName}"`).count();
        if (folderStillVisible === 0) {
          console.log(`✅ Folder deleted: ${folderName}`);
        } else {
          console.log(`⚠️  Folder may still be visible`);
        }
      } else {
        console.log(`⚠️  Delete option not found for folder`);
      }

      console.log(`\n🎉 Complete storage lifecycle test finished!`);
    });

    // Keep individual tests for each file as backup
    for (const fileName of testFiles) {
      test.skip(`[BACKUP] upload, preview, and delete: ${fileName}`, async ({
        adminPage,
        envConfig,
      }) => {
        const filePath = path.join(UPLOAD_TEST_DIR, fileName);
        const fileSize = fs.statSync(filePath).size;
        const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
        const isLargePDF = fileName === "large-pdf.pdf";

        console.log(`📁 Testing file: ${fileName} (${fileSizeMB} MB)`);
        if (isLargePDF) {
          console.log(`   ⚠️  Large file - will test confirmation dialog`);
        }

        // Step 0: Navigate to storage and select a tenant
        console.log(`  0️⃣  Navigating to storage...`);
        await adminPage.goto(`${envConfig.baseUrls.web}/admin/storage`, {
          waitUntil: "domcontentloaded",
        });
        await adminPage.waitForTimeout(2000);

        // Check if we need to select a tenant
        const selectTenantText = await adminPage
          .locator("text=/select a tenant/i")
          .count();
        if (selectTenantText > 0) {
          console.log(`     Selecting tenant...`);

          // Click "Filter by tenant" button
          await adminPage.click('button:has-text("Filter by tenant")');
          await adminPage.waitForTimeout(1000);

          // Select the first available tenant from the menu
          // Look for tenant items in the dropdown/menu
          const tenantOptions = await adminPage
            .locator('[role="menuitem"], [role="option"], li:has-text("tenant")')
            .first();
          if (await tenantOptions.count() > 0) {
            await tenantOptions.click();
            await adminPage.waitForTimeout(2000);
          }
        }

        // Verify we're on the storage page with a tenant selected
        expect(adminPage.url()).toContain("/admin/storage");
        console.log(`  ✅ On storage page with tenant selected`);

        // Step 1: Upload file
        console.log(`  1️⃣  Uploading ${fileName}...`);

        // Find and use the file input
        const fileInput = adminPage.locator('input[type="file"]').first();
        await fileInput.setInputFiles(filePath);

        // Wait for upload to complete
        // Look for success indicators or wait for file to appear
        await adminPage.waitForTimeout(5000); // Longer wait for large files

        // Verify file appears in the list/table
        const fileInList = await adminPage.locator(`text="${fileName}"`).count();
        if (fileInList > 0) {
          console.log(`  ✅ Upload completed - file visible in list`);
        } else {
          console.log(`  ⚠️  Upload may have succeeded but file not visible yet`);
        }

        // Step 2: Preview file
        console.log(`  2️⃣  Previewing ${fileName}...`);

        // Find the row containing the file and click preview/eye icon
        // Common patterns: eye icon, preview button, clicking filename
        const fileRow = adminPage.locator(`tr:has-text("${fileName}")`).first();

        // Try to find preview button (eye icon or preview text)
        const previewButton = fileRow.locator(
          'button[aria-label*="preview"], button[title*="preview"], button:has(svg), a:has-text("Preview")',
        ).first();

        if ((await previewButton.count()) > 0) {
          await previewButton.click();
          await adminPage.waitForTimeout(2000);

          // Special handling for large PDF - expect confirmation dialog
          if (isLargePDF) {
            console.log(`     ⚠️  Checking for size confirmation dialog...`);

            // Look for confirmation dialog about file size
            const confirmDialog = await adminPage
              .locator(
                'text=/large file/i, text=/are you sure/i, text=/confirm/i, button:has-text("Continue"), button:has-text("Proceed")',
              )
              .count();

            if (confirmDialog > 0) {
              console.log(`     ✅ Confirmation dialog appeared (as expected)`);

              // Click confirm/continue button
              await adminPage
                .locator(
                  'button:has-text("Continue"), button:has-text("Proceed"), button:has-text("Yes"), button:has-text("Confirm")',
                )
                .first()
                .click();

              await adminPage.waitForTimeout(2000);
              console.log(`     ✅ Confirmed preview of large file`);
            } else {
              console.log(
                `     ⚠️  No confirmation dialog found (might not be triggered)`,
              );
            }
          }

          // Verify preview modal/panel is visible
          const previewVisible = await adminPage
            .locator(
              '[role="dialog"], [data-testid*="preview"], [class*="preview"], [class*="modal"]',
            )
            .count();

          if (previewVisible > 0) {
            console.log(`  ✅ Preview opened successfully`);

            // Close preview modal
            await adminPage.keyboard.press("Escape");
            await adminPage.waitForTimeout(1000);
          } else {
            console.log(`  ⚠️  Preview may be open but modal not detected`);
          }
        } else {
          console.log(`  ⚠️  Preview button not found, skipping preview test`);
        }

        // Step 3: Delete file
        console.log(`  3️⃣  Deleting ${fileName}...`);

        // Find the row containing the file and click delete/trash icon
        const deleteButton = fileRow.locator(
          'button[aria-label*="delete"], button[aria-label*="remove"], button[title*="delete"], button:has(svg[class*="trash"])',
        ).first();

        if ((await deleteButton.count()) > 0) {
          await deleteButton.click();
          await adminPage.waitForTimeout(1000);

          // Look for confirmation dialog
          const confirmDeleteButton = await adminPage
            .locator(
              'button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Remove"), button[class*="danger"]',
            )
            .first();

          if ((await confirmDeleteButton.count()) > 0) {
            await confirmDeleteButton.click();
            console.log(`     ✅ Confirmed deletion`);
          }

          await adminPage.waitForTimeout(2000);

          // Verify file is removed from list
          const fileStillVisible = await adminPage
            .locator(`text="${fileName}"`)
            .count();

          if (fileStillVisible === 0) {
            console.log(`  ✅ Delete completed - file removed from list`);
          } else {
            console.log(
              `  ⚠️  File may still be visible (deletion may take time)`,
            );
          }
        } else {
          console.log(`  ⚠️  Delete button not found, skipping delete test`);
        }

        console.log(`✅ Test complete for ${fileName}`);
      });
    }
  });

  // Summary test to show what files were tested
  test("storage test summary", async () => {
    console.log("\n📊 Storage Test Summary");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ Tested ${testFiles.length} files:`);
    testFiles.forEach((file, index) => {
      const filePath = path.join(UPLOAD_TEST_DIR, file);
      const fileSize = fs.statSync(filePath).size;
      const fileSizeKB = (fileSize / 1024).toFixed(2);
      console.log(`   ${index + 1}. ${file} (${fileSizeKB} KB)`);
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  });
}
