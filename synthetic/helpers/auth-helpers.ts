/**
 * Authentication Helper Functions
 * Shared utilities for JWT token injection in tests
 *
 * NOTE: Tests should use the adminPage/userPage fixtures instead of
 * calling these helpers directly. These are primarily for internal use.
 */

import type { Page } from "@playwright/test";
import { setupAuthenticatedPage } from "../../shared/auth/token-injection.js";
import { Auth0Helper } from "../../shared/auth/auth0-helper.js";

/**
 * Navigate to a URL with authentication via JWT token injection
 *
 * This approach:
 * 1. Gets JWT tokens programmatically (no Auth0 redirect)
 * 2. Injects tokens into browser storage
 * 3. Navigates directly to the target page
 * 4. Fast, reliable, headless - no OAuth flow delays
 *
 * @param page - Playwright page object
 * @param url - Target URL to navigate to
 * @param username - User email for authentication
 * @param password - User password for authentication
 * @param auth0Config - Auth0 configuration
 */
export async function navigateWithAuth(
  page: Page,
  url: string,
  username: string,
  password: string,
  auth0Config: { domain: string; clientId: string; audience?: string },
): Promise<void> {
  // Get base URL from the target URL
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

  // Setup Auth0 helper
  const auth0Helper = new Auth0Helper(auth0Config);

  // Get JWT tokens and inject into browser
  await setupAuthenticatedPage(page, username, password, auth0Helper, baseUrl);

  // Navigate to the target page (already authenticated)
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}
