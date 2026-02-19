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
    await use(config);
  },

  // Credentials fixture
  credentials: async ({ environment }, use) => {
    const creds = await credentialManager.loadCredentials(environment, false);
    await use(creds);
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
  authenticatedPage: async ({ page, envConfig, credentials, auth0Helper }, use) => {
    // Navigate to the app
    await page.goto(envConfig.baseUrls.web);

    // Wait for redirect to Auth0 or check if already logged in
    try {
      const isLoggedIn = await auth0Helper.waitForAuth0Session(page);

      if (!isLoggedIn) {
        // Perform Auth0 login
        await auth0Helper.completeAuth0LoginInBrowser(
          page,
          credentials.username,
          credentials.password,
          {
            waitForUrl: /.*\/dashboard.*/,
            timeout: 30000,
          }
        );
      }
    } catch (error) {
      console.warn('Auth0 login flow not required or already authenticated');
    }

    await use(page);

    // Cleanup: Clear session after test
    await auth0Helper.clearAuth0Session(page);
  },
});

export { expect } from '@playwright/test';
