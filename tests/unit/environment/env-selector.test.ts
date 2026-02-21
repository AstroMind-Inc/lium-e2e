/**
 * Tests for EnvironmentSelector
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { EnvironmentSelector } from "../../../shared/environment/env-selector.js";
import type { EnvironmentConfig } from "../../../shared/types/index.js";

describe("EnvironmentSelector", () => {
  const testConfigDir = join(process.cwd(), "test-config-env");
  let envSelector: EnvironmentSelector;

  const validDevConfig: EnvironmentConfig = {
    name: "dev",
    baseUrls: {
      web: "https://dev.lium.app",
      api: "https://api-dev.lium.app",
      services: {
        service1: "https://service1-dev.lium.app",
      },
    },
    auth0: {
      domain: "lium-dev.us.auth0.com",
      clientId: "test-client-id",
      audience: "https://api-dev.lium.app",
    },
    timeouts: {
      api: 30000,
      pageLoad: 60000,
    },
  };

  beforeEach(async () => {
    // Create test config directory
    await mkdir(testConfigDir, { recursive: true });
    envSelector = new EnvironmentSelector(testConfigDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testConfigDir, { recursive: true, force: true });
  });

  describe("loadEnvironment", () => {
    it("should load valid environment configuration", async () => {
      // Write test config
      await writeFile(
        join(testConfigDir, "dev.json"),
        JSON.stringify(validDevConfig),
      );

      const config = await envSelector.loadEnvironment("dev");

      expect(config.name).toBe("dev");
      expect(config.baseUrls.web).toBe("https://dev.lium.app");
      expect(config.auth0.domain).toBe("lium-dev.us.auth0.com");
    });

    it("should cache loaded configurations", async () => {
      await writeFile(
        join(testConfigDir, "dev.json"),
        JSON.stringify(validDevConfig),
      );

      const config1 = await envSelector.loadEnvironment("dev");
      const config2 = await envSelector.loadEnvironment("dev");

      expect(config1).toBe(config2); // Same object reference (cached)
    });

    it("should throw error for non-existent environment", async () => {
      await expect(envSelector.loadEnvironment("dev")).rejects.toThrow(
        /Environment configuration not found: dev/,
      );
    });

    it("should throw error for invalid JSON", async () => {
      await writeFile(join(testConfigDir, "dev.json"), "invalid json");

      await expect(envSelector.loadEnvironment("dev")).rejects.toThrow(
        /Failed to load environment config/,
      );
    });

    it("should validate required fields", async () => {
      const invalidConfig = { ...validDevConfig };
      delete (invalidConfig as any).baseUrls;

      await writeFile(
        join(testConfigDir, "dev.json"),
        JSON.stringify(invalidConfig),
      );

      await expect(envSelector.loadEnvironment("dev")).rejects.toThrow(
        /missing "baseUrls" field/,
      );
    });

    it("should validate name field matches environment", async () => {
      const wrongNameConfig = { ...validDevConfig, name: "staging" };

      await writeFile(
        join(testConfigDir, "dev.json"),
        JSON.stringify(wrongNameConfig),
      );

      await expect(envSelector.loadEnvironment("dev")).rejects.toThrow(
        /name" field is "staging" but should be "dev"/,
      );
    });

    it("should validate auth0 configuration", async () => {
      const noAuth0Config = { ...validDevConfig };
      delete (noAuth0Config as any).auth0;

      await writeFile(
        join(testConfigDir, "dev.json"),
        JSON.stringify(noAuth0Config),
      );

      await expect(envSelector.loadEnvironment("dev")).rejects.toThrow(
        /missing or incomplete "auth0" field/,
      );
    });
  });

  describe("environmentExists", () => {
    it("should return true for existing environment", async () => {
      await writeFile(
        join(testConfigDir, "dev.json"),
        JSON.stringify(validDevConfig),
      );

      const exists = await envSelector.environmentExists("dev");
      expect(exists).toBe(true);
    });

    it("should return false for non-existing environment", async () => {
      const exists = await envSelector.environmentExists("dev");
      expect(exists).toBe(false);
    });
  });

  describe("getAvailableEnvironments", () => {
    it("should return list of available environments", async () => {
      await writeFile(
        join(testConfigDir, "dev.json"),
        JSON.stringify(validDevConfig),
      );
      await writeFile(
        join(testConfigDir, "local.json"),
        JSON.stringify({ ...validDevConfig, name: "local" }),
      );

      const envs = await envSelector.getAvailableEnvironments();

      expect(envs).toContain("dev");
      expect(envs).toContain("local");
    });

    it("should filter out non-json files", async () => {
      await writeFile(
        join(testConfigDir, "dev.json"),
        JSON.stringify(validDevConfig),
      );
      await writeFile(join(testConfigDir, "README.md"), "# Readme");

      const envs = await envSelector.getAvailableEnvironments();

      expect(envs).toContain("dev");
      expect(envs).not.toContain("README");
    });

    it("should return default environments if directory does not exist", async () => {
      const nonExistentSelector = new EnvironmentSelector("./non-existent-dir");
      const envs = await nonExistentSelector.getAvailableEnvironments();

      expect(envs).toContain("local");
      expect(envs).toContain("dev");
      expect(envs).toContain("sandbox");
      expect(envs).toContain("staging");
    });
  });

  describe("clearCache", () => {
    it("should clear cached configurations", async () => {
      await writeFile(
        join(testConfigDir, "dev.json"),
        JSON.stringify(validDevConfig),
      );

      const config1 = await envSelector.loadEnvironment("dev");
      envSelector.clearCache();

      // Modify the file
      const modifiedConfig = { ...validDevConfig, name: "dev" };
      modifiedConfig.baseUrls.web = "https://modified.lium.app";
      await writeFile(
        join(testConfigDir, "dev.json"),
        JSON.stringify(modifiedConfig),
      );

      const config2 = await envSelector.loadEnvironment("dev");

      expect(config1).not.toBe(config2);
      expect(config2.baseUrls.web).toBe("https://modified.lium.app");
    });
  });
});
