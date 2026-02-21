/**
 * Playwright Configuration for Integration Tests
 * API testing configuration
 */

import { defineConfig } from "@playwright/test";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve reporter path
const jsonlReporterPath = path.resolve(
  __dirname,
  "../shared/reporting/jsonl-reporter.ts",
);

export default defineConfig({
  testDir: "./tests",

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration (use same report folder as synthetic for consolidated view)
  reporter: [
    [
      "html",
      {
        outputFolder:
          process.env.PLAYWRIGHT_HTML_REPORT || "../playwright-report",
        open: "never",
      },
    ],
    ["list"],
    ["junit", { outputFile: "../reports/junit-api-results.xml" }],
    ["../scripts/jsonl-playwright-reporter.js"],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for API requests
    baseURL: process.env.BASE_API_URL || "http://localhost:4000",

    // Extra HTTP headers
    extraHTTPHeaders: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },

    // Default timeout for API requests
    timeout: 30000,
  },

  // Configure projects (no browser needed for API tests)
  projects: [
    {
      name: "api",
      use: {},
    },
  ],

  // Global timeout for each test
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },
});
