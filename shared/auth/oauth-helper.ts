/**
 * OAuth Helper
 * Generic OAuth2/OIDC authentication helper
 */

import type { Page } from "@playwright/test";

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  [key: string]: any; // Allow additional properties
}

export interface OAuthConfig {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
  scope?: string;
}

export class OAuthHelper {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Authenticate with password grant (Resource Owner Password Credentials)
   * Note: This is for testing only and may not be supported by all OAuth providers
   */
  async authenticateWithPassword(
    username: string,
    password: string,
  ): Promise<TokenSet> {
    const tokenEndpoint = `${this.config.issuer}/oauth/token`;

    const params = new URLSearchParams({
      grant_type: "password",
      username,
      password,
      client_id: this.config.clientId,
      scope: this.config.scope || "openid profile email",
    });

    if (this.config.clientSecret) {
      params.append("client_secret", this.config.clientSecret);
    }

    try {
      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Authentication failed: ${response.status} ${error}`);
      }

      return (await response.json()) as TokenSet;
    } catch (error) {
      throw new Error(
        `OAuth password authentication failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Authenticate with client credentials grant
   */
  async authenticateWithClientCredentials(): Promise<TokenSet> {
    if (!this.config.clientSecret) {
      throw new Error("Client secret is required for client credentials flow");
    }

    const tokenEndpoint = `${this.config.issuer}/oauth/token`;

    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scope || "",
    });

    try {
      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Authentication failed: ${response.status} ${error}`);
      }

      return (await response.json()) as TokenSet;
    } catch (error) {
      throw new Error(
        `OAuth client credentials authentication failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenSet> {
    const tokenEndpoint = `${this.config.issuer}/oauth/token`;

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.config.clientId,
    });

    if (this.config.clientSecret) {
      params.append("client_secret", this.config.clientSecret);
    }

    try {
      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${error}`);
      }

      return (await response.json()) as TokenSet;
    } catch (error) {
      throw new Error(
        `OAuth token refresh failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Complete OAuth flow in browser (for Playwright tests)
   * This is a generic implementation that may need customization per provider
   */
  async completeOAuthFlowInBrowser(
    page: Page,
    username: string,
    password: string,
  ): Promise<void> {
    try {
      // Wait for login form to appear
      // Note: Selectors may vary by OAuth provider
      await page.waitForSelector(
        'input[type="email"], input[type="text"], input[name="username"]',
        {
          timeout: 10000,
        },
      );

      // Fill in username
      const usernameField = await page
        .locator(
          'input[type="email"], input[type="text"], input[name="username"]',
        )
        .first();
      await usernameField.fill(username);

      // Check if there's a "Continue" or "Next" button
      const continueButton = page
        .locator('button:has-text("Continue"), button:has-text("Next")')
        .first();
      if (await continueButton.isVisible().catch(() => false)) {
        await continueButton.click();
        await page.waitForTimeout(500);
      }

      // Fill in password
      await page.waitForSelector(
        'input[type="password"], input[name="password"]',
        {
          timeout: 5000,
        },
      );
      const passwordField = await page
        .locator('input[type="password"], input[name="password"]')
        .first();
      await passwordField.fill(password);

      // Submit form
      const submitButton = page
        .locator(
          'button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")',
        )
        .first();
      await submitButton.click();

      // Wait for redirect (URL should change away from OAuth provider)
      await page.waitForURL(
        (url) => !url.toString().includes(this.config.issuer),
        {
          timeout: 10000,
        },
      );
    } catch (error) {
      throw new Error(`OAuth browser flow failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get authorization URL for authorization code flow
   */
  getAuthorizationUrl(state?: string): string {
    if (!this.config.redirectUri) {
      throw new Error("Redirect URI is required for authorization code flow");
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope || "openid profile email",
      state: state || this.generateState(),
    });

    return `${this.config.issuer}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<TokenSet> {
    if (!this.config.redirectUri) {
      throw new Error(
        "Redirect URI is required for authorization code exchange",
      );
    }

    const tokenEndpoint = `${this.config.issuer}/oauth/token`;

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
    });

    if (this.config.clientSecret) {
      params.append("client_secret", this.config.clientSecret);
    }

    try {
      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Code exchange failed: ${response.status} ${error}`);
      }

      return (await response.json()) as TokenSet;
    } catch (error) {
      throw new Error(
        `OAuth code exchange failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
