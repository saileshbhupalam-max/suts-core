/**
 * Tests for Reddit Client
 */

import { RedditClient } from '../src/client';
import { RateLimiter } from '@rgs/utils/rate-limiter';
import { NetworkError, AuthenticationError } from '@rgs/utils/errors';
import { RedditConfig } from '../src/config';

// Mock snoowrap
jest.mock('snoowrap');
import Snoowrap from 'snoowrap';

describe('RedditClient', () => {
  let mockConfig: RedditConfig;
  let mockRateLimiter: RateLimiter;
  let mockSnoowrapInstance: jest.Mocked<Snoowrap>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    mockConfig = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      userAgent: 'RGS/1.0',
      subreddits: ['vscode', 'programming'],
      postsPerSubreddit: 100,
      sort: 'hot',
      rateLimit: 60,
    };

    mockRateLimiter = {
      execute: jest.fn((fn) => fn()),
    } as unknown as RateLimiter;

    // Mock snoowrap instance methods
    mockSnoowrapInstance = {
      config: jest.fn(),
      getSubreddit: jest.fn(),
    } as unknown as jest.Mocked<Snoowrap>;

    // Mock the Snoowrap constructor
    (Snoowrap as jest.MockedClass<typeof Snoowrap>).mockImplementation(() => mockSnoowrapInstance);
  });

  describe('constructor', () => {
    it('should initialize client with config', () => {
      const client = new RedditClient(mockConfig, mockRateLimiter);

      expect(client).toBeInstanceOf(RedditClient);
      expect(Snoowrap).toHaveBeenCalledWith({
        userAgent: 'RGS/1.0',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        refreshToken: '',
      });
      expect(mockSnoowrapInstance.config).toHaveBeenCalledWith({
        requestDelay: 1000,
        warnings: false,
        continueAfterRatelimitError: false,
      });
    });

    it('should throw AuthenticationError if snoowrap initialization fails', () => {
      (Snoowrap as jest.MockedClass<typeof Snoowrap>).mockImplementation(() => {
        throw new Error('Invalid credentials');
      });

      expect(() => new RedditClient(mockConfig, mockRateLimiter)).toThrow(AuthenticationError);
    });
  });

  describe('getSubreddit', () => {
    it('should fetch subreddit data successfully', async () => {
      const mockSubreddit = {
        fetch: jest.fn().mockResolvedValue({
          display_name: 'vscode',
          subscribers: 100000,
          public_description: 'VS Code community',
        }),
      };

      mockSnoowrapInstance.getSubreddit.mockReturnValue(mockSubreddit as never);

      const client = new RedditClient(mockConfig, mockRateLimiter);
      const result = await client.getSubreddit('vscode');

      expect(result).toEqual({
        name: 'vscode',
        subscribers: 100000,
        description: 'VS Code community',
      });
      expect(mockRateLimiter.execute).toHaveBeenCalled();
    });

    it('should handle empty description', async () => {
      const mockSubreddit = {
        fetch: jest.fn().mockResolvedValue({
          display_name: 'vscode',
          subscribers: 100000,
          public_description: '',
        }),
      };

      mockSnoowrapInstance.getSubreddit.mockReturnValue(mockSubreddit as never);

      const client = new RedditClient(mockConfig, mockRateLimiter);
      const result = await client.getSubreddit('vscode');

      expect(result.description).toBe('');
    });

    it('should throw NetworkError with 429 on rate limit', async () => {
      const mockError = { statusCode: 429, message: 'Rate limit exceeded' };
      mockSnoowrapInstance.getSubreddit.mockImplementation(() => {
        throw mockError;
      });

      const client = new RedditClient(mockConfig, mockRateLimiter);

      await expect(client.getSubreddit('vscode')).rejects.toThrow(NetworkError);
      await expect(client.getSubreddit('vscode')).rejects.toMatchObject({
        source: 'reddit',
        retryable: true,
      });
    });

    it('should throw NetworkError with 404 on not found', async () => {
      const mockError = { statusCode: 404, message: 'Not found' };
      mockSnoowrapInstance.getSubreddit.mockImplementation(() => {
        throw mockError;
      });

      const client = new RedditClient(mockConfig, mockRateLimiter);

      await expect(client.getSubreddit('nonexistent')).rejects.toThrow(NetworkError);
      await expect(client.getSubreddit('nonexistent')).rejects.toMatchObject({
        source: 'reddit',
        retryable: false,
      });
    });

    it('should throw generic NetworkError on other errors', async () => {
      mockSnoowrapInstance.getSubreddit.mockImplementation(() => {
        throw new Error('Network error');
      });

      const client = new RedditClient(mockConfig, mockRateLimiter);

      await expect(client.getSubreddit('vscode')).rejects.toThrow(NetworkError);
    });
  });

  describe('getPosts', () => {
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

    it('should fetch hot posts successfully', async () => {
      const mockSubreddit = {
        getHot: jest.fn().mockResolvedValue(mockPosts),
      };

      mockSnoowrapInstance.getSubreddit.mockReturnValue(mockSubreddit as never);

      const client = new RedditClient(mockConfig, mockRateLimiter);
      const result = await client.getPosts('vscode', { limit: 10, sort: 'hot' });

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('post1');
      expect(result[1]?.id).toBe('post2');
      expect(mockSubreddit.getHot).toHaveBeenCalledWith({ limit: 10 });
    });

    it('should fetch new posts successfully', async () => {
      const mockSubreddit = {
        getNew: jest.fn().mockResolvedValue(mockPosts),
      };

      mockSnoowrapInstance.getSubreddit.mockReturnValue(mockSubreddit as never);

      const client = new RedditClient(mockConfig, mockRateLimiter);
      const result = await client.getPosts('vscode', { limit: 10, sort: 'new' });

      expect(result).toHaveLength(2);
      expect(mockSubreddit.getNew).toHaveBeenCalledWith({ limit: 10 });
    });

    it('should fetch top posts successfully', async () => {
      const mockSubreddit = {
        getTop: jest.fn().mockResolvedValue(mockPosts),
      };

      mockSnoowrapInstance.getSubreddit.mockReturnValue(mockSubreddit as never);

      const client = new RedditClient(mockConfig, mockRateLimiter);
      const result = await client.getPosts('vscode', { limit: 10, sort: 'top' });

      expect(result).toHaveLength(2);
      expect(mockSubreddit.getTop).toHaveBeenCalledWith({ time: 'week', limit: 10 });
    });

    it('should handle deleted author', async () => {
      const postsWithDeletedAuthor = [
        {
          ...mockPosts[0],
          author: undefined,
        },
      ];

      const mockSubreddit = {
        getHot: jest.fn().mockResolvedValue(postsWithDeletedAuthor),
      };

      mockSnoowrapInstance.getSubreddit.mockReturnValue(mockSubreddit as never);

      const client = new RedditClient(mockConfig, mockRateLimiter);
      const result = await client.getPosts('vscode', { limit: 10, sort: 'hot' });

      expect(result[0]?.author.name).toBe('[deleted]');
    });

    it('should throw NetworkError on rate limit', async () => {
      const mockError = { statusCode: 429 };
      mockSnoowrapInstance.getSubreddit.mockImplementation(() => {
        throw mockError;
      });

      const client = new RedditClient(mockConfig, mockRateLimiter);

      await expect(client.getPosts('vscode', { limit: 10, sort: 'hot' })).rejects.toThrow(
        NetworkError
      );
    });

    it('should throw NetworkError on not found', async () => {
      const mockError = { statusCode: 404 };
      mockSnoowrapInstance.getSubreddit.mockImplementation(() => {
        throw mockError;
      });

      const client = new RedditClient(mockConfig, mockRateLimiter);

      await expect(client.getPosts('nonexistent', { limit: 10, sort: 'hot' })).rejects.toThrow(
        NetworkError
      );
    });
  });

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      const mockSubreddit = {
        fetch: jest.fn().mockResolvedValue({
          display_name: 'programming',
          subscribers: 1000000,
          public_description: 'Programming',
        }),
      };

      mockSnoowrapInstance.getSubreddit.mockReturnValue(mockSubreddit as never);

      const client = new RedditClient(mockConfig, mockRateLimiter);
      const result = await client.testConnection();

      expect(result).toBe(true);
    });

    it('should return false on failed connection', async () => {
      mockSnoowrapInstance.getSubreddit.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const client = new RedditClient(mockConfig, mockRateLimiter);
      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });
});
