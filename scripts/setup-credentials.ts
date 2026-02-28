/**
 * Credential Setup Script
 * Prompts for and saves credentials for headless JWT authentication.
 * Run once per environment — credentials are stored locally and gitignored.
 *
 * Usage: make creds-setup
 *        make creds-setup env=staging
 */

import * as readline from "readline";
import { credentialManager } from "../shared/credentials/credential-manager.js";
import type { Environment } from "../shared/types/index.js";

const VALID_ENVS: Environment[] = ["local", "dev", "sandbox", "staging", "production"];

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

    // Pause readline before taking over stdin with raw mode;
    // we'll resume it after so subsequent rl.question() calls work correctly.
    rl.pause();
    (stdin as any).setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";

    const onData = (char: string) => {
      char = char.toString();
      switch (char) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.removeListener("data", onData);
          (stdin as any).setRawMode(false);
          stdout.write("\n");
          rl.resume(); // hand stdin back to readline for the next question
          resolve(password);
          break;
        case "\u0003":
          process.exit();
          break;
        case "\u007f":
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.clearLine(0);
            stdout.cursorTo(0);
            stdout.write(prompt + "*".repeat(password.length));
          }
          break;
        default:
          password += char;
          stdout.write("*");
          break;
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  console.log("\n🔐 Credential Setup");
  console.log("━".repeat(60));
  console.log("Saves email/password credentials for automatic session refresh.");
  console.log("Files are gitignored — never committed to the repo.\n");

  console.log("How the auth fallback chain works:");
  console.log("  1. Saved session (playwright/.auth/*.json) — used if still valid");
  console.log("  2. Email/password credentials (this file or E2E_*_EMAIL/PASSWORD env vars)");
  console.log("     → headless auto-refresh when session expires (no browser popup)");
  console.log("  3. No credentials → prompts: run make auth-setup-admin/user");
  console.log("     → opens a browser where you can sign in with Google OAuth\n");
  console.log("ℹ️  If you use Google OAuth, skip this and run: make auth-setup-all");
  console.log("   This script is mainly for CI or accounts with email/password login.\n");
  console.log("━".repeat(60));

  // Select environment (can also be passed via E2E_ENVIRONMENT env var)
  const defaultEnv = (process.env.E2E_ENVIRONMENT || "local") as Environment;
  const envInput =
    (await question(
      `Environment (${VALID_ENVS.join("/")})\n  [${defaultEnv}]: `,
    )) || defaultEnv;

  const env = envInput.trim() as Environment;
  if (!VALID_ENVS.includes(env)) {
    console.error(`❌ Invalid environment: "${env}"`);
    console.error(`   Valid options: ${VALID_ENVS.join(", ")}`);
    process.exit(1);
  }

  console.log(`\n📝 Configuring credentials for: ${env}\n`);

  // Show existing credentials if any
  const hasExisting = await credentialManager.hasCredentials(env);
  if (hasExisting) {
    console.log(`ℹ️  Existing credentials found for "${env}" — they will be replaced.\n`);
  }

  // ── Admin credentials ──────────────────────────────────────────
  console.log("👔 Admin credentials  (@astromind.com account)");
  const adminEmail = await question("   Email:    ");
  const adminPassword = await questionHidden("   Password: ");

  if (!adminEmail || !adminPassword) {
    console.error("❌ Admin email and password are required.");
    process.exit(1);
  }

  // ── User credentials ───────────────────────────────────────────
  console.log("\n👤 Regular user credentials");
  const defaultUserEmail = "test-user@astromind.com";
  const userEmailInput = await question(
    `   Email    [${defaultUserEmail}]: `,
  );
  const userEmail = userEmailInput.trim() || defaultUserEmail;
  const userPassword = await questionHidden("   Password: ");

  if (!userPassword) {
    console.error("❌ User password is required.");
    process.exit(1);
  }

  // ── Save both in one file ──────────────────────────────────────
  // regular = user account, elevated = admin account
  await credentialManager.saveCredentials(
    env,
    { username: userEmail, password: userPassword },     // regular (user)
    { username: adminEmail, password: adminPassword },   // elevated (admin)
  );

  console.log(`\n✅ Credentials saved → credentials/${env}.json`);
  console.log("   (gitignored — never committed)\n");
  console.log("Next steps:");
  console.log(`  make test-syn-all env=${env}     # runs all tests (auto-logins headlessly)`);
  console.log(`  make auth-setup-all              # or manually save sessions once\n`);

  rl.close();
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  rl.close();
  process.exit(1);
});
