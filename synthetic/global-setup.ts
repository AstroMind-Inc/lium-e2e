/**
 * Global Setup - runs before all tests
 * Checks and refreshes authentication tokens automatically
 */

import { type FullConfig } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { refreshAuthIfNeeded } from "../shared/auth/token-refresh.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
  // Get base URL from config or environment
  const baseUrl =
    config.use?.baseURL || process.env.BASE_URL || "http://localhost:3000";

  // Health check - verify host is reachable before running tests
  console.log(`\n🏥 Checking if host is reachable: ${baseUrl}\n`);
  try {
    const response = await fetch(baseUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok && response.status !== 401 && response.status !== 403) {
      // Allow 401/403 since app might require auth, but other errors are problems
      console.error(`❌ Host returned error status: ${response.status}`);
      console.error(`   URL: ${baseUrl}`);
      console.error(`\n💡 Make sure the app is running before running tests.\n`);
      process.exit(1);
    }

    console.log(`✅ Host is reachable (status: ${response.status})\n`);
  } catch (error: any) {
    console.error(`❌ Cannot reach host: ${baseUrl}`);
    console.error(`   Error: ${error.message}`);
    console.error(
      `\n💡 Make sure the app is running before running tests.\n`,
    );
    console.error(`   If using Docker: docker compose up -d`);
    console.error(`   If running locally: npm run dev\n`);
    process.exit(1);
  }

  console.log("🔍 Checking authentication sessions...\n");

  const authDir = path.join(__dirname, "../playwright/.auth");
  const adminAuthFile = path.join(authDir, "admin.json");
  const userAuthFile = path.join(authDir, "user.json");

  // Check admin session
  if (fs.existsSync(adminAuthFile)) {
    console.log("🔐 Admin session:");
    const adminValid = await refreshAuthIfNeeded(adminAuthFile, baseUrl);
    if (!adminValid) {
      console.log("⚠️  Admin session expired and could not be refreshed");
      console.log("   Run: make auth-setup-admin\n");
    }
    console.log();
  }

  // Check user session
  if (fs.existsSync(userAuthFile)) {
    console.log("👤 User session:");
    const userValid = await refreshAuthIfNeeded(userAuthFile, baseUrl);
    if (!userValid) {
      console.log("⚠️  User session expired and could not be refreshed");
      console.log("   Run: make auth-setup-user\n");
    }
    console.log();
  }

  console.log("✅ Authentication check complete\n");
}

export default globalSetup;
