/**
 * RGS CLI - Output Utilities
 *
 * Helper functions for formatted CLI output.
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';

/**
 * Create a spinner for long-running operations
 */
export function createSpinner(text: string): Ora {
  return ora(text);
}

/**
 * Print success message
 */
export function printSuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

/**
 * Print error message
 */
export function printError(message: string): void {
  console.error(chalk.red('✗'), message);
}

/**
 * Print warning message
 */
export function printWarning(message: string): void {
  console.warn(chalk.yellow('⚠'), message);
}

/**
 * Print info message
 */
export function printInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Print a section header
 */
export function printHeader(text: string): void {
  console.log('\n' + chalk.bold.cyan(text));
  console.log(chalk.cyan('='.repeat(text.length)));
}

/**
 * Print a summary box
 */
export function printSummary(title: string, items: Array<[string, string | number]>): void {
  console.log('\n' + chalk.bold(title));
  console.log(chalk.gray('─'.repeat(50)));

  const maxKeyLength = Math.max(...items.map(([key]) => key.length));

  items.forEach(([key, value]) => {
    const paddedKey = key.padEnd(maxKeyLength);
    console.log(`  ${chalk.cyan(paddedKey)}: ${chalk.white(value)}`);
  });

  console.log(chalk.gray('─'.repeat(50)));
}
