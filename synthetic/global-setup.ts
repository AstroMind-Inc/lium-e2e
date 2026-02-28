/**
 * Global Setup - runs before all tests
 *
 * Pre-flight checks:
 * 1. Verify host is reachable (fail fast if app is down)
 * 2. Check auth sessions — auto-refresh if expired and credentials available
 */

import { type FullConfig } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { ensureSession } from "../shared/auth/headless-login.js";
import { envSelector } from "../shared/environment/env-selector.js";
import type { Environment } from "../shared/types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(_config: FullConfig) {
  const environment = (process.env.E2E_ENVIRONMENT as Environment) || "local";
  const envConfig = await envSelector.loadEnvironment(environment);
  const baseUrl = envConfig.baseUrls.web;

  // ─── Health Check ──────────────────────────────────────────────────────────
  console.log(`\n🏥 Health check: ${baseUrl}\n`);
  try {
    const response = await fetch(baseUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok && response.status !== 401 && response.status !== 403) {
      console.error(`❌ Host returned error status: ${response.status}`);
      console.error(`   URL: ${baseUrl}`);
      console.error(
        `\n💡 Make sure the app is running before running tests.\n`,
      );
      process.exit(1);
    }

    console.log(`✅ Host is reachable (status: ${response.status})\n`);
  } catch (error: any) {
    const isDockerUrl = baseUrl.includes("lium-web") || baseUrl.startsWith("http://");
    const isCloudUrl = baseUrl.startsWith("https://");

    console.error(`❌ Cannot reach host: ${baseUrl}`);
    console.error(`   Error: ${error.message}`);
    if (isDockerUrl) {
      console.error(`\n💡 The app does not appear to be running.`);
      console.error(`   Start it with: docker compose up -d`);
      console.error(`   Or from the lium repo: cd ../lium && docker compose up -d\n`);
    } else if (isCloudUrl) {
      console.error(`\n💡 Cannot reach ${baseUrl}.`);
      console.error(`   Check your network connection and try again.\n`);
    } else {
      console.error(`\n💡 Make sure the app is running at: ${baseUrl}\n`);
    }
    process.exit(1);
  }

  // ─── Auth Sessions ─────────────────────────────────────────────────────────
  console.log("🔐 Checking authentication sessions...\n");

  // Always call ensureSession for both roles.
  // ensureSession handles all cases:
  //   1. Valid session file        → use it (fast path)
  //   2. Expired/missing + creds   → headless login (credentials file or ENV vars)
  //   3. No creds + local          → interactive browser (Google OAuth works)
  //   4. No creds + CI             → error
  let anyValid = false;

  console.log("🔑 Admin session:");
  const adminOk = await ensureSession("admin", baseUrl, environment);
  if (adminOk) anyValid = true;
  console.log();

  console.log("👤 User session:");
  const userOk = await ensureSession("user", baseUrl, environment);
  if (userOk) anyValid = true;
  console.log();

  if (!anyValid) {
    console.log("⚠️  No valid authentication sessions available.");
    console.log("   Tests requiring authentication may fail.\n");
  }

  console.log("✅ Pre-flight checks complete\n");
}

export default globalSetup;
