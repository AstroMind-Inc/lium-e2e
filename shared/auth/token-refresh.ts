/**
 * Token Refresh Utility
 * Automatically refresh expired Auth0 tokens before running tests
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { chromium } from '@playwright/test';

interface StorageState {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{
      name: string;
      value: string;
    }>;
  }>;
}

/**
 * Check if auth tokens are expired and refresh if needed
 */
export async function refreshAuthIfNeeded(
  authFilePath: string,
  baseUrl: string
): Promise<boolean> {
  try {
    // Check if auth file exists
    const fileExists = await fs.access(authFilePath).then(() => true).catch(() => false);
    if (!fileExists) {
      console.log(`⚠️  No auth session found at: ${authFilePath}`);
      return false;
    }

    // Read storage state
    const storageStateContent = await fs.readFile(authFilePath, 'utf-8');
    const storageState: StorageState = JSON.parse(storageStateContent);

    // Check if tokens are still valid
    const isValid = await checkTokenValidity(storageState, baseUrl);

    if (isValid) {
      console.log('✓ Auth session is still valid');
      return true;
    }

    console.log('⚠️  Auth session expired, attempting to refresh...');

    // Try to refresh using the saved session
    const refreshed = await attemptRefresh(authFilePath, baseUrl, storageState);

    if (refreshed) {
      console.log('✓ Auth session refreshed successfully');
      return true;
    } else {
      console.log('❌ Could not refresh auth session - manual re-authentication required');
      return false;
    }
  } catch (error) {
    console.warn(`Token refresh check failed: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Check if the current session is still valid
 */
async function checkTokenValidity(storageState: StorageState, baseUrl: string): Promise<boolean> {
  try {
    // Launch headless browser with saved state
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    // Try to navigate to a protected route
    await page.goto(baseUrl + '/chats', {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    // Wait a moment for any redirects
    await page.waitForTimeout(2000);

    // Check if we're still authenticated (not redirected to login)
    const url = page.url();
    const isAuthenticated = url.includes('/chats') || url.includes('/chat');

    await browser.close();
    return isAuthenticated;
  } catch (error) {
    console.warn(`Token validity check failed: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Attempt to refresh the session
 */
async function attemptRefresh(
  authFilePath: string,
  baseUrl: string,
  oldStorageState: StorageState
): Promise<boolean> {
  try {
    // Unfortunately, Auth0 refresh tokens are stored in HTTP-only cookies
    // which we can't access directly. The best approach is to:
    // 1. Load the page with the old session
    // 2. Let Auth0's SDK handle the refresh automatically
    // 3. Save the new session

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: oldStorageState });
    const page = await context.newPage();

    // Navigate to the app - Auth0 SDK might auto-refresh
    await page.goto(baseUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for any background token refresh
    await page.waitForTimeout(5000);

    // Try to access a protected route
    await page.goto(baseUrl + '/chats', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    await page.waitForTimeout(2000);

    // Check if we made it to the protected route
    const url = page.url();
    const isAuthenticated = url.includes('/chats') || url.includes('/chat');

    if (isAuthenticated) {
      // Save the refreshed session
      await context.storageState({ path: authFilePath });
      await browser.close();
      return true;
    }

    await browser.close();
    return false;
  } catch (error) {
    console.warn(`Token refresh attempt failed: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Get token expiry time in seconds (for manual token inspection)
 */
function getTokenExpiry(token: string): number | null {
  try {
    // JWT tokens are base64 encoded
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.exp || null;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) {
    return true; // Assume expired if we can't parse
  }

  const now = Math.floor(Date.now() / 1000);
  const bufferSeconds = 300; // 5 minute buffer

  return now >= (expiry - bufferSeconds);
}
