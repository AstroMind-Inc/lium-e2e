/**
 * Login Page Object
 * Represents the login page and Auth0 authentication flow
 */

import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage.js";
import type { EnvironmentConfig } from "../../shared/types/index.js";

export class LoginPage extends BasePage {
  // Selectors
  private selectors = {
    // Auth0 Universal Login selectors
    usernameInput: 'input[name="username"], input[type="email"]',
    passwordInput: 'input[name="password"], input[type="password"]',
    submitButton: 'button[type="submit"], button[name="action"]',
    continueButton: 'button:has-text("Continue"), button:has-text("Next")',
    errorMessage: '[role="alert"], .error-message, .auth0-lock-error-msg',

    // App-specific selectors (if not using Auth0)
    appUsernameInput: '#username, input[name="email"]',
    appPasswordInput: '#password, input[name="password"]',
    appSubmitButton: 'button[type="submit"]',
  };

  constructor(page: Page, envConfig: EnvironmentConfig) {
    super(page, envConfig);
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await super.goto("/login");
  }

  /**
   * Perform login with Auth0
   */
  async loginWithAuth0(username: string, password: string): Promise<void> {
    // Wait for Auth0 login form
    await this.waitForElement(this.selectors.usernameInput);

    // Fill username
    await this.fill(this.selectors.usernameInput, username);

    // Check if there's a continue button (Auth0 two-step flow)
    const hasContinue = await this.isVisible(this.selectors.continueButton);
    if (hasContinue) {
      await this.click(this.selectors.continueButton);
      await this.wait(500); // Wait for password field to appear
    }

    // Fill password
    await this.waitForElement(this.selectors.passwordInput);
    await this.fill(this.selectors.passwordInput, password);

    // Submit
    await this.click(this.selectors.submitButton);

    // Wait for navigation to complete
    await this.waitForNavigation();
  }

  /**
   * Perform login with app-specific form (non-Auth0)
   */
  async loginWithAppForm(email: string, password: string): Promise<void> {
    await this.fill(this.selectors.appUsernameInput, email);
    await this.fill(this.selectors.appPasswordInput, password);
    await this.click(this.selectors.appSubmitButton);
    await this.waitForNavigation();
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.isVisible(this.selectors.errorMessage);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasErrorMessage()) {
      return await this.getText(this.selectors.errorMessage);
    }
    return "";
  }

  /**
   * Check if on login page
   */
  async isOnLoginPage(): Promise<boolean> {
    const url = this.getCurrentUrl();
    return url.includes("/login") || url.includes("auth0.com");
  }
}
