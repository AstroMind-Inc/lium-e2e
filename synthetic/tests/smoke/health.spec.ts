/**
 * Smoke Tests - Basic Health Checks
 *
 * Quick tests to verify the app is up and accessible.
 * Run these first to catch obvious issues before full test suites.
 */

import { test, expect } from '../../fixtures/index.js';

test.describe('Smoke Tests - App Health', () => {
  test('web app is accessible', async ({ page, envConfig }) => {
    console.log(`Checking: ${envConfig.baseUrls.web}`);

    const response = await page.goto(envConfig.baseUrls.web, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Should get a response
    expect(response).not.toBeNull();

    // Should not be a server error
    expect(response!.status()).toBeLessThan(500);

    console.log(`✅ Web app responded with status: ${response!.status()}`);
  });

  test('web app loads HTML content', async ({ page, envConfig }) => {
    await page.goto(envConfig.baseUrls.web);

    // Should have HTML content
    const content = await page.content();
    expect(content).toContain('<!DOCTYPE html>');
    expect(content.length).toBeGreaterThan(100);

    console.log('✅ Web app returned HTML content');
  });

  test('web app has valid title', async ({ page, envConfig }) => {
    await page.goto(envConfig.baseUrls.web);

    const title = await page.title();

    // Should have a title (not blank)
    expect(title.length).toBeGreaterThan(0);

    console.log(`✅ Page title: "${title}"`);
  });

  test('no console errors on page load', async ({ page, envConfig }) => {
    const allErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        allErrors.push(msg.text());
      }
    });

    await page.goto(envConfig.baseUrls.web);

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Filter out expected errors (these are normal for unauthenticated pages)
    const expectedErrors = [
      '401',  // Unauthorized - expected before login
      '404',  // Not found - some resources may not exist
      'Client Components from Server Components',  // React/Next.js warning
      'Set objects are not supported',  // React/Next.js warning
    ];

    const unexpectedErrors = allErrors.filter(error =>
      !expectedErrors.some(expected => error.includes(expected))
    );

    if (unexpectedErrors.length > 0) {
      console.log('❌ UNEXPECTED console errors:', unexpectedErrors);
    } else {
      console.log('✅ No unexpected console errors');
      if (allErrors.length > 0) {
        console.log(`   (${allErrors.length} expected errors filtered out)`);
      }
    }

    // Only fail on unexpected errors
    expect(unexpectedErrors.length).toBe(0);
  });

  test('basic JavaScript is working', async ({ page, envConfig }) => {
    await page.goto(envConfig.baseUrls.web);

    // Try to evaluate JavaScript
    const result = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });

    expect(result).toBe(true);
    console.log('✅ JavaScript execution works');
  });

  test('can reach login/auth page', async ({ page, envConfig }) => {
    await page.goto(envConfig.baseUrls.web);

    // Wait a bit for redirects
    await page.waitForTimeout(2000);

    const url = page.url();

    // Should either be on app or redirected to auth
    const isOnApp = url.includes(envConfig.baseUrls.web);
    const isOnAuth = url.includes('auth0.com') || url.includes('/login');

    expect(isOnApp || isOnAuth).toBe(true);

    if (isOnAuth) {
      console.log('✅ Redirected to authentication (expected)');
    } else {
      console.log('✅ On application (may have existing session)');
    }
  });
});

test.describe('Smoke Tests - API Health', () => {
  test('API endpoint is reachable', async ({ page, envConfig }) => {
    const apiUrl = envConfig.baseUrls.api;

    // Skip if API requires VPN
    if (apiUrl === 'VPN_REQUIRED') {
      test.skip();
      return;
    }

    console.log(`Checking API: ${apiUrl}`);

    try {
      const response = await page.request.get(`${apiUrl}/health`);

      console.log(`✅ API responded with status: ${response.status()}`);

      // API should respond (even if 404, at least it's reachable)
      expect(response.status()).toBeLessThan(500);

    } catch (error) {
      console.log('⚠️  API not reachable:', (error as Error).message);
      throw error;
    }
  });
});

test.describe('Smoke Tests - Auth0', () => {
  test('Auth0 domain is reachable', async ({ page, envConfig }) => {
    const auth0Domain = envConfig.auth0.domain;
    const auth0Url = `https://${auth0Domain}`;

    console.log(`Checking Auth0: ${auth0Url}`);

    const response = await page.goto(auth0Url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);

    console.log(`✅ Auth0 domain accessible`);
  });
});
