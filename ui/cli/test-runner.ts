/**
 * Test Runner
 * Executes tests for each pillar
 */

import { spawn } from 'child_process';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import type { Pillar, Environment } from '../../shared/types/index.js';
import { refreshAuthIfNeeded } from '../../shared/auth/token-refresh.js';
import inquirer from 'inquirer';

export interface TestRunOptions {
  pillar: Pillar;
  environment: Environment;
  headed?: boolean;
  debug?: boolean;
  grep?: string;
  module?: string; // e.g., 'chats', 'storage', 'agents'
}

export interface TestRunResult {
  success: boolean;
  exitCode: number;
  duration: number;
}

export class TestRunner {
  /**
   * Run tests for a specific pillar
   */
  async runTests(options: TestRunOptions): Promise<TestRunResult> {
    const startTime = Date.now();

    console.log(chalk.cyan(`\n🚀 Running ${options.pillar} tests against ${options.environment}\n`));

    const result = await this.executeTestCommand(options);

    const duration = Date.now() - startTime;

    if (result.success) {
      console.log(chalk.green(`\n✅ Tests completed successfully in ${this.formatDuration(duration)}\n`));
    } else {
      console.log(chalk.red(`\n❌ Tests failed in ${this.formatDuration(duration)}\n`));
    }

    return {
      ...result,
      duration,
    };
  }

  /**
   * Execute test command based on pillar
   */
  private async executeTestCommand(options: TestRunOptions): Promise<{ success: boolean; exitCode: number }> {
    let spinner: Ora | null = null;

    switch (options.pillar) {
      case 'synthetic':
      case 'integration':
        return await this.runPlaywrightTests(options);

      case 'performance':
        return await this.runK6Tests(options);

      default:
        throw new Error(`Unknown pillar: ${options.pillar}`);
    }
  }

  /**
   * Run Playwright tests (synthetic or integration)
   */
  private async runPlaywrightTests(options: TestRunOptions): Promise<{ success: boolean; exitCode: number }> {
    // Check auth tokens before running tests
    const authValid = await this.checkAndRefreshAuth(options.environment);
    if (!authValid) {
      return { success: false, exitCode: 1 };
    }

    // Build test path - if module specified, target that directory
    let testPath = `${options.pillar}/`;
    if (options.module) {
      testPath = `${options.pillar}/tests/${options.module}/`;
      console.log(chalk.cyan(`📦 Running module: ${options.module}\n`));
    }

    const args = [
      'playwright',
      'test',
      testPath,
    ];

    // Only run headed for manual/interactive tests or when explicitly requested
    const shouldRunHeaded = options.headed ||
      (options.grep && (
        options.grep.toLowerCase().includes('manual') ||
        options.grep.toLowerCase().includes('poc') ||
        options.grep.toLowerCase().includes('multi-user')
      ));

    // Add options
    if (shouldRunHeaded) {
      args.push('--headed');
      console.log(chalk.yellow('📺 Running in headed mode (browser visible)\n'));
    } else {
      console.log(chalk.gray('🚀 Running in headless mode (fast!)\n'));
    }

    if (options.debug) {
      args.push('--debug');
    }

    if (options.grep) {
      args.push('--grep', options.grep);
    }

    // Set environment variables
    const env = {
      ...process.env,
      E2E_ENVIRONMENT: options.environment,
    };

    console.log(chalk.gray(`Environment: ${options.environment}`));
    console.log(chalk.gray(`E2E_ENVIRONMENT set to: ${env.E2E_ENVIRONMENT}\n`));

    return await this.spawnProcess('npx', args, env);
  }

  /**
   * Run k6 performance tests
   */
  private async runK6Tests(options: TestRunOptions): Promise<{ success: boolean; exitCode: number }> {
    // Check if k6 is installed
    const k6Installed = await this.checkK6Installed();

    if (!k6Installed) {
      console.log(chalk.red('\n❌ k6 is not installed'));
      console.log(chalk.gray('Install k6 from: https://k6.io/docs/get-started/installation/'));
      console.log(chalk.gray('  macOS: brew install k6'));
      console.log(chalk.gray('  Linux: See installation guide\n'));
      return { success: false, exitCode: 1 };
    }

    // For k6, we need to specify the test file
    // Let's run the baseline test by default
    const testFile = options.grep || 'performance/tests/load/api-baseline.js';

    const env = {
      ...process.env,
      E2E_ENVIRONMENT: options.environment,
    };

    return await this.spawnProcess('k6', ['run', testFile], env);
  }

  /**
   * Check if k6 is installed
   */
  private async checkK6Installed(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('which', ['k6']);

      proc.on('close', (code) => {
        resolve(code === 0);
      });

      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Spawn a child process and stream output
   */
  private async spawnProcess(
    command: string,
    args: string[],
    env: NodeJS.ProcessEnv
  ): Promise<{ success: boolean; exitCode: number }> {
    return new Promise((resolve) => {
      console.log(chalk.gray(`$ ${command} ${args.join(' ')}\n`));

      const proc = spawn(command, args, {
        env,
        stdio: 'inherit', // Stream output directly to console
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          exitCode: code || 0,
        });
      });

      proc.on('error', (error) => {
        console.error(chalk.red(`\n❌ Failed to execute: ${error.message}\n`));
        resolve({
          success: false,
          exitCode: 1,
        });
      });
    });
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${seconds}s`;
  }

  /**
   * Check and refresh authentication tokens
   */
  private async checkAndRefreshAuth(environment: Environment): Promise<boolean> {
    const authDir = path.resolve('./playwright/.auth');
    const adminAuthFile = path.join(authDir, 'admin.json');
    const userAuthFile = path.join(authDir, 'user.json');

    // Get base URL from environment config
    const baseUrl = await this.getBaseUrl(environment);

    console.log(chalk.cyan('🔍 Checking authentication sessions...\n'));

    let hasValidAuth = false;

    // Check admin session
    if (fs.existsSync(adminAuthFile)) {
      console.log(chalk.gray('🔐 Checking admin session...'));
      const adminValid = await refreshAuthIfNeeded(adminAuthFile, baseUrl);
      if (adminValid) {
        console.log(chalk.green('  ✓ Admin session valid'));
        hasValidAuth = true;
      } else {
        console.log(chalk.yellow('  ⚠️  Admin session expired'));
      }
    }

    // Check user session
    if (fs.existsSync(userAuthFile)) {
      console.log(chalk.gray('👤 Checking user session...'));
      const userValid = await refreshAuthIfNeeded(userAuthFile, baseUrl);
      if (userValid) {
        console.log(chalk.green('  ✓ User session valid'));
        hasValidAuth = true;
      } else {
        console.log(chalk.yellow('  ⚠️  User session expired'));
      }
    }

    // If no auth files exist at all
    if (!fs.existsSync(adminAuthFile) && !fs.existsSync(userAuthFile)) {
      console.log(chalk.yellow('⚠️  No authentication sessions found\n'));
      const { shouldSetup } = await inquirer.prompt<{ shouldSetup: boolean }>([
        {
          type: 'confirm',
          name: 'shouldSetup',
          message: 'Would you like to set up authentication now?',
          default: true,
        },
      ]);

      if (shouldSetup) {
        console.log(chalk.cyan('\n📝 Please run one of these commands to authenticate:\n'));
        console.log(chalk.cyan('  make auth-setup-admin  - Login as @astromind.com admin'));
        console.log(chalk.cyan('  make auth-setup-user   - Login as regular user\n'));
        return false;
      } else {
        console.log(chalk.red('Cannot run tests without authentication\n'));
        return false;
      }
    }

    // If auth exists but is invalid
    if (!hasValidAuth) {
      console.log(chalk.yellow('\n⚠️  Authentication sessions expired and could not be refreshed\n'));
      const { shouldReauth } = await inquirer.prompt<{ shouldReauth: boolean }>([
        {
          type: 'confirm',
          name: 'shouldReauth',
          message: 'Would you like to re-authenticate now?',
          default: true,
        },
      ]);

      if (shouldReauth) {
        console.log(chalk.cyan('\n📝 Please run one of these commands to re-authenticate:\n'));
        console.log(chalk.cyan('  make auth-setup-admin  - Re-login as admin'));
        console.log(chalk.cyan('  make auth-setup-user   - Re-login as user\n'));
        return false;
      } else {
        console.log(chalk.red('Cannot run tests with expired authentication\n'));
        return false;
      }
    }

    console.log(chalk.green('\n✅ Authentication verified\n'));
    return true;
  }

  /**
   * Get base URL for environment
   */
  private async getBaseUrl(environment: Environment): Promise<string> {
    try {
      const configPath = path.resolve(`./config/environments/${environment}.json`);
      const configFile = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configFile);
      return config.baseUrls.web;
    } catch {
      return 'http://localhost:3000';
    }
  }
}

export const testRunner = new TestRunner();
