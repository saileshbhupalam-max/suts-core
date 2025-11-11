/**
 * Tests for Reddit Scraper
 */

import { RedditScraper } from '../src/scraper';
import { RedditClient } from '../src/client';
import { ScraperError } from '@rgs/utils/errors';
import { Logger } from '@rgs/utils/logger';
import { ScrapeConfig } from '@rgs/core/interfaces/scraper';

// Mock dependencies
jest.mock('../src/client');
jest.mock('@rgs/utils/logger');

describe('RedditScraper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment
    process.env = { ...originalEnv };
    process.env['REDDIT_CLIENT_ID'] = 'test-client-id';
    process.env['REDDIT_CLIENT_SECRET'] = 'test-client-secret';

    // Mock Logger
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(
      () =>
        ({
          info: jest.fn(),
          debug: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        }) as unknown as Logger
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockPosts = [
    {
      id: 'post1',
      title: 'Test Post 1',
      selftext: 'Body 1',
      author: { name: 'user1' },
      created_utc: 1699999999,
      permalink: '/r/vscode/comments/post1/',
      subreddit: { display_name: 'vscode' },
      score: 100,
      num_comments: 10,
      upvote_ratio: 0.9,
      url: 'https://reddit.com/r/vscode/comments/post1/',
      is_self: true,
      author_fullname: 't2_user1',
    },
    {
      id: 'post2',
      title: 'Test Post 2',
      selftext: 'Body 2',
      author: { name: 'user2' },
      created_utc: 1699999998,
      permalink: '/r/vscode/comments/post2/',
      subreddit: { display_name: 'vscode' },
      score: 50,
      num_comments: 5,
      upvote_ratio: 0.85,
      url: 'https://reddit.com/r/vscode/comments/post2/',
      is_self: true,
      author_fullname: 't2_user2',
    },
  ];

  describe('constructor', () => {
    it('should initialize scraper with default config', () => {
      const scraper = new RedditScraper();

      expect(scraper).toBeInstanceOf(RedditScraper);
      expect(RedditClient).toHaveBeenCalled();
    });

    it('should initialize scraper with custom config', () => {
      const scraper = new RedditScraper({
        subreddits: ['typescript'],
        postsPerSubreddit: 50,
        sort: 'new',
      });

      expect(scraper).toBeInstanceOf(RedditScraper);
      const config = scraper.getConfig();
      expect(config.subreddits).toEqual(['typescript']);
      expect(config.postsPerSubreddit).toBe(50);
      expect(config.sort).toBe('new');
    });

    it('should throw ScraperError if initialization fails', () => {
      delete process.env['REDDIT_CLIENT_ID'];

      expect(() => new RedditScraper()).toThrow(ScraperError);
    });
  });

  describe('scrape', () => {
    it('should scrape posts from multiple subreddits successfully', async () => {
      const mockClient = {
        getPosts: jest.fn().mockResolvedValue(mockPosts),
      };

      (RedditClient as jest.MockedClass<typeof RedditClient>).mockImplementation(
        () => mockClient as unknown as RedditClient
      );

      const scraper = new RedditScraper({
        subreddits: ['vscode', 'programming'],
        postsPerSubreddit: 10,
      });

      const signals = await scraper.scrape();

      expect(signals.length).toBeGreaterThan(0);
      expect(mockClient.getPosts).toHaveBeenCalledTimes(2);
      expect(mockClient.getPosts).toHaveBeenCalledWith('vscode', {
        limit: 10,
        sort: 'hot',
      });
      expect(mockClient.getPosts).toHaveBeenCalledWith('programming', {
        limit: 10,
        sort: 'hot',
      });
    });

    it('should map Reddit posts to WebSignals correctly', async () => {
      const mockClient = {
        getPosts: jest.fn().mockResolvedValue(mockPosts),
      };

      (RedditClient as jest.MockedClass<typeof RedditClient>).mockImplementation(
        () => mockClient as unknown as RedditClient
      );

      const scraper = new RedditScraper({
        subreddits: ['vscode'],
      });

      const signals = await scraper.scrape();

      expect(signals[0]?.id).toBe('reddit-post1');
      expect(signals[0]?.source).toBe('reddit');
      expect(signals[0]?.content).toContain('Test Post 1');
      expect(signals[0]?.author).toBe('user1');
      expect(signals[0]?.metadata['subreddit']).toBe('vscode');
    });

    it('should filter out deleted posts', async () => {
      const postsWithDeleted = [
        ...mockPosts,
        {
          ...mockPosts[0]!,
          id: 'deleted',
          author: { name: '[deleted]' },
        },
      ];

      const mockClient = {
        getPosts: jest.fn().mockResolvedValue(postsWithDeleted),
      };

      (RedditClient as jest.MockedClass<typeof RedditClient>).mockImplementation(
        () => mockClient as unknown as RedditClient
      );

      const scraper = new RedditScraper({
        subreddits: ['vscode'],
      });

      const signals = await scraper.scrape();

      // Should only have 2 valid posts, not the deleted one
      expect(signals).toHaveLength(2);
      expect(signals.every((s) => s.id !== 'reddit-deleted')).toBe(true);
    });

    it('should use config from ScrapeConfig if provided', async () => {
      const mockClient = {
        getPosts: jest.fn().mockResolvedValue(mockPosts),
      };

      (RedditClient as jest.MockedClass<typeof RedditClient>).mockImplementation(
        () => mockClient as unknown as RedditClient
      );

      const scraper = new RedditScraper({
        subreddits: ['vscode'],
      });

      const scrapeConfig: ScrapeConfig = {
        type: 'reddit',
        params: {
          subreddits: 'typescript,javascript',
        },
        maxItems: 50,
      };

      await scraper.scrape(scrapeConfig);

      expect(mockClient.getPosts).toHaveBeenCalledWith('typescript', {
        limit: 50,
        sort: 'hot',
      });
      expect(mockClient.getPosts).toHaveBeenCalledWith('javascript', {
        limit: 50,
        sort: 'hot',
      });
    });

    it('should handle retryable errors and continue scraping', async () => {
      const mockClient = {
        getPosts: jest
          .fn()
          .mockRejectedValueOnce(new ScraperError('Temporary failure', 'reddit', true))
          .mockResolvedValueOnce(mockPosts),
      };

      (RedditClient as jest.MockedClass<typeof RedditClient>).mockImplementation(
        () => mockClient as unknown as RedditClient
      );

      const scraper = new RedditScraper({
        subreddits: ['vscode', 'programming'],
      });

      const signals = await scraper.scrape();

      // Should have signals from the second successful scrape
      expect(signals.length).toBeGreaterThan(0);
      expect(mockClient.getPosts).toHaveBeenCalledTimes(2);
    });

    it('should throw on non-retryable errors', async () => {
      const mockClient = {
        getPosts: jest.fn().mockRejectedValue(new ScraperError('Fatal error', 'reddit', false)),
      };

      (RedditClient as jest.MockedClass<typeof RedditClient>).mockImplementation(
        () => mockClient as unknown as RedditClient
      );

      const scraper = new RedditScraper({
        subreddits: ['vscode'],
      });

      await expect(scraper.scrape()).rejects.toThrow(ScraperError);
    });

    it('should throw if no signals scraped from any subreddit', async () => {
      const mockClient = {
        getPosts: jest.fn().mockRejectedValue(new ScraperError('Error', 'reddit', true)),
      };

      (RedditClient as jest.MockedClass<typeof RedditClient>).mockImplementation(
        () => mockClient as unknown as RedditClient
      );

      const scraper = new RedditScraper({
        subreddits: ['vscode', 'programming'],
      });

      await expect(scraper.scrape()).rejects.toThrow(ScraperError);
      await expect(scraper.scrape()).rejects.toThrow('Failed to scrape any signals');
    });

    it('should validate signals and filter invalid ones', async () => {
      const invalidPost = {
        ...mockPosts[0]!,
        id: 'invalid',
        title: '', // Invalid - empty title
        selftext: '', // Invalid - empty body
      };

      const mockClient = {
        getPosts: jest.fn().mockResolvedValue([...mockPosts, invalidPost]),
      };

      (RedditClient as jest.MockedClass<typeof RedditClient>).mockImplementation(
        () => mockClient as unknown as RedditClient
      );

      const scraper = new RedditScraper({
        subreddits: ['vscode'],
      });

      const signals = await scraper.scrape();

      // Should only have valid signals
      expect(signals).toHaveLength(2);
    });
  });

  describe('testConnection', () => {
    it('should return true on successful connection test', async () => {
      const mockClient = {
        testConnection: jest.fn().mockResolvedValue(true),
      };

      (RedditClient as jest.MockedClass<typeof RedditClient>).mockImplementation(
        () => mockClient as unknown as RedditClient
      );

      const scraper = new RedditScraper();
      const result = await scraper.testConnection();

      expect(result).toBe(true);
      expect(mockClient.testConnection).toHaveBeenCalled();
    });

    it('should return false on failed connection test', async () => {
      const mockClient = {
        testConnection: jest.fn().mockResolvedValue(false),
      };

      (RedditClient as jest.MockedClass<typeof RedditClient>).mockImplementation(
        () => mockClient as unknown as RedditClient
      );

      const scraper = new RedditScraper();
      const result = await scraper.testConnection();

      expect(result).toBe(false);
    });

    it('should return false if connection test throws error', async () => {
      const mockClient = {
        testConnection: jest.fn().mockRejectedValue(new Error('Connection failed')),
      };

      (RedditClient as jest.MockedClass<typeof RedditClient>).mockImplementation(
        () => mockClient as unknown as RedditClient
      );

      const scraper = new RedditScraper();
      const result = await scraper.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('validate', () => {
    it('should validate valid signals', () => {
      const scraper = new RedditScraper();

      const validSignal = {
        id: 'reddit-test',
        source: 'reddit' as const,
        content: 'Test content',
        timestamp: new Date(),
        url: 'https://reddit.com/test',
        metadata: {},
      };

      expect(scraper.validate(validSignal)).toBe(true);
    });

    it('should reject signals with empty content', () => {
      const scraper = new RedditScraper();

      const invalidSignal = {
        id: 'reddit-test',
        source: 'reddit' as const,
        content: '',
        timestamp: new Date(),
        url: 'https://reddit.com/test',
        metadata: {},
      };

      expect(scraper.validate(invalidSignal)).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const scraper = new RedditScraper({
        subreddits: ['typescript'],
        postsPerSubreddit: 25,
      });

      const config = scraper.getConfig();

      expect(config.subreddits).toEqual(['typescript']);
      expect(config.postsPerSubreddit).toBe(25);
    });
  });
});
