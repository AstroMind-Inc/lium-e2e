/**
 * Manual Login POC
 *
 * This test opens a browser and waits for YOU to manually log in.
 * Useful for:
 * - Testing OAuth flow manually
 * - Debugging Auth0 configuration
 * - Demonstrating login flow to team members
 *
 * Run with: npx playwright test synthetic/tests/auth/manual-login-poc.spec.ts --headed
 */

import { test, expect } from '@playwright/test';

test.describe('Manual Login POC', () => {
  test.setTimeout(300000); // 5 minutes for manual interaction

  test('manual OAuth login - wait for user to sign in', async ({ page }) => {
    console.log('\n🔐 Manual Login POC Started');
    console.log('================================');

    // Get environment URL (or default to dev)
    const baseUrl = process.env.WEB_BASE_URL || 'https://dev.lium.app';

    console.log(`\n1. Opening browser to: ${baseUrl}`);
    await page.goto(baseUrl);

    console.log('2. Please log in using your OAuth credentials in the browser...');
    console.log('3. Test will wait for you to reach the dashboard...\n');

    // Wait for user to complete login and reach dashboard
    // This will wait up to 5 minutes (test timeout)
    try {
      await page.waitForURL(/.*\/dashboard.*/, { timeout: 300000 });

      console.log('✅ Login successful! You reached the dashboard.');

      // Verify we're actually on the dashboard
      const url = page.url();
      expect(url).toMatch(/dashboard/);

      // Optional: Check for user-specific elements
      const pageTitle = await page.title();
      console.log(`📄 Page title: ${pageTitle}`);

      // Wait a bit so you can see the result
      console.log('\n⏸️  Pausing for 10 seconds so you can see the dashboard...\n');
      await page.waitForTimeout(10000);

    } catch (error) {
      console.log('\n❌ Login timed out or failed.');
      console.log('Current URL:', page.url());
      throw error;
    }
  });

  test('manual OAuth login with session check', async ({ page, context }) => {
    console.log('\n🔐 Manual Login POC with Session Check');
    console.log('=========================================');

    const baseUrl = process.env.WEB_BASE_URL || 'https://dev.lium.app';

    // Step 1: Login
    console.log(`\n1. Opening browser to: ${baseUrl}`);
    await page.goto(baseUrl);

    console.log('2. Please log in using your OAuth credentials...');
    await page.waitForURL(/.*\/dashboard.*/, { timeout: 300000 });

    console.log('✅ Login successful!\n');

    // Step 2: Check cookies/storage
    console.log('3. Checking authentication state...');
    const cookies = await context.cookies();
    console.log(`   Found ${cookies.length} cookies`);

    const localStorage = await page.evaluate(() => {
      return JSON.stringify(window.localStorage);
    });
    console.log('   Local storage:', localStorage.substring(0, 100) + '...');

    // Step 3: Test session persistence
    console.log('\n4. Testing session persistence (reload page)...');
    await page.reload();
    await page.waitForTimeout(2000);

    const stillOnDashboard = page.url().includes('dashboard');
    if (stillOnDashboard) {
      console.log('✅ Session persisted after reload!');
    } else {
      console.log('❌ Session lost after reload');
    }

    expect(stillOnDashboard).toBe(true);

    // Pause
    console.log('\n⏸️  Pausing for 10 seconds...\n');
    await page.waitForTimeout(10000);
  });

  test('manual OAuth login - capture tokens', async ({ page }) => {
    console.log('\n🔐 Manual Login POC - Token Capture');
    console.log('=====================================');

    const baseUrl = process.env.WEB_BASE_URL || 'https://dev.lium.app';

    // Listen for Auth0 token requests
    page.on('response', async (response) => {
      const url = response.url();

      // Capture Auth0 token endpoint responses
      if (url.includes('/oauth/token') || url.includes('/authorize')) {
        console.log('🔑 Auth0 endpoint hit:', url);

        if (response.status() === 200) {
          try {
            const body = await response.json();
            if (body.access_token) {
              console.log('✅ Access token received (truncated):',
                body.access_token.substring(0, 50) + '...');
            }
            if (body.id_token) {
              console.log('✅ ID token received (truncated):',
                body.id_token.substring(0, 50) + '...');
            }
          } catch (e) {
            // Response might not be JSON
          }
        }
      }
    });

    console.log(`\n1. Opening browser to: ${baseUrl}`);
    console.log('2. Token requests will be logged as they happen...');
    console.log('3. Please log in using your OAuth credentials...\n');

    await page.goto(baseUrl);

    // Wait for login
    await page.waitForURL(/.*\/dashboard.*/, { timeout: 300000 });

    console.log('\n✅ Login flow complete!');
    console.log('⏸️  Pausing for 10 seconds...\n');
    await page.waitForTimeout(10000);
  });
});
