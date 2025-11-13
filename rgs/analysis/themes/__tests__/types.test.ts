/**
 * Tests for theme extraction types
 */

import {
  isThemeCategory,
  isValidSentiment,
  isValidConfidence,
  isRawThemeExtraction,
  isExtractedTheme,
  ExtractedTheme,
  RawThemeExtraction,
} from '../src/types';

describe('Theme Types', () => {
  describe('isThemeCategory', () => {
    it('should return true for valid categories', () => {
      expect(isThemeCategory('pain')).toBe(true);
      expect(isThemeCategory('desire')).toBe(true);
      expect(isThemeCategory('feature')).toBe(true);
      expect(isThemeCategory('workflow')).toBe(true);
      expect(isThemeCategory('comparison')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(isThemeCategory('invalid')).toBe(false);
      expect(isThemeCategory('')).toBe(false);
      expect(isThemeCategory('PAIN')).toBe(false);
    });
  });

  describe('isValidSentiment', () => {
    it('should return true for valid sentiment scores', () => {
      expect(isValidSentiment(-1)).toBe(true);
      expect(isValidSentiment(0)).toBe(true);
      expect(isValidSentiment(1)).toBe(true);
      expect(isValidSentiment(0.5)).toBe(true);
      expect(isValidSentiment(-0.7)).toBe(true);
    });

    it('should return false for invalid sentiment scores', () => {
      expect(isValidSentiment(-1.1)).toBe(false);
      expect(isValidSentiment(1.1)).toBe(false);
      expect(isValidSentiment(2)).toBe(false);
      expect(isValidSentiment(-2)).toBe(false);
    });
  });

  describe('isValidConfidence', () => {
    it('should return true for valid confidence scores', () => {
      expect(isValidConfidence(0)).toBe(true);
      expect(isValidConfidence(1)).toBe(true);
      expect(isValidConfidence(0.5)).toBe(true);
      expect(isValidConfidence(0.95)).toBe(true);
    });

    it('should return false for invalid confidence scores', () => {
      expect(isValidConfidence(-0.1)).toBe(false);
      expect(isValidConfidence(1.1)).toBe(false);
      expect(isValidConfidence(2)).toBe(false);
      expect(isValidConfidence(-1)).toBe(false);
    });
  });

  describe('isRawThemeExtraction', () => {
    const validRaw: RawThemeExtraction = {
      theme: 'High token costs',
      keywords: ['expensive', 'costly', 'pricing'],
      category: 'pain',
      examples: ["It's too expensive", 'Pricing is high'],
    };

    it('should return true for valid raw theme extraction', () => {
      expect(isRawThemeExtraction(validRaw)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isRawThemeExtraction(null)).toBe(false);
      expect(isRawThemeExtraction(undefined)).toBe(false);
      expect(isRawThemeExtraction({})).toBe(false);
      expect(isRawThemeExtraction('string')).toBe(false);
    });

    it('should return false if theme is missing or invalid', () => {
      expect(isRawThemeExtraction({ ...validRaw, theme: '' })).toBe(false);
      expect(isRawThemeExtraction({ ...validRaw, theme: 123 })).toBe(false);
      const { theme: _theme, ...rest } = validRaw;
      expect(isRawThemeExtraction(rest)).toBe(false);
    });

    it('should return false if keywords are missing or invalid', () => {
      expect(isRawThemeExtraction({ ...validRaw, keywords: [] })).toBe(true); // Empty array is valid
      expect(isRawThemeExtraction({ ...validRaw, keywords: 'not-array' })).toBe(false);
      expect(isRawThemeExtraction({ ...validRaw, keywords: [1, 2, 3] })).toBe(false);
      const { keywords: _keywords, ...rest } = validRaw;
      expect(isRawThemeExtraction(rest)).toBe(false);
    });

    it('should return false if category is missing or invalid', () => {
      expect(isRawThemeExtraction({ ...validRaw, category: 'invalid' })).toBe(false);
      expect(isRawThemeExtraction({ ...validRaw, category: '' })).toBe(false);
      const { category: _category, ...rest } = validRaw;
      expect(isRawThemeExtraction(rest)).toBe(false);
    });

    it('should return false if examples are missing or invalid', () => {
      expect(isRawThemeExtraction({ ...validRaw, examples: [] })).toBe(true); // Empty array is valid
      expect(isRawThemeExtraction({ ...validRaw, examples: 'not-array' })).toBe(false);
      expect(isRawThemeExtraction({ ...validRaw, examples: [1, 2] })).toBe(false);
      const { examples: _examples, ...rest } = validRaw;
      expect(isRawThemeExtraction(rest)).toBe(false);
    });
  });

  describe('isExtractedTheme', () => {
    const validTheme: ExtractedTheme = {
      id: 'high-token-costs-abc123',
      name: 'High token costs',
      keywords: ['expensive', 'costly', 'pricing'],
      category: 'pain',
      frequency: 5,
      sentiment: -0.6,
      confidence: 0.85,
      examples: ["It's too expensive", 'Pricing is high'],
    };

    it('should return true for valid extracted theme', () => {
      expect(isExtractedTheme(validTheme)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isExtractedTheme(null)).toBe(false);
      expect(isExtractedTheme(undefined)).toBe(false);
      expect(isExtractedTheme({})).toBe(false);
      expect(isExtractedTheme('string')).toBe(false);
    });

    it('should return false if id is missing or invalid', () => {
      expect(isExtractedTheme({ ...validTheme, id: '' })).toBe(false);
      expect(isExtractedTheme({ ...validTheme, id: 123 })).toBe(false);
      const { id: _id, ...rest } = validTheme;
      expect(isExtractedTheme(rest)).toBe(false);
    });

    it('should return false if name is missing or invalid', () => {
      expect(isExtractedTheme({ ...validTheme, name: '' })).toBe(false);
      expect(isExtractedTheme({ ...validTheme, name: 123 })).toBe(false);
      const { name: _name, ...rest } = validTheme;
      expect(isExtractedTheme(rest)).toBe(false);
    });

    it('should return false if category is invalid', () => {
      expect(isExtractedTheme({ ...validTheme, category: 'invalid' })).toBe(false);
    });

    it('should return false if keywords are invalid', () => {
      expect(isExtractedTheme({ ...validTheme, keywords: 'not-array' })).toBe(false);
      expect(isExtractedTheme({ ...validTheme, keywords: [1, 2] })).toBe(false);
    });

    it('should return false if frequency is invalid', () => {
      expect(isExtractedTheme({ ...validTheme, frequency: -1 })).toBe(false);
      expect(isExtractedTheme({ ...validTheme, frequency: 'string' })).toBe(false);
    });

    it('should return false if sentiment is invalid', () => {
      expect(isExtractedTheme({ ...validTheme, sentiment: -1.5 })).toBe(false);
      expect(isExtractedTheme({ ...validTheme, sentiment: 1.5 })).toBe(false);
      expect(isExtractedTheme({ ...validTheme, sentiment: 'string' })).toBe(false);
    });

    it('should return false if confidence is invalid', () => {
      expect(isExtractedTheme({ ...validTheme, confidence: -0.1 })).toBe(false);
      expect(isExtractedTheme({ ...validTheme, confidence: 1.1 })).toBe(false);
      expect(isExtractedTheme({ ...validTheme, confidence: 'string' })).toBe(false);
    });

    it('should return false if examples are invalid', () => {
      expect(isExtractedTheme({ ...validTheme, examples: 'not-array' })).toBe(false);
      expect(isExtractedTheme({ ...validTheme, examples: [1, 2] })).toBe(false);
    });
  });
});
