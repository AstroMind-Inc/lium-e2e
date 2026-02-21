/**
 * Global Setup - runs before all tests
 * Checks and refreshes authentication tokens automatically
 */

import { type FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { refreshAuthIfNeeded } from '../shared/auth/token-refresh.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
  console.log('\n🔍 Checking authentication sessions...\n');

  const authDir = path.join(__dirname, '../playwright/.auth');
  const adminAuthFile = path.join(authDir, 'admin.json');
  const userAuthFile = path.join(authDir, 'user.json');

  // Get base URL from config or environment
  const baseUrl = config.use?.baseURL || process.env.BASE_URL || 'http://localhost:3000';

  // Check admin session
  if (fs.existsSync(adminAuthFile)) {
    console.log('🔐 Admin session:');
    const adminValid = await refreshAuthIfNeeded(adminAuthFile, baseUrl);
    if (!adminValid) {
      console.log('⚠️  Admin session expired and could not be refreshed');
      console.log('   Run: make auth-setup-admin\n');
    }
    console.log();
  }

  // Check user session
  if (fs.existsSync(userAuthFile)) {
    console.log('👤 User session:');
    const userValid = await refreshAuthIfNeeded(userAuthFile, baseUrl);
    if (!userValid) {
      console.log('⚠️  User session expired and could not be refreshed');
      console.log('   Run: make auth-setup-user\n');
    }
    console.log();
  }

  console.log('✅ Authentication check complete\n');
}

export default globalSetup;
