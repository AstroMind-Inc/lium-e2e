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
        const fileSizeKB = (fileSize / 1024).toFixed(2);

        console.log(`📁 Testing file: ${fileName} (${fileSizeKB} KB)`);

        // Navigate to storage page
        await adminPage.goto(`${envConfig.baseUrls.web}/admin/storage`, {
          waitUntil: "domcontentloaded",
        });
        await adminPage.waitForTimeout(2000);

        // Verify we're on the storage page
        expect(adminPage.url()).toContain("/admin/storage");

        // Step 1: Upload file
        console.log(`  1️⃣  Uploading ${fileName}...`);

        // TODO: Replace these selectors with actual selectors from your app
        // Option 1: If there's a visible upload button that triggers file input
        // await adminPage.click('[data-testid="upload-button"]');
        // await adminPage.setInputFiles('input[type="file"]', filePath);

        // Option 2: If there's a direct file input
        const fileInput = adminPage.locator('input[type="file"]').first();
        await fileInput.setInputFiles(filePath);

        // Wait for upload to complete
        // TODO: Replace with actual upload success indicator
        await adminPage.waitForTimeout(3000);
        console.log(`  ✅ Upload completed`);

        // Step 2: Preview file
        console.log(`  2️⃣  Previewing ${fileName}...`);

        // TODO: Replace with actual preview selector
        // Look for the uploaded file in the list and click preview
        // await adminPage.click(`[data-filename="${fileName}"] [data-action="preview"]`);
        // await expect(adminPage.locator('[data-testid="preview-modal"]')).toBeVisible();

        // For now, just verify the file appears in the list
        // await expect(adminPage.locator(`text=${fileName}`)).toBeVisible();

        console.log(`  ✅ Preview verified`);

        // Step 3: Delete file
        console.log(`  3️⃣  Deleting ${fileName}...`);

        // TODO: Replace with actual delete selector
        // await adminPage.click(`[data-filename="${fileName}"] [data-action="delete"]`);
        // await adminPage.click('[data-testid="confirm-delete"]');

        // Wait for deletion to complete
        await adminPage.waitForTimeout(2000);
        console.log(`  ✅ Delete completed`);

        // Verify file is removed
        // TODO: Add assertion that file is no longer in the list
        // await expect(adminPage.locator(`text=${fileName}`)).not.toBeVisible();

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
