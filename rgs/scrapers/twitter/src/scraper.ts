/**
 * Twitter Scraper Implementation
 *
 * Implements IScraper interface for scraping tweets from Twitter API v2
 */

import { BaseScraper, ScrapeConfig } from '@rgs/core/interfaces/scraper';
import { WebSignal } from '@rgs/core/models/signal';
import { RateLimiter } from '@rgs/utils/rate-limiter';
import { Logger } from '@rgs/utils/logger';
import { ScraperError } from '@rgs/utils/errors';
import { TweetV2 } from 'twitter-api-v2';

import { TwitterClient } from './client';
import { TwitterConfig, validateTwitterConfig } from './config';
import {
  mapTweetToSignal,
  filterRetweets,
  filterByLanguage,
  deduplicateTweets,
} from './mapper';

/**
 * Twitter scraper that implements IScraper interface
 */
export class TwitterScraper extends BaseScraper {
  private readonly client: TwitterClient;
  private readonly config: TwitterConfig;
  private readonly logger: Logger;
  private readonly seenTweetIds: Set<string>;

  /**
   * Creates a new TwitterScraper instance
   *
   * @param config - Twitter configuration
   * @param logger - Optional logger instance
   */
  constructor(config: TwitterConfig, logger?: Logger) {
    super();

    // Validate configuration
    validateTwitterConfig(config);

    this.config = config;
    this.logger = logger ?? new Logger();
    this.seenTweetIds = new Set<string>();

    // Create rate limiter (convert per 15 min to per minute)
    const requestsPerMinute = config.rateLimit.requestsPer15Min / 15;
    const rateLimiter = new RateLimiter({
      requestsPerMinute,
      burstSize: 10,
      logger: this.logger,
    });

    // Create Twitter client
    this.client = new TwitterClient(config.bearerToken, rateLimiter, this.logger);

    this.logger.info('TwitterScraper initialized', {
      queriesCount: config.queries.length,
      maxResultsPerQuery: config.maxResultsPerQuery,
      excludeRetweets: config.excludeRetweets,
    });
  }

  /**
   * Scrapes tweets based on the provided configuration
   *
   * @param config - Scrape configuration
   * @returns Promise resolving to array of WebSignals
   * @throws ScraperError if scraping fails
   */
  async scrape(config: ScrapeConfig): Promise<WebSignal[]> {
    this.logger.info('Starting Twitter scrape', {
      type: config.type,
      maxItems: config.maxItems,
      timeRangeHours: config.timeRangeHours,
    });

    const startTime = new Date();
    const allTweets: TweetV2[] = [];
    const errors: Error[] = [];

    try {
      // Build search options
      const searchOptions = this.buildSearchOptions(config);

      // Execute search for each query
      for (const query of this.config.queries) {
        try {
          this.logger.debug('Executing search query', { query });

          const response = await this.client.searchTweets(query, searchOptions);
          allTweets.push(...response.tweets);

          this.logger.debug('Query completed', {
            query,
            resultCount: response.resultCount,
          });
        } catch (error) {
          this.logger.error('Query failed', { query, error });
          if (error instanceof Error) {
            errors.push(error);
          }
        }
      }

      // Process and filter tweets
      let processedTweets = allTweets;

      // Deduplicate by tweet ID
      processedTweets = deduplicateTweets(processedTweets);
      this.logger.debug('Deduplicated tweets', {
        before: allTweets.length,
        after: processedTweets.length,
      });

      // Filter out retweets if configured
      if (this.config.excludeRetweets === true) {
        const beforeFilter = processedTweets.length;
        processedTweets = filterRetweets(processedTweets);
        this.logger.debug('Filtered retweets', {
          before: beforeFilter,
          after: processedTweets.length,
        });
      }

      // Filter by language if configured
      if (this.config.languages !== undefined && this.config.languages.length > 0) {
        const beforeFilter = processedTweets.length;
        processedTweets = filterByLanguage(processedTweets, this.config.languages);
        this.logger.debug('Filtered by language', {
          before: beforeFilter,
          after: processedTweets.length,
          languages: this.config.languages,
        });
      }

      // Apply maxItems limit if specified
      if (config.maxItems !== undefined && config.maxItems > 0) {
        processedTweets = processedTweets.slice(0, config.maxItems);
      }

      // Convert tweets to WebSignals
      const signals: WebSignal[] = [];
      for (const tweet of processedTweets) {
        // Skip if already seen
        if (this.seenTweetIds.has(tweet.id) === true) {
          continue;
        }

        this.seenTweetIds.add(tweet.id);

        // Map to WebSignal
        const signal = mapTweetToSignal(tweet);

        // Validate signal
        if (this.validate(signal) === true) {
          signals.push(signal);
        } else {
          this.logger.warn('Invalid signal skipped', { tweetId: tweet.id });
        }
      }

      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();

      this.logger.info('Twitter scrape completed', {
        totalTweets: allTweets.length,
        uniqueTweets: processedTweets.length,
        validSignals: signals.length,
        durationMs,
        errors: errors.length,
      });

      return signals;
    } catch (error) {
      this.logger.error('Twitter scrape failed', { error });

      if (error instanceof ScraperError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new ScraperError(
          `Twitter scraping failed: ${error.message}`,
          'twitter',
          true,
          error
        );
      }

      throw new ScraperError('Twitter scraping failed with unknown error', 'twitter', true);
    }
  }

  /**
   * Validates a WebSignal
   *
   * @param signal - Signal to validate
   * @returns true if valid, false otherwise
   */
  override validate(signal: WebSignal): boolean {
    // Use base validation
    if (super.validate(signal) === false) {
      return false;
    }

    // Additional Twitter-specific validation
    if (signal.source !== 'twitter') {
      return false;
    }

    // Check ID format (should start with "twitter-")
    if (signal.id.startsWith('twitter-') === false) {
      return false;
    }

    // Check URL format
    if (signal.url.includes('twitter.com/i/web/status/') === false) {
      return false;
    }

    return true;
  }

  /**
   * Tests connection to Twitter API
   *
   * @returns Promise resolving to true if connection is successful
   */
  override async testConnection(): Promise<boolean> {
    try {
      return await this.client.testConnection();
    } catch (error) {
      this.logger.error('Twitter connection test failed', { error });
      return false;
    }
  }

  /**
   * Builds search options from scrape config
   *
   * @param config - Scrape configuration
   * @returns SearchTweetsOptions
   */
  private buildSearchOptions(config: ScrapeConfig): {
    maxResults: number;
    startTime?: Date;
    endTime?: Date;
  } {
    const options: {
      maxResults: number;
      startTime?: Date;
      endTime?: Date;
    } = {
      maxResults: this.config.maxResultsPerQuery,
    };

    // Set time range if specified
    if (config.timeRangeHours !== undefined && config.timeRangeHours > 0) {
      const now = new Date();
      const hoursAgo = new Date(now.getTime() - config.timeRangeHours * 60 * 60 * 1000);
      options.startTime = hoursAgo;
      options.endTime = now;
    }

    return options;
  }

  /**
   * Resets the seen tweet IDs cache
   */
  resetCache(): void {
    this.seenTweetIds.clear();
    this.logger.debug('Tweet ID cache cleared');
  }

  /**
   * Gets statistics about the scraper
   */
  getStats(): {
    seenTweetCount: number;
    queriesCount: number;
    config: TwitterConfig;
  } {
    return {
      seenTweetCount: this.seenTweetIds.size,
      queriesCount: this.config.queries.length,
      config: this.config,
    };
  }
}
