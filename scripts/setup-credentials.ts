/**
 * Credential Setup Script
 * Prompts for and saves credentials for JWT token authentication
 *
 * Usage: npm run setup-credentials
 */

import * as readline from 'readline';
import { credentialManager } from '../shared/credentials/credential-manager.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(prompt);

    // Hide input
    (stdin as any).setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    const onData = (char: string) => {
      char = char.toString();

      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.removeListener('data', onData);
          (stdin as any).setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.clearLine(0);
            stdout.cursorTo(0);
            stdout.write(prompt + '*'.repeat(password.length));
          }
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    };

    stdin.on('data', onData);
  });
}

async function main() {
  console.log('\n🔐 JWT Credential Setup');
  console.log('━'.repeat(70));
  console.log('\nThis will save credentials for JWT token authentication.');
  console.log('Your credentials are stored locally and gitignored.\n');

  // Select environment
  const env = await question('Environment (local/dev/sandbox/staging) [local]: ') || 'local';

  if (!['local', 'dev', 'sandbox', 'staging'].includes(env)) {
    console.error(`❌ Invalid environment: ${env}`);
    process.exit(1);
  }

  console.log(`\n📝 Setting up credentials for: ${env}\n`);

  // Admin credentials
  console.log('👔 Admin Credentials (@astromind.com account)');
  const adminUsername = await question('  Email: ');
  const adminPassword = await questionHidden('  Password: ');

  // Save admin credentials
  await credentialManager.saveCredentials(env as any, {
    username: adminUsername,
    password: adminPassword,
  }, false); // regular user = false means admin

  console.log('\n✅ Admin credentials saved\n');

  // Ask if they want to set up user credentials too
  const setupUser = await question('Setup regular user credentials too? (y/N): ');

  if (setupUser.toLowerCase() === 'y' || setupUser.toLowerCase() === 'yes') {
    console.log('\n👤 Regular User Credentials');
    const userUsername = await question('  Email [test-user@astromind.com]: ') || 'test-user@astromind.com';
    const userPassword = await questionHidden('  Password: ');

    // Save user credentials
    await credentialManager.saveCredentials(env as any, {
      username: userUsername,
      password: userPassword,
    }, true); // regular user = true

    console.log('\n✅ User credentials saved\n');
  }

  console.log('✅ Credential setup complete!');
  console.log(`\nCredentials saved in: ./credentials/${env}.json`);
  console.log('(This file is gitignored)\n');
  console.log('You can now run tests with JWT token injection:');
  console.log(`  make test-syn-auth env=${env}\n`);

  rl.close();
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
