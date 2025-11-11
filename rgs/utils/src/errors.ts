/**
 * RGS Error Handling Module
 *
 * Provides custom error classes for RGS scrapers with:
 * - Source tracking (which API/scraper failed)
 * - Retry capabilities (retryable vs non-retryable errors)
 * - Error cause chaining
 */

/**
 * Base error class for all RGS scraper errors
 */
export class ScraperError extends Error {
  /**
   * Creates a new ScraperError
   *
   * @param message - Error message describing what went wrong
   * @param source - The source/scraper that generated this error (e.g., 'reddit', 'twitter')
   * @param retryable - Whether this error can be retried
   * @param cause - Optional underlying error that caused this error
   */
  constructor(
    message: string,
    public readonly source: string,
    public readonly retryable: boolean,
    public override readonly cause?: Error
  ) {
    super(message);
    this.name = 'ScraperError';

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, ScraperError);
    }
  }

  /**
   * Converts error to JSON format for structured logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      source: this.source,
      retryable: this.retryable,
      cause:
        this.cause !== undefined
          ? {
              name: this.cause.name,
              message: this.cause.message,
              stack: this.cause.stack,
            }
          : undefined,
      stack: this.stack,
    };
  }
}

/**
 * Error thrown when rate limits are exceeded
 * Always retryable with backoff
 */
export class RateLimitError extends ScraperError {
  /**
   * Creates a new RateLimitError
   *
   * @param message - Error message
   * @param source - The source/scraper that was rate limited
   * @param retryAfterMs - Optional milliseconds to wait before retrying
   * @param cause - Optional underlying error
   */
  constructor(
    message: string,
    source: string,
    public readonly retryAfterMs?: number,
    cause?: Error
  ) {
    super(message, source, true, cause);
    this.name = 'RateLimitError';

    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, RateLimitError);
    }
  }

  /**
   * Converts error to JSON format with retry timing info
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      retryAfterMs: this.retryAfterMs,
    };
  }
}

/**
 * Error thrown for network-related failures
 * Usually retryable unless the error is permanent (e.g., DNS failure)
 */
export class NetworkError extends ScraperError {
  /**
   * Creates a new NetworkError
   *
   * @param message - Error message
   * @param source - The source/scraper that had network issues
   * @param statusCode - Optional HTTP status code
   * @param retryable - Whether this network error is retryable (default: true)
   * @param cause - Optional underlying error
   */
  constructor(
    message: string,
    source: string,
    public readonly statusCode?: number,
    retryable: boolean = true,
    cause?: Error
  ) {
    super(message, source, retryable, cause);
    this.name = 'NetworkError';

    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, NetworkError);
    }
  }

  /**
   * Converts error to JSON format with status code
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
    };
  }
}

/**
 * Error thrown for authentication/authorization failures
 * Not retryable as credentials need to be fixed
 */
export class AuthenticationError extends ScraperError {
  /**
   * Creates a new AuthenticationError
   *
   * @param message - Error message
   * @param source - The source/scraper that had auth issues
   * @param cause - Optional underlying error
   */
  constructor(message: string, source: string, cause?: Error) {
    super(message, source, false, cause);
    this.name = 'AuthenticationError';

    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }
}

/**
 * Error thrown when parsing/validation fails
 * Not retryable as the data format is invalid
 */
export class ValidationError extends ScraperError {
  /**
   * Creates a new ValidationError
   *
   * @param message - Error message
   * @param source - The source/scraper that had validation issues
   * @param cause - Optional underlying error
   */
  constructor(message: string, source: string, cause?: Error) {
    super(message, source, false, cause);
    this.name = 'ValidationError';

    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}
