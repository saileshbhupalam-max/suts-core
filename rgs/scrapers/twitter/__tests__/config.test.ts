/**
 * Tests for Twitter Configuration
 */

import {
  TwitterConfig,
  DEFAULT_TWITTER_CONFIG,
  validateTwitterConfig,
  createTwitterConfigFromEnv,
  buildSearchQueries,
} from '../src/config';

describe('TwitterConfig', () => {
  describe('validateTwitterConfig', () => {
    it('should validate a valid configuration', () => {
      const config: TwitterConfig = {
        bearerToken: 'test-token',
        queries: ['test query'],
        maxResultsPerQuery: 50,
        excludeRetweets: true,
        languages: ['en'],
        rateLimit: {
          requestsPer15Min: 450,
        },
      };

      expect(() => validateTwitterConfig(config)).not.toThrow();
      expect(validateTwitterConfig(config)).toBe(true);
    });

    it('should throw error for empty bearer token', () => {
      const config: TwitterConfig = {
        bearerToken: '',
        queries: ['test query'],
        maxResultsPerQuery: 50,
        excludeRetweets: true,
        rateLimit: {
          requestsPer15Min: 450,
        },
      };

      expect(() => validateTwitterConfig(config)).toThrow();
    });

    it('should throw error for empty queries array', () => {
      const config: TwitterConfig = {
        bearerToken: 'test-token',
        queries: [],
        maxResultsPerQuery: 50,
        excludeRetweets: true,
        rateLimit: {
          requestsPer15Min: 450,
        },
      };

      expect(() => validateTwitterConfig(config)).toThrow();
    });

    it('should throw error for maxResults below 10', () => {
      const config: TwitterConfig = {
        bearerToken: 'test-token',
        queries: ['test query'],
        maxResultsPerQuery: 5,
        excludeRetweets: true,
        rateLimit: {
          requestsPer15Min: 450,
        },
      };

      expect(() => validateTwitterConfig(config)).toThrow();
    });

    it('should throw error for maxResults above 100', () => {
      const config: TwitterConfig = {
        bearerToken: 'test-token',
        queries: ['test query'],
        maxResultsPerQuery: 150,
        excludeRetweets: true,
        rateLimit: {
          requestsPer15Min: 450,
        },
      };

      expect(() => validateTwitterConfig(config)).toThrow();
    });

    it('should validate config without optional languages', () => {
      const config: TwitterConfig = {
        bearerToken: 'test-token',
        queries: ['test query'],
        maxResultsPerQuery: 50,
        excludeRetweets: true,
        rateLimit: {
          requestsPer15Min: 450,
        },
      };

      expect(() => validateTwitterConfig(config)).not.toThrow();
    });
  });

  describe('createTwitterConfigFromEnv', () => {
    const originalEnv = process.env['TWITTER_BEARER_TOKEN'];

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env['TWITTER_BEARER_TOKEN'] = originalEnv;
      } else {
        delete process.env['TWITTER_BEARER_TOKEN'];
      }
    });

    it('should create config from environment variables', () => {
      process.env['TWITTER_BEARER_TOKEN'] = 'test-bearer-token';

      const config = createTwitterConfigFromEnv();

      expect(config.bearerToken).toBe('test-bearer-token');
      expect(config.queries.length).toBeGreaterThan(0);
      expect(config.maxResultsPerQuery).toBe(100);
      expect(config.excludeRetweets).toBe(true);
      expect(config.rateLimit.requestsPer15Min).toBe(450);
    });

    it('should throw error if TWITTER_BEARER_TOKEN is missing', () => {
      delete process.env['TWITTER_BEARER_TOKEN'];

      expect(() => createTwitterConfigFromEnv()).toThrow('Missing required environment variable');
    });

    it('should throw error if TWITTER_BEARER_TOKEN is empty', () => {
      process.env['TWITTER_BEARER_TOKEN'] = '';

      expect(() => createTwitterConfigFromEnv()).toThrow();
    });

    it('should throw error if TWITTER_BEARER_TOKEN is whitespace', () => {
      process.env['TWITTER_BEARER_TOKEN'] = '   ';

      expect(() => createTwitterConfigFromEnv()).toThrow();
    });
  });

  describe('buildSearchQueries', () => {
    it('should build queries with exclude retweets', () => {
      const keywords = ['vscode', 'cursor'];
      const queries = buildSearchQueries(keywords, true);

      expect(queries).toHaveLength(2);
      expect(queries[0]).toBe('vscode -is:retweet');
      expect(queries[1]).toBe('cursor -is:retweet');
    });

    it('should build queries without exclude retweets', () => {
      const keywords = ['vscode', 'cursor'];
      const queries = buildSearchQueries(keywords, false);

      expect(queries).toHaveLength(2);
      expect(queries[0]).toBe('vscode');
      expect(queries[1]).toBe('cursor');
    });

    it('should build queries with language filter', () => {
      const keywords = ['vscode'];
      const queries = buildSearchQueries(keywords, true, 'en');

      expect(queries).toHaveLength(1);
      expect(queries[0]).toBe('vscode -is:retweet lang:en');
    });

    it('should build queries with language but without retweet filter', () => {
      const keywords = ['vscode'];
      const queries = buildSearchQueries(keywords, false, 'en');

      expect(queries).toHaveLength(1);
      expect(queries[0]).toBe('vscode lang:en');
    });

    it('should handle multiple keywords correctly', () => {
      const keywords = ['vscode extension', 'cursor ai', 'copilot'];
      const queries = buildSearchQueries(keywords, true, 'en');

      expect(queries).toHaveLength(3);
      expect(queries[0]).toBe('vscode extension -is:retweet lang:en');
      expect(queries[1]).toBe('cursor ai -is:retweet lang:en');
      expect(queries[2]).toBe('copilot -is:retweet lang:en');
    });

    it('should handle empty keywords array', () => {
      const queries = buildSearchQueries([], true, 'en');
      expect(queries).toHaveLength(0);
    });
  });

  describe('DEFAULT_TWITTER_CONFIG', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_TWITTER_CONFIG.queries.length).toBeGreaterThan(0);
      expect(DEFAULT_TWITTER_CONFIG.maxResultsPerQuery).toBe(100);
      expect(DEFAULT_TWITTER_CONFIG.excludeRetweets).toBe(true);
      expect(DEFAULT_TWITTER_CONFIG.languages).toEqual(['en']);
      expect(DEFAULT_TWITTER_CONFIG.rateLimit.requestsPer15Min).toBe(450);
    });

    it('should have queries with proper format', () => {
      for (const query of DEFAULT_TWITTER_CONFIG.queries) {
        expect(query).toContain('-is:retweet');
        expect(query).toContain('lang:en');
      }
    });
  });
});
