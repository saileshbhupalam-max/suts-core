/**
 * Tests for Reddit Configuration
 */

import {
  RedditConfig,
  RedditConfigSchema,
  DEFAULT_REDDIT_CONFIG,
  createRedditConfig,
  isValidSubreddit,
} from '../src/config';

describe('RedditConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    process.env['REDDIT_CLIENT_ID'] = 'test-client-id';
    process.env['REDDIT_CLIENT_SECRET'] = 'test-client-secret';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('RedditConfigSchema', () => {
    it('should validate a valid config', () => {
      const config: RedditConfig = {
        clientId: 'test-id',
        clientSecret: 'test-secret',
        userAgent: 'RGS/1.0',
        subreddits: ['vscode', 'programming'],
        postsPerSubreddit: 100,
        sort: 'hot',
        rateLimit: 60,
      };

      const result = RedditConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject config with empty client ID', () => {
      const config = {
        clientId: '',
        clientSecret: 'test-secret',
        userAgent: 'RGS/1.0',
        subreddits: ['vscode'],
        postsPerSubreddit: 100,
        sort: 'hot',
        rateLimit: 60,
      };

      const result = RedditConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject config with empty subreddits array', () => {
      const config = {
        clientId: 'test-id',
        clientSecret: 'test-secret',
        userAgent: 'RGS/1.0',
        subreddits: [],
        postsPerSubreddit: 100,
        sort: 'hot',
        rateLimit: 60,
      };

      const result = RedditConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject subreddit names with r/ prefix', () => {
      const config = {
        clientId: 'test-id',
        clientSecret: 'test-secret',
        userAgent: 'RGS/1.0',
        subreddits: ['r/vscode', 'programming'],
        postsPerSubreddit: 100,
        sort: 'hot',
        rateLimit: 60,
      };

      const result = RedditConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject invalid sort value', () => {
      const config = {
        clientId: 'test-id',
        clientSecret: 'test-secret',
        userAgent: 'RGS/1.0',
        subreddits: ['vscode'],
        postsPerSubreddit: 100,
        sort: 'invalid',
        rateLimit: 60,
      };

      const result = RedditConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject rate limit exceeding 60', () => {
      const config = {
        clientId: 'test-id',
        clientSecret: 'test-secret',
        userAgent: 'RGS/1.0',
        subreddits: ['vscode'],
        postsPerSubreddit: 100,
        sort: 'hot',
        rateLimit: 100,
      };

      const result = RedditConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject posts per subreddit exceeding 1000', () => {
      const config = {
        clientId: 'test-id',
        clientSecret: 'test-secret',
        userAgent: 'RGS/1.0',
        subreddits: ['vscode'],
        postsPerSubreddit: 1500,
        sort: 'hot',
        rateLimit: 60,
      };

      const result = RedditConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('createRedditConfig', () => {
    it('should create config with default values', () => {
      const config = createRedditConfig();

      expect(config.clientId).toBe('test-client-id');
      expect(config.clientSecret).toBe('test-client-secret');
      expect(config.userAgent).toBe('RGS/1.0');
      expect(config.subreddits).toEqual(['vscode', 'programming', 'cursor']);
      expect(config.postsPerSubreddit).toBe(100);
      expect(config.sort).toBe('hot');
      expect(config.rateLimit).toBe(60);
    });

    it('should create config with overrides', () => {
      const config = createRedditConfig({
        subreddits: ['typescript', 'javascript'],
        postsPerSubreddit: 50,
        sort: 'new',
      });

      expect(config.subreddits).toEqual(['typescript', 'javascript']);
      expect(config.postsPerSubreddit).toBe(50);
      expect(config.sort).toBe('new');
    });

    it('should throw error if REDDIT_CLIENT_ID is missing', () => {
      delete process.env['REDDIT_CLIENT_ID'];

      expect(() => createRedditConfig()).toThrow(
        'REDDIT_CLIENT_ID environment variable is required'
      );
    });

    it('should throw error if REDDIT_CLIENT_ID is empty', () => {
      process.env['REDDIT_CLIENT_ID'] = '';

      expect(() => createRedditConfig()).toThrow(
        'REDDIT_CLIENT_ID environment variable is required'
      );
    });

    it('should throw error if REDDIT_CLIENT_SECRET is missing', () => {
      delete process.env['REDDIT_CLIENT_SECRET'];

      expect(() => createRedditConfig()).toThrow(
        'REDDIT_CLIENT_SECRET environment variable is required'
      );
    });

    it('should throw error if REDDIT_CLIENT_SECRET is empty', () => {
      process.env['REDDIT_CLIENT_SECRET'] = '';

      expect(() => createRedditConfig()).toThrow(
        'REDDIT_CLIENT_SECRET environment variable is required'
      );
    });

    it('should throw error for invalid configuration', () => {
      expect(() =>
        createRedditConfig({
          rateLimit: 100, // Exceeds max of 60
        })
      ).toThrow('Invalid Reddit configuration');
    });
  });

  describe('isValidSubreddit', () => {
    it('should return true for valid subreddit names', () => {
      expect(isValidSubreddit('vscode')).toBe(true);
      expect(isValidSubreddit('programming')).toBe(true);
      expect(isValidSubreddit('typescript_lang')).toBe(true);
      expect(isValidSubreddit('rust_lang123')).toBe(true);
    });

    it('should return false for empty subreddit name', () => {
      expect(isValidSubreddit('')).toBe(false);
      expect(isValidSubreddit('   ')).toBe(false);
    });

    it('should return false for subreddit names with r/ prefix', () => {
      expect(isValidSubreddit('r/vscode')).toBe(false);
    });

    it('should return false for subreddit names with special characters', () => {
      expect(isValidSubreddit('vs-code')).toBe(false);
      expect(isValidSubreddit('vs code')).toBe(false);
      expect(isValidSubreddit('vs.code')).toBe(false);
      expect(isValidSubreddit('vs/code')).toBe(false);
    });
  });

  describe('DEFAULT_REDDIT_CONFIG', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_REDDIT_CONFIG.userAgent).toBe('RGS/1.0');
      expect(DEFAULT_REDDIT_CONFIG.postsPerSubreddit).toBe(100);
      expect(DEFAULT_REDDIT_CONFIG.sort).toBe('hot');
      expect(DEFAULT_REDDIT_CONFIG.rateLimit).toBe(60);
    });
  });
});
