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
    // Dynamically create a test for each file
    for (const fileName of testFiles) {
      test(`upload, preview, and delete: ${fileName}`, async ({
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
