/**
 * Tests for Insight model
 */

import {
  type Theme,
  type SentimentAnalysis,
  createTheme,
  createSentimentAnalysis,
  createInsight,
  isValidConfidence,
} from '../src/models/insight';

describe('Insight Model', () => {
  describe('createTheme', () => {
    it('should create a valid theme', () => {
      const theme = createTheme({
        name: 'Performance',
        confidence: 0.8,
        frequency: 10,
        keywords: ['fast', 'slow', 'speed'],
      });

      expect(theme.name).toBe('Performance');
      expect(theme.confidence).toBe(0.8);
      expect(theme.frequency).toBe(10);
      expect(theme.keywords).toEqual(['fast', 'slow', 'speed']);
    });

    it('should throw error for invalid confidence', () => {
      expect(() =>
        createTheme({
          name: 'Test',
          confidence: 1.5,
          frequency: 5,
          keywords: [],
        })
      ).toThrow('Theme confidence must be between 0 and 1');

      expect(() =>
        createTheme({
          name: 'Test',
          confidence: -0.5,
          frequency: 5,
          keywords: [],
        })
      ).toThrow('Theme confidence must be between 0 and 1');
    });

    it('should throw error for negative frequency', () => {
      expect(() =>
        createTheme({
          name: 'Test',
          confidence: 0.5,
          frequency: -5,
          keywords: [],
        })
      ).toThrow('Theme frequency must be non-negative');
    });

    it('should accept valid boundary values', () => {
      const theme = createTheme({
        name: 'Boundary',
        confidence: 0,
        frequency: 0,
        keywords: [],
      });
      expect(theme.confidence).toBe(0);
      expect(theme.frequency).toBe(0);
    });
  });

  describe('createSentimentAnalysis', () => {
    it('should create valid sentiment analysis', () => {
      const sentiment = createSentimentAnalysis({
        overall: 0.3,
        distribution: {
          positive: 0.5,
          neutral: 0.3,
          negative: 0.2,
        },
        positiveSignals: ['Great!', 'Love it'],
        negativeSignals: ['Bad', 'Hate it'],
      });

      expect(sentiment.overall).toBe(0.3);
      expect(sentiment.distribution.positive).toBe(0.5);
      expect(sentiment.distribution.neutral).toBe(0.3);
      expect(sentiment.distribution.negative).toBe(0.2);
    });

    it('should throw error for invalid overall sentiment', () => {
      expect(() =>
        createSentimentAnalysis({
          overall: 2,
          distribution: { positive: 0.5, neutral: 0.3, negative: 0.2 },
          positiveSignals: [],
          negativeSignals: [],
        })
      ).toThrow('Overall sentiment must be between -1 and 1');

      expect(() =>
        createSentimentAnalysis({
          overall: -2,
          distribution: { positive: 0.5, neutral: 0.3, negative: 0.2 },
          positiveSignals: [],
          negativeSignals: [],
        })
      ).toThrow('Overall sentiment must be between -1 and 1');
    });

    it('should throw error for invalid distribution sum', () => {
      expect(() =>
        createSentimentAnalysis({
          overall: 0,
          distribution: { positive: 0.5, neutral: 0.3, negative: 0.1 },
          positiveSignals: [],
          negativeSignals: [],
        })
      ).toThrow('Sentiment distribution must sum to 1.0');
    });

    it('should accept distribution that sums to 1.0 within tolerance', () => {
      const sentiment = createSentimentAnalysis({
        overall: 0,
        distribution: {
          positive: 0.333,
          neutral: 0.333,
          negative: 0.334,
        },
        positiveSignals: [],
        negativeSignals: [],
      });

      expect(sentiment).toBeDefined();
    });
  });

  describe('createInsight', () => {
    const validTheme: Theme = {
      name: 'Test',
      confidence: 0.8,
      frequency: 5,
      keywords: ['test'],
    };

    const validSentiment: SentimentAnalysis = {
      overall: 0.5,
      distribution: { positive: 0.6, neutral: 0.3, negative: 0.1 },
      positiveSignals: [],
      negativeSignals: [],
    };

    const validLanguage = {
      commonPhrases: ['hello'],
      tone: 'casual',
      frequentTerms: { test: 5 },
      emotionalIndicators: ['happy'],
    };

    it('should create a valid insight', () => {
      const insight = createInsight({
        themes: [validTheme],
        sentiment: validSentiment,
        painPoints: ['slow performance'],
        desires: ['better UX'],
        language: validLanguage,
        confidence: 0.75,
      });

      expect(insight.themes).toEqual([validTheme]);
      expect(insight.confidence).toBe(0.75);
      expect(insight.painPoints).toEqual(['slow performance']);
      expect(insight.desires).toEqual(['better UX']);
      expect(insight.sentiment).toEqual(validSentiment);
      expect(insight.language).toEqual(validLanguage);
    });

    it('should accept boundary confidence values', () => {
      const insight = createInsight({
        themes: [],
        sentiment: validSentiment,
        painPoints: [],
        desires: [],
        language: validLanguage,
        confidence: 0,
      });
      expect(insight.confidence).toBe(0);

      const insight2 = createInsight({
        themes: [],
        sentiment: validSentiment,
        painPoints: [],
        desires: [],
        language: validLanguage,
        confidence: 1,
      });
      expect(insight2.confidence).toBe(1);
    });

    it('should throw error for invalid confidence', () => {
      expect(() =>
        createInsight({
          themes: [],
          sentiment: validSentiment,
          painPoints: [],
          desires: [],
          language: validLanguage,
          confidence: 1.5,
        })
      ).toThrow('Insight confidence must be between 0 and 1');

      expect(() =>
        createInsight({
          themes: [],
          sentiment: validSentiment,
          painPoints: [],
          desires: [],
          language: validLanguage,
          confidence: -0.1,
        })
      ).toThrow('Insight confidence must be between 0 and 1');
    });
  });

  describe('isValidConfidence', () => {
    it('should return true for valid confidence scores', () => {
      expect(isValidConfidence(0)).toBe(true);
      expect(isValidConfidence(0.5)).toBe(true);
      expect(isValidConfidence(1)).toBe(true);
    });

    it('should return false for invalid confidence scores', () => {
      expect(isValidConfidence(-0.1)).toBe(false);
      expect(isValidConfidence(1.1)).toBe(false);
      expect(isValidConfidence(-5)).toBe(false);
      expect(isValidConfidence(10)).toBe(false);
    });
  });
});
