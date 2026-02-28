/**
 * Auth Login Utilities
 *
 * Three exported functions for managing authenticated browser sessions:
 *
 *   headlessLogin()   — fully automated, requires email+password credentials
 *   interactiveLogin() — opens a visible browser, supports Google OAuth
 *   ensureSession()   — validates + refreshes session automatically:
 *                         1. Try headless if credentials available
 *                         2. Fall back to interactive browser if headless fails (non-CI)
 *                         3. In CI with no credentials: error and exit
 *
 * Credential priority for headless:
 *   1. ENV vars:  E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 *                 E2E_USER_EMAIL  / E2E_USER_PASSWORD
 *   2. Local file: credentials/<env>.json  (gitignored)
 */

import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { credentialManager } from "../credentials/credential-manager.js";
import type { Environment } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.resolve(__dirname, "../../playwright/.auth");

const ROLE_LABEL: Record<"admin" | "user", string> = {
  admin: "Admin (@astromind.com account)",
  user: "Regular user",
};

const ROLE_COLOR: Record<"admin" | "user", string> = {
  admin: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
  user: "linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)",
};

/**
 * Retrieve credentials for a role from ENV vars or credentials file.
 * Returns null if no credentials are available for headless login.
 */
export async function getCredentials(
  role: "admin" | "user",
  environment: Environment,
): Promise<{ email: string; password: string } | null> {
  // 1. Check ENV vars (CI-friendly)
  if (role === "admin") {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    if (email && password) {
      console.log(`  Using ENV var credentials for admin`);
      return { email, password };
    }
  } else {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (email && password) {
      console.log(`  Using ENV var credentials for user`);
      return { email, password };
    }
  }

  // 2. Check local credentials file
  try {
    const elevated = role === "admin";
    const creds = await credentialManager.loadCredentials(
      environment,
      elevated,
    );
    if (creds.username && creds.password) {
      console.log(`  Using credentials file for ${role}`);
      return { email: creds.username, password: creds.password };
    }
  } catch {
    // No credentials file — fall back to interactive
  }

  return null;
}

/**
 * Perform a fully headless Auth0 login using email+password credentials.
 * Does NOT support Google OAuth — use interactiveLogin() for that.
 *
 * Navigates to the app → follows Auth0 redirect → fills email/password →
 * waits for redirect back → saves context.storageState()
 */
export async function headlessLogin(
  role: "admin" | "user",
  baseUrl: string,
  email: string,
  password: string,
  outputPath?: string,
): Promise<void> {
  const env = process.env.E2E_ENVIRONMENT || "local";
  const authFile = outputPath ?? path.join(AUTH_DIR, `${role}-${env}.json`);

  console.log(`\n  Headless login: ${role} (${email})`);
  console.log(`  App: ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for Auth0 redirect
    await page.waitForURL(/auth0\.com/, { timeout: 15000 });
    console.log(`  Reached Auth0 login page`);

    // Fill email
    await page.fill('input[name="username"], input[type="email"]', email, {
      timeout: 10000,
    });

    // Some Auth0 configs have a "Continue" button before password
    const continueBtn = page.locator(
      'button:has-text("Continue"), button[name="action"][value="default"]',
    );
    if ((await continueBtn.count()) > 0) {
      await continueBtn.first().click();
      await page.waitForTimeout(500);
    }

    // Fill password
    await page.fill(
      'input[name="password"], input[type="password"]',
      password,
      { timeout: 10000 },
    );

    // Submit
    await page.click('button[type="submit"], button[name="action"]', {
      timeout: 10000,
    });

    // Wait for redirect back to the app
    await page.waitForURL(
      (url) =>
        !url.href.includes("auth0.com") &&
        (url.href.includes("/chats") ||
          url.href.includes("/chat") ||
          url.href.includes("/beta") ||
          url.href.startsWith(baseUrl)),
      { timeout: 30000 },
    );

    console.log(`  Authenticated → ${page.url()}`);

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
    await context.storageState({ path: authFile });
    console.log(`  Session saved → ${authFile}`);
  } finally {
    await browser.close();
  }
}

/**
 * Open a visible browser so the user can sign in manually.
 * Supports Google OAuth, email+password, or any Auth0 login method.
 *
 * Waits for the user to reach /chats, then saves the session.
 */
export async function interactiveLogin(
  role: "admin" | "user",
  baseUrl: string,
  outputPath?: string,
): Promise<void> {
  const env = process.env.E2E_ENVIRONMENT || "local";
  const authFile = outputPath ?? path.join(AUTH_DIR, `${role}-${env}.json`);

  console.log(`\n  Opening browser for ${role} login...`);
  console.log(`  (Google OAuth works — sign in however you normally do)\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    // Inject a banner so the user knows what to do
    await page.evaluate(
      ({ label, color }) => {
        const banner = document.createElement("div");
        banner.id = "e2e-auth-banner";
        banner.style.cssText = `
          position: fixed; top: 0; left: 0; right: 0;
          background: ${color};
          color: white; padding: 32px; text-align: center;
          z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        `;
        banner.innerHTML = `
          <div style="font-size: 26px; font-weight: bold; margin-bottom: 10px;">
            🔐 E2E Authentication Setup
          </div>
          <div style="font-size: 18px; margin-bottom: 6px;">${label}</div>
          <div style="font-size: 15px; opacity: 0.85;">
            Sign in (Google OAuth works) — window closes automatically when done.
          </div>
        `;
        document.body.prepend(banner);
      },
      { label: ROLE_LABEL[role], color: ROLE_COLOR[role] },
    );

    console.log(`  Waiting for login... (you have 10 minutes)\n`);

    await page.waitForURL(/.*\/chats.*/, { timeout: 600000 });

    // Update banner to success state
    await page.evaluate(() => {
      const banner = document.getElementById("e2e-auth-banner");
      if (banner) {
        banner.style.background = "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)";
        banner.innerHTML = `<div style="font-size: 24px; font-weight: bold;">
          ✅ Login successful — saving session, window closing...
        </div>`;
      }
    });

    await page.waitForTimeout(1500);

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
    await context.storageState({ path: authFile });
    console.log(`  Session saved → ${authFile}`);
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes("state") || page.url().includes("error=")) {
      console.error(`\n  Auth0 configuration issue. Common fixes:`);
      console.error(`    1. Ensure app is running at: ${baseUrl}`);
      console.error(`    2. Check Auth0 Allowed Callback/Logout/Web Origin URLs`);
      console.error(`    3. Run 'make configure' to sync Auth0 config\n`);
    }
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Check if a saved session file is valid (non-expired).
 */
export async function isSessionValid(
  authFile: string,
  baseUrl: string,
): Promise<boolean> {
  if (!fs.existsSync(authFile)) {
    return false;
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/chats`, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    await page.waitForTimeout(1500);

    const url = page.url();
    const authenticated =
      url.includes("/chats") || url.includes("/chat") || url.includes("/beta");

    return authenticated && !url.includes("auth0.com");
  } catch {
    // If app isn't reachable, assume valid — let tests decide
    return true;
  } finally {
    await browser.close();
  }
}

/**
 * Ensure a session exists and is valid. Self-healing:
 *
 *   1. Valid session file? → done
 *   2. Credentials available? → headless login
 *      Headless failed + not CI? → fall back to interactive browser
 *   3. No credentials + not CI → open interactive browser
 *   4. No credentials + CI → error (cannot prompt in CI)
 */
export async function ensureSession(
  role: "admin" | "user",
  baseUrl: string,
  environment: Environment,
): Promise<boolean> {
  const authFile = path.join(AUTH_DIR, `${role}-${environment}.json`);
  const isCI = !!process.env.CI;

  // 1. Check existing session
  if (fs.existsSync(authFile)) {
    console.log(`  Checking ${role} session...`);
    const valid = await isSessionValid(authFile, baseUrl);
    if (valid) {
      console.log(`  ✓ ${role} session is valid`);
      return true;
    }
    console.log(`  ⚠  ${role} session expired`);
  } else {
    console.log(`  ⚠  No ${role} session found`);
  }

  // 2. Try headless login if credentials are available
  const creds = await getCredentials(role, environment);
  if (creds) {
    try {
      await headlessLogin(role, baseUrl, creds.email, creds.password, authFile);
      console.log(`  ✓ ${role} session refreshed (headless)`);
      return true;
    } catch (err) {
      console.log(
        `  ⚠  Headless login failed (${(err as Error).message.split("\n")[0]})`,
      );
      if (isCI) {
        console.error(
          `  ✗ Cannot fall back to interactive browser in CI.\n` +
          `    Check E2E_${role.toUpperCase()}_EMAIL / E2E_${role.toUpperCase()}_PASSWORD.`,
        );
        return false;
      }
      console.log(`  → Falling back to interactive browser login...`);
    }
  }

  // 3. Interactive browser (local only)
  if (!isCI) {
    try {
      await interactiveLogin(role, baseUrl, authFile);
      console.log(`  ✓ ${role} session saved (interactive)`);
      return true;
    } catch (err) {
      console.error(`  ✗ Interactive login failed: ${(err as Error).message}`);
      return false;
    }
  }

  // 4. CI with no credentials — cannot proceed
  console.error(
    `  ✗ No ${role} session and no credentials available.\n` +
    `    Set E2E_${role.toUpperCase()}_EMAIL and E2E_${role.toUpperCase()}_PASSWORD.`,
  );
  return false;
}
