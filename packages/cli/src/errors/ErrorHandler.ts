/**
 * Error handler for CLI
 */

import chalk from 'chalk';
import { CLIError, ExitCode, ValidationError } from './CLIError';

/**
 * Format and display error messages
 */
export class ErrorHandler {
  /**
   * Handle an error and exit the process
   * @param error - The error to handle
   * @param verbose - Whether to show stack traces
   */
  public static handle(error: unknown, verbose: boolean = false): never {
    if (error instanceof ValidationError) {
      console.error(chalk.red.bold('✗ Validation Error'));
      console.error(chalk.red(error.message));
      if (error.errors.length > 0) {
        console.error(chalk.yellow('\nValidation errors:'));
        error.errors.forEach((err) => {
          console.error(chalk.yellow(`  - ${err}`));
        });
      }
      process.exit(error.exitCode);
    }

    if (error instanceof CLIError) {
      console.error(chalk.red.bold(`✗ ${error.name}`));
      console.error(chalk.red(error.message));
      if (verbose && error.stack !== undefined) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
      }
      process.exit(error.exitCode);
    }

    if (error instanceof Error) {
      console.error(chalk.red.bold('✗ Unexpected Error'));
      console.error(chalk.red(error.message));
      if (verbose && error.stack !== undefined) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
      }
      process.exit(ExitCode.ERROR);
    }

    console.error(chalk.red.bold('✗ Unknown Error'));
    console.error(chalk.red(String(error)));
    process.exit(ExitCode.ERROR);
  }

  /**
   * Format an error message without exiting
   * @param error - The error to format
   * @returns Formatted error message
   */
  public static format(error: unknown): string {
    if (error instanceof CLIError) {
      return `${error.name}: ${error.message}`;
    }

    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }

    return String(error);
  }
}
