/**
 * Playwright config for regular user authentication setup
 */

import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './auth-setup',
  timeout: 600000, // 10 minutes for manual login
  globalSetup: path.resolve(__dirname, './auth-setup/setup-user.ts'),
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
  },
});
