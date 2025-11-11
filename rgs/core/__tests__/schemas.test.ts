/**
 * Tests for Zod schemas
 */

import {
  SourceTypeSchema,
  SourceConfigSchema,
  WebSignalSchema,
  SentimentSchema,
  ThemeSchema,
  SentimentAnalysisSchema,
  InsightSchema,
  ScrapeConfigSchema,
} from '../src/schemas';

describe('Zod Schemas', () => {
  describe('SourceTypeSchema', () => {
    it('should validate valid source types', () => {
      expect(SourceTypeSchema.safeParse('reddit').success).toBe(true);
      expect(SourceTypeSchema.safeParse('twitter').success).toBe(true);
      expect(SourceTypeSchema.safeParse('github').success).toBe(true);
      expect(SourceTypeSchema.safeParse('hackernews').success).toBe(true);
    });

    it('should reject invalid source types', () => {
      expect(SourceTypeSchema.safeParse('facebook').success).toBe(false);
      expect(SourceTypeSchema.safeParse('').success).toBe(false);
      expect(SourceTypeSchema.safeParse(null).success).toBe(false);
    });
  });

  describe('SourceConfigSchema', () => {
    it('should validate correct source config', () => {
      const config = {
        type: 'reddit',
        params: { subreddit: 'test' },
      };
      expect(SourceConfigSchema.safeParse(config).success).toBe(true);
    });

    it('should validate config with optional fields', () => {
      const config = {
        type: 'github',
        params: { repo: 'test/repo' },
        maxItems: 100,
        timeRangeHours: 24,
      };
      expect(SourceConfigSchema.safeParse(config).success).toBe(true);
    });

    it('should reject config with negative maxItems', () => {
      const config = {
        type: 'twitter',
        params: {},
        maxItems: -5,
      };
      expect(SourceConfigSchema.safeParse(config).success).toBe(false);
    });
  });

  describe('SentimentSchema', () => {
    it('should validate valid sentiment scores', () => {
      expect(SentimentSchema.safeParse(-1).success).toBe(true);
      expect(SentimentSchema.safeParse(0).success).toBe(true);
      expect(SentimentSchema.safeParse(1).success).toBe(true);
      expect(SentimentSchema.safeParse(0.5).success).toBe(true);
    });

    it('should reject invalid sentiment scores', () => {
      expect(SentimentSchema.safeParse(-1.1).success).toBe(false);
      expect(SentimentSchema.safeParse(1.1).success).toBe(false);
      expect(SentimentSchema.safeParse(5).success).toBe(false);
    });
  });

  describe('WebSignalSchema', () => {
    it('should validate correct web signal', () => {
      const signal = {
        id: 'test-1',
        source: 'reddit',
        content: 'Test content',
        timestamp: new Date(),
        url: 'https://example.com',
        metadata: {},
      };
      expect(WebSignalSchema.safeParse(signal).success).toBe(true);
    });

    it('should validate signal with optional fields', () => {
      const signal = {
        id: 'test-1',
        source: 'reddit',
        content: 'Test content',
        author: 'testuser',
        timestamp: new Date(),
        url: 'https://example.com',
        sentiment: 0.5,
        themes: ['tech', 'ai'],
        metadata: {},
      };
      expect(WebSignalSchema.safeParse(signal).success).toBe(true);
    });

    it('should reject signal with empty id', () => {
      const signal = {
        id: '',
        source: 'reddit',
        content: 'Content',
        timestamp: new Date(),
        url: 'https://example.com',
        metadata: {},
      };
      expect(WebSignalSchema.safeParse(signal).success).toBe(false);
    });

    it('should reject signal with invalid url', () => {
      const signal = {
        id: 'test-1',
        source: 'reddit',
        content: 'Content',
        timestamp: new Date(),
        url: 'not-a-url',
        metadata: {},
      };
      expect(WebSignalSchema.safeParse(signal).success).toBe(false);
    });

    it('should reject signal with invalid sentiment', () => {
      const signal = {
        id: 'test-1',
        source: 'reddit',
        content: 'Content',
        timestamp: new Date(),
        url: 'https://example.com',
        sentiment: 2,
        metadata: {},
      };
      expect(WebSignalSchema.safeParse(signal).success).toBe(false);
    });
  });

  describe('ThemeSchema', () => {
    it('should validate correct theme', () => {
      const theme = {
        name: 'Performance',
        confidence: 0.8,
        frequency: 10,
        keywords: ['fast', 'slow'],
      };
      expect(ThemeSchema.safeParse(theme).success).toBe(true);
    });

    it('should reject theme with invalid confidence', () => {
      const theme = {
        name: 'Test',
        confidence: 1.5,
        frequency: 5,
        keywords: [],
      };
      expect(ThemeSchema.safeParse(theme).success).toBe(false);
    });

    it('should reject theme with negative frequency', () => {
      const theme = {
        name: 'Test',
        confidence: 0.5,
        frequency: -5,
        keywords: [],
      };
      expect(ThemeSchema.safeParse(theme).success).toBe(false);
    });
  });

  describe('SentimentAnalysisSchema', () => {
    it('should validate correct sentiment analysis', () => {
      const analysis = {
        overall: 0.5,
        distribution: {
          positive: 0.6,
          neutral: 0.3,
          negative: 0.1,
        },
        positiveSignals: ['Great!'],
        negativeSignals: ['Bad'],
      };
      expect(SentimentAnalysisSchema.safeParse(analysis).success).toBe(true);
    });

    it('should reject invalid overall sentiment', () => {
      const analysis = {
        overall: 2,
        distribution: {
          positive: 0.5,
          neutral: 0.3,
          negative: 0.2,
        },
        positiveSignals: [],
        negativeSignals: [],
      };
      expect(SentimentAnalysisSchema.safeParse(analysis).success).toBe(false);
    });

    it('should reject invalid distribution values', () => {
      const analysis = {
        overall: 0,
        distribution: {
          positive: 1.5,
          neutral: 0.3,
          negative: 0.2,
        },
        positiveSignals: [],
        negativeSignals: [],
      };
      expect(SentimentAnalysisSchema.safeParse(analysis).success).toBe(false);
    });
  });

  describe('InsightSchema', () => {
    it('should validate correct insight', () => {
      const insight = {
        themes: [
          {
            name: 'Test',
            confidence: 0.8,
            frequency: 5,
            keywords: ['test'],
          },
        ],
        sentiment: {
          overall: 0.5,
          distribution: {
            positive: 0.5,
            neutral: 0.3,
            negative: 0.2,
          },
          positiveSignals: [],
          negativeSignals: [],
        },
        painPoints: ['slow'],
        desires: ['fast'],
        language: {
          commonPhrases: ['hello'],
          tone: 'casual',
          frequentTerms: { test: 5 },
          emotionalIndicators: ['happy'],
        },
        confidence: 0.75,
      };
      expect(InsightSchema.safeParse(insight).success).toBe(true);
    });

    it('should reject insight with invalid confidence', () => {
      const insight = {
        themes: [],
        sentiment: {
          overall: 0,
          distribution: {
            positive: 0.5,
            neutral: 0.3,
            negative: 0.2,
          },
          positiveSignals: [],
          negativeSignals: [],
        },
        painPoints: [],
        desires: [],
        language: {
          commonPhrases: [],
          tone: 'casual',
          frequentTerms: {},
          emotionalIndicators: [],
        },
        confidence: 1.5,
      };
      expect(InsightSchema.safeParse(insight).success).toBe(false);
    });
  });

  describe('ScrapeConfigSchema', () => {
    it('should validate correct scrape config', () => {
      const config = {
        type: 'reddit',
        params: { subreddit: 'test' },
        rateLimit: 60,
        maxRetries: 3,
        timeout: 5000,
        includeMetadata: true,
      };
      expect(ScrapeConfigSchema.safeParse(config).success).toBe(true);
    });

    it('should reject config with negative rateLimit', () => {
      const config = {
        type: 'reddit',
        params: {},
        rateLimit: -10,
      };
      expect(ScrapeConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should reject config with negative maxRetries', () => {
      const config = {
        type: 'reddit',
        params: {},
        maxRetries: -1,
      };
      expect(ScrapeConfigSchema.safeParse(config).success).toBe(false);
    });

    it('should accept config with zero maxRetries', () => {
      const config = {
        type: 'reddit',
        params: {},
        maxRetries: 0,
      };
      expect(ScrapeConfigSchema.safeParse(config).success).toBe(true);
    });
  });
});
