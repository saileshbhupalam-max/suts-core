/**
 * Tests for Twitter Scraper
 */

import { TwitterScraper } from '../src/scraper';
import { TwitterConfig } from '../src/config';
import { TwitterClient } from '../src/client';
import { ScrapeConfig } from '@rgs/core/interfaces/scraper';
import { Logger } from '@rgs/utils/logger';
// Error types are tested in client.test.ts

// Mock dependencies
jest.mock('../src/client');

describe('TwitterScraper', () => {
  const mockConfig: TwitterConfig = {
    bearerToken: 'test-token',
    queries: ['vscode extension', 'cursor ai'],
    maxResultsPerQuery: 50,
    excludeRetweets: true,
    languages: ['en'],
    rateLimit: {
      requestsPer15Min: 450,
    },
  };

  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({});
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a TwitterScraper instance', () => {
      const scraper = new TwitterScraper(mockConfig, logger);
      expect(scraper).toBeInstanceOf(TwitterScraper);
    });

    it('should throw error for invalid configuration', () => {
      const invalidConfig = { ...mockConfig, bearerToken: '' };
      expect(() => new TwitterScraper(invalidConfig, logger)).toThrow();
    });

    it('should create logger if not provided', () => {
      const scraper = new TwitterScraper(mockConfig);
      expect(scraper).toBeInstanceOf(TwitterScraper);
    });
  });

  describe('scrape', () => {
    it('should scrape tweets from multiple queries', async () => {
      const mockTweets = [
        {
          id: '1',
          text: 'Test tweet 1',
          created_at: '2025-01-01T12:00:00.000Z',
          author_id: 'user1',
          public_metrics: {
            like_count: 10,
            retweet_count: 5,
            reply_count: 2,
            quote_count: 1,
          },
          lang: 'en',
        },
        {
          id: '2',
          text: 'Test tweet 2',
          created_at: '2025-01-01T13:00:00.000Z',
          author_id: 'user2',
          public_metrics: {
            like_count: 20,
            retweet_count: 10,
            reply_count: 5,
            quote_count: 2,
          },
          lang: 'en',
        },
      ];

      const mockSearchTweets = jest.fn().mockResolvedValue({
        tweets: mockTweets,
        resultCount: 2,
      });

      (TwitterClient as jest.MockedClass<typeof TwitterClient>).mockImplementation(() => ({
        searchTweets: mockSearchTweets,
        testConnection: jest.fn().mockResolvedValue(true),
      } as any));

      const scraper = new TwitterScraper(mockConfig, logger);
      const scrapeConfig: ScrapeConfig = {
        type: 'twitter',
        params: {},
      };

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals.length).toBeGreaterThan(0);
      expect(mockSearchTweets).toHaveBeenCalledTimes(2); // Two queries
      const firstSignal = signals[0];
      expect(firstSignal).toBeDefined();
      if (firstSignal !== undefined) {
        expect(firstSignal.source).toBe('twitter');
        expect(firstSignal.id).toContain('twitter-');
      }
    });

    it('should deduplicate tweets by ID', async () => {
      const duplicateTweets = [
        {
          id: '1',
          text: 'Duplicate tweet',
          created_at: '2025-01-01T12:00:00.000Z',
          author_id: 'user1',
          public_metrics: {
            like_count: 10,
            retweet_count: 5,
            reply_count: 2,
            quote_count: 1,
          },
          lang: 'en',
        },
      ];

      const mockSearchTweets = jest
        .fn()
        .mockResolvedValueOnce({ tweets: duplicateTweets, resultCount: 1 })
        .mockResolvedValueOnce({ tweets: duplicateTweets, resultCount: 1 });

      (TwitterClient as jest.MockedClass<typeof TwitterClient>).mockImplementation(() => ({
        searchTweets: mockSearchTweets,
        testConnection: jest.fn().mockResolvedValue(true),
      } as any));

      const scraper = new TwitterScraper(mockConfig, logger);
      const scrapeConfig: ScrapeConfig = {
        type: 'twitter',
        params: {},
      };

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(1); // Should be deduplicated
    });

    it('should exclude retweets when configured', async () => {
      const mixedTweets = [
        {
          id: '1',
          text: 'Regular tweet',
          created_at: '2025-01-01T12:00:00.000Z',
          author_id: 'user1',
          public_metrics: { like_count: 10, retweet_count: 5, reply_count: 2, quote_count: 1 },
          lang: 'en',
        },
        {
          id: '2',
          text: 'RT @someone: This is a retweet',
          created_at: '2025-01-01T13:00:00.000Z',
          author_id: 'user2',
          public_metrics: { like_count: 5, retweet_count: 0, reply_count: 0, quote_count: 0 },
          lang: 'en',
        },
      ];

      const mockSearchTweets = jest.fn().mockResolvedValue({
        tweets: mixedTweets,
        resultCount: 2,
      });

      (TwitterClient as jest.MockedClass<typeof TwitterClient>).mockImplementation(() => ({
        searchTweets: mockSearchTweets,
        testConnection: jest.fn().mockResolvedValue(true),
      } as any));

      const scraper = new TwitterScraper(mockConfig, logger);
      const scrapeConfig: ScrapeConfig = {
        type: 'twitter',
        params: {},
      };

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(1);
      expect(signals[0]?.content).toBe('Regular tweet');
    });

    it('should filter by language when configured', async () => {
      const multiLangTweets = [
        {
          id: '1',
          text: 'English tweet',
          created_at: '2025-01-01T12:00:00.000Z',
          author_id: 'user1',
          public_metrics: { like_count: 10, retweet_count: 5, reply_count: 2, quote_count: 1 },
          lang: 'en',
        },
        {
          id: '2',
          text: 'Tweet en español',
          created_at: '2025-01-01T13:00:00.000Z',
          author_id: 'user2',
          public_metrics: { like_count: 5, retweet_count: 2, reply_count: 1, quote_count: 0 },
          lang: 'es',
        },
      ];

      const mockSearchTweets = jest.fn().mockResolvedValue({
        tweets: multiLangTweets,
        resultCount: 2,
      });

      (TwitterClient as jest.MockedClass<typeof TwitterClient>).mockImplementation(() => ({
        searchTweets: mockSearchTweets,
        testConnection: jest.fn().mockResolvedValue(true),
      } as any));

      const scraper = new TwitterScraper(mockConfig, logger);
      const scrapeConfig: ScrapeConfig = {
        type: 'twitter',
        params: {},
      };

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(1);
      expect(signals[0]?.content).toBe('English tweet');
    });

    it('should respect maxItems limit', async () => {
      const manyTweets = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        text: `Tweet ${i + 1}`,
        created_at: '2025-01-01T12:00:00.000Z',
        author_id: `user${i + 1}`,
        public_metrics: { like_count: 10, retweet_count: 5, reply_count: 2, quote_count: 1 },
        lang: 'en',
      }));

      const mockSearchTweets = jest.fn().mockResolvedValue({
        tweets: manyTweets,
        resultCount: 10,
      });

      (TwitterClient as jest.MockedClass<typeof TwitterClient>).mockImplementation(() => ({
        searchTweets: mockSearchTweets,
        testConnection: jest.fn().mockResolvedValue(true),
      } as any));

      const scraper = new TwitterScraper(mockConfig, logger);
      const scrapeConfig: ScrapeConfig = {
        type: 'twitter',
        params: {},
        maxItems: 5,
      };

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals.length).toBeLessThanOrEqual(5);
    });

    it('should handle errors gracefully', async () => {
      const mockSearchTweets = jest.fn().mockRejectedValue(new Error('API error'));

      (TwitterClient as jest.MockedClass<typeof TwitterClient>).mockImplementation(() => ({
        searchTweets: mockSearchTweets,
        testConnection: jest.fn().mockResolvedValue(true),
      } as any));

      const scraper = new TwitterScraper(mockConfig, logger);
      const scrapeConfig: ScrapeConfig = {
        type: 'twitter',
        params: {},
      };

      const result = await scraper.scrape(scrapeConfig);
      expect(result).toEqual([]);
    });

    it('should apply time range filters', async () => {
      const mockSearchTweets = jest.fn().mockResolvedValue({
        tweets: [],
        resultCount: 0,
      });

      (TwitterClient as jest.MockedClass<typeof TwitterClient>).mockImplementation(() => ({
        searchTweets: mockSearchTweets,
        testConnection: jest.fn().mockResolvedValue(true),
      } as any));

      const scraper = new TwitterScraper(mockConfig, logger);
      const scrapeConfig: ScrapeConfig = {
        type: 'twitter',
        params: {},
        timeRangeHours: 24,
      };

      await scraper.scrape(scrapeConfig);

      expect(mockSearchTweets).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          startTime: expect.any(Date),
          endTime: expect.any(Date),
        })
      );
    });
  });

  describe('validate', () => {
    it('should validate correct WebSignal', () => {
      const scraper = new TwitterScraper(mockConfig, logger);
      const signal = {
        id: 'twitter-123',
        source: 'twitter' as const,
        content: 'Test content',
        timestamp: new Date(),
        url: 'https://twitter.com/i/web/status/123',
        metadata: {},
      };

      expect(scraper.validate(signal)).toBe(true);
    });

    it('should reject signal with wrong source', () => {
      const scraper = new TwitterScraper(mockConfig, logger);
      const signal = {
        id: 'twitter-123',
        source: 'reddit' as const,
        content: 'Test content',
        timestamp: new Date(),
        url: 'https://twitter.com/i/web/status/123',
        metadata: {},
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal with wrong ID format', () => {
      const scraper = new TwitterScraper(mockConfig, logger);
      const signal = {
        id: 'wrong-123',
        source: 'twitter' as const,
        content: 'Test content',
        timestamp: new Date(),
        url: 'https://twitter.com/i/web/status/123',
        metadata: {},
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal with wrong URL format', () => {
      const scraper = new TwitterScraper(mockConfig, logger);
      const signal = {
        id: 'twitter-123',
        source: 'twitter' as const,
        content: 'Test content',
        timestamp: new Date(),
        url: 'https://wrong.com/status/123',
        metadata: {},
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal with empty content', () => {
      const scraper = new TwitterScraper(mockConfig, logger);
      const signal = {
        id: 'twitter-123',
        source: 'twitter' as const,
        content: '',
        timestamp: new Date(),
        url: 'https://twitter.com/i/web/status/123',
        metadata: {},
      };

      expect(scraper.validate(signal)).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const mockTestConnection = jest.fn().mockResolvedValue(true);

      (TwitterClient as jest.MockedClass<typeof TwitterClient>).mockImplementation(() => ({
        testConnection: mockTestConnection,
      } as any));

      const scraper = new TwitterScraper(mockConfig, logger);
      const result = await scraper.testConnection();

      expect(result).toBe(true);
      expect(mockTestConnection).toHaveBeenCalled();
    });

    it('should return false for failed connection', async () => {
      const mockTestConnection = jest.fn().mockRejectedValue(new Error('Connection failed'));

      (TwitterClient as jest.MockedClass<typeof TwitterClient>).mockImplementation(() => ({
        testConnection: mockTestConnection,
      } as any));

      const scraper = new TwitterScraper(mockConfig, logger);
      const result = await scraper.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('resetCache', () => {
    it('should reset seen tweet IDs', async () => {
      const mockTweet = {
        id: '1',
        text: 'Test tweet',
        created_at: '2025-01-01T12:00:00.000Z',
        author_id: 'user1',
        public_metrics: { like_count: 10, retweet_count: 5, reply_count: 2, quote_count: 1 },
        lang: 'en',
      };

      const mockSearchTweets = jest.fn().mockResolvedValue({
        tweets: [mockTweet],
        resultCount: 1,
      });

      (TwitterClient as jest.MockedClass<typeof TwitterClient>).mockImplementation(() => ({
        searchTweets: mockSearchTweets,
        testConnection: jest.fn().mockResolvedValue(true),
      } as any));

      const scraper = new TwitterScraper(mockConfig, logger);
      const scrapeConfig: ScrapeConfig = {
        type: 'twitter',
        params: {},
      };

      // First scrape
      await scraper.scrape(scrapeConfig);
      let stats = scraper.getStats();
      expect(stats.seenTweetCount).toBeGreaterThan(0);

      // Reset cache
      scraper.resetCache();
      stats = scraper.getStats();
      expect(stats.seenTweetCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return scraper statistics', () => {
      const scraper = new TwitterScraper(mockConfig, logger);
      const stats = scraper.getStats();

      expect(stats.seenTweetCount).toBe(0);
      expect(stats.queriesCount).toBe(2);
      expect(stats.config).toEqual(mockConfig);
    });
  });
});
