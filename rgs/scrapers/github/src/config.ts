/**
 * RGS GitHub Scraper - Configuration
 *
 * Defines and validates GitHub scraper configuration.
 */

import { z } from 'zod';

/**
 * GitHub issue state filter
 */
export type IssueState = 'open' | 'closed' | 'all';

/**
 * GitHub search sort options
 */
export type SearchSort = 'created' | 'updated' | 'comments';

/**
 * GitHub scraper configuration
 */
export interface GitHubConfig {
  /**
   * GitHub personal access token for authentication
   * Required for higher rate limits (5000 req/hour vs 60 req/hour)
   */
  readonly token: string;

  /**
   * List of repositories to scrape (format: "owner/repo")
   * Example: ["microsoft/vscode", "cursor/cursor"]
   */
  readonly repos: readonly string[];

  /**
   * Search query keywords
   * Example: ["performance", "slow", "bug"]
   */
  readonly queries: readonly string[];

  /**
   * Whether to fetch and include issue comments
   * Default: true
   */
  readonly includeComments: boolean;

  /**
   * Filter issues by state
   * Default: 'all'
   */
  readonly state: IssueState;

  /**
   * Maximum issues to fetch per query
   * Default: 100 (GitHub API limit per page)
   */
  readonly maxIssuesPerQuery: number;

  /**
   * How to sort search results
   * Default: 'created'
   */
  readonly sort: SearchSort;

  /**
   * Rate limiting configuration
   */
  readonly rateLimit: {
    /**
     * Maximum requests per hour
     * Default: 5000 (authenticated GitHub API limit)
     */
    readonly requestsPerHour: number;
  };
}

/**
 * Default GitHub configuration values
 */
export const defaultGitHubConfig: Partial<GitHubConfig> = {
  includeComments: true,
  state: 'all',
  maxIssuesPerQuery: 100,
  sort: 'created',
  rateLimit: {
    requestsPerHour: 5000,
  },
};

/**
 * Zod schema for validating repository name format
 */
const repoNameSchema = z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/, {
  message: 'Repository must be in "owner/repo" format',
});

/**
 * Zod schema for validating GitHub token format
 * GitHub tokens can be:
 * - Personal Access Tokens (classic): ghp_...
 * - Fine-grained Personal Access Tokens: github_pat_...
 * - OAuth tokens: gho_...
 * - GitHub App tokens: ghs_...
 */
const tokenSchema = z
  .string()
  .min(1, 'GitHub token is required')
  .refine(
    (token) => {
      return (
        token.startsWith('ghp_') ||
        token.startsWith('github_pat_') ||
        token.startsWith('gho_') ||
        token.startsWith('ghs_')
      );
    },
    {
      message: 'Invalid GitHub token format',
    }
  );

/**
 * Zod schema for validating GitHub configuration
 */
export const GitHubConfigSchema = z.object({
  token: tokenSchema,
  repos: z.array(repoNameSchema).min(1, 'At least one repository is required'),
  queries: z.array(z.string().min(1, 'Query cannot be empty')).min(1, 'At least one query is required'),
  includeComments: z.boolean().default(true),
  state: z.enum(['open', 'closed', 'all']).default('all'),
  maxIssuesPerQuery: z.number().int().min(1).max(100).default(100),
  sort: z.enum(['created', 'updated', 'comments']).default('created'),
  rateLimit: z.object({
    requestsPerHour: z.number().int().min(1).max(5000).default(5000),
  }).default({ requestsPerHour: 5000 }),
});

/**
 * Validates GitHub configuration
 *
 * @param config - Configuration to validate
 * @returns Validated configuration with defaults applied
 * @throws ValidationError if configuration is invalid
 */
export function validateGitHubConfig(config: unknown): GitHubConfig {
  return GitHubConfigSchema.parse(config);
}

/**
 * Creates a GitHub configuration with defaults
 *
 * @param config - Partial configuration
 * @returns Complete configuration with defaults applied
 */
export function createGitHubConfig(config: Partial<GitHubConfig> & Pick<GitHubConfig, 'token' | 'repos' | 'queries'>): GitHubConfig {
  return validateGitHubConfig({
    ...defaultGitHubConfig,
    ...config,
  });
}

/**
 * Loads GitHub configuration from environment variables
 *
 * @returns GitHub configuration
 * @throws Error if GITHUB_TOKEN is not set
 */
export function loadGitHubConfigFromEnv(): Partial<GitHubConfig> {
  const token = process.env['GITHUB_TOKEN'];
  if (token === undefined || token.trim().length === 0) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  return {
    token,
  };
}
