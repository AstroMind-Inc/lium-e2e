/**
 * Storage UI Discovery Test
 * Run this once to discover the correct selectors for your storage page
 */

import { test } from "../../fixtures/index.js";

test.describe("Storage UI Discovery", () => {
  test("discover storage page elements", async ({ adminPage, envConfig }) => {
    console.log("🔍 Discovering storage page UI elements...\n");

    await adminPage.goto(`${envConfig.baseUrls.web}/admin/storage`, {
      waitUntil: "domcontentloaded",
    });
    await adminPage.waitForTimeout(2000);

    // Discover file input
    console.log("📤 File inputs:");
    const fileInputs = await adminPage.locator('input[type="file"]').all();
    for (let i = 0; i < fileInputs.length; i++) {
      const id = await fileInputs[i].getAttribute("id");
      const name = await fileInputs[i].getAttribute("name");
      console.log(`  ${i + 1}. id="${id}" name="${name}"`);
    }

    // Discover buttons
    console.log("\n🔘 Buttons:");
    const buttons = await adminPage.locator("button").all();
    for (let i = 0; i < Math.min(buttons.length, 20); i++) {
      const text = (await buttons[i].textContent()) || "";
      const ariaLabel = await buttons[i].getAttribute("aria-label");
      const dataTestId = await buttons[i].getAttribute("data-testid");
      if (text.trim() || ariaLabel || dataTestId) {
        console.log(
          `  ${i + 1}. "${text.trim()}" [aria-label="${ariaLabel}"] [data-testid="${dataTestId}"]`,
        );
      }
    }

    // Discover table/list elements
    console.log("\n📋 Tables:");
    const tables = await adminPage.locator("table").count();
    console.log(`  Found ${tables} table(s)`);

    // Discover any elements with "upload" in them
    console.log("\n📤 Upload-related elements:");
    const uploadElements = await adminPage
      .locator('[class*="upload"], [aria-label*="upload"], [title*="upload"]')
      .all();
    for (let i = 0; i < Math.min(uploadElements.length, 10); i++) {
      const tagName = await uploadElements[i].evaluate((el) => el.tagName);
      const className = await uploadElements[i].getAttribute("class");
      console.log(`  ${i + 1}. <${tagName}> class="${className}"`);
    }

    // Discover any elements with "delete" or "remove" in them
    console.log("\n🗑️  Delete-related elements:");
    const deleteElements = await adminPage
      .locator(
        '[class*="delete"], [class*="remove"], [aria-label*="delete"], [aria-label*="remove"]',
      )
      .all();
    for (let i = 0; i < Math.min(deleteElements.length, 10); i++) {
      const tagName = await deleteElements[i].evaluate((el) => el.tagName);
      const ariaLabel = await deleteElements[i].getAttribute("aria-label");
      console.log(`  ${i + 1}. <${tagName}> aria-label="${ariaLabel}"`);
    }

    // Take screenshot
    await adminPage.screenshot({
      path: "synthetic/tests/storage/storage-page-discovery.png",
      fullPage: true,
    });
    console.log(
      "\n📸 Screenshot saved to: synthetic/tests/storage/storage-page-discovery.png",
    );

    console.log("\n✅ Discovery complete!");
  });
});
