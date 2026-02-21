/**
 * Test Module Scanner
 * Auto-discovers test modules from filesystem
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TestModule {
  name: string;
  displayName: string;
  description: string;
  path: string;
}

export class ModuleScanner {
  private rootDir: string;

  constructor() {
    // Root is two levels up from this file
    this.rootDir = path.resolve(__dirname, '../..');
  }

  /**
   * Scan for test modules in a given pillar
   */
  async scanModules(pillar: 'synthetic' | 'integration'): Promise<TestModule[]> {
    const testsDir = path.join(this.rootDir, pillar, 'tests');

    try {
      const entries = await fs.readdir(testsDir, { withFileTypes: true });

      const modules: TestModule[] = [];

      for (const entry of entries) {
        // Skip non-directories
        if (!entry.isDirectory()) {
          continue;
        }

        // Skip special directories (start with _ or specific names)
        if (this.shouldSkipDirectory(entry.name)) {
          continue;
        }

        // Check if directory contains test files
        const hasTests = await this.hasTestFiles(path.join(testsDir, entry.name));
        if (!hasTests) {
          continue;
        }

        // Create module info
        modules.push({
          name: entry.name,
          displayName: this.formatDisplayName(entry.name),
          description: await this.getModuleDescription(path.join(testsDir, entry.name)),
          path: path.join(testsDir, entry.name),
        });
      }

      // Sort alphabetically by name
      modules.sort((a, b) => a.name.localeCompare(b.name));

      return modules;
    } catch (error) {
      console.warn(`Warning: Could not scan ${pillar} test modules:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Check if directory should be skipped
   */
  private shouldSkipDirectory(dirName: string): boolean {
    // Skip directories starting with underscore
    if (dirName.startsWith('_')) {
      return true;
    }

    // Skip special directories
    const skipDirs = ['user-flows', 'helpers', 'fixtures', 'utils'];
    return skipDirs.includes(dirName);
  }

  /**
   * Check if directory contains test files
   */
  private async hasTestFiles(dirPath: string): Promise<boolean> {
    try {
      const files = await fs.readdir(dirPath);
      return files.some((file) => file.endsWith('.spec.ts') || file.endsWith('.test.ts'));
    } catch {
      return false;
    }
  }

  /**
   * Format directory name for display
   */
  private formatDisplayName(dirName: string): string {
    // Convert kebab-case or snake_case to Title Case
    return dirName
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get module description from README or default
   */
  private async getModuleDescription(modulePath: string): Promise<string> {
    // Try to read description from .gitkeep or README
    const readmePath = path.join(modulePath, '.gitkeep');
    try {
      const content = await fs.readFile(readmePath, 'utf-8');
      const firstLine = content.split('\n')[0];
      // Remove markdown heading markers
      return firstLine.replace(/^#\s*/, '').trim();
    } catch {
      // Default descriptions based on common module names
      return this.getDefaultDescription(path.basename(modulePath));
    }
  }

  /**
   * Get default description for common module names
   */
  private getDefaultDescription(moduleName: string): string {
    const descriptions: Record<string, string> = {
      auth: 'Authentication & sessions',
      basic: 'Health checks & smoke tests',
      chats: 'Chat functionality',
      storage: 'File storage & uploads',
      agents: 'AI agent tests',
      tools: 'Tool functionality',
      tenants: 'Multi-tenancy',
      health: 'API health checks',
      users: 'User API endpoints',
    };

    return descriptions[moduleName] || `${this.formatDisplayName(moduleName)} tests`;
  }

  /**
   * Get emoji icon for module
   */
  getModuleIcon(moduleName: string): string {
    const icons: Record<string, string> = {
      basic: '🔍',
      auth: '🔐',
      chats: '💬',
      storage: '📁',
      agents: '🤖',
      tools: '🔧',
      tenants: '🏢',
      health: '🔍',
      users: '👥',
    };

    return icons[moduleName] || '📦';
  }
}

// Export singleton
export const moduleScanner = new ModuleScanner();
