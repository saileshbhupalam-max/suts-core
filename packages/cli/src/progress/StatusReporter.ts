/**
 * Real-time status reporter
 */

import { Logger } from './Logger';
import { ProgressBar } from './ProgressBar';

/**
 * Status reporter combining logger and progress bar
 */
export class StatusReporter {
  private logger: Logger;
  private progressBar: ProgressBar;

  constructor(verbose: boolean = false, showProgress: boolean = true) {
    this.logger = new Logger(verbose);
    this.progressBar = new ProgressBar(showProgress);
  }

  /**
   * Get the logger
   * @returns Logger instance
   */
  public getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get the progress bar
   * @returns ProgressBar instance
   */
  public getProgressBar(): ProgressBar {
    return this.progressBar;
  }

  /**
   * Start a new operation with progress tracking
   * @param total - Total number of steps
   * @param title - Operation title
   */
  public startOperation(total: number, title: string): void {
    this.logger.info(`Starting: ${title}`);
    this.progressBar.start(total, title);
  }

  /**
   * Update operation progress
   * @param current - Current step
   * @param status - Status message
   */
  public updateProgress(current: number, status: string): void {
    this.logger.debug(status);
    this.progressBar.update(current, status);
  }

  /**
   * Complete an operation
   * @param message - Completion message
   */
  public completeOperation(message: string): void {
    this.progressBar.stop();
    this.logger.success(message);
  }

  /**
   * Report an operation error
   * @param message - Error message
   */
  public reportError(message: string): void {
    this.progressBar.stop();
    this.logger.error(message);
  }
}
