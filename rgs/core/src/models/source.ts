/**
 * RGS Core - Source Types
 *
 * Defines the types of sources that can be scraped for web signals.
 */

/**
 * Available source types for web signal scraping
 */
export type SourceType = 'reddit' | 'twitter' | 'github' | 'hackernews';

/**
 * Configuration for source-specific scraping
 */
export interface SourceConfig {
  /**
   * Type of source to scrape
   */
  readonly type: SourceType;

  /**
   * Source-specific parameters (e.g., subreddit name, GitHub repo, etc.)
   */
  readonly params: Record<string, string>;

  /**
   * Maximum number of items to scrape
   */
  readonly maxItems?: number;

  /**
   * Time range for scraping (in hours)
   */
  readonly timeRangeHours?: number;
}

/**
 * Metadata specific to each source type
 */
export interface SourceMetadata {
  /**
   * Source type
   */
  readonly source: SourceType;

  /**
   * Raw source-specific data
   */
  readonly rawData: Record<string, unknown>;
}

/**
 * Type guard to check if a string is a valid SourceType
 */
export function isSourceType(value: string): value is SourceType {
  return ['reddit', 'twitter', 'github', 'hackernews'].includes(value);
}

/**
 * Helper to validate source configuration
 */
export function validateSourceConfig(config: SourceConfig): boolean {
  if (!isSourceType(config.type)) {
    return false;
  }

  if (typeof config.params !== 'object' || config.params === null) {
    return false;
  }

  if (
    config.maxItems !== undefined &&
    (typeof config.maxItems !== 'number' || config.maxItems <= 0)
  ) {
    return false;
  }

  if (
    config.timeRangeHours !== undefined &&
    (typeof config.timeRangeHours !== 'number' || config.timeRangeHours <= 0)
  ) {
    return false;
  }

  return true;
}
