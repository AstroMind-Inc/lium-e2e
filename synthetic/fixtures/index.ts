/**
 * Custom Playwright Fixtures
 * Provides environment, credentials, and auth helpers to tests
 */

import { test as base, Page } from "@playwright/test";
import { envSelector } from "../../shared/environment/env-selector.js";
import { credentialManager } from "../../shared/credentials/credential-manager.js";
import { Auth0Helper } from "../../shared/auth/auth0-helper.js";
import { setupAuthenticatedPage } from "../../shared/auth/token-injection.js";
import path from "path";
import { fileURLToPath } from "url";
import type {
  Environment,
  EnvironmentConfig,
} from "../../shared/types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend base test with custom fixtures
type CustomFixtures = {
  environment: Environment;
  envConfig: EnvironmentConfig;
  credentials: {
    username: string;
    password: string;
    auth0ClientId?: string;
  };
  auth0Helper: Auth0Helper;
  authenticatedPage: Page; // Page with JWT auth injected
  adminPage: Page; // Page authenticated as admin (via JWT)
  userPage: Page; // Page authenticated as regular user (via JWT)
};

export const test = base.extend<CustomFixtures>({
  // Environment fixture
  environment: async ({}, use) => {
    // Get environment from env variable or default to 'local'
    const env = (process.env.E2E_ENVIRONMENT as Environment) || "local";
    await use(env);
  },

  // Environment config fixture
  envConfig: async ({ environment }, use) => {
    const config = await envSelector.loadEnvironment(environment);
    console.log(`[Fixture] Using environment: ${environment}`);
    console.log(`[Fixture] Web URL: ${config.baseUrls.web}`);
    await use(config);
  },

  // Credentials fixture (optional - for tests that need programmatic auth)
  credentials: async ({ environment }, use) => {
    try {
      const creds = await credentialManager.loadCredentials(environment, false);
      await use(creds);
    } catch (error) {
      // If credentials don't exist, provide empty credentials
      // Tests using saved auth states don't need credentials
      console.warn(
        "[Fixture] No credentials found - tests will use saved auth state",
      );
      await use({
        username: "",
        password: "",
        auth0ClientId: "",
      });
    }
  },

  // Auth0 helper fixture
  auth0Helper: async ({ envConfig }, use) => {
    const helper = new Auth0Helper({
      domain: envConfig.auth0.domain,
      clientId: envConfig.auth0.clientId,
      audience: envConfig.auth0.audience,
    });
    await use(helper);
  },

  // Authenticated page fixture (DEPRECATED - uses old storageState approach)
  // Note: With saved auth states, the page is already authenticated
  // This fixture just navigates to the app and verifies auth
  authenticatedPage: async ({ page, envConfig }, use) => {
    // Navigate to the app - auth state is already loaded from storageState
    await page.goto(envConfig.baseUrls.web);

    // Give it a moment to load
    await page.waitForTimeout(1000);

    // Page should be authenticated via saved auth state
    // If not, test will fail (which is expected behavior)
    await use(page);
  },

  // Admin page fixture - Uses saved browser session
  // Creates a new context with admin storageState
  // Tests focus on functionality, not auth flow
  adminPage: async ({ browser }, use) => {
    console.log("[Auth] Using saved admin session");

    const adminAuthPath = path.resolve(
      __dirname,
      "../../playwright/.auth/admin.json",
    );

    // Create context with admin session
    const context = await browser.newContext({
      storageState: adminAuthPath,
    });
    const page = await context.newPage();

    // Don't navigate here - let the test navigate to its target directly
    await use(page);
    await context.close();
  },

  // User page fixture - Uses saved browser session
  // Creates a new context with user storageState
  // Tests focus on functionality, not auth flow
  userPage: async ({ browser }, use) => {
    console.log("[Auth] Using saved user session");

    const userAuthPath = path.resolve(
      __dirname,
      "../../playwright/.auth/user.json",
    );

    // Create context with user session
    const context = await browser.newContext({
      storageState: userAuthPath,
    });
    const page = await context.newPage();

    // Don't navigate here - let the test navigate to its target directly
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";

// Global afterEach hook to FORCE screenshot attachment for ALL tests (even passing ones)
// This ensures screenshots appear in HTML reports for all tests
test.afterEach(async ({ page }, testInfo) => {
  console.log(`[Screenshot Hook] Running for test: ${testInfo.title}`);

  if (!page) {
    console.log("[Screenshot Hook] No page object - skipping");
    return;
  }

  try {
    // Take screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    console.log(
      `[Screenshot Hook] Screenshot captured (${screenshot.length} bytes)`,
    );

    // Attach to test info
    await testInfo.attach(`screenshot-${testInfo.status}`, {
      body: screenshot,
      contentType: "image/png",
    });

    console.log("[Screenshot Hook] Screenshot attached to test report");
  } catch (error) {
    console.log(`[Screenshot Hook] Error: ${(error as Error).message}`);
  }
});
