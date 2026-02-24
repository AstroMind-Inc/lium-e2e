import { test } from "../../fixtures/index.js";

test("find upload button inside folder", async ({ adminPage, envConfig }) => {
  console.log("🔍 Finding upload button inside folder...\n");

  await adminPage.goto(`${envConfig.baseUrls.web}/admin/storage`, {
    waitUntil: "domcontentloaded",
  });
  await adminPage.waitForTimeout(2000);

  // Select tenant if needed
  const selectTenant = await adminPage.locator("text=/select a tenant/i").count();
  if (selectTenant > 0) {
    const filterButton = adminPage.locator('button:has-text("Filter by tenant")').first();
    await filterButton.click();
    await adminPage.waitForTimeout(1500);
    const tenantItems = await adminPage.locator('[role="menuitem"]').all();
    if (tenantItems.length > 0) {
      await tenantItems[0].click();
      await adminPage.waitForTimeout(3000);
    }
  }

  // Create and open a test folder
  const folderName = "test-upload-button-discovery";
  console.log(`📁 Creating test folder: ${folderName}`);
  
  await adminPage.click('button:has-text("New Folder")');
  await adminPage.waitForTimeout(1000);
  const folderInput = adminPage.locator('input').first();
  await folderInput.fill(folderName);
  await adminPage.click('button:has-text("Create")');
  await adminPage.waitForTimeout(2000);

  // Click into the folder
  await adminPage.click(`text="${folderName}"`);
  await adminPage.waitForTimeout(2000);

  console.log("\n🔘 All buttons inside folder:");
  const buttons = await adminPage.locator("button").all();
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const ariaLabel = await buttons[i].getAttribute("aria-label");
    const isVisible = await buttons[i].isVisible();
    if ((text?.trim() || ariaLabel) && isVisible) {
      console.log(`  ${i + 1}. "${text?.trim()}" [aria-label="${ariaLabel}"]`);
    }
  }

  // Check for upload-related elements
  console.log("\n📤 Upload-related:");
  const uploadText = await adminPage.locator('text=/upload/i').all();
  console.log(`  Found ${uploadText.length} elements with "upload" text`);
  for (let i = 0; i < Math.min(uploadText.length, 5); i++) {
    const text = await uploadText[i].textContent();
    const tagName = await uploadText[i].evaluate(el => el.tagName);
    console.log(`  ${i + 1}. <${tagName}> "${text?.trim()}"`);
  }

  // Check for file inputs
  console.log("\n📄 File inputs:");
  const fileInputs = await adminPage.locator('input[type="file"]').all();
  console.log(`  Found ${fileInputs.length} file input(s)`);

  // Take screenshot
  await adminPage.screenshot({
    path: "synthetic/tests/storage/inside-folder.png",
    fullPage: true,
  });
  console.log("\n📸 Screenshot: inside-folder.png");

  // Cleanup
  console.log("\n🧹 Cleaning up...");
  await adminPage.click('a:has-text("Root"), button:has-text("Root")');
  await adminPage.waitForTimeout(2000);
  const folderRow = adminPage.locator(`tr:has-text("${folderName}")`);
  const deleteBtn = folderRow.locator('button').last();
  await deleteBtn.click();
  await adminPage.waitForTimeout(1000);
  await adminPage.locator('button:has-text("Delete")').first().click();
  await adminPage.waitForTimeout(2000);
  console.log("✅ Cleanup complete");
});
