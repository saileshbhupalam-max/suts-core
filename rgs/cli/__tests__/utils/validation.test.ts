/**
 * Tests for validation utilities
 */

import { validateOptions, scrapeOptionsSchema, analyzeOptionsSchema, runOptionsSchema } from '../../src/utils/validation';

describe('validation utilities', () => {
  describe('scrapeOptionsSchema', () => {
    it('should validate valid scrape options', () => {
      const options = {
        sources: ['reddit'],
        output: '/path/to/output.json',
      };

      const result = validateOptions(scrapeOptionsSchema, options);
      expect(result).toEqual(options);
    });

    it('should validate with optional fields', () => {
      const options = {
        sources: ['reddit', 'twitter'],
        subreddits: ['vscode', 'gaming'],
        limit: 20,
        output: '/path/to/output.json',
      };

      const result = validateOptions(scrapeOptionsSchema, options);
      expect(result).toEqual(options);
    });

    it('should reject options without sources', () => {
      const options = {
        sources: [],
        output: '/path/to/output.json',
      };

      expect(() => validateOptions(scrapeOptionsSchema, options)).toThrow('Invalid options');
    });

    it('should reject options without output', () => {
      const options = {
        sources: ['reddit'],
        output: '',
      };

      expect(() => validateOptions(scrapeOptionsSchema, options)).toThrow('Invalid options');
    });

    it('should reject negative limit', () => {
      const options = {
        sources: ['reddit'],
        limit: -1,
        output: '/path/to/output.json',
      };

      expect(() => validateOptions(scrapeOptionsSchema, options)).toThrow();
    });
  });

  describe('analyzeOptionsSchema', () => {
    it('should validate valid analyze options', () => {
      const options = {
        input: '/path/to/input.json',
        output: '/path/to/output.json',
      };

      const result = validateOptions(analyzeOptionsSchema, options);
      expect(result).toEqual(options);
    });

    it('should validate with skip flags', () => {
      const options = {
        input: '/path/to/input.json',
        output: '/path/to/output.json',
        skipSentiment: true,
        skipThemes: true,
      };

      const result = validateOptions(analyzeOptionsSchema, options);
      expect(result).toEqual(options);
    });

    it('should reject options without input', () => {
      const options = {
        input: '',
        output: '/path/to/output.json',
      };

      expect(() => validateOptions(analyzeOptionsSchema, options)).toThrow('Invalid options');
    });

    it('should reject options without output', () => {
      const options = {
        input: '/path/to/input.json',
        output: '',
      };

      expect(() => validateOptions(analyzeOptionsSchema, options)).toThrow('Invalid options');
    });
  });

  describe('runOptionsSchema', () => {
    it('should validate valid run options', () => {
      const options = {
        config: '/path/to/config.json',
        output: '/path/to/output',
      };

      const result = validateOptions(runOptionsSchema, options);
      expect(result).toEqual(options);
    });

    it('should reject options without config', () => {
      const options = {
        config: '',
        output: '/path/to/output',
      };

      expect(() => validateOptions(runOptionsSchema, options)).toThrow('Invalid options');
    });

    it('should reject options without output', () => {
      const options = {
        config: '/path/to/config.json',
        output: '',
      };

      expect(() => validateOptions(runOptionsSchema, options)).toThrow('Invalid options');
    });
  });

  describe('validateOptions', () => {
    it('should throw error with detailed messages', () => {
      const options = {
        sources: [],
        output: '',
      };

      try {
        validateOptions(scrapeOptionsSchema, options);
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toContain('Invalid options');
        expect((error as Error).message).toContain('sources');
        expect((error as Error).message).toContain('output');
      }
    });
  });
});
