/**
 * RGS Core - IScraper Interface
 *
 * Defines the contract for web scraper implementations.
 */

import { WebSignal } from '../models/signal';
import { SourceConfig } from '../models/source';

/**
 * Configuration for a scraping operation
 */
export interface ScrapeConfig extends SourceConfig {
  /**
   * Rate limit in requests per minute
   */
  readonly rateLimit?: number;

  /**
   * Maximum retry attempts on failure
   */
  readonly maxRetries?: number;

  /**
   * Timeout for each request in milliseconds
   */
  readonly timeout?: number;

  /**
   * Whether to include metadata in signals
   */
  readonly includeMetadata?: boolean;
}

/**
 * Result of a scraping operation
 */
export interface ScrapeResult {
  /**
   * Successfully scraped signals
   */
  readonly signals: WebSignal[];

  /**
   * Number of signals scraped
   */
  readonly count: number;

  /**
   * Errors encountered during scraping
   */
  readonly errors: Error[];

  /**
   * Whether the operation completed successfully
   */
  readonly success: boolean;

  /**
   * Additional metadata about the scrape operation
   */
  readonly metadata: {
    readonly startTime: Date;
    readonly endTime: Date;
    readonly durationMs: number;
  };
}

/**
 * Base error class for scraper errors
 */
export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ScraperError';
    Object.setPrototypeOf(this, ScraperError.prototype);
  }
}

/**
 * IScraper interface defines the contract for all web scrapers
 */
export interface IScraper {
  /**
   * Scrapes web signals based on the provided configuration
   *
   * @param config - Configuration for the scraping operation
   * @returns Promise resolving to an array of web signals
   * @throws ScraperError if scraping fails
   */
  scrape(config: ScrapeConfig): Promise<WebSignal[]>;

  /**
   * Validates a web signal to ensure it meets quality standards
   *
   * @param signal - The signal to validate
   * @returns true if the signal is valid, false otherwise
   */
  validate(signal: WebSignal): boolean;

  /**
   * Tests the connection to the source
   *
   * @returns Promise resolving to true if connection is successful
   */
  testConnection(): Promise<boolean>;
}

/**
 * Base class for scraper implementations with common functionality
 */
export abstract class BaseScraper implements IScraper {
  /**
   * Scrapes web signals - must be implemented by subclasses
   */
  abstract scrape(config: ScrapeConfig): Promise<WebSignal[]>;

  /**
   * Default validation checks for web signals
   */
  validate(signal: WebSignal): boolean {
    // Check required fields
    if (signal.id.trim().length === 0) {
      return false;
    }

    if (signal.content.trim().length === 0) {
      return false;
    }

    if (signal.url.trim().length === 0) {
      return false;
    }

    if (!(signal.timestamp instanceof Date) || isNaN(signal.timestamp.getTime())) {
      return false;
    }

    // Check optional sentiment range
    if (signal.sentiment !== undefined) {
      if (signal.sentiment < -1 || signal.sentiment > 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Tests connection to source - can be overridden by subclasses
   */
  testConnection(): Promise<boolean> {
    // Default implementation - subclasses should override
    return Promise.resolve(true);
  }

  /**
   * Helper to create a scrape result
   */
  protected createResult(
    signals: WebSignal[],
    errors: Error[],
    startTime: Date,
    endTime: Date
  ): ScrapeResult {
    return {
      signals,
      count: signals.length,
      errors,
      success: errors.length === 0,
      metadata: {
        startTime,
        endTime,
        durationMs: endTime.getTime() - startTime.getTime(),
      },
    };
  }
}
