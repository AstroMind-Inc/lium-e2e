/**
 * CLI Prompts
 * Interactive prompts for user input
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import type { Environment, Pillar } from '../../shared/types/index.js';
import { envSelector } from '../../shared/environment/env-selector.js';
import { credentialManager } from '../../shared/credentials/credential-manager.js';
import { moduleScanner } from '../../shared/test-discovery/module-scanner.js';

export class CLIPrompts {
  /**
   * Prompt for environment selection
   */
  async promptForEnvironment(): Promise<Environment> {
    const availableEnvs = await envSelector.getAvailableEnvironments();

    const { environment } = await inquirer.prompt<{ environment: Environment }>([
      {
        type: 'list',
        name: 'environment',
        message: 'Select environment:',
        choices: availableEnvs.map(env => ({
          name: this.formatEnvironmentName(env),
          value: env,
        })),
      },
    ]);

    return environment;
  }

  /**
   * Prompt for test pillar selection
   */
  async promptForPillar(): Promise<Pillar> {
    const { pillar } = await inquirer.prompt<{ pillar: Pillar }>([
      {
        type: 'list',
        name: 'pillar',
        message: 'Select test pillar:',
        choices: [
          {
            name: '🌐 Synthetic (Browser Tests)',
            value: 'synthetic',
          },
          {
            name: '🔗 Integration (API Tests)',
            value: 'integration',
          },
          {
            name: '⚡ Performance (Load Tests)',
            value: 'performance',
          },
        ],
      },
    ]);

    return pillar;
  }

  /**
   * Prompt for test module selection (for synthetic tests)
   * Auto-discovers modules from filesystem
   */
  async promptForModule(): Promise<string | null | 'back'> {
    // Scan for available modules
    const modules = await moduleScanner.scanModules('synthetic');

    // Build choices dynamically
    const choices = [
      {
        name: '🎯 All Modules (complete test suite)',
        value: 'all',
      },
      {
        name: '⬅️  Back to pillar selection',
        value: 'back',
      },
      {
        name: '━'.repeat(40),
        disabled: true,
      },
    ];

    // Add discovered modules (show count)
    for (const module of modules) {
      const icon = moduleScanner.getModuleIcon(module.name);
      const countStr = module.testCount === 0
        ? chalk.gray(`(0 tests)`)
        : chalk.cyan(`(${module.testCount} test${module.testCount > 1 ? 's' : ''})`);
      choices.push({
        name: `${icon} ${module.displayName} ${countStr} - ${module.description}`,
        value: module.name,
      });
    }

    const { module } = await inquirer.prompt<{ module: string }>([
      {
        type: 'list',
        name: 'module',
        message: 'Select test module:',
        choices,
      },
    ]);

    if (module === 'back') return 'back';
    return module === 'all' ? null : module;
  }

  /**
   * Prompt for integration test module selection
   * Auto-discovers modules from filesystem
   */
  async promptForIntegrationModule(): Promise<string | null | 'back'> {
    // Scan for available modules
    const modules = await moduleScanner.scanModules('integration');

    // Build choices dynamically
    const choices = [
      {
        name: '🎯 All APIs (complete test suite)',
        value: 'all',
      },
      {
        name: '⬅️  Back to pillar selection',
        value: 'back',
      },
      {
        name: '━'.repeat(40),
        disabled: true,
      },
    ];

    // Add discovered modules (show count)
    for (const module of modules) {
      const icon = moduleScanner.getModuleIcon(module.name);
      const countStr = module.testCount === 0
        ? chalk.gray(`(0 tests)`)
        : chalk.cyan(`(${module.testCount} test${module.testCount > 1 ? 's' : ''})`);
      choices.push({
        name: `${icon} ${module.displayName} ${countStr} - ${module.description}`,
        value: module.name,
      });
    }

    const { module } = await inquirer.prompt<{ module: string }>([
      {
        type: 'list',
        name: 'module',
        message: 'Select API module:',
        choices,
      },
    ]);

    if (module === 'back') return 'back';
    return module === 'all' ? null : module;
  }

  /**
   * Prompt for credentials setup
   */
  async promptForCredentials(environment: Environment): Promise<{
    username: string;
    password: string;
    auth0ClientId?: string;
  }> {
    console.log(`\n🔐 Setup credentials for: ${this.formatEnvironmentName(environment)}`);
    console.log('━'.repeat(50));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Username/Email:',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Username is required';
          }
          return true;
        },
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Password is required';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'auth0ClientId',
        message: 'Auth0 Client ID (optional):',
      },
    ]);

    return answers;
  }

  /**
   * Prompt for elevated credentials
   */
  async promptForElevatedCredentials(environment: Environment): Promise<{
    username: string;
    password: string;
  } | null> {
    const { needElevated } = await inquirer.prompt<{ needElevated: boolean }>([
      {
        type: 'confirm',
        name: 'needElevated',
        message: 'Setup elevated/admin credentials?',
        default: false,
      },
    ]);

    if (!needElevated) {
      return null;
    }

    console.log(`\n🔑 Setup elevated credentials for: ${this.formatEnvironmentName(environment)}`);
    console.log('━'.repeat(50));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Admin Username/Email:',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Username is required';
          }
          return true;
        },
      },
      {
        type: 'password',
        name: 'password',
        message: 'Admin Password:',
        mask: '*',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Password is required';
          }
          return true;
        },
      },
    ]);

    return answers;
  }

  /**
   * Ask if user wants to use saved credentials
   */
  async promptToUseSavedCredentials(environment: Environment): Promise<boolean> {
    const hasCreds = await credentialManager.hasCredentials(environment);

    if (!hasCreds) {
      return false;
    }

    const { useSaved } = await inquirer.prompt<{ useSaved: boolean }>([
      {
        type: 'confirm',
        name: 'useSaved',
        message: `Use saved credentials for ${this.formatEnvironmentName(environment)}?`,
        default: true,
      },
    ]);

    return useSaved;
  }

  /**
   * Confirm action
   */
  async confirm(message: string, defaultValue: boolean = true): Promise<boolean> {
    const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue,
      },
    ]);

    return confirmed;
  }

  /**
   * Prompt for main menu action
   */
  async promptForMainAction(): Promise<'run' | 'results' | 'exit'> {
    const { action } = await inquirer.prompt<{
      action: 'run' | 'results' | 'exit';
    }>([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          {
            name: '▶️  Run Tests',
            value: 'run',
          },
          {
            name: '📊 View Results',
            value: 'results',
          },
          {
            name: '❌ Exit',
            value: 'exit',
          },
        ],
      },
    ]);

    return action;
  }

  /**
   * Prompt for number of days for results
   */
  async promptForResultsDays(): Promise<number> {
    const { days } = await inquirer.prompt<{ days: string }>([
      {
        type: 'list',
        name: 'days',
        message: 'Show results from:',
        choices: [
          { name: 'Last 24 hours', value: '1' },
          { name: 'Last 7 days', value: '7' },
          { name: 'Last 30 days', value: '30' },
          { name: 'All time', value: '365' },
        ],
      },
    ]);

    return parseInt(days, 10);
  }

  /**
   * Format environment name for display
   */
  private formatEnvironmentName(env: Environment): string {
    const names: Record<Environment, string> = {
      local: '🏠 Local',
      dev: '🔧 Development',
      sandbox: '🏖️  Sandbox',
      staging: '🎭 Staging',
    };

    return names[env] || env;
  }
}

// Export singleton instance
export const cliPrompts = new CLIPrompts();
