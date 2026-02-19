/**
 * Result Writer
 * Writes test results to JSONL (JSON Lines) format
 */

import { appendFile, writeFile, readFile, mkdir } from 'fs/promises';
import { resolve, join } from 'path';
import type { TestResult, Pillar } from '../types/index.js';

export class ResultWriter {
  private resultsDir: string;

  constructor(resultsDir: string = './results') {
    this.resultsDir = resolve(resultsDir);
  }

  /**
   * Write a single test result to JSONL file
   */
  async writeResult(result: TestResult): Promise<void> {
    const filename = this.getFilename(result.pillar, result.environment);

    try {
      // Ensure results directory exists
      await mkdir(this.resultsDir, { recursive: true });

      // Append result as JSON line
      const line = JSON.stringify(result) + '\n';
      await appendFile(filename, line);

      // Update index
      await this.updateIndex(result.pillar, result.environment);
    } catch (error) {
      throw new Error(
        `Failed to write result: ${(error as Error).message}`
      );
    }
  }

  /**
   * Write multiple test results in batch
   */
  async writeResults(results: TestResult[]): Promise<void> {
    if (results.length === 0) {
      return;
    }

    // Group results by pillar and environment
    const grouped = this.groupResults(results);

    for (const [key, groupResults] of Object.entries(grouped)) {
      const [pillar, environment] = key.split(':');
      const filename = this.getFilename(pillar as Pillar, environment);

      try {
        // Ensure results directory exists
        await mkdir(this.resultsDir, { recursive: true });

        // Write all results as JSON lines
        const lines = groupResults.map(r => JSON.stringify(r)).join('\n') + '\n';
        await appendFile(filename, lines);

        // Update index
        await this.updateIndex(pillar as Pillar, environment);
      } catch (error) {
        throw new Error(
          `Failed to write results for ${pillar}/${environment}: ${(error as Error).message}`
        );
      }
    }
  }

  /**
   * Update results index for quick lookups
   */
  private async updateIndex(pillar: Pillar, environment: string): Promise<void> {
    const indexPath = join(this.resultsDir, 'index.json');

    try {
      let index: Record<string, any> = {};

      // Load existing index
      try {
        const content = await readFile(indexPath, 'utf-8');
        index = JSON.parse(content);
      } catch {
        // Index doesn't exist yet, create new one
      }

      const key = `${pillar}:${environment}`;
      const date = new Date().toISOString().split('T')[0];

      // Update index entry
      index[key] = {
        pillar,
        environment,
        lastUpdated: new Date().toISOString(),
        latestFile: this.getFilename(pillar, environment),
        date,
      };

      // Write updated index
      await writeFile(indexPath, JSON.stringify(index, null, 2));
    } catch (error) {
      // Index update is non-critical, just log error
      console.warn(`Failed to update index: ${(error as Error).message}`);
    }
  }

  /**
   * Get filename for results
   */
  private getFilename(pillar: string, environment: string): string {
    const date = new Date().toISOString().split('T')[0];
    return join(this.resultsDir, `${pillar}-${environment}-${date}.jsonl`);
  }

  /**
   * Group results by pillar and environment
   */
  private groupResults(results: TestResult[]): Record<string, TestResult[]> {
    return results.reduce((acc, result) => {
      const key = `${result.pillar}:${result.environment}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(result);
      return acc;
    }, {} as Record<string, TestResult[]>);
  }
}

// Export singleton instance
export const resultWriter = new ResultWriter();
