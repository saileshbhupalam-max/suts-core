/**
 * Twitter API v2 Client Wrapper
 *
 * Provides a rate-limited wrapper around the Twitter API v2 client
 */

import { TwitterApi, TweetV2, TwitterApiReadOnly, ApiResponseError } from 'twitter-api-v2';
import { RateLimiter } from '@rgs/utils/rate-limiter';
import {
  ScraperError,
  RateLimitError,
  NetworkError,
  AuthenticationError,
} from '@rgs/utils/errors';
import { Logger } from '@rgs/utils/logger';

/**
 * Options for searching tweets
 */
export interface SearchTweetsOptions {
  /**
   * Maximum number of results (10-100)
   */
  readonly maxResults: number;

  /**
   * Start time for tweet search
   */
  readonly startTime?: Date;

  /**
   * End time for tweet search
   */
  readonly endTime?: Date;

  /**
   * Tweet fields to include in response
   */
  readonly tweetFields?: string[];

  /**
   * Next token for pagination
   */
  readonly nextToken?: string;
}

/**
 * Response from tweet search
 */
export interface SearchTweetsResponse {
  /**
   * Array of tweets returned
   */
  readonly tweets: TweetV2[];

  /**
   * Total number of results
   */
  readonly resultCount: number;

  /**
   * Next token for pagination (if more results available)
   */
  readonly nextToken?: string;
}

/**
 * Twitter API v2 client with rate limiting
 */
export class TwitterClient {
  private readonly client: TwitterApiReadOnly;
  private readonly rateLimiter: RateLimiter;
  private readonly logger: Logger;

  /**
   * Creates a new TwitterClient
   *
   * @param bearerToken - Twitter API bearer token
   * @param rateLimiter - Rate limiter instance
   * @param logger - Logger instance
   */
  constructor(bearerToken: string, rateLimiter: RateLimiter, logger?: Logger) {
    if (bearerToken.trim().length === 0) {
      throw new Error('Bearer token cannot be empty');
    }

    // Initialize Twitter API client (read-only)
    this.client = new TwitterApi(bearerToken).readOnly;
    this.rateLimiter = rateLimiter;
    this.logger = logger ?? new Logger();
  }

  /**
   * Searches for tweets using the Twitter API v2 search endpoint
   *
   * @param query - Search query string
   * @param options - Search options
   * @returns Promise resolving to search response
   * @throws ScraperError if the API call fails
   */
  async searchTweets(query: string, options: SearchTweetsOptions): Promise<SearchTweetsResponse> {
    if (query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (options.maxResults < 10 || options.maxResults > 100) {
      throw new Error('maxResults must be between 10 and 100');
    }

    this.logger.debug('Searching tweets', { query, maxResults: options.maxResults });

    try {
      // Execute with rate limiting
      const response = await this.rateLimiter.execute(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const searchParams: Record<string, any> = {
          max_results: options.maxResults,
          'tweet.fields': options.tweetFields ?? [
            'created_at',
            'author_id',
            'public_metrics',
            'lang',
            'conversation_id',
          ],
        };

        if (options.startTime !== undefined) {
          searchParams['start_time'] = options.startTime.toISOString();
        }

        if (options.endTime !== undefined) {
          searchParams['end_time'] = options.endTime.toISOString();
        }

        if (options.nextToken !== undefined) {
          searchParams['next_token'] = options.nextToken;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return await this.client.v2.search(query, searchParams);
      });

      const tweets = response.data.data ?? [];
      const meta = response.data.meta;

      this.logger.info('Tweet search completed', {
        query,
        resultCount: tweets.length,
        hasMore: meta.next_token !== undefined,
      });

      const result: SearchTweetsResponse = {
        tweets,
        resultCount: meta.result_count ?? 0,
      };

      if (meta.next_token !== undefined) {
        (result as { nextToken?: string }).nextToken = meta.next_token;
      }

      return result;
    } catch (error) {
      return this.handleApiError(error, 'searchTweets');
    }
  }

  /**
   * Gets a tweet thread (conversation) by tweet ID
   *
   * @param tweetId - ID of the tweet to get thread for
   * @returns Promise resolving to array of tweets in the thread
   * @throws ScraperError if the API call fails
   */
  async getTweetThread(tweetId: string): Promise<TweetV2[]> {
    if (tweetId.trim().length === 0) {
      throw new Error('Tweet ID cannot be empty');
    }

    this.logger.debug('Fetching tweet thread', { tweetId });

    try {
      // First get the original tweet to get conversation ID
      const tweetResponse = await this.rateLimiter.execute(async () => {
        return await this.client.v2.singleTweet(tweetId, {
          'tweet.fields': ['conversation_id', 'created_at', 'author_id', 'public_metrics', 'lang'],
        });
      });

      const originalTweet = tweetResponse.data;
      const conversationId = originalTweet.conversation_id;

      if (conversationId === undefined) {
        return [originalTweet];
      }

      // Search for all tweets in the conversation
      const searchResponse = await this.rateLimiter.execute(async () => {
        return await this.client.v2.search(`conversation_id:${conversationId}`, {
          max_results: 100,
          'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'lang', 'conversation_id'],
        });
      });

      const tweets = searchResponse.data.data ?? [];

      this.logger.info('Tweet thread fetched', {
        tweetId,
        conversationId,
        threadLength: tweets.length,
      });

      return tweets;
    } catch (error) {
      return this.handleApiError(error, 'getTweetThread');
    }
  }

  /**
   * Tests the connection to Twitter API
   *
   * @returns Promise resolving to true if connection is successful
   * @throws ScraperError if connection fails
   */
  async testConnection(): Promise<boolean> {
    this.logger.debug('Testing Twitter API connection');

    try {
      // Try a simple search with minimal results
      await this.rateLimiter.execute(async () => {
        return await this.client.v2.search('test', { max_results: 10 });
      });

      this.logger.info('Twitter API connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Twitter API connection test failed', { error });
      return this.handleApiError(error, 'testConnection');
    }
  }

  /**
   * Handles API errors and converts them to appropriate ScraperError types
   *
   * @param error - Error from API call
   * @param context - Context where error occurred
   * @returns Never (always throws)
   * @throws ScraperError with appropriate type
   */
  private handleApiError(error: unknown, context: string): never {
    this.logger.error('Twitter API error', { context, error });

    // Handle twitter-api-v2 specific errors
    if (error instanceof ApiResponseError) {
      const statusCode = error.code;

      // Rate limit error (429)
      if (statusCode === 429) {
        const resetTime = error.rateLimit?.reset;
        const retryAfterMs = resetTime !== undefined ? resetTime * 1000 - Date.now() : undefined;

        throw new RateLimitError(
          'Twitter API rate limit exceeded',
          'twitter',
          retryAfterMs,
          error
        );
      }

      // Authentication error (401, 403)
      if (statusCode === 401 || statusCode === 403) {
        throw new AuthenticationError(
          `Twitter API authentication failed: ${error.message}`,
          'twitter',
          error
        );
      }

      // Service unavailable (503) - retryable
      if (statusCode === 503) {
        throw new NetworkError(
          'Twitter API service unavailable',
          'twitter',
          statusCode,
          true,
          error
        );
      }

      // Other client errors (4xx) - not retryable
      if (statusCode >= 400 && statusCode < 500) {
        throw new ScraperError(
          `Twitter API client error: ${error.message}`,
          'twitter',
          false,
          error
        );
      }

      // Server errors (5xx) - retryable
      if (statusCode >= 500) {
        throw new NetworkError(
          `Twitter API server error: ${error.message}`,
          'twitter',
          statusCode,
          true,
          error
        );
      }
    }

    // Handle rate limiter errors
    if (error instanceof RateLimitError) {
      throw error;
    }

    // Generic error
    if (error instanceof Error) {
      throw new ScraperError(`Twitter API error in ${context}: ${error.message}`, 'twitter', true, error);
    }

    // Unknown error
    throw new ScraperError(`Unknown Twitter API error in ${context}`, 'twitter', true);
  }
}
