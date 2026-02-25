/**
 * Restore test-user@astromind.com to seismic tenant
 *
 * Run this if tests fail with "You're not a member of any organization yet"
 *
 * Usage: npx tsx scripts/restore-test-user.ts
 */

import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_USER_EMAIL = 'test-user@astromind.com';

async function restoreTestUser() {
  console.log('🔧 Restoring test user to seismic tenant...\n');

  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    storageState: path.resolve(__dirname, '../playwright/.auth/admin.json'),
  });

  const page = await context.newPage();

  try {
    // Navigate to admin
    console.log('1️⃣  Navigating to admin...');
    await page.goto('http://lium-web:3000');
    await page.waitForLoadState('networkidle');

    // Switch to Admin workspace
    console.log('2️⃣  Switching to Admin workspace...');
    await page.locator('[aria-label="Account menu"]').click();
    await page.waitForTimeout(500);
    await page.locator('a:has-text("Admin")').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open Seismic tenant management
    console.log('3️⃣  Opening Seismic tenant management...');
    const seismicRow = page.locator('tr:has-text("Seismic")');
    await seismicRow.locator('button[aria-label*="more" i]').click();
    await page.waitForTimeout(500);
    await page.locator('text=/^Manage$/i').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if user already exists
    console.log('4️⃣  Checking if test user exists...');
    const userExists = await page.locator(`text=${TEST_USER_EMAIL}`).count() > 0;

    if (userExists) {
      console.log(`✅ Test user already exists in tenant\n`);
    } else {
      // Add user
      console.log('5️⃣  Adding test user to tenant...');
      await page.locator('input[placeholder="Email"]').fill(TEST_USER_EMAIL);
      await page.locator('button:has-text("Invite user to tenant")').click();
      await page.waitForTimeout(2000);

      // Verify added
      const nowExists = await page.locator(`text=${TEST_USER_EMAIL}`).isVisible({ timeout: 5000 });
      if (nowExists) {
        console.log(`✅ Test user added successfully!\n`);
      } else {
        console.log(`❌ Failed to add test user\n`);
      }
    }

    // Close modal
    await page.locator('button:has-text("Close")').first().click();
    await page.waitForTimeout(500);

    console.log('🎉 Done! Test user should now have access.\n');
    console.log('You can now run tests again: make test-syn-storage');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

restoreTestUser();
