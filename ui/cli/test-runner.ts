/**
 * Test Runner
 * Executes tests for each pillar
 */

import { spawn } from 'child_process';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import type { Pillar, Environment } from '../../shared/types/index.js';

export interface TestRunOptions {
  pillar: Pillar;
  environment: Environment;
  headed?: boolean;
  debug?: boolean;
  grep?: string;
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
    const args = [
      'playwright',
      'test',
      `${options.pillar}/`,
    ];

    // Add options
    if (options.headed) {
      args.push('--headed');
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
}

export const testRunner = new TestRunner();
