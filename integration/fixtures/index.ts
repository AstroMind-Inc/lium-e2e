/**
 * Custom Playwright Fixtures for API Testing
 * Provides authenticated request context, environment config, and OpenAPI validation
 */

import { test as base, request } from "@playwright/test";
import { envSelector } from "../../shared/environment/env-selector.js";
import { openApiValidator } from "./openapi-validator.js";
import type {
  Environment,
  EnvironmentConfig,
} from "../../shared/types/index.js";
import type { APIRequestContext } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extend base test with custom fixtures
type CustomFixtures = {
  environment: Environment;
  envConfig: EnvironmentConfig;
  apiContext: APIRequestContext;
  authenticatedContext: APIRequestContext;
  accessToken: string;
  validator: typeof openApiValidator;
};

export const test = base.extend<CustomFixtures>({
  // Environment fixture
  environment: async ({}, use) => {
    const env = (process.env.E2E_ENVIRONMENT as Environment) || "local";
    await use(env);
  },

  // Environment config fixture
  envConfig: async ({ environment }, use) => {
    const config = await envSelector.loadEnvironment(environment);
    await use(config);
  },

  // Access token fixture - placeholder (not needed when using storageState)
  accessToken: async ({}, use) => {
    // Token is automatically included via cookies when using storageState
    // This fixture exists for backward compatibility
    await use("");
  },

  // Basic API context (no authentication)
  apiContext: async ({ envConfig }, use) => {
    const context = await request.newContext({
      baseURL: envConfig.baseUrls.api,
      extraHTTPHeaders: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    await use(context);
    await context.dispose();
  },

  // Authenticated API context - uses saved browser session cookies
  authenticatedContext: async ({ envConfig }, use) => {
    // Try to load auth session from synthetic tests (prefer admin, fallback to user)
    const authDir = path.resolve(__dirname, "../../playwright/.auth");
    const adminAuthPath = path.join(authDir, "admin.json");
    const userAuthPath = path.join(authDir, "user.json");

    let storageState: string | undefined;
    if (fs.existsSync(adminAuthPath)) {
      storageState = adminAuthPath;
    } else if (fs.existsSync(userAuthPath)) {
      storageState = userAuthPath;
    }

    if (!storageState) {
      console.warn(
        "⚠️  No auth session found. Run 'make auth-setup-admin' to authenticate.",
      );
      console.warn("   API tests requiring authentication will fail.");
    }

    const context = await request.newContext({
      baseURL: envConfig.baseUrls.api,
      extraHTTPHeaders: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      storageState, // Include cookies from saved browser session
    });

    await use(context);
    await context.dispose();
  },

  // OpenAPI validator fixture
  validator: async ({}, use) => {
    await use(openApiValidator);
  },
});

export { expect } from "@playwright/test";
