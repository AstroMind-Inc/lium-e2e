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

  // Access token fixture - extracts token from saved synthetic auth session
  accessToken: async ({}, use) => {
    try {
      // Try to load auth session from synthetic tests (prefer admin, fallback to user)
      const authDir = path.resolve(__dirname, "../../playwright/.auth");
      const adminAuthPath = path.join(authDir, "admin.json");
      const userAuthPath = path.join(authDir, "user.json");

      let authSessionPath: string | null = null;
      if (fs.existsSync(adminAuthPath)) {
        authSessionPath = adminAuthPath;
      } else if (fs.existsSync(userAuthPath)) {
        authSessionPath = userAuthPath;
      }

      if (!authSessionPath) {
        console.warn(
          "⚠️  No auth session found. Run 'make auth-setup-admin' to authenticate.",
        );
        await use("");
        return;
      }

      // Read the saved session
      const sessionData = JSON.parse(
        fs.readFileSync(authSessionPath, "utf-8"),
      );

      // Extract access token from localStorage
      let accessToken = "";
      for (const origin of sessionData.origins || []) {
        for (const item of origin.localStorage || []) {
          // Auth0 typically stores tokens in localStorage with keys like:
          // - @@auth0spajs@@::CLIENT_ID::AUDIENCE::openid profile email
          // - auth.token, authToken, access_token, etc.
          if (
            item.name.includes("auth0") ||
            item.name.includes("token") ||
            item.name === "access_token"
          ) {
            try {
              const parsed = JSON.parse(item.value);
              if (parsed.access_token) {
                accessToken = parsed.access_token;
                break;
              } else if (parsed.body?.access_token) {
                accessToken = parsed.body.access_token;
                break;
              }
            } catch {
              // Not JSON, might be the token itself
              if (item.value.startsWith("eyJ")) {
                // JWT tokens start with eyJ
                accessToken = item.value;
                break;
              }
            }
          }
        }
        if (accessToken) break;
      }

      if (!accessToken) {
        console.warn(
          "⚠️  Could not extract access token from saved session. API tests may fail.",
        );
      }

      await use(accessToken);
    } catch (error) {
      console.warn(
        "Failed to load access token from saved session:",
        (error as Error).message,
      );
      await use("");
    }
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

  // Authenticated API context
  authenticatedContext: async ({ envConfig, accessToken }, use) => {
    const context = await request.newContext({
      baseURL: envConfig.baseUrls.api,
      extraHTTPHeaders: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
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

export { expect } from "@playwright/test";
