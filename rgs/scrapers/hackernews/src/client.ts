/**
 * HackerNews Algolia API Client
 *
 * Wrapper around the HackerNews Algolia Search API with rate limiting.
 * API Documentation: https://hn.algolia.com/api
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { RateLimiter } from '@rgs/utils';
import { ScraperError, RateLimitError, NetworkError } from '@rgs/utils';

/**
 * HackerNews API endpoints
 */
const API_ENDPOINTS = {
  search: 'https://hn.algolia.com/api/v1/search',
  searchByDate: 'https://hn.algolia.com/api/v1/search_by_date',
  item: (id: number) => `https://hn.algolia.com/api/v1/items/${id}`,
};

/**
 * HackerNews item from Algolia API
 */
export interface HNItem {
  readonly objectID: string;
  readonly created_at: string;
  readonly author: string;
  readonly title?: string;
  readonly url?: string;
  readonly story_text?: string;
  readonly comment_text?: string;
  readonly points?: number;
  readonly num_comments?: number;
  readonly story_id?: number;
  readonly parent_id?: number;
  readonly created_at_i?: number;
}

/**
 * HackerNews story (subset of HNItem)
 */
export interface HNStory extends HNItem {
  readonly title: string;
  readonly points: number;
  readonly num_comments: number;
}

/**
 * HackerNews comment (subset of HNItem)
 */
export interface HNComment extends HNItem {
  readonly comment_text: string;
  readonly story_id: number;
}

/**
 * Search result from Algolia API
 */
export interface HNSearchResult {
  readonly hits: HNItem[];
  readonly nbHits: number;
  readonly page: number;
  readonly nbPages: number;
  readonly hitsPerPage: number;
  readonly processingTimeMS: number;
  readonly query: string;
  readonly params: string;
}

/**
 * Search options for Algolia API
 */
export interface HNSearchOptions {
  /**
   * Filter by tags (e.g., 'story', 'comment', 'poll')
   */
  readonly tags?: string;

  /**
   * Numeric filters (e.g., 'points>100')
   */
  readonly numericFilters?: string;

  /**
   * Results per page (max 1000)
   */
  readonly hitsPerPage?: number;

  /**
   * Page number (0-indexed)
   */
  readonly page?: number;
}

/**
 * HackerNews Algolia API client with rate limiting
 */
export class HackerNewsClient {
  private readonly axios: AxiosInstance;
  private readonly rateLimiter: RateLimiter;

  /**
   * Creates a new HackerNewsClient
   *
   * @param rateLimiter - Rate limiter instance (10000 requests per hour)
   */
  constructor(rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;
    this.axios = axios.create({
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Searches for stories or comments matching a query
   *
   * @param query - Search query
   * @param options - Search options (tags, filters, pagination)
   * @returns Promise resolving to search results
   * @throws ScraperError on API errors
   */
  async searchStories(query: string, options: HNSearchOptions = {}): Promise<HNSearchResult> {
    // Allow empty query if there are filters (e.g., for fetching comments by story_id)
    if (query.trim().length === 0 && options.tags === undefined && options.numericFilters === undefined) {
      throw new ScraperError('Query cannot be empty without filters', 'hackernews', false);
    }

    const params: Record<string, string | number> = {
      query: query.trim(),
    };

    if (options.tags !== undefined) {
      params['tags'] = options.tags;
    }
    if (options.numericFilters !== undefined) {
      params['numericFilters'] = options.numericFilters;
    }
    if (options.hitsPerPage !== undefined) {
      params['hitsPerPage'] = Math.min(options.hitsPerPage, 1000);
    }
    if (options.page !== undefined) {
      params['page'] = options.page;
    }

    try {
      return await this.rateLimiter.execute(async () => {
        const response = await this.axios.get<HNSearchResult>(API_ENDPOINTS.search, {
          params,
        });
        return response.data;
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets a specific item by ID
   *
   * @param id - HackerNews item ID
   * @returns Promise resolving to the item
   * @throws ScraperError on API errors
   */
  async getItem(id: number): Promise<HNItem> {
    if (id <= 0) {
      throw new ScraperError('Invalid item ID', 'hackernews', false);
    }

    try {
      return await this.rateLimiter.execute(async () => {
        const response = await this.axios.get<HNItem>(API_ENDPOINTS.item(id));
        return response.data;
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gets all comments for a story
   *
   * @param storyId - Story ID
   * @returns Promise resolving to array of comments
   * @throws ScraperError on API errors
   */
  async getItemComments(storyId: number): Promise<HNItem[]> {
    if (storyId <= 0) {
      throw new ScraperError('Invalid story ID', 'hackernews', false);
    }

    try {
      // Search for comments with matching story_id
      const result = await this.searchStories('', {
        tags: 'comment',
        numericFilters: `story_id=${storyId}`,
        hitsPerPage: 1000,
      });

      return result.hits;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Tests connection to HackerNews Algolia API
   *
   * @returns Promise resolving to true if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.rateLimiter.execute(async () => {
        await this.axios.get(API_ENDPOINTS.search, {
          params: { query: 'test', hitsPerPage: 1 },
        });
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handles errors from Axios and converts to ScraperError
   */
  private handleError(error: unknown): ScraperError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Rate limit error (unlikely with 10k/hour limit)
      if (axiosError.response?.status === 429) {
        const retryAfter = axiosError.response.headers['retry-after'];
        const retryAfterMs = retryAfter !== undefined ? parseInt(retryAfter, 10) * 1000 : undefined;
        return new RateLimitError(
          'HackerNews API rate limit exceeded',
          'hackernews',
          retryAfterMs,
          axiosError
        );
      }

      // Bad request (invalid query)
      if (axiosError.response?.status === 400) {
        return new ScraperError('Invalid HackerNews API query', 'hackernews', false, axiosError);
      }

      // Not found
      if (axiosError.response?.status === 404) {
        return new ScraperError('HackerNews item not found', 'hackernews', false, axiosError);
      }

      // Server error (retryable)
      if (axiosError.response?.status !== undefined && axiosError.response.status >= 500) {
        return new NetworkError(
          'HackerNews API server error',
          'hackernews',
          axiosError.response.status,
          true,
          axiosError
        );
      }

      // Network errors (retryable)
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ENOTFOUND') {
        return new NetworkError('HackerNews API unavailable', 'hackernews', undefined, true, axiosError);
      }

      // Generic network error
      return new NetworkError('HackerNews API network error', 'hackernews', undefined, true, axiosError);
    }

    // Unknown error
    return new ScraperError(
      'Unknown HackerNews API error',
      'hackernews',
      false,
      error instanceof Error ? error : undefined
    );
  }
}
