/**
 * Custom Playwright Fixtures for API Testing
 * Provides authenticated request context, environment config, and OpenAPI validation
 */

import { test as base, request } from '@playwright/test';
import { envSelector } from '../../shared/environment/env-selector.js';
import { credentialManager } from '../../shared/credentials/credential-manager.js';
import { Auth0Helper } from '../../shared/auth/auth0-helper.js';
import { openApiValidator } from './openapi-validator.js';
import type { Environment, EnvironmentConfig } from '../../shared/types/index.js';
import type { APIRequestContext } from '@playwright/test';

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
  apiContext: APIRequestContext;
  authenticatedContext: APIRequestContext;
  accessToken: string;
  validator: typeof openApiValidator;
};

export const test = base.extend<CustomFixtures>({
  // Environment fixture
  environment: async ({}, use) => {
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

  // Access token fixture (gets token via Auth0)
  accessToken: async ({ credentials, auth0Helper }, use) => {
    try {
      const tokenSet = await auth0Helper.loginWithPassword(
        credentials.username,
        credentials.password
      );
      await use(tokenSet.access_token);
    } catch (error) {
      console.warn('Failed to get access token:', (error as Error).message);
      await use(''); // Use empty string if auth fails
    }
  },

  // Basic API context (no authentication)
  apiContext: async ({ envConfig }, use) => {
    const context = await request.newContext({
      baseURL: envConfig.baseUrls.api,
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    await use(context);
    await context.dispose();
  },

  // Authenticated API context
  authenticatedContext: async ({ envConfig, accessToken }, use) => {
    const context = await request.newContext({
      baseURL: envConfig.baseUrls.api,
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    await use(context);
    await context.dispose();
  },

  // OpenAPI validator fixture
  validator: async ({}, use) => {
    await use(openApiValidator);
  },
});

export { expect } from '@playwright/test';
