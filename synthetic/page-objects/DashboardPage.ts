/**
 * Dashboard Page Object
 * Represents the main dashboard page after login
 */

import type { Page } from '@playwright/test';
import { BasePage } from './BasePage.js';
import type { EnvironmentConfig } from '../../shared/types/index.js';

export class DashboardPage extends BasePage {
  // Selectors
  private selectors = {
    dashboardHeader: 'h1, [data-testid="dashboard-header"]',
    userMenu: '[data-testid="user-menu"], .user-menu',
    logoutButton: '[data-testid="logout"], button:has-text("Logout"), button:has-text("Sign out")',
    welcomeMessage: '[data-testid="welcome-message"], .welcome-message',
  };

  constructor(page: Page, envConfig: EnvironmentConfig) {
    super(page, envConfig);
  }

  /**
   * Navigate to dashboard
   */
  async goto(): Promise<void> {
    await super.goto('/dashboard');
  }

  /**
   * Check if on dashboard page
   */
  async isOnDashboard(): Promise<boolean> {
    const url = this.getCurrentUrl();
    return url.includes('/dashboard');
  }

  /**
   * Get dashboard header text
   */
  async getHeaderText(): Promise<string> {
    return await this.getText(this.selectors.dashboardHeader);
  }

  /**
   * Check if user menu is visible
   */
  async isUserMenuVisible(): Promise<boolean> {
    return await this.isVisible(this.selectors.userMenu);
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    // Open user menu if needed
    if (await this.isVisible(this.selectors.userMenu)) {
      await this.click(this.selectors.userMenu);
      await this.wait(500); // Wait for menu to open
    }

    // Click logout button
    await this.click(this.selectors.logoutButton);
    await this.waitForNavigation();
  }

  /**
   * Check if welcome message is displayed
   */
  async hasWelcomeMessage(): Promise<boolean> {
    return await this.isVisible(this.selectors.welcomeMessage);
  }

  /**
   * Get welcome message text
   */
  async getWelcomeMessage(): Promise<string> {
    if (await this.hasWelcomeMessage()) {
      return await this.getText(this.selectors.welcomeMessage);
    }
    return '';
  }
}
