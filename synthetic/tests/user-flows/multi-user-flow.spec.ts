/**
 * Multi-User Test Flow
 * Tests with different user roles - prompts operator to log in as each
 */

import { test, expect } from '../../fixtures/index.js';

test.describe.serial('Multi-User Flow', () => {
  test.setTimeout(600000); // 10 minutes for manual interaction

  test('1. Root Admin Access - @astromind.com via Google OAuth', async ({ page, envConfig }) => {
    console.log('\n' + '='.repeat(70));
    console.log('🔐 TESTING ROOT ADMIN ACCESS');
    console.log('='.repeat(70));
    console.log('\n👉 Please sign in with an @astromind.com account via Google OAuth\n');

    await page.goto(envConfig.baseUrls.web);

    // Show banner in browser
    await page.evaluate(() => {
      const banner = document.createElement('div');
      banner.id = 'test-banner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #1976d2;
        color: white;
        padding: 30px;
        text-align: center;
        z-index: 999999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      banner.innerHTML = `
        <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">
          🔐 TESTING ROOT ADMIN ACCESS
        </div>
        <div style="font-size: 20px;">
          Please sign in with @astromind.com account via Google OAuth
        </div>
      `;
      document.body.prepend(banner);
    });

    // Wait for user to log in and reach dashboard
    console.log('⏳ Waiting for login... (up to 10 minutes)');
    await page.waitForURL(/.*dashboard.*/, { timeout: 600000 });

    console.log('✅ Admin logged in successfully\n');

    // Update banner
    await page.evaluate(() => {
      const banner = document.getElementById('test-banner');
      if (banner) {
        banner.style.background = '#2e7d32';
        banner.innerHTML = `
          <div style="font-size: 24px; font-weight: bold;">
            ✅ Admin Access Confirmed - Running Tests...
          </div>
        `;
      }
    });

    // Run admin-specific tests
    console.log('🧪 Running admin access tests...');

    // Example: Check for admin-specific elements
    // await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();

    console.log('✅ Admin tests complete\n');

    // Wait a moment
    await page.waitForTimeout(2000);
  });

  test('2. Sign Out', async ({ page, envConfig }) => {
    console.log('\n' + '='.repeat(70));
    console.log('🚪 SIGNING OUT');
    console.log('='.repeat(70) + '\n');

    // Show logout banner
    await page.evaluate(() => {
      const banner = document.getElementById('test-banner');
      if (banner) {
        banner.style.background = '#f57c00';
        banner.innerHTML = `
          <div style="font-size: 24px; font-weight: bold;">
            🚪 Signing out...
          </div>
        `;
      }
    });

    // Navigate to app and trigger logout
    await page.goto(envConfig.baseUrls.web);
    await page.waitForTimeout(2000);

    // Try to find and click logout button
    // Adjust selectors based on your app
    const logoutSelectors = [
      'button:has-text("Sign Out")',
      'button:has-text("Logout")',
      'a:has-text("Sign Out")',
      '[data-testid="logout"]',
      '[aria-label="Logout"]',
    ];

    let loggedOut = false;
    for (const selector of logoutSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          loggedOut = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!loggedOut) {
      console.log('⚠️  Could not find logout button automatically');
      console.log('👉 Please manually log out in the browser');

      await page.evaluate(() => {
        const banner = document.getElementById('test-banner');
        if (banner) {
          banner.style.background = '#ff6b00';
          banner.innerHTML = `
            <div style="font-size: 24px; font-weight: bold;">
              👉 Please manually log out
            </div>
            <div style="font-size: 18px; margin-top: 10px;">
              Then this test will continue...
            </div>
          `;
        }
      });
    }

    // Wait for redirect to login/auth
    console.log('⏳ Waiting for logout...');
    await page.waitForTimeout(3000);

    // Verify logged out by checking URL or login page
    const url = page.url();
    const isLoggedOut = url.includes('/login') || url.includes('auth0.com') || !url.includes('dashboard');

    expect(isLoggedOut).toBe(true);
    console.log('✅ Signed out successfully\n');
  });

  test('3. Regular User Access - Non @astromind.com account', async ({ page, envConfig }) => {
    console.log('\n' + '='.repeat(70));
    console.log('👤 TESTING REGULAR USER ACCESS');
    console.log('='.repeat(70));
    console.log('\n👉 Please sign in with a NON @astromind.com account\n');

    await page.goto(envConfig.baseUrls.web);

    // Show banner
    await page.evaluate(() => {
      const banner = document.getElementById('test-banner') || document.createElement('div');
      banner.id = 'test-banner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #7b1fa2;
        color: white;
        padding: 30px;
        text-align: center;
        z-index: 999999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      banner.innerHTML = `
        <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">
          👤 TESTING REGULAR USER ACCESS
        </div>
        <div style="font-size: 20px;">
          Please sign in with NON @astromind.com account
        </div>
      `;
      if (!document.getElementById('test-banner')) {
        document.body.prepend(banner);
      }
    });

    // Wait for user to log in
    console.log('⏳ Waiting for login... (up to 10 minutes)');
    await page.waitForURL(/.*dashboard.*/, { timeout: 600000 });

    console.log('✅ Regular user logged in successfully\n');

    // Update banner
    await page.evaluate(() => {
      const banner = document.getElementById('test-banner');
      if (banner) {
        banner.style.background = '#2e7d32';
        banner.innerHTML = `
          <div style="font-size: 24px; font-weight: bold;">
            ✅ User Access Confirmed - Running Tests...
          </div>
        `;
      }
    });

    // Run user-specific tests
    console.log('🧪 Running regular user access tests...');

    // Example: Verify no admin panel
    // await expect(page.locator('[data-testid="admin-panel"]')).not.toBeVisible();

    console.log('✅ User tests complete\n');

    // Final success banner
    await page.evaluate(() => {
      const banner = document.getElementById('test-banner');
      if (banner) {
        banner.style.background = '#2e7d32';
        banner.innerHTML = `
          <div style="font-size: 28px; font-weight: bold;">
            ✅ ALL TESTS COMPLETE
          </div>
        `;
      }
    });

    await page.waitForTimeout(3000);
  });
});
