/**
 * RGS Retry Logic Module
 *
 * Implements exponential backoff retry strategy with:
 * - Configurable max retries
 * - Exponential backoff (1s, 2s, 4s, 8s, ...)
 * - Jitter to prevent thundering herd
 * - Retry only for retryable errors
 */

import { ScraperError } from './errors';
import { Logger } from './logger';

/**
 * Retry policy configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial backoff delay in milliseconds (default: 1000) */
  backoffMs?: number;
  /** Maximum backoff delay in milliseconds (default: 30000) */
  maxBackoffMs?: number;
  /** Jitter factor (0-1, default: 0.1 = 10% jitter) */
  jitter?: number;
  /** Whether to retry on all errors or only ScraperErrors marked as retryable (default: false) */
  retryAllErrors?: boolean;
  /** Logger instance */
  logger?: Logger;
}

/**
 * Retry policy with exponential backoff
 *
 * Implements retry logic with:
 * - Exponential backoff: delay doubles with each retry
 * - Jitter: adds randomness to prevent thundering herd
 * - Smart error detection: only retries errors marked as retryable
 */
export class RetryPolicy {
  private readonly maxRetries: number;
  private readonly backoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly jitter: number;
  private readonly retryAllErrors: boolean;
  private readonly logger: Logger | undefined;

  /**
   * Creates a new RetryPolicy instance
   *
   * @param options - Retry configuration
   */
  constructor(options: RetryOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.backoffMs = options.backoffMs ?? 1000;
    this.maxBackoffMs = options.maxBackoffMs ?? 30000;
    this.jitter = options.jitter ?? 0.1;
    this.retryAllErrors = options.retryAllErrors ?? false;
    if (options.logger !== undefined) {
      this.logger = options.logger;
    }

    if (this.maxRetries < 0) {
      throw new Error('maxRetries must be non-negative');
    }
    if (this.backoffMs <= 0) {
      throw new Error('backoffMs must be positive');
    }
    if (this.maxBackoffMs < this.backoffMs) {
      throw new Error('maxBackoffMs must be >= backoffMs');
    }
    if (this.jitter < 0 || this.jitter > 1) {
      throw new Error('jitter must be between 0 and 1');
    }
  }

  /**
   * Checks if an error should be retried
   */
  private shouldRetry(error: unknown): boolean {
    if (this.retryAllErrors) {
      return true;
    }

    if (error instanceof ScraperError) {
      return error.retryable;
    }

    // Don't retry unknown errors by default
    return false;
  }

  /**
   * Calculates backoff delay with exponential growth and jitter
   *
   * @param attempt - Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: backoffMs * 2^attempt
    const exponentialDelay = this.backoffMs * Math.pow(2, attempt);

    // Cap at maxBackoffMs
    const cappedDelay = Math.min(exponentialDelay, this.maxBackoffMs);

    // Add jitter: random value between -jitter% and +jitter%
    const jitterRange = cappedDelay * this.jitter;
    const jitterAmount = (Math.random() * 2 - 1) * jitterRange;

    return Math.max(0, Math.floor(cappedDelay + jitterAmount));
  }

  /**
   * Waits for the specified delay
   *
   * @param delayMs - Delay in milliseconds
   */
  private async wait(delayMs: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  }

  /**
   * Executes a function with retry logic
   *
   * @param fn - Async function to execute
   * @param options - Optional retry options to override defaults
   * @returns Promise resolving to the function's result
   * @throws The last error encountered if all retries fail
   */
  async execute<T>(
    fn: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.maxRetries;
    const retryAllErrors = options?.retryAllErrors ?? this.retryAllErrors;

    let lastError: unknown;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const result = await fn();

        if (attempt > 0) {
          this.logger?.info('Operation succeeded after retry', {
            attempt,
            maxRetries
          });
        }

        return result;
      } catch (error) {
        lastError = error;

        // Check if we should retry
        const shouldRetry = retryAllErrors || this.shouldRetry(error);

        if (!shouldRetry) {
          this.logger?.debug('Error is not retryable, failing immediately', {
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }

        // Check if we have retries left
        if (attempt >= maxRetries) {
          this.logger?.error('All retry attempts exhausted', {
            attempt,
            maxRetries,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }

        // Calculate backoff and wait
        const backoffMs = this.calculateBackoff(attempt);

        this.logger?.warn('Operation failed, retrying with backoff', {
          attempt: attempt + 1,
          maxRetries,
          backoffMs,
          error: error instanceof Error ? error.message : String(error)
        });

        await this.wait(backoffMs);
        attempt++;
      }
    }

    // Should never reach here, but TypeScript doesn't know that
    throw lastError;
  }

  /**
   * Executes a function with a specific number of retries
   *
   * Convenience method for one-off retry scenarios
   *
   * @param fn - Async function to execute
   * @param maxRetries - Maximum number of retries
   * @returns Promise resolving to the function's result
   */
  async executeWithRetries<T>(
    fn: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    return this.execute(fn, { maxRetries });
  }
}

/**
 * Default retry policy instance
 */
export const defaultRetryPolicy = new RetryPolicy();

/**
 * Convenience function for executing with retry
 *
 * @param fn - Async function to execute
 * @param options - Retry options
 * @returns Promise resolving to the function's result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const policy = new RetryPolicy(options);
  return policy.execute(fn);
}
