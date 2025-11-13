/**
 * Tests for MockAnalyzer placeholder
 */

import { createWebSignal } from '@rgs/core';
import { MockAnalyzer, createAnalyzer } from '../../src/placeholders/analyzer';

describe('MockAnalyzer', () => {
  let analyzer: MockAnalyzer;

  beforeEach(() => {
    analyzer = new MockAnalyzer();
  });

  const createMockSignals = (count: number): ReturnType<typeof createWebSignal>[] => {
    return Array.from({ length: count }, (_, i) =>
      createWebSignal({
        id: `signal-${i}`,
        source: 'reddit',
        content: `Test content ${i}`,
        timestamp: new Date(),
        url: `https://reddit.com/${i}`,
        metadata: {},
        sentiment: i % 2 === 0 ? 0.5 : -0.5,
        themes: ['gaming', 'test'],
      })
    );
  };

  describe('analyzeSentiment', () => {
    it('should analyze sentiment from signals', async () => {
      const signals = createMockSignals(10);
      const sentiment = await analyzer.analyzeSentiment(signals);

      expect(sentiment).toHaveProperty('overall');
      expect(sentiment.overall).toBeGreaterThanOrEqual(-1);
      expect(sentiment.overall).toBeLessThanOrEqual(1);

      expect(sentiment).toHaveProperty('distribution');
      expect(sentiment.distribution.positive).toBeGreaterThanOrEqual(0);
      expect(sentiment.distribution.neutral).toBeGreaterThanOrEqual(0);
      expect(sentiment.distribution.negative).toBeGreaterThanOrEqual(0);

      // Distribution should sum to 1
      const total =
        sentiment.distribution.positive +
        sentiment.distribution.neutral +
        sentiment.distribution.negative;
      expect(total).toBeCloseTo(1.0, 2);
    });

    it('should handle empty signals array', async () => {
      const sentiment = await analyzer.analyzeSentiment([]);

      expect(sentiment.overall).toBe(0);
      expect(sentiment.distribution.positive).toBe(0);
      expect(sentiment.distribution.neutral).toBe(1); // Empty signals default to neutral
      expect(sentiment.distribution.negative).toBe(0);
      expect(sentiment.positiveSignals).toHaveLength(0);
      expect(sentiment.negativeSignals).toHaveLength(0);
    });

    it('should identify positive and negative signals', async () => {
      const signals = createMockSignals(10);
      const sentiment = await analyzer.analyzeSentiment(signals);

      expect(sentiment.positiveSignals).toBeDefined();
      expect(sentiment.negativeSignals).toBeDefined();
      expect(sentiment.positiveSignals.length).toBeLessThanOrEqual(3);
      expect(sentiment.negativeSignals.length).toBeLessThanOrEqual(3);
    });
  });

  describe('extractThemes', () => {
    it('should extract themes from signals', async () => {
      const signals = createMockSignals(5);
      const themes = await analyzer.extractThemes(signals);

      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);

      themes.forEach((theme) => {
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('confidence');
        expect(theme).toHaveProperty('frequency');
        expect(theme).toHaveProperty('keywords');

        expect(theme.confidence).toBeGreaterThanOrEqual(0);
        expect(theme.confidence).toBeLessThanOrEqual(1);
        expect(theme.frequency).toBeGreaterThan(0);
      });
    });

    it('should handle empty signals array', async () => {
      const themes = await analyzer.extractThemes([]);
      expect(themes).toHaveLength(0);
    });

    it('should return themes sorted by frequency', async () => {
      const signals = createMockSignals(10);
      const themes = await analyzer.extractThemes(signals);

      for (let i = 1; i < themes.length; i++) {
        expect(themes[i - 1]?.frequency).toBeGreaterThanOrEqual(themes[i]?.frequency ?? 0);
      }
    });

    it('should limit themes to top 10', async () => {
      const signals = Array.from({ length: 50 }, (_, i) =>
        createWebSignal({
          id: `signal-${i}`,
          source: 'reddit',
          content: `Test content ${i}`,
          timestamp: new Date(),
          url: `https://reddit.com/${i}`,
          metadata: {},
          themes: [`theme-${i % 15}`], // Create 15 different themes
        })
      );

      const themes = await analyzer.extractThemes(signals);
      expect(themes.length).toBeLessThanOrEqual(10);
    });
  });

  describe('extractLanguagePatterns', () => {
    it('should extract language patterns from signals', async () => {
      const signals = createMockSignals(5);
      const patterns = await analyzer.extractLanguagePatterns(signals);

      expect(patterns).toHaveProperty('commonPhrases');
      expect(patterns).toHaveProperty('tone');
      expect(patterns).toHaveProperty('frequentTerms');
      expect(patterns).toHaveProperty('emotionalIndicators');

      expect(Array.isArray(patterns.commonPhrases)).toBe(true);
      expect(typeof patterns.tone).toBe('string');
      expect(typeof patterns.frequentTerms).toBe('object');
      expect(Array.isArray(patterns.emotionalIndicators)).toBe(true);
    });

    it('should handle empty signals array', async () => {
      const patterns = await analyzer.extractLanguagePatterns([]);

      expect(patterns.commonPhrases).toHaveLength(0);
      expect(patterns.tone).toBe('neutral');
      expect(Object.keys(patterns.frequentTerms)).toHaveLength(0);
      expect(patterns.emotionalIndicators).toHaveLength(0);
    });

    it('should count word frequencies', async () => {
      const signals = createMockSignals(10);
      const patterns = await analyzer.extractLanguagePatterns(signals);

      const terms = patterns.frequentTerms;
      Object.values(terms).forEach((count) => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  describe('generateInsight', () => {
    it('should generate complete insight', async () => {
      const signals = createMockSignals(10);
      const insight = await analyzer.generateInsight(signals);

      expect(insight).toHaveProperty('themes');
      expect(insight).toHaveProperty('sentiment');
      expect(insight).toHaveProperty('painPoints');
      expect(insight).toHaveProperty('desires');
      expect(insight).toHaveProperty('language');
      expect(insight).toHaveProperty('confidence');

      expect(Array.isArray(insight.themes)).toBe(true);
      expect(Array.isArray(insight.painPoints)).toBe(true);
      expect(Array.isArray(insight.desires)).toBe(true);
      expect(insight.confidence).toBeGreaterThanOrEqual(0);
      expect(insight.confidence).toBeLessThanOrEqual(1);
    });

    it('should calculate confidence based on signal count', async () => {
      const smallBatch = createMockSignals(10);
      const largeBatch = createMockSignals(100);

      const smallInsight = await analyzer.generateInsight(smallBatch);
      const largeInsight = await analyzer.generateInsight(largeBatch);

      expect(largeInsight.confidence).toBeGreaterThanOrEqual(smallInsight.confidence);
    });
  });
});

describe('createAnalyzer', () => {
  it('should create an analyzer instance', () => {
    const analyzer = createAnalyzer();
    expect(analyzer).toBeInstanceOf(MockAnalyzer);
  });
});
