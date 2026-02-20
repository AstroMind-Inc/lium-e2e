/**
 * Admin Access Control Tests
 * Verify role-based access to admin routes
 */

import { test, expect } from '../../fixtures/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('Admin Access Control', () => {
  test.describe('Admin User', () => {
    test.use({
      storageState: path.resolve(__dirname, '../../../playwright/.auth/admin.json'),
    });

    test('can access /admin page', async ({ page, envConfig }) => {
      // Navigate to admin page
      await page.goto(`${envConfig.baseUrls.web}/admin`);

      // Wait for navigation to complete
      await page.waitForLoadState('networkidle');

      // Should be on admin page (not redirected)
      expect(page.url()).toContain('/admin');

      // Should not see login or unauthorized page
      expect(page.url()).not.toContain('auth0.com');
      expect(page.url()).not.toContain('/login');
      expect(page.url()).not.toContain('/unauthorized');

      // Optionally: verify admin-specific content is visible
      // Uncomment and adjust selector based on your app:
      // await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    });
  });

  test.describe('Regular User', () => {
    test.use({
      storageState: path.resolve(__dirname, '../../../playwright/.auth/user.json'),
    });

    test('cannot access /admin page', async ({ page, envConfig }) => {
      // Attempt to navigate to admin page
      await page.goto(`${envConfig.baseUrls.web}/admin`);

      // Wait for navigation/redirect to complete
      await page.waitForLoadState('networkidle');

      // Should be redirected away from /admin
      // Common patterns: redirected to home, unauthorized page, or 403 error
      const url = page.url();

      // Verify NOT on admin page
      const isOnAdminPage = url.endsWith('/admin') || url.includes('/admin/');
      expect(isOnAdminPage).toBe(false);

      // Should be redirected to one of these common patterns:
      const isRedirectedProperly =
        url.includes('/unauthorized') ||
        url.includes('/403') ||
        url.includes('/forbidden') ||
        url === envConfig.baseUrls.web ||
        url === `${envConfig.baseUrls.web}/` ||
        url.endsWith('/dashboard');

      // If not redirected, check for error message on page
      if (!isRedirectedProperly) {
        const bodyText = await page.textContent('body');
        const hasErrorMessage =
          bodyText?.toLowerCase().includes('unauthorized') ||
          bodyText?.toLowerCase().includes('forbidden') ||
          bodyText?.toLowerCase().includes('access denied') ||
          bodyText?.toLowerCase().includes('permission');

        expect(hasErrorMessage).toBe(true);
      }
    });
  });
});
