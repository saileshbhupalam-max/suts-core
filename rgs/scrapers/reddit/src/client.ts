/**
 * Reddit Client with Rate Limiting
 *
 * Wraps snoowrap Reddit API client with rate limiting and error handling.
 */

import Snoowrap from 'snoowrap';
import { RateLimiter } from '@rgs/utils/rate-limiter';
import { NetworkError, AuthenticationError } from '@rgs/utils/errors';
import { RedditConfig } from './config';
import { RedditPost } from './mapper';

/**
 * Options for fetching posts
 */
export interface GetPostsOptions {
  /** Maximum number of posts to fetch */
  readonly limit: number;

  /** Sort order: 'hot', 'new', or 'top' */
  readonly sort: 'hot' | 'new' | 'top';
}

/**
 * Subreddit data
 */
export interface SubredditData {
  /** Subreddit name (without r/ prefix) */
  readonly name: string;

  /** Number of subscribers */
  readonly subscribers: number;

  /** Subreddit description */
  readonly description: string;
}

/**
 * Reddit API client with rate limiting
 */
export class RedditClient {
  private readonly client: Snoowrap;
  private readonly rateLimiter: RateLimiter;

  /**
   * Creates a new RedditClient
   *
   * @param config - Reddit configuration
   * @param rateLimiter - Rate limiter instance
   */
  constructor(config: RedditConfig, rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;

    try {
      // Use client credentials (app-only) auth by providing empty string for refresh token
      this.client = new Snoowrap({
        userAgent: config.userAgent,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        refreshToken: '', // Empty for client credentials auth
      });

      // Configure snoowrap options
      this.client.config({
        requestDelay: 1000, // 1 second between requests (base delay)
        warnings: false, // Disable warnings
        continueAfterRatelimitError: false, // Don't auto-retry rate limits
      });
    } catch (error) {
      throw new AuthenticationError(
        'Failed to initialize Reddit client',
        'reddit',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Gets subreddit information
   *
   * @param name - Subreddit name (without r/ prefix)
   * @returns Subreddit data
   * @throws NetworkError if the request fails
   */
  async getSubreddit(name: string): Promise<SubredditData> {
    try {
      const fetchSubreddit = async (): Promise<SubredditData> => {
        const subredditListing = this.client.getSubreddit(name);
        // Type assertion to work around snoowrap's circular type issue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
        const subredditFetch = subredditListing.fetch() as any;
        const subreddit = (await subredditFetch) as {
          display_name: string;
          subscribers: number;
          public_description: string;
        };

        return {
          name: subreddit.display_name,
          subscribers: subreddit.subscribers,
          description: subreddit.public_description !== '' ? subreddit.public_description : '',
        };
      };

      return await this.rateLimiter.execute(fetchSubreddit);
    } catch (error) {
      if (this.isRateLimitError(error)) {
        throw new NetworkError(
          'Reddit rate limit exceeded',
          'reddit',
          429,
          true,
          this.toError(error)
        );
      }

      if (this.isNotFoundError(error)) {
        throw new NetworkError(
          `Subreddit '${name}' not found`,
          'reddit',
          404,
          false,
          this.toError(error)
        );
      }

      throw new NetworkError(
        `Failed to fetch subreddit '${name}'`,
        'reddit',
        undefined,
        true,
        this.toError(error)
      );
    }
  }

  /**
   * Gets posts from a subreddit
   *
   * @param subreddit - Subreddit name (without r/ prefix)
   * @param options - Fetch options
   * @returns Array of Reddit posts
   * @throws NetworkError if the request fails
   */
  async getPosts(subreddit: string, options: GetPostsOptions): Promise<RedditPost[]> {
    try {
      return await this.rateLimiter.execute(async () => {
        const sub = this.client.getSubreddit(subreddit);

        let listing;
        switch (options.sort) {
          case 'hot':
            listing = await sub.getHot({ limit: options.limit });
            break;
          case 'new':
            listing = await sub.getNew({ limit: options.limit });
            break;
          case 'top':
            listing = await sub.getTop({ time: 'week', limit: options.limit });
            break;
          default:
            listing = await sub.getHot({ limit: options.limit });
        }

        // Convert snoowrap Submission objects to plain RedditPost objects
        const posts: RedditPost[] = [];
        for (const submission of listing) {
          // Type assertion for properties which may not be in the types
          const submissionAny = submission as unknown as {
            removed?: boolean;
            author_fullname?: string;
            [key: string]: unknown;
          };

          const post: RedditPost = {
            id: submission.id,
            title: submission.title,
            selftext: submission.selftext !== '' ? submission.selftext : '',
            author: {
              name:
                submission.author?.name !== '' && submission.author?.name !== undefined
                  ? submission.author.name
                  : '[deleted]',
            },
            created_utc: submission.created_utc,
            permalink: submission.permalink,
            subreddit: {
              display_name:
                submission.subreddit?.display_name !== '' &&
                submission.subreddit?.display_name !== undefined
                  ? submission.subreddit.display_name
                  : subreddit,
            },
            score: submission.score,
            num_comments: submission.num_comments,
            upvote_ratio: submission.upvote_ratio,
            url: submission.url,
            is_self: submission.is_self,
          };

          // Add optional properties only if defined
          if (submissionAny.removed !== undefined) {
            (post as { removed?: boolean }).removed = submissionAny.removed;
          }
          if (submissionAny.author_fullname !== undefined) {
            (post as { author_fullname?: string }).author_fullname = submissionAny.author_fullname;
          }

          posts.push(post);
        }

        return posts;
      });
    } catch (error) {
      if (this.isRateLimitError(error)) {
        throw new NetworkError(
          'Reddit rate limit exceeded',
          'reddit',
          429,
          true,
          this.toError(error)
        );
      }

      if (this.isNotFoundError(error)) {
        throw new NetworkError(
          `Subreddit '${subreddit}' not found`,
          'reddit',
          404,
          false,
          this.toError(error)
        );
      }

      throw new NetworkError(
        `Failed to fetch posts from '${subreddit}'`,
        'reddit',
        undefined,
        true,
        this.toError(error)
      );
    }
  }

  /**
   * Tests the connection to Reddit
   *
   * @returns true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch a well-known subreddit
      await this.getSubreddit('programming');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if an error is a rate limit error
   */
  private isRateLimitError(error: unknown): boolean {
    if (error === null || error === undefined) {
      return false;
    }

    const err = error as { statusCode?: number; message?: string };
    return err.statusCode === 429 || (err.message?.includes('rate limit') ?? false);
  }

  /**
   * Checks if an error is a not found error
   */
  private isNotFoundError(error: unknown): boolean {
    if (error === null || error === undefined) {
      return false;
    }

    const err = error as { statusCode?: number };
    return err.statusCode === 404;
  }

  /**
   * Converts unknown error to Error instance
   */
  private toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }
}
