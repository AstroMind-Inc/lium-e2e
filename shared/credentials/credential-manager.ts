/**
 * Credential Manager
 * Handles secure local storage and retrieval of credentials
 */

import { readFile, writeFile, access, chmod } from "fs/promises";
import { resolve, join } from "path";
import type { Credentials, Environment } from "../types/index.js";

export class CredentialManager {
  private credentialsDir: string;

  constructor(credentialsDir: string = "./credentials") {
    this.credentialsDir = resolve(credentialsDir);
  }

  /**
   * Save credentials to local file
   */
  async saveCredentials(
    env: Environment,
    regular: { username: string; password: string; auth0ClientId?: string },
    elevated?: { username: string; password: string },
  ): Promise<void> {
    const credentials: Credentials = {
      regular,
      elevated,
      lastUpdated: new Date().toISOString(),
    };

    const credPath = this.getCredentialPath(env);

    try {
      // Write credentials as JSON
      await writeFile(credPath, JSON.stringify(credentials, null, 2));

      // Set restrictive permissions (read/write for owner only)
      await chmod(credPath, 0o600);
    } catch (error) {
      throw new Error(
        `Failed to save credentials for "${env}": ${(error as Error).message}`,
      );
    }
  }

  /**
   * Load credentials from local file
   */
  async loadCredentials(
    env: Environment,
    elevated: boolean = false,
  ): Promise<{
    username: string;
    password: string;
    auth0ClientId?: string;
  }> {
    const credPath = this.getCredentialPath(env);

    try {
      const content = await readFile(credPath, "utf-8");
      const credentials: Credentials = JSON.parse(content);

      if (elevated) {
        if (!credentials.elevated) {
          throw new Error(
            `Elevated credentials not found for environment "${env}". ` +
              `Run 'make credentials' to setup elevated credentials.`,
          );
        }
        return credentials.elevated;
      }

      return credentials.regular;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(
          `Credentials not found for environment "${env}". ` +
            `Run 'make credentials' to setup credentials.`,
        );
      }
      throw new Error(
        `Failed to load credentials for "${env}": ${(error as Error).message}`,
      );
    }
  }

  /**
   * Check if credentials exist for environment
   */
  async hasCredentials(env: Environment): Promise<boolean> {
    const credPath = this.getCredentialPath(env);
    try {
      await access(credPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if elevated credentials exist for environment
   */
  async hasElevatedCredentials(env: Environment): Promise<boolean> {
    if (!(await this.hasCredentials(env))) {
      return false;
    }

    try {
      const credPath = this.getCredentialPath(env);
      const content = await readFile(credPath, "utf-8");
      const credentials: Credentials = JSON.parse(content);
      return !!credentials.elevated;
    } catch {
      return false;
    }
  }

  /**
   * Clear credentials for environment
   */
  async clearCredentials(env: Environment): Promise<void> {
    const { unlink } = await import("fs/promises");
    const credPath = this.getCredentialPath(env);

    try {
      await unlink(credPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw new Error(
          `Failed to clear credentials for "${env}": ${(error as Error).message}`,
        );
      }
    }
  }

  /**
   * Get credential file path
   */
  private getCredentialPath(env: Environment): string {
    return join(this.credentialsDir, `${env}.json`);
  }

  /**
   * Mask password for logging (security)
   */
  static maskPassword(password: string): string {
    if (password.length <= 2) {
      return "***";
    }
    return (
      password[0] +
      "*".repeat(password.length - 2) +
      password[password.length - 1]
    );
  }
}

// Export singleton instance
export const credentialManager = new CredentialManager();
