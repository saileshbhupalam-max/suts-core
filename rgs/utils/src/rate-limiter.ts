/**
 * RGS Rate Limiting Module
 *
 * Implements token bucket algorithm for rate limiting with:
 * - Configurable requests per minute
 * - Burst capacity support
 * - Automatic backoff when rate limited
 * - Circuit breaker pattern (opens after consecutive failures)
 */

import { RateLimitError } from './errors';
import { Logger } from './logger';

/**
 * Rate limiter configuration options
 */
export interface RateLimiterOptions {
  /** Maximum requests per minute */
  requestsPerMinute: number;
  /** Maximum burst size (tokens that can accumulate) */
  burstSize?: number;
  /** Circuit breaker failure threshold (default: 5) */
  circuitBreakerThreshold?: number;
  /** Circuit breaker reset timeout in ms (default: 60000 = 1 minute) */
  circuitBreakerResetMs?: number;
  /** Logger instance */
  logger?: Logger;
}

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'closed',    // Normal operation
  OPEN = 'open',        // Blocking all requests
  HALF_OPEN = 'half_open' // Testing if service recovered
}

/**
 * Token bucket rate limiter with circuit breaker
 *
 * Uses the token bucket algorithm to enforce rate limits:
 * - Tokens are added at a constant rate (requestsPerMinute / 60 per second)
 * - Each request consumes one token
 * - Requests wait if no tokens available
 * - Includes circuit breaker to fail fast after consecutive failures
 */
export class RateLimiter {
  private readonly requestsPerMinute: number;
  private readonly burstSize: number;
  private readonly tokensPerMs: number;
  private readonly circuitBreakerThreshold: number;
  private readonly circuitBreakerResetMs: number;
  private readonly logger: Logger | undefined;

  private tokens: number;
  private lastRefillTime: number;
  private circuitState: CircuitState = CircuitState.CLOSED;
  private consecutiveFailures: number = 0;
  private circuitOpenTime: number | undefined;
  private pendingRequests: number = 0;

  /**
   * Creates a new RateLimiter instance
   *
   * @param options - Rate limiter configuration
   */
  constructor(options: RateLimiterOptions) {
    if (options.requestsPerMinute <= 0) {
      throw new Error('requestsPerMinute must be positive');
    }

    this.requestsPerMinute = options.requestsPerMinute;
    this.burstSize = options.burstSize ?? Math.max(10, Math.floor(options.requestsPerMinute / 6));
    this.tokensPerMs = options.requestsPerMinute / 60000; // Convert per minute to per millisecond
    this.circuitBreakerThreshold = options.circuitBreakerThreshold ?? 5;
    this.circuitBreakerResetMs = options.circuitBreakerResetMs ?? 60000;
    if (options.logger !== undefined) {
      this.logger = options.logger;
    }

    this.tokens = this.burstSize;
    this.lastRefillTime = Date.now();
  }

  /**
   * Refills tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastRefillTime;
    const tokensToAdd = elapsedMs * this.tokensPerMs;

    this.tokens = Math.min(this.burstSize, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  /**
   * Checks if circuit breaker should transition from OPEN to HALF_OPEN
   */
  private checkCircuitBreaker(): void {
    if (this.circuitState === CircuitState.OPEN && this.circuitOpenTime !== undefined) {
      const now = Date.now();
      if (now - this.circuitOpenTime >= this.circuitBreakerResetMs) {
        this.circuitState = CircuitState.HALF_OPEN;
        this.logger?.info('Circuit breaker transitioning to HALF_OPEN', {
          consecutiveFailures: this.consecutiveFailures
        });
      }
    }
  }

  /**
   * Records a successful request
   */
  private recordSuccess(): void {
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.circuitState = CircuitState.CLOSED;
      this.consecutiveFailures = 0;
      this.circuitOpenTime = undefined;
      this.logger?.info('Circuit breaker closed after successful request');
    } else if (this.circuitState === CircuitState.CLOSED && this.consecutiveFailures > 0) {
      this.consecutiveFailures = 0;
    }
  }

  /**
   * Records a failed request
   */
  private recordFailure(): void {
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= this.circuitBreakerThreshold) {
      this.circuitState = CircuitState.OPEN;
      this.circuitOpenTime = Date.now();
      this.logger?.error('Circuit breaker opened', {
        consecutiveFailures: this.consecutiveFailures,
        threshold: this.circuitBreakerThreshold
      });
    }
  }

  /**
   * Waits for a token to become available
   *
   * @returns Promise that resolves when a token is available
   */
  private async waitForToken(): Promise<void> {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Calculate wait time for next token
    const tokensNeeded = 1 - this.tokens;
    const waitMs = Math.ceil(tokensNeeded / this.tokensPerMs);

    this.logger?.debug('Rate limit reached, waiting for token', {
      waitMs,
      pendingRequests: this.pendingRequests,
      availableTokens: this.tokens
    });

    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));

    // Recursively try again after waiting
    return this.waitForToken();
  }

  /**
   * Executes a function with rate limiting and circuit breaker protection
   *
   * @param fn - Async function to execute
   * @returns Promise resolving to the function's result
   * @throws RateLimitError if circuit breaker is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit breaker state
    this.checkCircuitBreaker();

    if (this.circuitState === CircuitState.OPEN) {
      const waitTime = this.circuitOpenTime !== undefined
        ? Math.max(0, this.circuitBreakerResetMs - (Date.now() - this.circuitOpenTime))
        : this.circuitBreakerResetMs;

      throw new RateLimitError(
        'Circuit breaker is open due to consecutive failures',
        'rate-limiter',
        waitTime
      );
    }

    // Acquire token
    this.pendingRequests++;
    try {
      await this.waitForToken();
    } catch (error) {
      this.pendingRequests--;
      throw error;
    }
    this.pendingRequests--;

    // Execute function
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Gets current rate limiter statistics
   */
  getStats(): {
    availableTokens: number;
    burstSize: number;
    requestsPerMinute: number;
    circuitState: string;
    consecutiveFailures: number;
    pendingRequests: number;
  } {
    this.refillTokens();
    return {
      availableTokens: this.tokens,
      burstSize: this.burstSize,
      requestsPerMinute: this.requestsPerMinute,
      circuitState: this.circuitState,
      consecutiveFailures: this.consecutiveFailures,
      pendingRequests: this.pendingRequests
    };
  }

  /**
   * Manually resets the circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitState = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.circuitOpenTime = undefined;
    this.logger?.info('Circuit breaker manually reset');
  }
}
