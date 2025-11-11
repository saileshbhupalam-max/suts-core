/**
 * Structured logging utility
 */

import chalk from 'chalk';

/**
 * Log levels
 */
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success',
  DEBUG = 'debug',
}

/**
 * Logger for CLI output
 */
export class Logger {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  /**
   * Log an info message
   * @param message - Message to log
   */
  public info(message: string): void {
    // eslint-disable-next-line no-console
    console.log(chalk.blue('ℹ'), message);
  }

  /**
   * Log a warning message
   * @param message - Message to log
   */
  public warn(message: string): void {
    // eslint-disable-next-line no-console
    console.log(chalk.yellow('⚠'), message);
  }

  /**
   * Log an error message
   * @param message - Message to log
   */
  public error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  /**
   * Log a success message
   * @param message - Message to log
   */
  public success(message: string): void {
    // eslint-disable-next-line no-console
    console.log(chalk.green('✓'), message);
  }

  /**
   * Log a debug message (only if verbose is enabled)
   * @param message - Message to log
   */
  public debug(message: string): void {
    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log(chalk.gray('⋮'), chalk.gray(message));
    }
  }

  /**
   * Log a message with custom formatting
   * @param level - Log level
   * @param message - Message to log
   */
  public log(level: LogLevel, message: string): void {
    switch (level) {
      case LogLevel.INFO:
        this.info(message);
        break;
      case LogLevel.WARN:
        this.warn(message);
        break;
      case LogLevel.ERROR:
        this.error(message);
        break;
      case LogLevel.SUCCESS:
        this.success(message);
        break;
      case LogLevel.DEBUG:
        this.debug(message);
        break;
    }
  }

  /**
   * Enable or disable verbose logging
   * @param enabled - Whether to enable verbose logging
   */
  public setVerbose(enabled: boolean): void {
    this.verbose = enabled;
  }

  /**
   * Check if verbose logging is enabled
   * @returns True if verbose logging is enabled
   */
  public isVerbose(): boolean {
    return this.verbose;
  }
}
