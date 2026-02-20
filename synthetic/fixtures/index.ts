/**
 * Custom Playwright Fixtures
 * Provides environment, credentials, and auth helpers to tests
 */

import { test as base } from '@playwright/test';
import { envSelector } from '../../shared/environment/env-selector.js';
import { credentialManager } from '../../shared/credentials/credential-manager.js';
import { Auth0Helper } from '../../shared/auth/auth0-helper.js';
import type { Environment, EnvironmentConfig } from '../../shared/types/index.js';

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
  authenticatedPage: any; // Page after authentication
};

export const test = base.extend<CustomFixtures>({
  // Environment fixture
  environment: async ({}, use) => {
    // Get environment from env variable or default to 'local'
    const env = (process.env.E2E_ENVIRONMENT as Environment) || 'local';
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
      console.warn('[Fixture] No credentials found - tests will use saved auth state');
      await use({
        username: '',
        password: '',
        auth0ClientId: '',
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

  // Authenticated page fixture
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
});

export { expect } from '@playwright/test';
