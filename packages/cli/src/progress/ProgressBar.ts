/**
 * Progress bar utility
 */

import cliProgress from 'cli-progress';
import chalk from 'chalk';

/**
 * Progress bar for long-running operations
 */
export class ProgressBar {
  private bar: cliProgress.SingleBar | null = null;
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Start the progress bar
   * @param total - Total number of steps
   * @param title - Title for the progress bar
   */
  public start(total: number, title: string): void {
    if (!this.enabled) {
      return;
    }

    this.bar = new cliProgress.SingleBar({
      format: `${chalk.cyan(title)} ${chalk.cyan('|')} {bar} ${chalk.cyan('|')} {percentage}% | {value}/{total} | {status}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    this.bar.start(total, 0, { status: 'Starting...' });
  }

  /**
   * Update progress
   * @param current - Current step number
   * @param status - Status message
   */
  public update(current: number, status: string): void {
    if (!this.enabled || this.bar === null) {
      return;
    }

    this.bar.update(current, { status });
  }

  /**
   * Increment progress by one step
   * @param status - Status message
   */
  public increment(status: string): void {
    if (!this.enabled || this.bar === null) {
      return;
    }

    this.bar.increment({ status });
  }

  /**
   * Stop the progress bar
   */
  public stop(): void {
    if (!this.enabled || this.bar === null) {
      return;
    }

    this.bar.stop();
    this.bar = null;
  }

  /**
   * Enable or disable the progress bar
   * @param enabled - Whether to enable the progress bar
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if progress bar is enabled
   * @returns True if progress bar is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
}
