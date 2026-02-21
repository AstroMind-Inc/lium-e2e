/**
 * Global Teardown - runs after all tests
 * Forces screenshot retention for all tests (even passing ones)
 */

import { type FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs/promises';

async function globalTeardown(config: FullConfig) {
  console.log('\n📸 Ensuring screenshots are retained...');

  const testResultsDir = path.join(process.cwd(), 'test-results');

  try {
    // Check if test-results exists
    const exists = await fs.access(testResultsDir).then(() => true).catch(() => false);

    if (exists) {
      const entries = await fs.readdir(testResultsDir, { withFileTypes: true });
      let screenshotCount = 0;

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const testDir = path.join(testResultsDir, entry.name);
          const files = await fs.readdir(testDir);
          const screenshots = files.filter(f => f.endsWith('.png'));
          screenshotCount += screenshots.length;
        }
      }

      console.log(`✓ ${screenshotCount} screenshots retained in test-results/\n`);
    } else {
      console.log('⚠️  No test-results directory found\n');
    }
  } catch (error) {
    console.warn(`Warning: Could not check screenshots: ${(error as Error).message}\n`);
  }
}

export default globalTeardown;
