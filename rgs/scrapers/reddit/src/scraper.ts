/**
 * Reddit Scraper Implementation
 *
 * Implements IScraper interface for scraping Reddit posts.
 */

import { BaseScraper, ScrapeConfig } from '@rgs/core/interfaces/scraper';
import { WebSignal } from '@rgs/core/models/signal';
import { RateLimiter } from '@rgs/utils/rate-limiter';
import { ScraperError } from '@rgs/utils/errors';
import { Logger, LogLevel } from '@rgs/utils/logger';
import { RedditClient } from './client';
import { mapRedditPostsToSignals } from './mapper';
import { RedditConfig, createRedditConfig } from './config';

/**
 * Reddit scraper implementation
 */
export class RedditScraper extends BaseScraper {
  private readonly client: RedditClient;
  private readonly config: RedditConfig;
  private readonly logger: Logger;

  /**
   * Creates a new RedditScraper
   *
   * @param config - Optional Reddit configuration overrides
   * @param logger - Optional logger instance
   */
  constructor(config?: Partial<RedditConfig>, logger?: Logger) {
    super();

    this.logger = logger ?? new Logger({ minLevel: LogLevel.INFO });

    try {
      // Create and validate configuration
      this.config = createRedditConfig(config);

      // Create rate limiter
      const rateLimiter = new RateLimiter({
        requestsPerMinute: this.config.rateLimit,
        logger: this.logger,
      });

      // Create Reddit client
      this.client = new RedditClient(this.config, rateLimiter);

      this.logger.info('RedditScraper initialized', {
        subreddits: this.config.subreddits,
        postsPerSubreddit: this.config.postsPerSubreddit,
        sort: this.config.sort,
        rateLimit: this.config.rateLimit,
      });
    } catch (error) {
      this.logger.error('Failed to initialize RedditScraper', { error });
      throw new ScraperError(
        'Failed to initialize Reddit scraper',
        'reddit',
        false,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Scrapes Reddit posts based on configuration
   *
   * @param scrapeConfig - Scrape configuration (optional, uses constructor config by default)
   * @returns Array of web signals
   * @throws ScraperError if scraping fails
   */
  async scrape(scrapeConfig?: ScrapeConfig): Promise<WebSignal[]> {
    const startTime = new Date();
    const signals: WebSignal[] = [];
    const errors: Error[] = [];

    // Determine which subreddits to scrape
    const subredditsToScrape =
      scrapeConfig?.params['subreddits'] !== undefined
        ? String(scrapeConfig.params['subreddits']).split(',')
        : this.config.subreddits;

    // Determine posts per subreddit
    const postsPerSubreddit = scrapeConfig?.maxItems ?? this.config.postsPerSubreddit;

    this.logger.info('Starting Reddit scrape', {
      subreddits: subredditsToScrape,
      postsPerSubreddit,
    });

    // Scrape each subreddit
    for (const subreddit of subredditsToScrape) {
      try {
        this.logger.debug(`Scraping subreddit: ${subreddit}`);

        // Get posts from the subreddit
        const posts = await this.client.getPosts(subreddit, {
          limit: postsPerSubreddit,
          sort: this.config.sort,
        });

        this.logger.debug(`Fetched ${posts.length} posts from r/${subreddit}`);

        // Map posts to WebSignals
        const subredditSignals = mapRedditPostsToSignals(posts);

        // Validate signals
        const validSignals = subredditSignals.filter((signal) => {
          const isValid = this.validate(signal);
          if (!isValid) {
            this.logger.warn('Invalid signal filtered out', {
              signalId: signal.id,
              subreddit,
            });
          }
          return isValid;
        });

        signals.push(...validSignals);

        this.logger.info(`Scraped ${validSignals.length} valid signals from r/${subreddit}`, {
          subreddit,
          total: posts.length,
          valid: validSignals.length,
          filtered: posts.length - validSignals.length,
        });
      } catch (error) {
        const scraperError =
          error instanceof ScraperError
            ? error
            : new ScraperError(
                `Failed to scrape r/${subreddit}`,
                'reddit',
                true,
                error instanceof Error ? error : undefined
              );

        this.logger.error(`Error scraping r/${subreddit}`, {
          error: scraperError,
          subreddit,
        });

        errors.push(scraperError);

        // If error is not retryable, stop scraping
        if (!scraperError.retryable) {
          throw scraperError;
        }

        // Continue to next subreddit on retryable errors
        continue;
      }
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    this.logger.info('Reddit scrape completed', {
      totalSignals: signals.length,
      errors: errors.length,
      durationMs,
    });

    // If we have errors but also signals, log a warning
    if (errors.length > 0 && signals.length > 0) {
      this.logger.warn('Scrape completed with partial failures', {
        successfulSubreddits: subredditsToScrape.length - errors.length,
        failedSubreddits: errors.length,
      });
    }

    // If we have no signals and errors, throw
    if (signals.length === 0 && errors.length > 0) {
      throw new ScraperError(
        `Failed to scrape any signals from ${subredditsToScrape.length} subreddits`,
        'reddit',
        true,
        errors[0]
      );
    }

    return signals;
  }

  /**
   * Tests the connection to Reddit
   *
   * @returns Promise resolving to true if connection is successful
   */
  override async testConnection(): Promise<boolean> {
    try {
      const result = await this.client.testConnection();
      this.logger.info('Reddit connection test', { success: result });
      return result;
    } catch (error) {
      this.logger.error('Reddit connection test failed', { error });
      return false;
    }
  }

  /**
   * Gets the current Reddit configuration
   *
   * @returns Current RedditConfig
   */
  getConfig(): RedditConfig {
    return this.config;
  }
}
