/**
 * Tests for HackerNews configuration
 */

import { validateHNConfig, DEFAULT_HN_CONFIG, HNConfig } from '../src/config';

describe('HackerNews Configuration', () => {
  describe('validateHNConfig', () => {
    it('should validate default configuration', () => {
      expect(validateHNConfig(DEFAULT_HN_CONFIG)).toBe(true);
    });

    it('should validate valid configuration', () => {
      const config: HNConfig = {
        queries: ['test'],
        tags: ['story'],
        minPoints: 5,
        includeComments: false,
        maxResultsPerQuery: 50,
        rateLimit: {
          requestsPerHour: 5000,
        },
      };
      expect(validateHNConfig(config)).toBe(true);
    });

    it('should reject empty queries array', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        queries: [],
      };
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should reject non-array queries', () => {
      const config = {
        ...DEFAULT_HN_CONFIG,
        queries: 'not-an-array',
      } as unknown as HNConfig;
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should reject queries with empty strings', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        queries: ['valid', '', 'another'],
      };
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should reject queries with non-string values', () => {
      const config = {
        ...DEFAULT_HN_CONFIG,
        queries: ['valid', 123, 'another'],
      } as unknown as HNConfig;
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should reject empty tags array', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        tags: [],
      };
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should reject invalid tag values', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        tags: ['invalid_tag'],
      };
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should accept valid tag values', () => {
      const validTags = ['story', 'comment', 'poll', 'job', 'pollopt'];
      for (const tag of validTags) {
        const config: HNConfig = {
          ...DEFAULT_HN_CONFIG,
          tags: [tag],
        };
        expect(validateHNConfig(config)).toBe(true);
      }
    });

    it('should reject negative minPoints', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        minPoints: -1,
      };
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should accept zero minPoints', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        minPoints: 0,
      };
      expect(validateHNConfig(config)).toBe(true);
    });

    it('should accept undefined minPoints', () => {
      const { minPoints, ...configWithoutMinPoints } = DEFAULT_HN_CONFIG;
      const config: HNConfig = {
        ...configWithoutMinPoints,
      } as HNConfig;
      expect(validateHNConfig(config)).toBe(true);
    });

    it('should reject non-boolean includeComments', () => {
      const config = {
        ...DEFAULT_HN_CONFIG,
        includeComments: 'yes',
      } as unknown as HNConfig;
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should reject zero maxResultsPerQuery', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        maxResultsPerQuery: 0,
      };
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should reject negative maxResultsPerQuery', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        maxResultsPerQuery: -10,
      };
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should reject maxResultsPerQuery greater than 1000', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        maxResultsPerQuery: 1001,
      };
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should accept maxResultsPerQuery of 1000', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        maxResultsPerQuery: 1000,
      };
      expect(validateHNConfig(config)).toBe(true);
    });

    it('should reject missing rateLimit', () => {
      const config = {
        ...DEFAULT_HN_CONFIG,
        rateLimit: undefined,
      } as unknown as HNConfig;
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should reject null rateLimit', () => {
      const config = {
        ...DEFAULT_HN_CONFIG,
        rateLimit: null,
      } as unknown as HNConfig;
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should reject zero requestsPerHour', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        rateLimit: {
          requestsPerHour: 0,
        },
      };
      expect(validateHNConfig(config)).toBe(false);
    });

    it('should reject negative requestsPerHour', () => {
      const config: HNConfig = {
        ...DEFAULT_HN_CONFIG,
        rateLimit: {
          requestsPerHour: -100,
        },
      };
      expect(validateHNConfig(config)).toBe(false);
    });
  });

  describe('DEFAULT_HN_CONFIG', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_HN_CONFIG.queries).toEqual(['vscode', 'cursor ai', 'github copilot']);
      expect(DEFAULT_HN_CONFIG.tags).toEqual(['story', 'comment']);
      expect(DEFAULT_HN_CONFIG.minPoints).toBe(10);
      expect(DEFAULT_HN_CONFIG.includeComments).toBe(true);
      expect(DEFAULT_HN_CONFIG.maxResultsPerQuery).toBe(100);
      expect(DEFAULT_HN_CONFIG.rateLimit.requestsPerHour).toBe(10000);
    });

    it('should be valid', () => {
      expect(validateHNConfig(DEFAULT_HN_CONFIG)).toBe(true);
    });
  });
});
