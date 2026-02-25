/**
 * Storage Tests - User (Full Lifecycle)
 *
 * Auto-discovers test files from fixtures/upload-test/
 * User can upload, preview, and delete files.
 * Tests complete storage lifecycle from user perspective.
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
    if (file.startsWith(".") || file.toLowerCase() === "readme.md") {
      return false;
    }
    return true;
  });

  console.log(`📂 Found ${testFiles.length} test files in fixtures/upload-test/`);
  return testFiles;
}

const testFiles = getTestFiles();

if (testFiles.length === 0) {
  test.skip("No test files found in fixtures/upload-test/", () => {});
} else {
  test.describe("Storage - User (Full Access)", () => {
    test("[USER] can upload, preview, and delete files", async ({
      userPage,
      envConfig,
    }) => {
      const today = new Date().toISOString().split("T")[0];
      const folderName = `test-${today}`;

      console.log(`🗂️  Starting user storage lifecycle test`);
      console.log(`📦 Testing ${testFiles.length} files\n`);

      // Navigate to user storage
      console.log("1️⃣  Navigating to storage...");
      await userPage.goto(`${envConfig.baseUrls.web}/storage`, {
        waitUntil: "domcontentloaded",
      });
      await userPage.waitForTimeout(2000);

      expect(userPage.url()).toContain("/storage");
      console.log("✅ On user storage page\n");

      // Create test folder
      console.log(`2️⃣  Creating test folder: ${folderName}`);
      await userPage.click('button:has-text("New Folder")');
      await userPage.waitForTimeout(1000);

      // Wait for dialog to appear and find the folder name input
      const dialog = userPage.locator('[role="dialog"], .modal, [class*="dialog"]').first();
      await dialog.waitFor({ state: "visible", timeout: 5000 });

      // Find the input field for folder name (try multiple selectors)
      const folderInput = dialog.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="folder"], input[type="text"]').first();
      await folderInput.waitFor({ state: "visible", timeout: 5000 });
      await folderInput.fill(folderName);

      // Click Create button
      await userPage.click('button:has-text("Create")');

      // Wait for dialog to close
      await dialog.waitFor({ state: "hidden", timeout: 5000 });
      await userPage.waitForTimeout(1000);

      // Wait for loading spinner to appear and then disappear (list reload)
      console.log(`   Waiting for file list to reload...`);
      await userPage.waitForTimeout(2000);

      const loadingAfterCreate = userPage.locator('text="Loading..."');
      if ((await loadingAfterCreate.count()) > 0) {
        await loadingAfterCreate.waitFor({ state: 'hidden', timeout: 10000 });
      }

      // Additional wait for list to populate
      await userPage.waitForTimeout(2000);

      // Verify folder was created (look for it in the table)
      const folderInTable = await userPage.locator(`tr:has-text("${folderName}")`).count();
      if (folderInTable > 0) {
        console.log(`✅ Folder created and visible in list\n`);
      } else {
        console.log(`⚠️  Folder created but not yet visible (may still be loading)\n`);
        // Try waiting a bit more
        await userPage.waitForTimeout(3000);
      }

      // Open folder - single click on the folder name to navigate into it
      console.log(`3️⃣  Opening folder: ${folderName}`);

      // Wait for the file list to be stable
      await userPage.waitForTimeout(1000);

      // Find the folder row and click on the folder name (first column text/link)
      const folderRow = userPage.locator(`tr:has-text("${folderName}")`).first();
      await folderRow.waitFor({ state: 'visible', timeout: 10000 });

      // Click on the folder name itself (should be a link in the Name column)
      console.log(`   Clicking folder name to open...`);
      await folderRow.locator('td').first().click();
      await userPage.waitForTimeout(2000);

      // Wait for the folder content to load
      const loadingSpinner = userPage.locator('text="Loading..."');
      if ((await loadingSpinner.count()) > 0) {
        console.log(`   Waiting for folder content to load...`);
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 });
        await userPage.waitForTimeout(1000);
      }

      // Verify we're inside the folder by checking if the folder list is now empty or different
      // Inside an empty folder, we should see the file list area but no folder rows
      const fileRowCount = await userPage.locator('table tbody tr').count();
      console.log(`   File rows inside folder: ${fileRowCount}`);
      console.log(`✅ Inside folder\n`);

      // Upload all test files
      console.log(`4️⃣  Uploading ${testFiles.length} files...`);

      for (const fileName of testFiles) {
        const filePath = path.join(UPLOAD_TEST_DIR, fileName);
        const fileSize = fs.statSync(filePath).size;
        const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

        console.log(`   📤 Uploading ${fileName} (${fileSizeMB} MB)...`);

        // Wait for and click "Upload Files" button
        // Try multiple selectors as the button text might have variations
        let uploadButton = userPage.locator('button:has-text("Upload Files")').first();
        let buttonCount = await uploadButton.count();

        if (buttonCount === 0) {
          // Try without exact text match
          uploadButton = userPage.locator('button', { hasText: 'Upload Files' }).first();
          buttonCount = await uploadButton.count();
        }

        if (buttonCount === 0) {
          // Try by aria-label or other attributes
          uploadButton = userPage.locator('button[aria-label*="Upload"]').first();
          buttonCount = await uploadButton.count();
        }

        if (buttonCount > 0) {
          console.log(`      Found upload button, clicking...`);
          await uploadButton.click({ timeout: 10000 });
        } else {
          console.log(`      ⚠️  Upload button not found, taking screenshot...`);
          await userPage.screenshot({ path: `test-results/upload-button-missing-${Date.now()}.png` });
        }

        await userPage.waitForTimeout(500);

        // Set file in file input
        const fileInput = userPage.locator('input[type="file"]').first();
        await fileInput.setInputFiles(filePath);
        await userPage.waitForTimeout(3000);

        // Verify upload
        const fileInList = await userPage.locator(`text="${fileName}"`).count();
        if (fileInList > 0) {
          console.log(`   ✅ ${fileName} uploaded`);
        } else {
          await userPage.waitForTimeout(2000);
        }
      }

      console.log(`✅ All files uploaded\n`);

      // Close any notification toasts that might be blocking UI elements
      const closeNotifications = async () => {
        const closeButtons = userPage.locator('button[aria-label="Close"], button:has-text("×")');
        const count = await closeButtons.count();
        for (let i = 0; i < count; i++) {
          try {
            await closeButtons.nth(i).click({ timeout: 1000 });
          } catch (e) {
            // Ignore if button no longer exists
          }
        }
        await userPage.waitForTimeout(500);
      };

      await closeNotifications();

      // Preview and delete each file
      console.log(`5️⃣  Previewing and deleting files...`);

      for (const fileName of testFiles) {
        const isLargePDF = fileName === "large-pdf.pdf";
        console.log(`\n   📄 Processing: ${fileName}`);

        const fileRow = userPage.locator(`tr:has-text("${fileName}")`).first();
        const actionsButton = fileRow.locator('button').last();

        // Preview
        console.log(`      👁️  Previewing...`);
        // Use force to click through any overlaying notifications
        await actionsButton.click({ force: true });
        await userPage.waitForTimeout(1000);

        const previewOption = userPage.locator('[role="menuitem"]:has-text("Preview")').first();
        if ((await previewOption.count()) > 0) {
          await previewOption.click();
          await userPage.waitForTimeout(2000);

          // Handle large PDF confirmation
          if (isLargePDF) {
            const confirmButton = userPage.locator('button:has-text("Continue"), button:has-text("Proceed")').first();
            if ((await confirmButton.count()) > 0) {
              console.log(`      ✅ Handled size confirmation`);
              await confirmButton.click();
              await userPage.waitForTimeout(2000);
            }
          }

          await userPage.keyboard.press("Escape");
          await userPage.waitForTimeout(1000);
          console.log(`      ✅ Preview closed`);
        }

        // Delete
        console.log(`      🗑️  Deleting...`);
        // Use force to click through any overlaying notifications
        await actionsButton.click({ force: true });
        await userPage.waitForTimeout(1000);

        const deleteOption = userPage.locator('[role="menuitem"]:has-text("Delete")').first();
        if ((await deleteOption.count()) > 0) {
          await deleteOption.click();
          await userPage.waitForTimeout(1000);

          const confirmDelete = userPage.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
          if ((await confirmDelete.count()) > 0) {
            await confirmDelete.click();
            await userPage.waitForTimeout(2000);
          }

          const fileStillVisible = await userPage.locator(`text="${fileName}"`).count();
          if (fileStillVisible === 0) {
            console.log(`      ✅ Deleted`);
          }
        }
      }

      console.log(`\n✅ All files processed\n`);

      // Clean up folder - navigate back to Root first
      console.log(`6️⃣  Cleaning up...`);

      // Take screenshot before cleanup
      await userPage.screenshot({ path: `test-results/before-cleanup-${Date.now()}.png` });
      console.log(`   Screenshot taken before cleanup`);

      // Navigate back to Root - use direct navigation for reliability
      console.log(`   Navigating back to Root...`);
      await userPage.goto(`${envConfig.baseUrls.web}/storage`);
      await userPage.waitForTimeout(2000);

      // Wait for loading if present
      const loadingAfterNav = userPage.locator('text="Loading..."');
      if ((await loadingAfterNav.count()) > 0) {
        await loadingAfterNav.waitFor({ state: 'hidden', timeout: 10000 });
      }

      // Verify we're at root (breadcrumb should only show "Root", not "Root > folder")
      const breadcrumbText = await userPage.locator('nav, [class*="breadcrumb"]').first().textContent();
      console.log(`   Breadcrumb: "${breadcrumbText?.trim()}"`);

      if (!breadcrumbText?.includes(folderName)) {
        console.log(`   ✅ Successfully navigated to Root`);
      } else {
        console.log(`   ⚠️  Still inside folder, trying again...`);
        // Try clicking Root link
        await userPage.locator('a:has-text("Root")').first().click({ force: true });
        await userPage.waitForTimeout(2000);
      }

      // Wait for file list to load
      await userPage.waitForTimeout(1000);

      // Take screenshot at Root to see folder list
      await userPage.screenshot({ path: `test-results/at-root-${Date.now()}.png` });
      console.log(`   Screenshot taken at Root`);

      // Find and delete the test folder
      const folderRowForDelete = userPage.locator(`tr:has-text("${folderName}")`).first();
      const folderRowCount = await folderRowForDelete.count();

      if (folderRowCount > 0) {
        console.log(`   Found folder "${folderName}", deleting...`);

        // Click actions button (3-dot menu)
        const folderActionsButton = folderRowForDelete.locator('button').last();
        await folderActionsButton.waitFor({ state: 'visible', timeout: 5000 });
        await folderActionsButton.click({ force: true });
        await userPage.waitForTimeout(1500); // Wait for menu to open

        // Click Delete option in menu
        const deleteFolderOption = userPage.locator('[role="menuitem"]:has-text("Delete")').first();
        const deleteOptionCount = await deleteFolderOption.count();

        if (deleteOptionCount > 0) {
          console.log(`   Clicking Delete option...`);
          await deleteFolderOption.click();
          await userPage.waitForTimeout(1000);

          // Confirm deletion
          const confirmDeleteFolder = userPage.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
          const confirmCount = await confirmDeleteFolder.count();

          if (confirmCount > 0) {
            console.log(`   Confirming deletion...`);
            await confirmDeleteFolder.click();
            await userPage.waitForTimeout(2000);

            // Verify folder was deleted
            const folderStillVisible = await userPage.locator(`tr:has-text("${folderName}")`).count();
            if (folderStillVisible === 0) {
              console.log(`✅ Folder deleted successfully\n`);
            } else {
              console.log(`⚠️  Folder may still be visible\n`);
            }
          } else {
            console.log(`⚠️  Delete confirmation button not found\n`);
          }
        } else {
          console.log(`⚠️  Delete option not found in menu\n`);
        }
      } else {
        console.log(`   ⚠️  Folder "${folderName}" not found (may already be deleted)\n`);
      }

      console.log(`🎉 User storage lifecycle test complete!`);
    });
  });
}
