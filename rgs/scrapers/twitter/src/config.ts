/**
 * Twitter Scraper Configuration
 *
 * Configuration for Twitter API v2 scraping with rate limiting
 */

import { z } from 'zod';

/**
 * Rate limit configuration for Twitter API v2
 */
export interface TwitterRateLimitConfig {
  /**
   * Maximum requests per 15 minutes (Twitter API v2 limit)
   */
  readonly requestsPer15Min: number;
}

/**
 * Twitter scraper configuration
 */
export interface TwitterConfig {
  /**
   * Twitter API bearer token (from TWITTER_BEARER_TOKEN env)
   */
  readonly bearerToken: string;

  /**
   * Search queries to execute
   */
  readonly queries: string[];

  /**
   * Maximum results per query (10-100)
   */
  readonly maxResultsPerQuery: number;

  /**
   * Whether to exclude retweets
   */
  readonly excludeRetweets: boolean;

  /**
   * Language filters (e.g., ["en"])
   */
  readonly languages?: string[];

  /**
   * Rate limit configuration
   */
  readonly rateLimit: TwitterRateLimitConfig;
}

/**
 * Zod schema for Twitter configuration validation
 */
export const TwitterConfigSchema = z.object({
  bearerToken: z.string().min(1, 'Bearer token is required'),
  queries: z.array(z.string().min(1)).min(1, 'At least one query is required'),
  maxResultsPerQuery: z
    .number()
    .int()
    .min(10, 'Max results must be at least 10')
    .max(100, 'Max results cannot exceed 100'),
  excludeRetweets: z.boolean(),
  languages: z.array(z.string()).optional(),
  rateLimit: z.object({
    requestsPer15Min: z.number().int().positive(),
  }),
});

/**
 * Default Twitter configuration
 */
export const DEFAULT_TWITTER_CONFIG: Omit<TwitterConfig, 'bearerToken'> = {
  queries: [
    'vscode extension -is:retweet lang:en',
    'cursor ai editor -is:retweet lang:en',
    'copilot alternative -is:retweet lang:en',
    'ai coding assistant -is:retweet lang:en',
  ],
  maxResultsPerQuery: 100,
  excludeRetweets: true,
  languages: ['en'],
  rateLimit: {
    requestsPer15Min: 450, // Twitter API v2 app auth limit
  },
};

/**
 * Validates Twitter configuration
 *
 * @param config - Configuration to validate
 * @returns true if valid
 * @throws Error if configuration is invalid
 */
export function validateTwitterConfig(config: TwitterConfig): boolean {
  const result = TwitterConfigSchema.safeParse(config);
  if (result.success === false) {
    throw new Error(`Invalid Twitter configuration: ${result.error.message}`);
  }
  return true;
}

/**
 * Creates a Twitter configuration from environment variables
 *
 * @returns TwitterConfig with values from environment
 * @throws Error if required environment variables are missing
 */
export function createTwitterConfigFromEnv(): TwitterConfig {
  const bearerToken = process.env['TWITTER_BEARER_TOKEN'];

  if (bearerToken === undefined || bearerToken === null || bearerToken.trim().length === 0) {
    throw new Error('Missing required environment variable: TWITTER_BEARER_TOKEN');
  }

  const config: TwitterConfig = {
    ...DEFAULT_TWITTER_CONFIG,
    bearerToken,
  };

  validateTwitterConfig(config);
  return config;
}

/**
 * Builds Twitter search queries with operators
 *
 * @param keywords - Keywords to search for
 * @param excludeRetweets - Whether to exclude retweets
 * @param language - Language filter (e.g., "en")
 * @returns Array of formatted search queries
 */
export function buildSearchQueries(
  keywords: string[],
  excludeRetweets: boolean,
  language?: string
): string[] {
  const queries: string[] = [];

  for (const keyword of keywords) {
    let query = keyword;

    if (excludeRetweets === true) {
      query += ' -is:retweet';
    }

    if (language !== undefined) {
      query += ` lang:${language}`;
    }

    queries.push(query);
  }

  return queries;
}
