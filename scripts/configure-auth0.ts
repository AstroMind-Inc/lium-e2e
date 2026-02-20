#!/usr/bin/env ts-node

/**
 * Configure Auth0 settings from lium-web .env.local
 *
 * This script:
 * 1. Asks where lium-web repo is located
 * 2. Reads .env.local file
 * 3. Updates all environment configs with Auth0 details
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve, join } from 'path';
import { existsSync } from 'fs';
import * as readline from 'readline';

interface Auth0Config {
  domain: string;
  clientId: string;
  audience: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function readEnvFile(path: string): Promise<Auth0Config | null> {
  try {
    const content = await readFile(path, 'utf-8');
    const lines = content.split('\n');

    const config: Partial<Auth0Config> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;

      // Parse KEY=VALUE
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        const cleanValue = value.replace(/^["']|["']$/g, ''); // Remove quotes

        if (key === 'NEXT_PUBLIC_AUTH0_DOMAIN') {
          config.domain = cleanValue;
        } else if (key === 'NEXT_PUBLIC_AUTH0_CLIENT_ID') {
          config.clientId = cleanValue;
        } else if (key === 'NEXT_PUBLIC_AUTH0_AUDIENCE') {
          config.audience = cleanValue;
        }
      }
    }

    if (config.domain && config.clientId && config.audience) {
      return config as Auth0Config;
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function updateEnvironmentConfig(envName: string, auth0: Auth0Config): Promise<void> {
  const configPath = resolve(process.cwd(), 'config/environments', `${envName}.json`);

  try {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    // Update Auth0 config
    config.auth0 = auth0;

    // Write back
    await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');

    console.log(`✅ Updated ${envName}.json`);
  } catch (error) {
    console.error(`❌ Failed to update ${envName}.json:`, (error as Error).message);
  }
}

async function main() {
  console.log('\n🔐 Auth0 Configuration Tool');
  console.log('════════════════════════════════════════\n');

  // Ask for lium-web location
  const defaultPath = '../lium-web';
  const answer = await question(
    `Where is your lium-web repository? (default: ${defaultPath}): `
  );

  const liumWebPath = answer.trim() || defaultPath;
  const envLocalPath = join(liumWebPath, 'apps/web/.env.local');

  // Check if file exists
  if (!existsSync(envLocalPath)) {
    console.error(`\n❌ File not found: ${envLocalPath}`);
    console.error('Please provide the correct path to lium-web repository.\n');
    rl.close();
    process.exit(1);
  }

  console.log(`\n📖 Reading: ${envLocalPath}`);

  // Read Auth0 config
  const auth0Config = await readEnvFile(envLocalPath);

  if (!auth0Config) {
    console.error('\n❌ Could not find Auth0 configuration in .env.local');
    console.error('Expected variables:');
    console.error('  - NEXT_PUBLIC_AUTH0_DOMAIN');
    console.error('  - NEXT_PUBLIC_AUTH0_CLIENT_ID');
    console.error('  - NEXT_PUBLIC_AUTH0_AUDIENCE\n');
    rl.close();
    process.exit(1);
  }

  console.log('\n✅ Found Auth0 configuration:');
  console.log(`   Domain: ${auth0Config.domain}`);
  console.log(`   Client ID: ${auth0Config.clientId}`);
  console.log(`   Audience: ${auth0Config.audience}\n`);

  // Confirm
  const confirm = await question('Update all environment configs? (Y/n): ');

  if (confirm.toLowerCase() === 'n') {
    console.log('❌ Cancelled\n');
    rl.close();
    process.exit(0);
  }

  // Update all environment configs
  console.log('\n📝 Updating environment configurations...\n');

  await updateEnvironmentConfig('local', auth0Config);
  await updateEnvironmentConfig('dev', auth0Config);
  await updateEnvironmentConfig('sandbox', auth0Config);
  await updateEnvironmentConfig('staging', auth0Config);

  console.log('\n✅ All environment configs updated!');
  console.log('\nNext steps:');
  console.log('  1. Setup credentials: make credentials');
  console.log('  2. Run tests: make test\n');

  rl.close();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
