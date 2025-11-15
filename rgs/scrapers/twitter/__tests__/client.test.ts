/**
 * Tests for Twitter Client
 */

import { TwitterApi, ApiResponseError } from 'twitter-api-v2';
import { TwitterClient } from '../src/client';
import { RateLimiter } from '@rgs/utils/rate-limiter';
import { Logger } from '@rgs/utils/logger';
import {
  RateLimitError,
  AuthenticationError,
  ScraperError,
} from '@rgs/utils/errors';

// Mock twitter-api-v2
jest.mock('twitter-api-v2');

describe('TwitterClient', () => {
  let rateLimiter: RateLimiter;
  let logger: Logger;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      requestsPerMinute: 30,
      burstSize: 10,
    });
    logger = new Logger({});
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a TwitterClient instance', () => {
      const client = new TwitterClient('test-token', rateLimiter, logger);
      expect(client).toBeInstanceOf(TwitterClient);
    });

    it('should throw error for empty bearer token', () => {
      expect(() => new TwitterClient('', rateLimiter, logger)).toThrow('Bearer token cannot be empty');
    });

    it('should throw error for whitespace bearer token', () => {
      expect(() => new TwitterClient('   ', rateLimiter, logger)).toThrow('Bearer token cannot be empty');
    });

    it('should create logger if not provided', () => {
      const client = new TwitterClient('test-token', rateLimiter);
      expect(client).toBeInstanceOf(TwitterClient);
    });
  });

  describe('searchTweets', () => {
    it('should search tweets successfully', async () => {
      const mockTweets = [
        {
          id: '1',
          text: 'Test tweet 1',
          created_at: '2025-01-01T12:00:00.000Z',
          author_id: 'user1',
        },
        {
          id: '2',
          text: 'Test tweet 2',
          created_at: '2025-01-01T13:00:00.000Z',
          author_id: 'user2',
        },
      ];

      const mockSearch = jest.fn().mockResolvedValue({
        data: {
          data: mockTweets,
          meta: {
            result_count: 2,
          },
        },
      });

      (TwitterApi as jest.MockedClass<typeof TwitterApi>).mockImplementation(() => ({
        readOnly: {
          v2: {
            search: mockSearch,
          },
        } as any,
      } as any));

      const client = new TwitterClient('test-token', rateLimiter, logger);
      const response = await client.searchTweets('test query', { maxResults: 10 });

      expect(response.tweets).toHaveLength(2);
      expect(response.resultCount).toBe(2);
      expect(response.tweets[0]?.id).toBe('1');
      expect(mockSearch).toHaveBeenCalledWith('test query', expect.any(Object));
    });

    it('should throw error for empty query', async () => {
      const client = new TwitterClient('test-token', rateLimiter, logger);

      await expect(client.searchTweets('', { maxResults: 10 })).rejects.toThrow(
        'Search query cannot be empty'
      );
    });

    it('should throw error for maxResults below 10', async () => {
      const client = new TwitterClient('test-token', rateLimiter, logger);

      await expect(client.searchTweets('test', { maxResults: 5 })).rejects.toThrow(
        'maxResults must be between 10 and 100'
      );
    });

    it('should throw error for maxResults above 100', async () => {
      const client = new TwitterClient('test-token', rateLimiter, logger);

      await expect(client.searchTweets('test', { maxResults: 150 })).rejects.toThrow(
        'maxResults must be between 10 and 100'
      );
    });

    it('should handle rate limit errors', async () => {
      const mockError = new ApiResponseError('Rate limit exceeded', {
        code: 429,
        data: {},
        headers: {},
        rateLimit: {
          limit: 450,
          remaining: 0,
          reset: Math.floor(Date.now() / 1000) + 900
        },
        request: {} as any,
        response: {} as any,
      });

      const mockSearch = jest.fn().mockRejectedValue(mockError);

      (TwitterApi as jest.MockedClass<typeof TwitterApi>).mockImplementation(() => ({
        readOnly: {
          v2: {
            search: mockSearch,
          },
        } as any,
      } as any));

      const client = new TwitterClient('test-token', rateLimiter, logger);

      await expect(client.searchTweets('test', { maxResults: 10 })).rejects.toThrow(
        RateLimitError
      );
    });

    it('should handle authentication errors (401)', async () => {
      const mockError = new ApiResponseError('Unauthorized', {
        code: 401,
        data: {},
        headers: {},
        request: {} as any,
        response: {} as any,
      });

      const mockSearch = jest.fn().mockRejectedValue(mockError);

      (TwitterApi as jest.MockedClass<typeof TwitterApi>).mockImplementation(() => ({
        readOnly: {
          v2: {
            search: mockSearch,
          },
        } as any,
      } as any));

      const client = new TwitterClient('test-token', rateLimiter, logger);

      await expect(client.searchTweets('test', { maxResults: 10 })).rejects.toThrow(
        AuthenticationError
      );
    });

    it('should handle authentication errors (403)', async () => {
      const mockError = new ApiResponseError('Forbidden', {
        code: 403,
        data: {},
        headers: {},
        request: {} as any,
        response: {} as any,
      });

      const mockSearch = jest.fn().mockRejectedValue(mockError);

      (TwitterApi as jest.MockedClass<typeof TwitterApi>).mockImplementation(() => ({
        readOnly: {
          v2: {
            search: mockSearch,
          },
        } as any,
      } as any));

      const client = new TwitterClient('test-token', rateLimiter, logger);

      await expect(client.searchTweets('test', { maxResults: 10 })).rejects.toThrow(
        ScraperError
      );
    });

    it('should handle service unavailable errors (503)', async () => {
      const mockError = new ApiResponseError('Service Unavailable', {
        code: 503,
        data: {},
        headers: {},
        request: {} as any,
        response: {} as any,
      });

      const mockSearch = jest.fn().mockRejectedValue(mockError);

      (TwitterApi as jest.MockedClass<typeof TwitterApi>).mockImplementation(() => ({
        readOnly: {
          v2: {
            search: mockSearch,
          },
        } as any,
      } as any));

      const client = new TwitterClient('test-token', rateLimiter, logger);

      await expect(client.searchTweets('test', { maxResults: 10 })).rejects.toThrow(ScraperError);
    });

    it('should handle generic errors', async () => {
      const mockSearch = jest.fn().mockRejectedValue(new Error('Generic error'));

      (TwitterApi as jest.MockedClass<typeof TwitterApi>).mockImplementation(() => ({
        readOnly: {
          v2: {
            search: mockSearch,
          },
        } as any,
      } as any));

      const client = new TwitterClient('test-token', rateLimiter, logger);

      await expect(client.searchTweets('test', { maxResults: 10 })).rejects.toThrow(ScraperError);
    });

    it('should include pagination token in response', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: {
          data: [{ id: '1', text: 'Test' }],
          meta: {
            result_count: 1,
            next_token: 'next-page-token',
          },
        },
      });

      (TwitterApi as jest.MockedClass<typeof TwitterApi>).mockImplementation(() => ({
        readOnly: {
          v2: {
            search: mockSearch,
          },
        } as any,
      } as any));

      const client = new TwitterClient('test-token', rateLimiter, logger);
      const response = await client.searchTweets('test', { maxResults: 10 });

      expect(response.nextToken).toBe('next-page-token');
    });
  });

  describe('getTweetThread', () => {
    it('should fetch tweet thread successfully', async () => {
      const mockSingleTweet = jest.fn().mockResolvedValue({
        data: {
          id: '1',
          text: 'Original tweet',
          conversation_id: 'conv123',
        },
      });

      const mockSearch = jest.fn().mockResolvedValue({
        data: {
          data: [
            { id: '1', text: 'Original tweet' },
            { id: '2', text: 'Reply 1' },
            { id: '3', text: 'Reply 2' },
          ],
          meta: { result_count: 3 },
        },
      });

      (TwitterApi as jest.MockedClass<typeof TwitterApi>).mockImplementation(() => ({
        readOnly: {
          v2: {
            singleTweet: mockSingleTweet,
            search: mockSearch,
          },
        } as any,
      } as any));

      const client = new TwitterClient('test-token', rateLimiter, logger);
      const thread = await client.getTweetThread('1');

      expect(thread).toHaveLength(3);
      expect(mockSingleTweet).toHaveBeenCalled();
      expect(mockSearch).toHaveBeenCalled();
    });

    it('should return single tweet if no conversation_id', async () => {
      const mockSingleTweet = jest.fn().mockResolvedValue({
        data: {
          id: '1',
          text: 'Standalone tweet',
          conversation_id: undefined,
        },
      });

      (TwitterApi as jest.MockedClass<typeof TwitterApi>).mockImplementation(() => ({
        readOnly: {
          v2: {
            singleTweet: mockSingleTweet,
          },
        } as any,
      } as any));

      const client = new TwitterClient('test-token', rateLimiter, logger);
      const thread = await client.getTweetThread('1');

      expect(thread).toHaveLength(1);
      expect(thread[0]?.id).toBe('1');
    });

    it('should throw error for empty tweet ID', async () => {
      const client = new TwitterClient('test-token', rateLimiter, logger);

      await expect(client.getTweetThread('')).rejects.toThrow('Tweet ID cannot be empty');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: {
          data: [],
          meta: { result_count: 0 },
        },
      });

      (TwitterApi as jest.MockedClass<typeof TwitterApi>).mockImplementation(() => ({
        readOnly: {
          v2: {
            search: mockSearch,
          },
        } as any,
      } as any));

      const client = new TwitterClient('test-token', rateLimiter, logger);
      const result = await client.testConnection();

      expect(result).toBe(true);
    });

    it('should throw error for failed connection', async () => {
      const mockSearch = jest.fn().mockRejectedValue(new Error('Connection failed'));

      (TwitterApi as jest.MockedClass<typeof TwitterApi>).mockImplementation(() => ({
        readOnly: {
          v2: {
            search: mockSearch,
          },
        } as any,
      } as any));

      const client = new TwitterClient('test-token', rateLimiter, logger);

      await expect(client.testConnection()).rejects.toThrow(ScraperError);
    });
  });
});
