/**
 * RGS GitHub Scraper - Main Scraper Implementation
 *
 * Implements IScraper for scraping GitHub issues and comments.
 */

import { BaseScraper, WebSignal } from '@rgs/core';
import { RateLimiter, Logger, defaultLogger } from '@rgs/utils';
import { GitHubClient } from './client';
import { GitHubConfig } from './config';
import {
  GitHubIssue,
  mapIssueToSignal,
  mapCommentToSignal,
  buildSearchQuery,
} from './mapper';

/**
 * GitHub scraper implementation
 */
export class GitHubScraper extends BaseScraper {
  private readonly client: GitHubClient;
  private readonly config: GitHubConfig;
  private readonly logger: Logger;

  /**
   * Creates a new GitHubScraper
   *
   * @param config - GitHub scraper configuration
   * @param logger - Optional logger instance
   */
  constructor(config: GitHubConfig, logger?: Logger) {
    super();
    this.config = config;
    this.logger = logger ?? defaultLogger;

    // Create rate limiter (convert requests per hour to requests per minute)
    const requestsPerMinute = Math.floor(config.rateLimit.requestsPerHour / 60);
    const rateLimiter = new RateLimiter({
      requestsPerMinute,
      burstSize: Math.min(30, Math.floor(requestsPerMinute / 2)),
      logger: this.logger,
    });

    // Create GitHub client
    this.client = new GitHubClient(config.token, rateLimiter);
  }

  /**
   * Scrapes GitHub issues and comments based on configuration
   *
   * @returns Array of web signals
   */
  async scrape(): Promise<WebSignal[]> {
    this.logger.info('Starting GitHub scrape', {
      repos: this.config.repos,
      queries: this.config.queries,
      state: this.config.state,
    });

    const signals: WebSignal[] = [];
    const seenIds = new Set<string>();

    try {
      // Iterate through each query
      for (const query of this.config.queries) {
        this.logger.debug('Processing query', { query });

        // Build search query for all repos
        const searchQuery = buildSearchQuery(
          this.config.repos,
          query,
          this.config.state
        );

        // Search for issues
        const issues = await this.searchIssues(searchQuery);

        this.logger.debug('Found issues', {
          query,
          count: issues.length,
        });

        // Process each issue
        for (const issue of issues) {
          // Extract repo from issue URL or repository_url
          const repo = this.extractRepoFromIssue(issue);
          if (repo === undefined) {
            this.logger.warn('Could not extract repo from issue', {
              issueId: issue.id,
            });
            continue;
          }

          // Map issue to signal
          const issueSignal = mapIssueToSignal(issue, repo);

          // Deduplicate by ID
          if (!seenIds.has(issueSignal.id)) {
            signals.push(issueSignal);
            seenIds.add(issueSignal.id);
          }

          // Fetch and process comments if enabled
          if (this.config.includeComments && issue.comments > 0) {
            const commentSignals = await this.scrapeComments(issue, repo);
            for (const commentSignal of commentSignals) {
              if (!seenIds.has(commentSignal.id)) {
                signals.push(commentSignal);
                seenIds.add(commentSignal.id);
              }
            }
          }
        }
      }

      // Validate all signals
      const validSignals = signals.filter((signal) => this.validate(signal));

      this.logger.info('GitHub scrape completed', {
        totalSignals: validSignals.length,
        invalidSignals: signals.length - validSignals.length,
      });

      return validSignals;
    } catch (error) {
      this.logger.error('GitHub scrape failed', { error });
      throw error;
    }
  }

  /**
   * Tests connection to GitHub API
   *
   * @returns true if connection is successful
   */
  override async testConnection(): Promise<boolean> {
    try {
      await this.client.testConnection();
      this.logger.info('GitHub connection test successful');
      return true;
    } catch (error) {
      this.logger.error('GitHub connection test failed', { error });
      return false;
    }
  }

  /**
   * Validates a web signal
   *
   * @param signal - Signal to validate
   * @returns true if signal is valid
   */
  override validate(signal: WebSignal): boolean {
    // Use base validation
    if (!super.validate(signal)) {
      return false;
    }

    // Check GitHub-specific requirements
    if (signal.source !== 'github') {
      return false;
    }

    // Verify URL format
    if (!this.isValidGitHubUrl(signal.url)) {
      return false;
    }

    return true;
  }

  /**
   * Searches for issues using the GitHub API
   *
   * @param query - Search query string
   * @returns Array of GitHub issues
   */
  private async searchIssues(query: string): Promise<GitHubIssue[]> {
    const allIssues: GitHubIssue[] = [];
    const perPage = Math.min(this.config.maxIssuesPerQuery, 100);
    let page = 1;

    // GitHub search API returns max 1000 results
    const maxPages = Math.ceil(Math.min(this.config.maxIssuesPerQuery, 1000) / perPage);

    while (page <= maxPages) {
      const issues = await this.client.searchIssues(query, {
        perPage,
        page,
        sort: this.config.sort,
        order: 'desc',
      });

      allIssues.push(...issues);

      // If we got fewer results than requested, we've reached the end
      if (issues.length < perPage) {
        break;
      }

      // Check if we've reached the max
      if (allIssues.length >= this.config.maxIssuesPerQuery) {
        break;
      }

      page++;
    }

    // Trim to exact max if we exceeded it
    return allIssues.slice(0, this.config.maxIssuesPerQuery);
  }

  /**
   * Scrapes comments for an issue
   *
   * @param issue - GitHub issue
   * @param repo - Repository name (owner/repo)
   * @returns Array of comment signals
   */
  private async scrapeComments(issue: GitHubIssue, repo: string): Promise<WebSignal[]> {
    try {
      const [owner, repoName] = repo.split('/');
      if (owner === undefined || repoName === undefined) {
        this.logger.warn('Invalid repo format', { repo });
        return [];
      }

      const comments = await this.client.getIssueComments(owner, repoName, issue.number);

      return comments.map((comment) => mapCommentToSignal(comment, issue, repo));
    } catch (error) {
      this.logger.error('Failed to fetch comments', {
        repo,
        issueNumber: issue.number,
        error,
      });
      // Return empty array instead of throwing to allow partial results
      return [];
    }
  }

  /**
   * Extracts repository name from issue
   *
   * @param issue - GitHub issue
   * @returns Repository name in "owner/repo" format
   */
  private extractRepoFromIssue(issue: GitHubIssue): string | undefined {
    // Try to extract from html_url
    // Format: https://github.com/owner/repo/issues/123
    const match = issue.html_url.match(/github\.com\/([^/]+\/[^/]+)\/issues/);
    if (match?.[1] !== undefined) {
      return match[1];
    }

    // Try to extract from repository_url
    // Format: https://api.github.com/repos/owner/repo
    if (issue.repository_url !== undefined) {
      const repoMatch = issue.repository_url.match(/repos\/([^/]+\/[^/]+)$/);
      if (repoMatch?.[1] !== undefined) {
        return repoMatch[1];
      }
    }

    return undefined;
  }

  /**
   * Validates a GitHub URL format
   *
   * @param url - URL to validate
   * @returns true if URL is a valid GitHub URL
   */
  private isValidGitHubUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'github.com' || parsed.hostname === 'api.github.com';
    } catch {
      return false;
    }
  }
}
