/**
 * Manual test to understand upload flow
 * Run with --headed to see what happens
 */

import { test } from "../../fixtures/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("manual upload exploration", async ({ adminPage, envConfig }) => {
  console.log("🔍 Exploring upload mechanism...\n");

  await adminPage.goto(`${envConfig.baseUrls.web}/admin/storage`, {
    waitUntil: "domcontentloaded",
  });
  await adminPage.waitForTimeout(2000);

  // Select tenant
  const selectTenant = await adminPage.locator("text=/select a tenant/i").count();
  if (selectTenant > 0) {
    await adminPage.click('button:has-text("Filter by tenant")');
    await adminPage.waitForTimeout(1000);
    const firstTenant = await adminPage.locator('[role="menuitem"]').first();
    if ((await firstTenant.count()) > 0) {
      await firstTenant.click();
      await adminPage.waitForTimeout(2000);
    }
  }

  console.log("📍 On storage page");

  // Try drag-and-drop approach
  console.log("\n🧪 Testing drag-and-drop...");
  
  // Get the file list area
  const fileList = adminPage.locator('table, [role="grid"], .file-list').first();
  
  if ((await fileList.count()) > 0) {
    console.log("✓ Found file list area");
    
    // Create a test file path
    const testFile = path.join(__dirname, "fixtures/upload-test/sample-image.jpeg");
    
    // Try to drop a file on the file list
    try {
      // Simulate drag-and-drop
      const dataTransfer = await adminPage.evaluateHandle((filePath) => {
        const dt = new DataTransfer();
        return dt;
      }, testFile);
      
      await fileList.dispatchEvent('drop', { dataTransfer });
      console.log("✓ Simulated drop event");
      
      await adminPage.waitForTimeout(3000);
      
      // Check if anything changed
      const newFileAppeared = await adminPage.locator('text="sample-image.jpeg"').count();
      console.log(`File appeared: ${newFileAppeared > 0}`);
    } catch (error) {
      console.log("✗ Drag-drop simulation failed:", error);
    }
  }

  // Pause for manual inspection (if running headed)
  console.log("\n⏸️  Pausing for 30 seconds for manual inspection...");
  console.log("   Try to upload a file manually and observe what happens");
  await adminPage.waitForTimeout(30000);
  
  console.log("\n✅ Exploration complete");
});
