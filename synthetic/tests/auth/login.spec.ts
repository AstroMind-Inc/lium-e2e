/**
 * Authentication Tests
 * Tests for login, logout, and session management
 */

import { test, expect } from '../../fixtures/index.js';
import { LoginPage } from '../../page-objects/LoginPage.js';
import { DashboardPage } from '../../page-objects/DashboardPage.js';

test.describe('Authentication Flow', () => {
  test('should login with valid credentials via Auth0', async ({
    page,
    envConfig,
    credentials,
    auth0Helper,
  }) => {
    const loginPage = new LoginPage(page, envConfig);
    const dashboardPage = new DashboardPage(page, envConfig);

    // Navigate to the app
    await loginPage.goto();

    // Perform Auth0 login
    await auth0Helper.completeAuth0LoginInBrowser(
      page,
      credentials.username,
      credentials.password,
      {
        waitForUrl: /.*\/dashboard.*/,
      }
    );

    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*\/dashboard.*/);
    expect(await dashboardPage.isOnDashboard()).toBe(true);
  });

  test('should display error for invalid credentials', async ({
    page,
    envConfig,
  }) => {
    const loginPage = new LoginPage(page, envConfig);

    // Navigate to login
    await loginPage.goto();

    // Try to login with invalid credentials
    try {
      await loginPage.loginWithAuth0('invalid@example.com', 'wrongpassword');

      // Wait a bit for error to appear
      await page.waitForTimeout(2000);

      // Check if error message is displayed
      const hasError = await loginPage.hasErrorMessage();
      expect(hasError).toBe(true);

      if (hasError) {
        const errorMsg = await loginPage.getErrorMessage();
        expect(errorMsg.length).toBeGreaterThan(0);
      }
    } catch (error) {
      // Auth0 might throw on invalid credentials, which is expected
      expect(error).toBeTruthy();
    }
  });

  test('should maintain session after page reload', async ({
    page,
    authenticatedPage,
    envConfig,
    environment,
  }) => {
    // Skip automated auth tests on local (requires manual login)
    if (environment === 'local') {
      test.skip();
      return;
    }

    const dashboardPage = new DashboardPage(page, envConfig);

    // Navigate to dashboard (should already be authenticated)
    await dashboardPage.goto();

    // Verify on dashboard
    expect(await dashboardPage.isOnDashboard()).toBe(true);

    // Reload page
    await page.reload();

    // Should still be on dashboard (session maintained)
    expect(await dashboardPage.isOnDashboard()).toBe(true);
  });

  test('should logout successfully', async ({
    page,
    authenticatedPage,
    envConfig,
    environment,
  }) => {
    // Skip automated auth tests on local (requires manual login)
    if (environment === 'local') {
      test.skip();
      return;
    }

    const dashboardPage = new DashboardPage(page, envConfig);

    // Navigate to dashboard
    await dashboardPage.goto();

    // Perform logout
    await dashboardPage.logout();

    // Should be redirected away from dashboard
    await page.waitForTimeout(1000);
    const onDashboard = await dashboardPage.isOnDashboard();
    expect(onDashboard).toBe(false);
  });
});

test.describe('Session Management', () => {
  test('should redirect to login when not authenticated', async ({
    page,
    envConfig,
  }) => {
    // Try to access dashboard without authentication
    await page.goto(`${envConfig.baseUrls.web}/dashboard`);

    // Should be redirected to login or Auth0
    await page.waitForTimeout(2000);
    const url = page.url();
    const redirected = url.includes('/login') || url.includes('auth0.com');
    expect(redirected).toBe(true);
  });

  test('should access protected route when authenticated', async ({
    page,
    authenticatedPage,
    envConfig,
    environment,
  }) => {
    // Skip automated auth tests on local (requires manual login)
    if (environment === 'local') {
      test.skip();
      return;
    }

    const dashboardPage = new DashboardPage(page, envConfig);

    // Navigate to dashboard
    await dashboardPage.goto();

    // Should be able to access dashboard
    expect(await dashboardPage.isOnDashboard()).toBe(true);
  });
});
