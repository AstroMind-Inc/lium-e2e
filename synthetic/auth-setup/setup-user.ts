/**
 * Regular User Authentication Setup
 *
 * Always opens an interactive browser so the developer can sign in with
 * whatever method they use (Google OAuth, email+password, SSO, etc.).
 *
 * This is the EXPLICIT setup command — it never skips to headless.
 * Headless auto-refresh is handled separately by ensureSession() in
 * global-setup when sessions expire during normal test runs.
 *
 * Run with: make auth-setup-user [env=staging]
 */

import { type FullConfig } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { interactiveLogin } from "../../shared/auth/headless-login.js";
import type { Environment } from "../../shared/types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getBaseUrl(): Promise<string> {
  if (process.env.E2E_BASE_URL) return process.env.E2E_BASE_URL;

  const env = (process.env.E2E_ENVIRONMENT || "local") as Environment;
  try {
    const configPath = path.join(
      __dirname,
      `../../config/environments/${env}.json`,
    );
    const localConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return localConfig.baseUrls.web;
  } catch {
    return "http://localhost:3000";
  }
}

async function setupUser(_config: FullConfig) {
  const authDir = path.join(__dirname, "../../playwright/.auth");
  const environment = (process.env.E2E_ENVIRONMENT || "local") as Environment;
  const authFile = path.join(authDir, `user-${environment}.json`);

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const baseUrl = await getBaseUrl();

  console.log("\n" + "=".repeat(70));
  console.log("👤 REGULAR USER AUTHENTICATION SETUP");
  console.log("=".repeat(70));
  console.log(`\n   Environment: ${environment}`);
  console.log(`   App URL:     ${baseUrl}\n`);

  // Always open an interactive browser — this is an explicit setup command.
  // Headless auto-refresh lives in ensureSession() for when sessions expire.
  await interactiveLogin("user", baseUrl, authFile);
  console.log("\n✅ User session saved");
  console.log("   All user tests will now use this authenticated session.\n");
}

export default setupUser;
