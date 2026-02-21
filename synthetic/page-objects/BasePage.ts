/**
 * Base Page Object
 * Base class for all page objects with common functionality
 */

import type { Page, Locator } from "@playwright/test";
import type { EnvironmentConfig } from "../../shared/types/index.js";

export class BasePage {
  protected page: Page;
  protected envConfig: EnvironmentConfig;

  constructor(page: Page, envConfig: EnvironmentConfig) {
    this.page = page;
    this.envConfig = envConfig;
  }

  /**
   * Navigate to a path relative to the base URL
   */
  async goto(path: string = ""): Promise<void> {
    const url = `${this.envConfig.baseUrls.web}${path}`;
    await this.page.goto(url, {
      waitUntil: "networkidle",
      timeout: this.envConfig.timeouts.pageLoad,
    });
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout?: number): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({
      state: "visible",
      timeout: timeout || this.envConfig.timeouts.pageLoad,
    });
    return element;
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({
      path: `../reports/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(timeout?: number): Promise<void> {
    await this.page.waitForLoadState("networkidle", {
      timeout: timeout || this.envConfig.timeouts.pageLoad,
    });
  }

  /**
   * Fill form field
   */
  async fill(selector: string, value: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.fill(value);
  }

  /**
   * Click element
   */
  async click(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.click();
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      return await element.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get text content of element
   */
  async getText(selector: string): Promise<string> {
    const element = await this.waitForElement(selector);
    return (await element.textContent()) || "";
  }

  /**
   * Wait for a specific amount of time (use sparingly)
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Reload the page
   */
  async reload(): Promise<void> {
    await this.page.reload({
      waitUntil: "networkidle",
    });
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack({
      waitUntil: "networkidle",
    });
  }

  /**
   * Execute JavaScript in the page context
   */
  async evaluate<T>(fn: () => T): Promise<T> {
    return await this.page.evaluate(fn);
  }
}
