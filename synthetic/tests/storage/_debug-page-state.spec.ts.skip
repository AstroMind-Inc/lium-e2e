import { test } from "../../fixtures/index.js";

test("debug page state after tenant selection", async ({ adminPage, envConfig }) => {
  console.log("🔍 Debugging page state...\n");

  await adminPage.goto(`${envConfig.baseUrls.web}/admin/storage`, {
    waitUntil: "domcontentloaded",
  });
  await adminPage.waitForTimeout(2000);

  console.log("📍 Initial URL:", adminPage.url());

  // Select tenant
  const selectTenant = await adminPage.locator("text=/select a tenant/i").count();
  console.log(`Need to select tenant: ${selectTenant > 0}`);
  
  if (selectTenant > 0) {
    await adminPage.click('button:has-text("Filter by tenant")');
    await adminPage.waitForTimeout(1000);
    const firstTenant = adminPage.locator('[role="menuitem"]').first();
    await firstTenant.click();
    await adminPage.waitForTimeout(3000); // Wait longer
  }

  console.log("📍 After tenant selection:", adminPage.url());

  // List ALL buttons
  console.log("\n🔘 All buttons on page:");
  const buttons = await adminPage.locator("button").all();
  for (let i = 0; i < Math.min(buttons.length, 30); i++) {
    const text = await buttons[i].textContent();
    const ariaLabel = await buttons[i].getAttribute("aria-label");
    const isVisible = await buttons[i].isVisible();
    if (text?.trim() || ariaLabel) {
      console.log(`  ${i + 1}. "${text?.trim()}" [aria-label="${ariaLabel}"] visible=${isVisible}`);
    }
  }

  // Check for "New Folder" specifically
  console.log("\n🔍 Searching for 'New Folder':");
  const newFolder1 = await adminPage.locator('button:has-text("New Folder")').count();
  const newFolder2 = await adminPage.locator('button').filter({ hasText: "New Folder" }).count();
  const newFolder3 = await adminPage.locator('text="New Folder"').count();
  console.log(`  button:has-text("New Folder"): ${newFolder1}`);
  console.log(`  button filter hasText: ${newFolder2}`);
  console.log(`  text="New Folder": ${newFolder3}`);

  // Take screenshot
  await adminPage.screenshot({
    path: "synthetic/tests/storage/debug-page-state.png",
    fullPage: true,
  });
  console.log("\n📸 Screenshot: synthetic/tests/storage/debug-page-state.png");
});
