/**
 * Tests for Source types and utilities
 */

import {
  type SourceType,
  type SourceConfig,
  isSourceType,
  validateSourceConfig,
} from '../src/models/source';

describe('Source Types', () => {
  describe('isSourceType', () => {
    it('should return true for valid source types', () => {
      expect(isSourceType('reddit')).toBe(true);
      expect(isSourceType('twitter')).toBe(true);
      expect(isSourceType('github')).toBe(true);
      expect(isSourceType('hackernews')).toBe(true);
    });

    it('should return false for invalid source types', () => {
      expect(isSourceType('facebook')).toBe(false);
      expect(isSourceType('instagram')).toBe(false);
      expect(isSourceType('')).toBe(false);
      expect(isSourceType('REDDIT')).toBe(false);
    });
  });

  describe('validateSourceConfig', () => {
    it('should validate a correct source config', () => {
      const config: SourceConfig = {
        type: 'reddit',
        params: { subreddit: 'programming' },
      };
      expect(validateSourceConfig(config)).toBe(true);
    });

    it('should validate config with optional fields', () => {
      const config: SourceConfig = {
        type: 'github',
        params: { repo: 'microsoft/vscode' },
        maxItems: 100,
        timeRangeHours: 24,
      };
      expect(validateSourceConfig(config)).toBe(true);
    });

    it('should reject config with invalid type', () => {
      const config = {
        type: 'invalid' as SourceType,
        params: {},
      };
      expect(validateSourceConfig(config)).toBe(false);
    });

    it('should reject config with null params', () => {
      const config = {
        type: 'reddit' as SourceType,
        params: null as unknown as Record<string, string>,
      };
      expect(validateSourceConfig(config)).toBe(false);
    });

    it('should reject config with invalid maxItems', () => {
      const config: SourceConfig = {
        type: 'twitter',
        params: { username: 'test' },
        maxItems: -5,
      };
      expect(validateSourceConfig(config)).toBe(false);
    });

    it('should reject config with zero maxItems', () => {
      const config: SourceConfig = {
        type: 'twitter',
        params: { username: 'test' },
        maxItems: 0,
      };
      expect(validateSourceConfig(config)).toBe(false);
    });

    it('should reject config with invalid timeRangeHours', () => {
      const config: SourceConfig = {
        type: 'hackernews',
        params: { category: 'top' },
        timeRangeHours: -10,
      };
      expect(validateSourceConfig(config)).toBe(false);
    });

    it('should reject config with zero timeRangeHours', () => {
      const config: SourceConfig = {
        type: 'hackernews',
        params: { category: 'top' },
        timeRangeHours: 0,
      };
      expect(validateSourceConfig(config)).toBe(false);
    });
  });
});
