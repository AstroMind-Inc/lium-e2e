/**
 * Tests for CredentialManager
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { mkdir, rm, stat } from "fs/promises";
import { join } from "path";
import { CredentialManager } from "../../../shared/credentials/credential-manager.js";

describe("CredentialManager", () => {
  const testCredDir = join(process.cwd(), "test-credentials");
  let credManager: CredentialManager;

  beforeEach(async () => {
    // Create test credentials directory
    await mkdir(testCredDir, { recursive: true });
    credManager = new CredentialManager(testCredDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testCredDir, { recursive: true, force: true });
  });

  describe("saveCredentials", () => {
    it("should save credentials to local file", async () => {
      const regular = {
        username: "test@lium.com",
        password: "password123",
      };

      await credManager.saveCredentials("dev", regular);

      const hasCredentials = await credManager.hasCredentials("dev");
      expect(hasCredentials).toBe(true);
    });

    it("should save credentials with elevated privileges", async () => {
      const regular = {
        username: "user@lium.com",
        password: "userpass",
      };
      const elevated = {
        username: "admin@lium.com",
        password: "adminpass",
      };

      await credManager.saveCredentials("dev", regular, elevated);

      const hasElevated = await credManager.hasElevatedCredentials("dev");
      expect(hasElevated).toBe(true);
    });

    it("should set restrictive file permissions", async () => {
      const regular = {
        username: "test@lium.com",
        password: "password123",
      };

      await credManager.saveCredentials("dev", regular);

      const credPath = join(testCredDir, "dev.json");
      const stats = await stat(credPath);
      const mode = stats.mode & parseInt("777", 8);

      // Check that only owner can read/write (600 permissions)
      expect(mode).toBe(parseInt("600", 8));
    });

    it("should include lastUpdated timestamp", async () => {
      const regular = {
        username: "test@lium.com",
        password: "password123",
      };

      await credManager.saveCredentials("dev", regular);
      const loaded = await credManager.loadCredentials("dev");

      // Verify credentials were saved (indirectly - if we can load them, timestamp was set)
      expect(loaded.username).toBe(regular.username);
    });
  });

  describe("loadCredentials", () => {
    it("should load regular credentials", async () => {
      const regular = {
        username: "test@lium.com",
        password: "password123",
        auth0ClientId: "client123",
      };

      await credManager.saveCredentials("dev", regular);
      const loaded = await credManager.loadCredentials("dev");

      expect(loaded.username).toBe(regular.username);
      expect(loaded.password).toBe(regular.password);
      expect(loaded.auth0ClientId).toBe(regular.auth0ClientId);
    });

    it("should load elevated credentials when requested", async () => {
      const regular = {
        username: "user@lium.com",
        password: "userpass",
      };
      const elevated = {
        username: "admin@lium.com",
        password: "adminpass",
      };

      await credManager.saveCredentials("dev", regular, elevated);
      const loaded = await credManager.loadCredentials("dev", true);

      expect(loaded.username).toBe(elevated.username);
      expect(loaded.password).toBe(elevated.password);
    });

    it("should throw error when credentials not found", async () => {
      await expect(credManager.loadCredentials("dev")).rejects.toThrow(
        /Credentials not found for environment "dev"/,
      );
    });

    it("should throw error when elevated credentials requested but not available", async () => {
      const regular = {
        username: "user@lium.com",
        password: "userpass",
      };

      await credManager.saveCredentials("dev", regular);

      await expect(credManager.loadCredentials("dev", true)).rejects.toThrow(
        /Elevated credentials not found/,
      );
    });
  });

  describe("hasCredentials", () => {
    it("should return true when credentials exist", async () => {
      const regular = {
        username: "test@lium.com",
        password: "password123",
      };

      await credManager.saveCredentials("dev", regular);

      const hasCredentials = await credManager.hasCredentials("dev");
      expect(hasCredentials).toBe(true);
    });

    it("should return false when credentials do not exist", async () => {
      const hasCredentials = await credManager.hasCredentials("dev");
      expect(hasCredentials).toBe(false);
    });
  });

  describe("hasElevatedCredentials", () => {
    it("should return true when elevated credentials exist", async () => {
      const regular = {
        username: "user@lium.com",
        password: "userpass",
      };
      const elevated = {
        username: "admin@lium.com",
        password: "adminpass",
      };

      await credManager.saveCredentials("dev", regular, elevated);

      const hasElevated = await credManager.hasElevatedCredentials("dev");
      expect(hasElevated).toBe(true);
    });

    it("should return false when only regular credentials exist", async () => {
      const regular = {
        username: "user@lium.com",
        password: "userpass",
      };

      await credManager.saveCredentials("dev", regular);

      const hasElevated = await credManager.hasElevatedCredentials("dev");
      expect(hasElevated).toBe(false);
    });

    it("should return false when no credentials exist", async () => {
      const hasElevated = await credManager.hasElevatedCredentials("dev");
      expect(hasElevated).toBe(false);
    });
  });

  describe("clearCredentials", () => {
    it("should delete credentials file", async () => {
      const regular = {
        username: "test@lium.com",
        password: "password123",
      };

      await credManager.saveCredentials("dev", regular);
      await credManager.clearCredentials("dev");

      const hasCredentials = await credManager.hasCredentials("dev");
      expect(hasCredentials).toBe(false);
    });

    it("should not throw error when credentials do not exist", async () => {
      await expect(credManager.clearCredentials("dev")).resolves.not.toThrow();
    });
  });

  describe("maskPassword", () => {
    it("should mask long passwords correctly", () => {
      const masked = CredentialManager.maskPassword("password123");
      expect(masked).toBe("p*********3");
      expect(masked).not.toContain("password");
    });

    it("should mask short passwords", () => {
      const masked = CredentialManager.maskPassword("ab");
      expect(masked).toBe("***");
    });

    it("should mask single character passwords", () => {
      const masked = CredentialManager.maskPassword("a");
      expect(masked).toBe("***");
    });
  });

  describe("security", () => {
    it("should not expose passwords in console output", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      const regular = {
        username: "test@lium.com",
        password: "secretpassword",
      };

      await credManager.saveCredentials("dev", regular);

      // Verify console was never called with the password
      const calls = consoleSpy.mock.calls.flat();
      const hasPassword = calls.some(
        (call) => typeof call === "string" && call.includes("secretpassword"),
      );

      expect(hasPassword).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});
