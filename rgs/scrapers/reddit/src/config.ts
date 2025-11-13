/**
 * Reddit Scraper Configuration
 *
 * Defines configuration types and validation for Reddit scraping operations.
 */

import { z } from 'zod';

/**
 * Reddit API configuration
 */
export interface RedditConfig {
  /** Reddit OAuth client ID (from REDDIT_CLIENT_ID env) */
  readonly clientId: string;

  /** Reddit OAuth client secret (from REDDIT_CLIENT_SECRET env) */
  readonly clientSecret: string;

  /** Reddit API user agent (e.g., "RGS/1.0") */
  readonly userAgent: string;

  /** List of subreddit names to scrape (without r/ prefix) */
  readonly subreddits: string[];

  /** Number of posts to fetch per subreddit */
  readonly postsPerSubreddit: number;

  /** Sort order for posts: 'hot', 'new', or 'top' */
  readonly sort: 'hot' | 'new' | 'top';

  /** Rate limit in requests per minute (Reddit API limit is 60) */
  readonly rateLimit: number;
}

/**
 * Zod schema for RedditConfig validation
 */
export const RedditConfigSchema = z.object({
  clientId: z.string().min(1, 'Reddit client ID is required'),
  clientSecret: z.string().min(1, 'Reddit client secret is required'),
  userAgent: z.string().min(1, 'User agent is required'),
  subreddits: z
    .array(z.string().min(1))
    .min(1, 'At least one subreddit is required')
    .refine(
      (subs) => subs.every((sub) => !/^r\//.test(sub)),
      'Subreddit names should not include r/ prefix'
    ),
  postsPerSubreddit: z
    .number()
    .int()
    .positive()
    .max(1000, 'Posts per subreddit cannot exceed 1000'),
  sort: z.enum(['hot', 'new', 'top']),
  rateLimit: z
    .number()
    .positive()
    .max(60, 'Rate limit cannot exceed 60 requests/minute (Reddit API limit)'),
});

/**
 * Default Reddit configuration values
 */
export const DEFAULT_REDDIT_CONFIG: Partial<RedditConfig> = {
  userAgent: 'RGS/1.0',
  postsPerSubreddit: 100,
  sort: 'hot',
  rateLimit: 60,
};

/**
 * Creates a validated Reddit configuration from environment variables and overrides
 *
 * @param overrides - Optional configuration overrides
 * @returns Validated RedditConfig
 * @throws Error if validation fails or required env vars are missing
 */
export function createRedditConfig(overrides?: Partial<RedditConfig>): RedditConfig {
  const clientId = process.env['REDDIT_CLIENT_ID'];
  const clientSecret = process.env['REDDIT_CLIENT_SECRET'];

  if (clientId === undefined || clientId === null || clientId.trim().length === 0) {
    throw new Error('REDDIT_CLIENT_ID environment variable is required');
  }

  if (clientSecret === undefined || clientSecret === null || clientSecret.trim().length === 0) {
    throw new Error('REDDIT_CLIENT_SECRET environment variable is required');
  }

  const config: RedditConfig = {
    clientId,
    clientSecret,
    userAgent: overrides?.userAgent ?? DEFAULT_REDDIT_CONFIG.userAgent ?? 'RGS/1.0',
    subreddits: overrides?.subreddits ?? ['vscode', 'programming', 'cursor'],
    postsPerSubreddit:
      overrides?.postsPerSubreddit ?? DEFAULT_REDDIT_CONFIG.postsPerSubreddit ?? 100,
    sort: overrides?.sort ?? DEFAULT_REDDIT_CONFIG.sort ?? 'hot',
    rateLimit: overrides?.rateLimit ?? DEFAULT_REDDIT_CONFIG.rateLimit ?? 60,
  };

  // Validate the configuration
  const result = RedditConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid Reddit configuration: ${result.error.message}`);
  }

  return config;
}

/**
 * Validates a subreddit name
 *
 * @param subreddit - Subreddit name to validate
 * @returns true if valid, false otherwise
 */
export function isValidSubreddit(subreddit: string): boolean {
  if (subreddit.trim().length === 0) {
    return false;
  }

  // Should not start with r/
  if (subreddit.startsWith('r/')) {
    return false;
  }

  // Should only contain alphanumeric characters and underscores
  return /^[a-zA-Z0-9_]+$/.test(subreddit);
}
