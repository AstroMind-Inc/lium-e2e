#!/usr/bin/env node

/**
 * Lium E2E Testing Framework - CLI
 * Main entry point for the interactive CLI
 */

import chalk from 'chalk';
import ora from 'ora';
import { cliPrompts } from './prompts.js';
import { resultsViewer } from './results-viewer.js';
import { testRunner } from './test-runner.js';
import { credentialManager } from '../../shared/credentials/credential-manager.js';
import { envSelector } from '../../shared/environment/env-selector.js';
import type { Environment, Pillar } from '../../shared/types/index.js';

class LiumCLI {
  /**
   * Display welcome banner
   */
  private displayBanner(): void {
    console.clear();
    console.log();
    console.log(chalk.cyan('  ╦  ╦╦ ╦╔╦╗  ') + chalk.magenta('╔═╗╔═╗╔═╗'));
    console.log(chalk.cyan('  ║  ║║ ║║║║  ') + chalk.magenta('║╣ ╔═╝║╣ '));
    console.log(chalk.cyan('  ╩═╝╩╚═╝╩ ╩  ') + chalk.magenta('╚═╝╚═╝╚═╝'));
    console.log();
    console.log(chalk.gray('  End-to-End Testing Framework'));
    console.log(chalk.gray('  ─────────────────────────────'));
    console.log();
  }

  /**
   * Main CLI loop
   */
  async run(): Promise<void> {
    this.displayBanner();

    // Parse command line arguments
    const args = process.argv.slice(2);

    if (args.length > 0) {
      await this.handleCommand(args);
      return;
    }

    // Interactive mode
    await this.interactiveMode();
  }

  /**
   * Handle command line arguments
   */
  private async handleCommand(args: string[]): Promise<void> {
    const command = args[0];

    try {
      switch (command) {
        case 'setup-credentials':
          await this.setupCredentialsCommand();
          break;

        case 'run':
          await this.runTestsCommand(args.slice(1));
          break;

        case 'view-results':
          await this.viewResultsCommand();
          break;

        case '--help':
        case '-h':
          this.displayHelp();
          break;

        case '--version':
        case '-v':
          this.displayVersion();
          break;

        default:
          console.log(chalk.red(`Unknown command: ${command}`));
          console.log(chalk.gray('Run with --help for usage information'));
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${(error as Error).message}`));
      process.exit(1);
    }
  }

  /**
   * Interactive mode
   */
  private async interactiveMode(): Promise<void> {
    let running = true;

    while (running) {
      try {
        const action = await cliPrompts.promptForMainAction();

        switch (action) {
          case 'run':
            await this.runTestsInteractive();
            break;

          case 'results':
            await this.openHtmlReport();
            break;

          case 'exit':
            running = false;
            console.log(chalk.cyan('\n👋 Goodbye!\n'));
            break;
        }
      } catch (error) {
        if ((error as any).isTtyError) {
          console.error(chalk.red('Prompt could not be rendered in this environment'));
          process.exit(1);
        } else {
          console.error(chalk.red(`\n❌ Error: ${(error as Error).message}\n`));
        }
      }
    }
  }

  /**
   * Setup credentials (interactive)
   */
  private async setupCredentialsInteractive(): Promise<void> {
    const environment = await cliPrompts.promptForEnvironment();

    // Check if credentials already exist
    const hasExisting = await credentialManager.hasCredentials(environment);

    if (hasExisting) {
      const overwrite = await cliPrompts.confirm(
        `Credentials already exist for ${environment}. Overwrite?`,
        false
      );

      if (!overwrite) {
        console.log(chalk.yellow('Cancelled'));
        return;
      }
    }

    // Prompt for regular credentials
    const regular = await cliPrompts.promptForCredentials(environment);

    // Prompt for elevated credentials
    const elevated = await cliPrompts.promptForElevatedCredentials(environment);

    // Save credentials
    const spinner = ora('Saving credentials...').start();

    try {
      await credentialManager.saveCredentials(environment, regular, elevated || undefined);
      spinner.succeed(chalk.green('✓ Credentials saved successfully'));

      console.log(
        chalk.gray(`\n  Stored in: ./credentials/${environment}.json (gitignored)`)
      );
    } catch (error) {
      spinner.fail(chalk.red('Failed to save credentials'));
      throw error;
    }
  }

  /**
   * Setup credentials (command)
   */
  private async setupCredentialsCommand(): Promise<void> {
    await this.setupCredentialsInteractive();
  }

  /**
   * Run tests (interactive)
   */
  private async runTestsInteractive(): Promise<void> {
    const pillar = await cliPrompts.promptForPillar();

    // For synthetic and integration tests, ask which module to test
    let module: string | null = null;
    if (pillar === 'synthetic') {
      module = await cliPrompts.promptForModule();
    } else if (pillar === 'integration') {
      module = await cliPrompts.promptForIntegrationModule();
    }

    const environment = await cliPrompts.promptForEnvironment();

    // Check if credentials exist
    const hasCredentials = credentialManager.hasCredentials(environment);

    if (!hasCredentials) {
      console.log(chalk.yellow(`\n⚠️  No credentials found for ${environment}\n`));
      const shouldSetup = await cliPrompts.confirm(
        'Would you like to set up credentials now?',
        true
      );

      if (shouldSetup) {
        await this.setupCredentialsInteractive();
        console.log();
      } else {
        console.log(chalk.red('Cannot run tests without credentials\n'));
        return;
      }
    }

    // Verify environment config exists
    try {
      await envSelector.loadEnvironment(environment);
    } catch (error) {
      console.log(chalk.red(`\n❌ Environment config not found for: ${environment}\n`));
      return;
    }

    // Run tests
    try {
      await testRunner.runTests({
        pillar,
        environment,
        module: module || undefined,
      });
    } catch (error) {
      console.error(chalk.red(`\n❌ Test execution failed: ${(error as Error).message}\n`));
    }
  }

  /**
   * Run tests (command)
   */
  private async runTestsCommand(args: string[]): Promise<void> {
    // Parse arguments
    const pillarArg = args.find(arg => arg.startsWith('--pillar='));
    const envArg = args.find(arg => arg.startsWith('--environment='));

    if (pillarArg && envArg) {
      const pillar = pillarArg.split('=')[1] as Pillar;
      const environment = envArg.split('=')[1] as Environment;

      // Check credentials
      const hasCredentials = credentialManager.hasCredentials(environment);

      if (!hasCredentials) {
        console.log(chalk.red(`\n❌ No credentials found for ${environment}`));
        console.log(chalk.gray('Run: npm run cli setup-credentials\n'));
        process.exit(1);
      }

      // Run tests
      try {
        await testRunner.runTests({
          pillar,
          environment,
        });
      } catch (error) {
        console.error(chalk.red(`\n❌ Test execution failed: ${(error as Error).message}\n`));
        process.exit(1);
      }

      return;
    }

    // No arguments, go interactive
    await this.runTestsInteractive();
  }

  /**
   * Open HTML report
   */
  private async openHtmlReport(): Promise<void> {
    console.log(chalk.cyan('\n📊 Opening interactive test report...\n'));

    const { spawn } = await import('child_process');

    const reportProcess = spawn('npx', ['playwright', 'show-report', 'playwright-report'], {
      stdio: 'inherit',
    });

    await new Promise<void>((resolve, reject) => {
      reportProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else if (code === 1) {
          console.log(chalk.yellow('\n⚠️  No test report found.'));
          console.log(chalk.gray('Run some tests first:\n'));
          console.log(chalk.cyan('  make test-basic    # Run basic tests'));
          console.log(chalk.cyan('  make test-auth     # Run auth tests'));
          console.log(chalk.cyan('  make test          # Interactive test runner\n'));
          resolve();
        } else {
          reject(new Error(`Report viewer exited with code ${code}`));
        }
      });

      reportProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * View results (interactive)
   */
  private async viewResultsInteractive(): Promise<void> {
    const days = await cliPrompts.promptForResultsDays();

    const spinner = ora('Loading results...').start();

    try {
      spinner.stop();
      await resultsViewer.displaySummary(days);
    } catch (error) {
      spinner.fail(chalk.red('Failed to load results'));
      throw error;
    }
  }

  /**
   * View results (command)
   */
  private async viewResultsCommand(): Promise<void> {
    await this.viewResultsInteractive();
  }

  /**
   * Display help
   */
  private displayHelp(): void {
    console.log(chalk.bold('\nLium E2E Testing Framework - CLI'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log('\nUsage:');
    console.log('  npm run cli [command] [options]');
    console.log('\nCommands:');
    console.log('  setup-credentials    Setup credentials for an environment');
    console.log('  run                  Run tests (interactive or with options)');
    console.log('  view-results         View test results');
    console.log('\nOptions:');
    console.log('  --help, -h          Show this help message');
    console.log('  --version, -v       Show version');
    console.log('\nExamples:');
    console.log('  npm run cli');
    console.log('  npm run cli setup-credentials');
    console.log('  npm run cli view-results');
    console.log();
  }

  /**
   * Display version
   */
  private displayVersion(): void {
    console.log('Lium E2E Testing Framework v1.0.0');
  }
}

// Main entry point
const cli = new LiumCLI();
cli.run().catch((error) => {
  console.error(chalk.red(`\n❌ Fatal error: ${error.message}`));
  process.exit(1);
});
