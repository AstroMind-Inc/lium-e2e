/**
 * Headless Authentication
 * Programmatically obtain Auth0 tokens without browser interaction
 *
 * Requires:
 * - Auth0 username/password account (not Google OAuth)
 * - Resource Owner Password Grant enabled in Auth0
 */

import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Auth0Config {
  domain: string;
  clientId: string;
  audience?: string;
}

interface TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

async function getTokensHeadless(
  config: Auth0Config,
  username: string,
  password: string,
): Promise<TokenResponse> {
  const url = `https://${config.domain}/oauth/token`;

  const response = await axios.post(url, {
    grant_type: "password",
    username,
    password,
    client_id: config.clientId,
    scope: "openid profile email",
    audience: config.audience,
  });

  return response.data;
}

async function createPlaywrightAuthState(
  tokens: TokenResponse,
  domain: string,
  outputPath: string,
): Promise<void> {
  // Create Playwright storage state with Auth0 tokens
  const storageState = {
    cookies: [
      {
        name: "auth0.is.authenticated",
        value: "true",
        domain: "lium-web",
        path: "/",
        expires: Date.now() / 1000 + tokens.expires_in,
        httpOnly: false,
        secure: false,
        sameSite: "Lax" as const,
      },
    ],
    origins: [
      {
        origin: "http://lium-web:3000",
        localStorage: [
          {
            name: "auth0.access_token",
            value: tokens.access_token,
          },
          {
            name: "auth0.id_token",
            value: tokens.id_token,
          },
        ],
      },
    ],
  };

  fs.writeFileSync(outputPath, JSON.stringify(storageState, null, 2));
}

// Export for use in other scripts
export { getTokensHeadless, createPlaywrightAuthState };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const authDir = path.join(__dirname, "../../playwright/.auth");

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  console.log("🔐 Headless Authentication Setup");
  console.log("━".repeat(50));
  console.log("\n⚠️  This requires:");
  console.log("  - Auth0 username/password account (NOT Google OAuth)");
  console.log("  - Password Grant enabled in Auth0 Application settings\n");

  // Load Auth0 config
  const configPath = path.join(__dirname, "../../.auth0.config.json");
  if (!fs.existsSync(configPath)) {
    console.error("❌ .auth0.config.json not found");
    console.error("   Run: make configure\n");
    process.exit(1);
  }

  const auth0Config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  // Get credentials from environment or prompt
  const username = process.env.AUTH0_USERNAME;
  const password = process.env.AUTH0_PASSWORD;

  if (!username || !password) {
    console.error("❌ Credentials not provided");
    console.error("   Set environment variables:");
    console.error('   export AUTH0_USERNAME="user@example.com"');
    console.error('   export AUTH0_PASSWORD="your-password"\n');
    process.exit(1);
  }

  getTokensHeadless(auth0Config, username, password)
    .then(async (tokens) => {
      const outputPath = path.join(authDir, "headless.json");
      await createPlaywrightAuthState(tokens, auth0Config.domain, outputPath);
      console.log("✅ Headless auth session saved:", outputPath);
    })
    .catch((error) => {
      console.error("❌ Authentication failed:", error.message);
      if (error.response?.data) {
        console.error("   Details:", error.response.data);
      }
      process.exit(1);
    });
}
