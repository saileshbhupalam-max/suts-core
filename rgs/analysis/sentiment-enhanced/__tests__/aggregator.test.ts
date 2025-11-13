/**
 * Tests for sentiment aggregator
 */

import { SentimentAggregator } from '../src/aggregator';
import { SentimentScale } from '../src/scales';
import { EnhancedSentiment } from '../src/types';

describe('SentimentAggregator', () => {
  let aggregator: SentimentAggregator;

  beforeEach(() => {
    aggregator = new SentimentAggregator();
  });

  const createMockSentiment = (
    scale: SentimentScale,
    score: number,
    emotions: string[]
  ): EnhancedSentiment => ({
    scale,
    score,
    magnitude: 0.7,
    emotions: emotions.map((label) => ({
      label: label as any,
      intensity: 0.8
    })),
    confidence: 0.9,
    reasoning: 'Test sentiment'
  });

  describe('aggregate', () => {
    it('should handle empty array', () => {
      const result = aggregator.aggregate([]);

      expect(result.total).toBe(0);
      expect(result.overall).toBe(SentimentScale.Neutral);
      expect(result.avgScore).toBe(0);
      expect(result.avgMagnitude).toBe(0);
      expect(result.avgConfidence).toBe(0);
      expect(result.topEmotions).toHaveLength(0);
    });

    it('should aggregate single sentiment', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited'])
      ];

      const result = aggregator.aggregate(sentiments);

      expect(result.total).toBe(1);
      expect(result.overall).toBe(SentimentScale.Positive);
      expect(result.avgScore).toBe(0.5);
      expect(result.avgMagnitude).toBe(0.7);
      expect(result.avgConfidence).toBe(0.9);
    });

    it('should calculate correct averages', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.VeryPositive, 1.0, ['excited']),
        createMockSentiment(SentimentScale.Negative, -0.5, ['frustrated']),
        createMockSentiment(SentimentScale.Neutral, 0.0, ['curious'])
      ];

      const result = aggregator.aggregate(sentiments);

      expect(result.total).toBe(3);
      expect(result.avgScore).toBeCloseTo(0.167, 2);
      expect(result.avgMagnitude).toBeCloseTo(0.7, 5);
      expect(result.avgConfidence).toBeCloseTo(0.9, 5);
    });

    it('should determine overall sentiment by mode', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['hopeful']),
        createMockSentiment(SentimentScale.Negative, -0.5, ['frustrated'])
      ];

      const result = aggregator.aggregate(sentiments);

      expect(result.overall).toBe(SentimentScale.Positive);
      expect(result.total).toBe(3);
    });

    it('should calculate scale distribution correctly', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.VeryPositive, 1.0, ['excited']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['hopeful']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['satisfied']),
        createMockSentiment(SentimentScale.Neutral, 0.0, ['curious']),
        createMockSentiment(SentimentScale.Negative, -0.5, ['frustrated'])
      ];

      const result = aggregator.aggregate(sentiments);

      expect(result.scaleDistribution.get(SentimentScale.VeryPositive)).toBe(1);
      expect(result.scaleDistribution.get(SentimentScale.Positive)).toBe(2);
      expect(result.scaleDistribution.get(SentimentScale.Neutral)).toBe(1);
      expect(result.scaleDistribution.get(SentimentScale.Negative)).toBe(1);
      expect(result.scaleDistribution.get(SentimentScale.VeryNegative)).toBe(0);
    });

    it('should calculate emotion distribution correctly', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited', 'hopeful']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited']),
        createMockSentiment(SentimentScale.Negative, -0.5, ['frustrated'])
      ];

      const result = aggregator.aggregate(sentiments);

      expect(result.emotionDistribution.get('excited' as any)).toBe(2);
      expect(result.emotionDistribution.get('hopeful' as any)).toBe(1);
      expect(result.emotionDistribution.get('frustrated' as any)).toBe(1);
    });

    it('should identify top emotions correctly', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['hopeful']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['hopeful']),
        createMockSentiment(SentimentScale.Negative, -0.5, ['frustrated'])
      ];

      const result = aggregator.aggregate(sentiments);

      expect(result.topEmotions).toHaveLength(3);
      expect(result.topEmotions[0]?.label).toBe('excited');
      expect(result.topEmotions[0]?.count).toBe(3);
      expect(result.topEmotions[1]?.label).toBe('hopeful');
      expect(result.topEmotions[1]?.count).toBe(2);
      expect(result.topEmotions[2]?.label).toBe('frustrated');
      expect(result.topEmotions[2]?.count).toBe(1);
    });

    it('should limit top emotions to requested number', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['hopeful']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['satisfied']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['curious'])
      ];

      const result = aggregator.aggregate(sentiments);

      expect(result.topEmotions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('filterByScale', () => {
    it('should filter sentiments by scale', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.VeryPositive, 1.0, ['excited']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['hopeful']),
        createMockSentiment(SentimentScale.Negative, -0.5, ['frustrated'])
      ];

      const filtered = aggregator.filterByScale(sentiments, [
        SentimentScale.VeryPositive,
        SentimentScale.Positive
      ]);

      expect(filtered).toHaveLength(2);
      expect(filtered[0]?.scale).toBe(SentimentScale.VeryPositive);
      expect(filtered[1]?.scale).toBe(SentimentScale.Positive);
    });

    it('should return empty array if no match', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited'])
      ];

      const filtered = aggregator.filterByScale(sentiments, [SentimentScale.Negative]);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('filterByEmotion', () => {
    it('should filter sentiments by emotion', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['hopeful']),
        createMockSentiment(SentimentScale.Negative, -0.5, ['frustrated'])
      ];

      const filtered = aggregator.filterByEmotion(sentiments, ['excited' as any]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.emotions[0]?.label).toBe('excited');
    });

    it('should match any of the specified emotions', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited']),
        createMockSentiment(SentimentScale.Positive, 0.5, ['hopeful']),
        createMockSentiment(SentimentScale.Negative, -0.5, ['frustrated'])
      ];

      const filtered = aggregator.filterByEmotion(sentiments, [
        'excited' as any,
        'hopeful' as any
      ]);

      expect(filtered).toHaveLength(2);
    });

    it('should return empty array if no match', () => {
      const sentiments = [
        createMockSentiment(SentimentScale.Positive, 0.5, ['excited'])
      ];

      const filtered = aggregator.filterByEmotion(sentiments, ['frustrated' as any]);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('filterByConfidence', () => {
    it('should filter sentiments by minimum confidence', () => {
      const sentiments = [
        { ...createMockSentiment(SentimentScale.Positive, 0.5, ['excited']), confidence: 0.9 },
        { ...createMockSentiment(SentimentScale.Positive, 0.5, ['hopeful']), confidence: 0.7 },
        { ...createMockSentiment(SentimentScale.Negative, -0.5, ['frustrated']), confidence: 0.5 }
      ];

      const filtered = aggregator.filterByConfidence(sentiments, 0.8);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.confidence).toBe(0.9);
    });

    it('should include sentiments with exact minimum confidence', () => {
      const sentiments = [
        { ...createMockSentiment(SentimentScale.Positive, 0.5, ['excited']), confidence: 0.8 },
        { ...createMockSentiment(SentimentScale.Positive, 0.5, ['hopeful']), confidence: 0.7 }
      ];

      const filtered = aggregator.filterByConfidence(sentiments, 0.8);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.confidence).toBe(0.8);
    });

    it('should return empty array if no sentiments meet threshold', () => {
      const sentiments = [
        { ...createMockSentiment(SentimentScale.Positive, 0.5, ['excited']), confidence: 0.5 }
      ];

      const filtered = aggregator.filterByConfidence(sentiments, 0.9);

      expect(filtered).toHaveLength(0);
    });
  });
});
