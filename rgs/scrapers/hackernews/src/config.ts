/**
 * HackerNews Scraper Configuration
 *
 * Configuration options specific to the HackerNews Algolia API scraper.
 */

/**
 * HackerNews-specific configuration
 */
export interface HNConfig {
  /**
   * Search queries to execute (e.g., ["vscode", "cursor ai", "copilot"])
   */
  readonly queries: string[];

  /**
   * Tags to filter by (e.g., ["story", "comment"])
   */
  readonly tags: string[];

  /**
   * Minimum points threshold for stories (filters low-quality content)
   * Default: 10
   */
  readonly minPoints?: number;

  /**
   * Whether to fetch and include comments for stories
   * Default: true
   */
  readonly includeComments: boolean;

  /**
   * Maximum results per query
   * Default: 100
   */
  readonly maxResultsPerQuery: number;

  /**
   * Rate limiting configuration
   */
  readonly rateLimit: {
    /**
     * Maximum requests per hour (Algolia limit: 10000)
     */
    readonly requestsPerHour: number;
  };
}

/**
 * Default HackerNews configuration
 */
export const DEFAULT_HN_CONFIG: HNConfig = {
  queries: ['vscode', 'cursor ai', 'github copilot'],
  tags: ['story', 'comment'],
  minPoints: 10,
  includeComments: true,
  maxResultsPerQuery: 100,
  rateLimit: {
    requestsPerHour: 10000, // Algolia's limit
  },
};

/**
 * Validates HackerNews configuration
 */
export function validateHNConfig(config: HNConfig): boolean {
  // Check queries
  if (!Array.isArray(config.queries) || config.queries.length === 0) {
    return false;
  }
  if (!config.queries.every((q) => typeof q === 'string' && q.trim().length > 0)) {
    return false;
  }

  // Check tags
  if (!Array.isArray(config.tags) || config.tags.length === 0) {
    return false;
  }
  const validTags = ['story', 'comment', 'poll', 'job', 'pollopt'];
  if (!config.tags.every((t) => validTags.includes(t))) {
    return false;
  }

  // Check minPoints
  if (config.minPoints !== undefined && (typeof config.minPoints !== 'number' || config.minPoints < 0)) {
    return false;
  }

  // Check includeComments
  if (typeof config.includeComments !== 'boolean') {
    return false;
  }

  // Check maxResultsPerQuery
  if (typeof config.maxResultsPerQuery !== 'number' || config.maxResultsPerQuery <= 0 || config.maxResultsPerQuery > 1000) {
    return false;
  }

  // Check rate limit
  if (typeof config.rateLimit !== 'object' || config.rateLimit === null) {
    return false;
  }
  if (typeof config.rateLimit.requestsPerHour !== 'number' || config.rateLimit.requestsPerHour <= 0) {
    return false;
  }

  return true;
}
