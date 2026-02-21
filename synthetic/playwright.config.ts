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

// Check if saved auth exists
const adminAuthPath = path.resolve(__dirname, "../playwright/.auth/admin.json");
const hasAdminAuth = fs.existsSync(adminAuthPath);

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
  globalSetup: path.resolve(__dirname, "./global-setup.js"),

  // Global teardown - ensure screenshots are retained
  globalTeardown: path.resolve(__dirname, "./global-teardown.js"),

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
  reporter: [
    ["html", { outputFolder: "../playwright-report", open: "never" }],
    ["list"],
    ["junit", { outputFile: "../reports/junit-results.xml" }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for page.goto('/')
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Use saved admin auth by default if it exists
    ...(hasAdminAuth && { storageState: adminAuthPath }),

    // Collect trace when retrying the failed test
    trace: "retain-on-failure",

    // Screenshot for all tests - ALWAYS ON (kept even for passing tests)
    screenshot: "on",

    // Video on failure only (to save disk space)
    video: "retain-on-failure",

    // Default timeout for actions
    actionTimeout: 10000,

    // Default navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    // Regular tests (no saved auth)
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // Admin tests (with saved admin auth)
    {
      name: "chromium-admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./playwright/.auth/admin.json",
      },
      testMatch: /.*admin.*.spec.ts/,
    },

    // User tests (with saved user auth)
    {
      name: "chromium-user",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./playwright/.auth/user.json",
      },
      testMatch: /.*user.*.spec.ts/,
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
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
