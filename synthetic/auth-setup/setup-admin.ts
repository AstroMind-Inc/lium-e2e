/**
 * Admin Authentication Setup
 *
 * This script guides the user through logging in as an admin (@astromind.com)
 * and saves the authenticated session for reuse in tests.
 *
 * Run with: make auth-setup-admin
 */

import { chromium, type FullConfig } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupAdmin(config: FullConfig) {
  const authDir = path.join(__dirname, "../../playwright/.auth");
  const authFile = path.join(authDir, "admin.json");

  // Ensure directory exists
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  console.log("\n" + "=".repeat(70));
  console.log("🔐 ADMIN AUTHENTICATION SETUP");
  console.log("=".repeat(70));
  console.log("\nThis will open a browser window for you to log in.");
  console.log(
    "Please sign in with an @astromind.com account via Google OAuth.",
  );
  console.log(
    "\nOnce authenticated, your session will be saved and reused for all tests.",
  );
  console.log("Tests will then run HEADLESS for maximum speed.\n");

  // Get base URL - try environment variable, then load from config
  let baseUrl = process.env.E2E_BASE_URL;

  if (!baseUrl) {
    // Load from local environment config
    try {
      const configPath = path.join(
        __dirname,
        "../../config/environments/local.json",
      );
      const configFile = fs.readFileSync(configPath, "utf-8");
      const localConfig = JSON.parse(configFile);
      baseUrl = localConfig.baseUrls.web;
      console.log(`📝 Using URL from local config: ${baseUrl}\n`);
    } catch (error) {
      baseUrl = "http://localhost:3000";
      console.log(`⚠️  Could not load config, using default: ${baseUrl}\n`);
    }
  }

  console.log(`📍 Opening: ${baseUrl}`);
  console.log(
    "⚠️  Make sure your app is running and accessible at this URL!\n",
  );
  console.log("⏳ Opening browser...\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to app
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    // Inject visible banner
    await page.evaluate(() => {
      const banner = document.createElement("div");
      banner.id = "auth-setup-banner";
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
        color: white;
        padding: 40px;
        text-align: center;
        z-index: 999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;
      banner.innerHTML = `
        <div style="font-size: 32px; font-weight: bold; margin-bottom: 15px;">
          🔐 ADMIN AUTHENTICATION SETUP
        </div>
        <div style="font-size: 22px; margin-bottom: 10px;">
          Please sign in with your <strong>@astromind.com</strong> account
        </div>
        <div style="font-size: 18px; opacity: 0.9;">
          This will save your session for all future tests
        </div>
      `;
      document.body.prepend(banner);
    });

    console.log("👉 Please complete the login in the browser window...");
    console.log("   (Waiting for you to reach /chats...)\n");

    // Wait for successful login (chats URL)
    await page.waitForURL(/.*\/chats.*/, {
      timeout: 600000, // 10 minutes
    });

    console.log("✅ Login successful!\n");

    // Update banner to show success
    await page.evaluate(() => {
      const banner = document.getElementById("auth-setup-banner");
      if (banner) {
        banner.style.background =
          "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)";
        banner.innerHTML = `
          <div style="font-size: 28px; font-weight: bold;">
            ✅ Authentication Successful
          </div>
          <div style="font-size: 18px; margin-top: 10px;">
            Saving session... This window will close automatically.
          </div>
        `;
      }
    });

    // Wait a moment for user to see success
    await page.waitForTimeout(2000);

    // Save authenticated state
    await context.storageState({ path: authFile });

    console.log("💾 Admin session saved to:", authFile);
    console.log("✅ All admin tests will now use this authenticated session!");
    console.log("   Tests will run HEADLESS for maximum speed.\n");
  } catch (error) {
    console.error("\n❌ Authentication failed:", (error as Error).message);

    // Check if it's an OAuth state error
    if (
      (error as Error).message.includes("state") ||
      page.url().includes("error=")
    ) {
      console.error(
        "\n⚠️  This looks like an Auth0 OAuth configuration issue.",
      );
      console.error("Common fixes:");
      console.error("  1. Make sure your app is running at:", baseUrl);
      console.error("  2. Check Auth0 dashboard > Applications > Settings:");
      console.error("     - Allowed Callback URLs should include:", baseUrl);
      console.error("     - Allowed Logout URLs should include:", baseUrl);
      console.error("     - Allowed Web Origins should include:", baseUrl);
      console.error(
        "  3. Make sure you copied Auth0 config from lium/apps/web/.env.local\n",
      );
    }

    throw error;
  } finally {
    await browser.close();
  }
}

export default setupAdmin;
