#!/usr/bin/env node

/**
 * Lium E2E Testing Framework - CLI
 * Main entry point for the interactive CLI
 */

import chalk from 'chalk';
import ora from 'ora';
import { cliPrompts } from './prompts.js';
import { resultsViewer } from './results-viewer.js';
import { credentialManager } from '../../shared/credentials/credential-manager.js';
import { envSelector } from '../../shared/environment/env-selector.js';
import type { Environment } from '../../shared/types/index.js';

class LiumCLI {
  /**
   * Display welcome banner
   */
  private displayBanner(): void {
    console.clear();
    console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║                                                        ║'));
    console.log(chalk.bold.cyan('║         Lium E2E Testing Framework                     ║'));
    console.log(chalk.bold.cyan('║                                                        ║'));
    console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════╝'));
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

          case 'credentials':
            await this.setupCredentialsInteractive();
            break;

          case 'results':
            await this.viewResultsInteractive();
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
    console.log(
      chalk.yellow(
        '\n⚠️  Note: Test execution requires Phases 4-6 to be implemented.'
      )
    );
    console.log(
      chalk.gray('This will be available after building the test pillars.\n')
    );

    const pillar = await cliPrompts.promptForPillar();
    const environment = await cliPrompts.promptForEnvironment();

    console.log(
      chalk.cyan(
        `\n▶️  Would run ${pillar} tests against ${environment} environment`
      )
    );
    console.log(
      chalk.gray('(Test execution coming in Phases 4-6)\n')
    );
  }

  /**
   * Run tests (command)
   */
  private async runTestsCommand(args: string[]): Promise<void> {
    // Parse arguments
    const pillarArg = args.find(arg => arg.startsWith('--pillar='));
    const envArg = args.find(arg => arg.startsWith('--environment='));

    if (pillarArg || envArg) {
      console.log(
        chalk.yellow(
          '\n⚠️  Test execution requires Phases 4-6 to be implemented.'
        )
      );
      console.log(
        chalk.gray('This will be available after building the test pillars.\n')
      );
      return;
    }

    // No arguments, go interactive
    await this.runTestsInteractive();
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
