/**
 * Playwright Configuration for Synthetic Tests
 * Browser automation testing configuration
 */

import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if saved auth exists
const adminAuthPath = path.resolve(__dirname, '../playwright/.auth/admin.json');
const hasAdminAuth = fs.existsSync(adminAuthPath);

export default defineConfig({
  testDir: './tests',

  // Ignore example and future tests
  testIgnore: ['**/_examples/**', '**/_future/**', '**/user-flows/multi-user-flow.spec.ts'],

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
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for page.goto('/')
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Use saved admin auth by default if it exists
    ...(hasAdminAuth && { storageState: adminAuthPath }),

    // Collect trace when retrying the failed test
    trace: 'retain-on-failure',

    // Screenshot for all tests (useful for visual verification)
    screenshot: 'on',

    // Video on failure
    video: 'retain-on-failure',

    // Default timeout for actions
    actionTimeout: 10000,

    // Default navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    // Regular tests (no saved auth)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Admin tests (with saved admin auth)
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/admin.json',
      },
      testMatch: /.*admin.*.spec.ts/,
    },

    // User tests (with saved user auth)
    {
      name: 'chromium-user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './playwright/.auth/user.json',
      },
      testMatch: /.*user.*.spec.ts/,
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
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

  // Output folder for test artifacts
  outputDir: 'test-results',
});
