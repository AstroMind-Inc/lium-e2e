/**
 * Integration Test Global Setup
 *
 * Checks API reachability before any tests run.
 * Fails fast with clear, actionable messages so developers immediately
 * know whether the issue is a missing VPN connection, Docker service down,
 * or a network problem — rather than watching all tests fail with cryptic errors.
 *
 * Environments with api: "VPN_REQUIRED" (dev/sandbox/staging/production) require
 * either VPN + BASE_API_URL override, or are skipped with a clear explanation.
 */

import { type FullConfig } from "@playwright/test";
import * as path from "path";
import { fileURLToPath } from "url";
import { envSelector } from "../shared/environment/env-selector.js";
import type { Environment } from "../shared/types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VPN_REQUIRED = "VPN_REQUIRED";

async function globalSetup(_config: FullConfig) {
  const environment = (process.env.E2E_ENVIRONMENT as Environment) || "local";
  const envConfig = await envSelector.loadEnvironment(environment);
  const configuredApiUrl = envConfig.baseUrls.api;

  // BASE_API_URL env var always takes precedence (useful for VPN environments)
  const apiUrl =
    process.env.BASE_API_URL ||
    (configuredApiUrl !== VPN_REQUIRED ? configuredApiUrl : null);

  console.log(`\n🔌 Integration API Health Check`);
  console.log(`   Environment: ${environment}`);

  // ── VPN_REQUIRED with no override → fail fast ───────────────────────────
  if (!apiUrl) {
    console.error(`\n❌ API requires VPN access for "${environment}" environment.`);
    console.error(`   The API endpoint is not publicly accessible.`);
    console.error(`\n💡 To run integration tests against ${environment}:`);
    console.error(`   1. Connect to VPN`);
    console.error(`   2. Provide the API URL via BASE_API_URL:`);
    console.error(
      `      BASE_API_URL=https://api.${environment}.lium.ai make test-int env=${environment}`,
    );
    console.error(
      `\n   Note: Synthetic (browser) tests do NOT require VPN — only API tests do.`,
    );
    console.error(`         Run: make test-syn-all env=${environment}\n`);
    process.exit(1);
  }

  console.log(`   API URL:     ${apiUrl}\n`);

  // ── Reachability check ──────────────────────────────────────────────────
  const isDockerUrl =
    apiUrl.includes("lium-api") ||
    apiUrl.includes("localhost") ||
    apiUrl.startsWith("http://");
  const needsVpn = configuredApiUrl === VPN_REQUIRED;

  try {
    // Try /healthz first (standard health endpoint), fall back to root
    let response: Response;
    try {
      response = await fetch(`${apiUrl}/healthz`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      response = await fetch(apiUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
    }

    // Any HTTP response (including 401, 403, 404) means the server is up
    console.log(`✅ API is reachable (status: ${response.status})\n`);
  } catch (error: any) {
    console.error(`❌ Cannot reach API: ${apiUrl}`);
    console.error(`   Error: ${error.message}`);

    if (isDockerUrl) {
      console.error(`\n💡 API service appears to be down.`);
      console.error(`   Start it with: docker compose up -d`);
      console.error(`   Or from the lium repo: cd ../lium && docker compose up api -d\n`);
    } else if (needsVpn) {
      console.error(`\n💡 Cannot reach VPN-protected API at ${apiUrl}.`);
      console.error(`   Check that your VPN is connected and try again.`);
      console.error(
        `\n   Note: Synthetic (browser) tests do NOT require VPN.`,
      );
      console.error(`         Run: make test-syn-all env=${environment}\n`);
    } else {
      console.error(`\n💡 Check network connectivity and try again.\n`);
    }

    process.exit(1);
  }
}

export default globalSetup;
