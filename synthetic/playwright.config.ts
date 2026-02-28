/**
 * Playwright Configuration for Synthetic Tests
 * Browser automation testing configuration
 */

import { defineConfig, devices } from "@playwright/test";
import type {
  Reporter,
  TestCase,
  TestResult as PlaywrightTestResult,
} from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { resultWriter } from "../shared/results/result-writer.js";
import * as os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auth file paths — per-environment so sessions don't overwrite each other
// when switching between local/dev/staging/production.
const env = process.env.E2E_ENVIRONMENT || "local";
const adminAuthPath = path.resolve(__dirname, `../playwright/.auth/admin-${env}.json`);
const userAuthPath = path.resolve(__dirname, `../playwright/.auth/user-${env}.json`);

// Inline JSONL Reporter to avoid module loading issues
class JSONLReporter implements Reporter {
  async onTestEnd(test: TestCase, result: PlaywrightTestResult) {
    console.log("[JSONL Reporter] onTestEnd called for:", test.title);
    try {
      const pillar = test.location.file.includes("/synthetic/")
        ? "synthetic"
        : "integration";
      const environment = (process.env.TEST_ENV || "local") as any;
      const testTitle = test.titlePath().slice(1).join(" › ");
      const testFile =
        test.location.file
          .split(`/${pillar}/tests/`)[1]
          ?.replace(/\.spec\.ts$/, "") ||
        path.basename(test.location.file, ".spec.ts");

      let status: "passed" | "failed" | "skipped";
      if (result.status === "passed") status = "passed";
      else if (result.status === "skipped") status = "skipped";
      else status = "failed";

      const screenshot = result.attachments.find(
        (a) => a.name === "screenshot" || a.contentType?.startsWith("image/"),
      )?.path;
      const trace = result.attachments.find(
        (a) => a.name === "trace" || a.contentType?.includes("zip"),
      )?.path;

      await resultWriter.writeResult({
        timestamp: new Date().toISOString(),
        pillar,
        environment,
        test: `${testFile} › ${testTitle}`,
        status,
        duration: result.duration,
        user: process.env.USER || os.userInfo().username || "unknown",
        error: result.error?.message,
        screenshot,
        trace,
        metadata: {
          browser: test.parent.project()?.name,
          retries: result.retry,
        },
      });
    } catch (error) {
      console.warn(
        `[JSONL Reporter] Failed to write result: ${(error as Error).message}`,
      );
    }
  }
}

export default defineConfig({
  testDir: "./tests",

  // Global setup - check and refresh auth tokens before tests
  globalSetup: path.resolve(__dirname, "./global-setup.ts"),

  // Global teardown - ensure screenshots are retained
  globalTeardown: path.resolve(__dirname, "./global-teardown.ts"),

  // Note: Example and manual tests use .spec.ts.skip extension (won't run)
  // _examples/, _future/, and multi-user-flow.spec.ts.skip are skipped

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [["html", { outputFolder: "../playwright-report" }], ["list"]],

  // Shared settings for all the projects below
  use: {
    // Base URL for page.goto('/')
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // NOTE: No global storageState here — each project/fixture manages its own auth.
    // Applying admin auth globally would break unauthenticated smoke tests.

    // Collect trace when retrying the failed test
    trace: "retain-on-failure",

    // Screenshot for all tests - ALWAYS ON (kept even for passing tests)
    screenshot: "on",

    // Video on failure only (to save disk space)
    video: "retain-on-failure",

    // Default timeout for actions
    actionTimeout: 10000,

    // Default navigation timeout — 60s to handle slow responses under full-suite parallel load
    navigationTimeout: 60000,
  },

  // Configure projects for major browsers
  projects: [
    // Regular tests (no saved auth)
    // Ignore files handled exclusively by chromium-user / chromium-admin to avoid
    // parallel execution conflicts (both projects using same user/admin session).
    // Also ignore tenant-management — it runs in the chromium-tenant project (last, after all others).
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/.*user.*\.spec\.ts$/, /.*admin.*\.spec\.ts$/, /.*tenant-management.*/],
    },

    // Admin tests (with saved admin auth — absolute path avoids CWD-relative issues)
    {
      name: "chromium-admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: adminAuthPath,
      },
      testMatch: /.*admin.*.spec.ts/,
    },

    // User tests (with saved user auth — absolute path avoids CWD-relative issues)
    {
      name: "chromium-user",
      use: {
        ...devices["Desktop Chrome"],
        storageState: userAuthPath,
      },
      testMatch: /.*user.*.spec.ts/,
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      // Exclude tenant-management — it modifies shared server state and only runs in chromium-tenant
      testIgnore: [/.*tenant-management.*/],
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      // Exclude tenant-management — it modifies shared server state and only runs in chromium-tenant
      testIgnore: [/.*tenant-management.*/],
    },

    // Tenant management — runs AFTER all other projects complete (via dependencies).
    // This prevents the user-removal SETUP step from conflicting with parallel user tests.
    {
      name: "chromium-tenant",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*tenant-management.*\.spec\.ts$/,
      dependencies: ["chromium", "chromium-admin", "chromium-user", "firefox", "webkit"],
    },

    // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Global timeout for each test
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Output folder for test artifacts (use root-level to consolidate all tests)
  outputDir: "../test-results",
});
