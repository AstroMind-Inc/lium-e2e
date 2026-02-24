/**
 * Find Upload Method Test
 * Discover how to upload files on the storage page
 */

import { test } from "../../fixtures/index.js";

test("find upload method on storage page", async ({
  adminPage,
  envConfig,
}) => {
  console.log("🔍 Finding upload method...\n");

  // Navigate and select tenant
  await adminPage.goto(`${envConfig.baseUrls.web}/admin/storage`, {
    waitUntil: "domcontentloaded",
  });
  await adminPage.waitForTimeout(2000);

  // Select tenant if needed
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

  console.log("📍 Current URL:", adminPage.url());

  // Look for ALL file inputs (including hidden)
  console.log("\n📤 ALL File Inputs (including hidden):");
  const allFileInputs = await adminPage.locator('input[type="file"]').all();
  console.log(`Found ${allFileInputs.length} file input(s)`);
  for (let i = 0; i < allFileInputs.length; i++) {
    const id = await allFileInputs[i].getAttribute("id");
    const name = await allFileInputs[i].getAttribute("name");
    const isVisible = await allFileInputs[i].isVisible();
    const isHidden = await allFileInputs[i].isHidden();
    console.log(
      `  ${i + 1}. id="${id}" name="${name}" visible=${isVisible} hidden=${isHidden}`,
    );
  }

  // Look for buttons with "upload" text
  console.log("\n🔘 Upload Buttons:");
  const uploadButtons = await adminPage
    .locator('button:has-text("Upload"), button:has-text("upload")')
    .all();
  console.log(`Found ${uploadButtons.length} upload button(s)`);
  for (let i = 0; i < uploadButtons.length; i++) {
    const text = await uploadButtons[i].textContent();
    const ariaLabel = await uploadButtons[i].getAttribute("aria-label");
    console.log(`  ${i + 1}. "${text}" [aria-label="${ariaLabel}"]`);
  }

  // Look for "New Folder" and nearby buttons
  console.log("\n📁 Action Buttons:");
  const actionButtons = await adminPage
    .locator('button:has-text("New"), button:has-text("Add"), button:has-text("Create")')
    .all();
  for (let i = 0; i < actionButtons.length; i++) {
    const text = await actionButtons[i].textContent();
    console.log(`  ${i + 1}. "${text}"`);
  }

  // Look for clickable elements near "New Folder"
  console.log("\n🔍 Elements near 'New Folder':");
  const newFolderArea = adminPage.locator('button:has-text("New Folder")');
  if ((await newFolderArea.count()) > 0) {
    // Check siblings or parent
    const parent = newFolderArea.locator("..");
    const siblings = await parent.locator("button, a, [role='button']").all();
    console.log(`Found ${siblings.length} clickable elements in parent`);
    for (let i = 0; i < Math.min(siblings.length, 10); i++) {
      const text = (await siblings[i].textContent()) || "";
      const ariaLabel = await siblings[i].getAttribute("aria-label");
      if (text.trim() || ariaLabel) {
        console.log(`  ${i + 1}. "${text.trim()}" [aria-label="${ariaLabel}"]`);
      }
    }
  }

  // Try clicking "New Folder" button to see if it reveals upload options
  console.log("\n🧪 Testing 'New Folder' button...");
  const newFolderBtn = adminPage.locator('button:has-text("New Folder")');
  if ((await newFolderBtn.count()) > 0) {
    await newFolderBtn.click();
    await adminPage.waitForTimeout(1500);

    // Check for dropdown/menu
    const menu = await adminPage.locator('[role="menu"], [role="dialog"]').count();
    console.log(`Menu appeared: ${menu > 0}`);

    if (menu > 0) {
      console.log("\n📋 Menu items:");
      const menuItems = await adminPage
        .locator('[role="menuitem"], [role="option"]')
        .all();
      for (let i = 0; i < menuItems.length; i++) {
        const text = await menuItems[i].textContent();
        console.log(`  ${i + 1}. "${text}"`);
      }
    }

    // Take screenshot of menu
    await adminPage.screenshot({
      path: "synthetic/tests/storage/menu-opened.png",
    });
    console.log("📸 Screenshot saved: menu-opened.png");
  }

  // Check for drag-drop zones
  console.log("\n🎯 Drag-Drop Zones:");
  const dropZones = await adminPage
    .locator(
      '[data-testid*="drop"], [class*="dropzone"], [class*="drop-zone"], [ondrop]',
    )
    .all();
  console.log(`Found ${dropZones.length} potential drop zone(s)`);

  console.log("\n✅ Discovery complete!");
});
