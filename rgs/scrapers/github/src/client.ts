/**
 * RGS GitHub Scraper - Client
 *
 * Wraps Octokit with rate limiting and error handling.
 */

import { Octokit } from '@octokit/rest';
import { RateLimiter, RateLimitError as UtilsRateLimitError, NetworkError, AuthenticationError, ScraperError } from '@rgs/utils';
import type { GitHubIssue, GitHubComment } from './mapper';

/**
 * Options for searching issues
 */
export interface SearchOptions {
  /**
   * Number of results per page (max 100)
   */
  readonly perPage: number;

  /**
   * Page number (1-indexed)
   */
  readonly page?: number;

  /**
   * Sort field
   */
  readonly sort?: 'created' | 'updated' | 'comments';

  /**
   * Sort order
   */
  readonly order?: 'asc' | 'desc';
}

/**
 * Rate limit information from GitHub API
 */
export interface RateLimitInfo {
  readonly remaining: number;
  readonly limit: number;
  readonly reset: Date;
  readonly used: number;
}

/**
 * GitHub API client with rate limiting
 */
export class GitHubClient {
  private readonly octokit: Octokit;
  private readonly rateLimiter: RateLimiter;

  /**
   * Creates a new GitHubClient
   *
   * @param token - GitHub personal access token
   * @param rateLimiter - Rate limiter for API calls
   */
  constructor(token: string, rateLimiter: RateLimiter) {
    this.octokit = new Octokit({
      auth: token,
      userAgent: 'RGS-GitHub-Scraper/1.0',
    });
    this.rateLimiter = rateLimiter;
  }

  /**
   * Searches for issues using GitHub's search API
   *
   * @param query - Search query string
   * @param options - Search options
   * @returns Array of GitHub issues
   * @throws ScraperError on API failures
   */
  async searchIssues(query: string, options: SearchOptions): Promise<GitHubIssue[]> {
    try {
      const response = await this.rateLimiter.execute(async () => {
        return await this.octokit.search.issuesAndPullRequests({
          q: query,
          per_page: options.perPage,
          page: options.page ?? 1,
          ...(options.sort !== undefined && { sort: options.sort }),
          order: options.order ?? 'desc',
        });
      });

      // Filter out pull requests (we only want issues)
      const issues = response.data.items.filter((item: { pull_request?: unknown }) => item.pull_request === undefined);

      return issues as GitHubIssue[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a single issue by repository and issue number
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param issueNumber - Issue number
   * @returns GitHub issue
   * @throws ScraperError on API failures
   */
  async getIssue(owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
    try {
      const response = await this.rateLimiter.execute(async () => {
        return await this.octokit.issues.get({
          owner,
          repo,
          issue_number: issueNumber,
        });
      });

      return response.data as GitHubIssue;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets all comments for an issue
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param issueNumber - Issue number
   * @returns Array of GitHub comments
   * @throws ScraperError on API failures
   */
  async getIssueComments(
    owner: string,
    repo: string,
    issueNumber: number
  ): Promise<GitHubComment[]> {
    try {
      const comments: GitHubComment[] = [];
      let page = 1;
      const perPage = 100;

      // Paginate through all comments
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await this.rateLimiter.execute(async () => {
          return await this.octokit.issues.listComments({
            owner,
            repo,
            issue_number: issueNumber,
            per_page: perPage,
            page,
          });
        });

        comments.push(...(response.data as GitHubComment[]));

        // Check if there are more pages
        if (response.data.length < perPage) {
          break;
        }

        page++;
      }

      return comments;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets current rate limit status from GitHub API
   *
   * @returns Rate limit information
   * @throws ScraperError on API failures
   */
  async getRateLimitStatus(): Promise<RateLimitInfo> {
    try {
      const response = await this.octokit.rateLimit.get();
      const { remaining, limit, reset, used } = response.data.resources.core;

      return {
        remaining,
        limit,
        reset: new Date(reset * 1000),
        used,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Tests the connection to GitHub API
   *
   * @returns true if connection is successful
   * @throws ScraperError if authentication fails
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.octokit.users.getAuthenticated();
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handles errors from GitHub API and converts them to appropriate error types
   *
   * @param error - Error from GitHub API
   * @returns Appropriate ScraperError subclass
   */
  private handleError(error: unknown): Error {
    // Handle rate limiter errors (circuit breaker)
    if (error instanceof UtilsRateLimitError) {
      return error as Error;
    }

    // Handle Octokit errors
    if (this.isOctokitError(error)) {
      const status = error.status;
      const message = error.message;

      // Rate limit exceeded (403)
      if (status === 403 && message.toLowerCase().includes('rate limit')) {
        const resetTime = error.response?.headers['x-ratelimit-reset'];
        const retryAfterMs = resetTime !== undefined
          ? Math.max(0, parseInt(resetTime, 10) * 1000 - Date.now())
          : undefined;

        return new UtilsRateLimitError(
          'GitHub API rate limit exceeded',
          'github',
          retryAfterMs,
          error as unknown as Error
        );
      }

      // Authentication failed (401)
      if (status === 401) {
        return new AuthenticationError(
          'GitHub authentication failed - invalid token',
          'github',
          error as unknown as Error
        );
      }

      // Invalid query (422)
      if (status === 422) {
        return new ScraperError(
          `Invalid GitHub query: ${message}`,
          'github',
          false,
          error as unknown as Error
        );
      }

      // Not found (404)
      if (status === 404) {
        return new ScraperError(
          `GitHub resource not found: ${message}`,
          'github',
          false,
          error as unknown as Error
        );
      }

      // Network errors (5xx or timeout)
      if (status >= 500 || status === undefined) {
        return new NetworkError(
          `GitHub API network error: ${message}`,
          'github',
          status,
          true,
          error as unknown as Error
        );
      }

      // Other client errors (4xx)
      return new ScraperError(
        `GitHub API error: ${message}`,
        'github',
        false,
        error as unknown as Error
      );
    }

    // Handle generic errors
    if (error instanceof Error) {
      return new ScraperError(
        `Unexpected GitHub client error: ${error.message}`,
        'github',
        true,
        error
      );
    }

    // Unknown error type
    return new ScraperError(
      'Unknown GitHub client error',
      'github',
      true
    );
  }

  /**
   * Type guard to check if an error is an Octokit RequestError
   *
   * @param error - Error to check
   * @returns true if error is an Octokit error
   */
  private isOctokitError(error: unknown): error is {
    status: number;
    message: string;
    response?: {
      headers: Record<string, string>;
    };
  } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'message' in error
    );
  }
}
