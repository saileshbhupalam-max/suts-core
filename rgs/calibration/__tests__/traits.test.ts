/**
 * Tests for RGS Calibration - Trait Extraction
 */

import { Insight, createInsight, createSentimentAnalysis, createTheme } from '@rgs/core';
import {
  extractTraits,
  filterTraitsByCategory,
  filterTraitsByConfidence,
  groupTraitsByName,
  TraitExtractionError,
  PersonaTrait,
} from '../src/traits';

describe('extractTraits', () => {
  it('should extract traits from a single insight', () => {
    const insight: Insight = createInsight({
      themes: [createTheme({ name: 'performance', confidence: 0.9, frequency: 5, keywords: [] })],
      sentiment: createSentimentAnalysis({
        overall: 0.5,
        distribution: { positive: 0.6, neutral: 0.3, negative: 0.1 },
        positiveSignals: [],
        negativeSignals: [],
      }),
      painPoints: ['slow loading'],
      desires: ['faster performance'],
      language: {
        tone: 'technical',
        commonPhrases: ['need to optimize'],
        frequentTerms: {},
        emotionalIndicators: [],
      },
      confidence: 0.8,
    });

    const traits = extractTraits([insight]);

    expect(traits.length).toBeGreaterThan(0);
    expect(traits.some((t) => t.name === 'painPoint' && t.value === 'slow loading')).toBe(true);
    expect(traits.some((t) => t.name === 'desire' && t.value === 'faster performance')).toBe(true);
    expect(traits.some((t) => t.name === 'tone' && t.value === 'technical')).toBe(true);
    expect(traits.some((t) => t.name === 'theme' && t.value === 'performance')).toBe(true);
  });

  it('should return empty array for empty insights', () => {
    const traits = extractTraits([]);
    expect(traits).toEqual([]);
  });

  it('should handle insights with missing optional fields', () => {
    const insight: Insight = createInsight({
      themes: [],
      sentiment: createSentimentAnalysis({
        overall: 0,
        distribution: { positive: 0.3, neutral: 0.4, negative: 0.3 },
        positiveSignals: [],
        negativeSignals: [],
      }),
      painPoints: [],
      desires: [],
      language: {
        tone: 'neutral',
        commonPhrases: [],
        frequentTerms: {},
        emotionalIndicators: [],
      },
      confidence: 0.5,
    });

    const traits = extractTraits([insight]);
    expect(traits).toBeDefined();
    expect(Array.isArray(traits)).toBe(true);
  });

  it('should extract sentiment tendency from positive sentiment', () => {
    const insight: Insight = createInsight({
      themes: [],
      sentiment: createSentimentAnalysis({
        overall: 0.7,
        distribution: { positive: 0.8, neutral: 0.1, negative: 0.1 },
        positiveSignals: [],
        negativeSignals: [],
      }),
      painPoints: [],
      desires: [],
      language: {
        tone: 'positive',
        commonPhrases: [],
        frequentTerms: {},
        emotionalIndicators: [],
      },
      confidence: 0.8,
    });

    const traits = extractTraits([insight]);
    const sentimentTrait = traits.find((t) => t.name === 'sentimentTendency');

    expect(sentimentTrait).toBeDefined();
    expect(sentimentTrait?.value).toBe('positive');
  });

  it('should extract sentiment tendency from negative sentiment', () => {
    const insight: Insight = createInsight({
      themes: [],
      sentiment: createSentimentAnalysis({
        overall: -0.5,
        distribution: { positive: 0.1, neutral: 0.2, negative: 0.7 },
        positiveSignals: [],
        negativeSignals: [],
      }),
      painPoints: [],
      desires: [],
      language: {
        tone: 'negative',
        commonPhrases: [],
        frequentTerms: {},
        emotionalIndicators: [],
      },
      confidence: 0.8,
    });

    const traits = extractTraits([insight]);
    const sentimentTrait = traits.find((t) => t.name === 'sentimentTendency');

    expect(sentimentTrait).toBeDefined();
    expect(sentimentTrait?.value).toBe('negative');
  });

  it('should throw TraitExtractionError for invalid confidence', () => {
    const invalidInsight = {
      themes: [],
      sentiment: createSentimentAnalysis({
        overall: 0,
        distribution: { positive: 0.3, neutral: 0.4, negative: 0.3 },
        positiveSignals: [],
        negativeSignals: [],
      }),
      painPoints: [],
      desires: [],
      language: {
        tone: 'neutral',
        commonPhrases: [],
        frequentTerms: {},
        emotionalIndicators: [],
      },
      confidence: 1.5, // Invalid confidence > 1
    } as Insight;

    expect(() => extractTraits([invalidInsight])).toThrow(TraitExtractionError);
  });
});

describe('filterTraitsByCategory', () => {
  const mockTraits: PersonaTrait[] = [
    { category: 'psychographic', name: 'painPoint', value: 'test', confidence: 0.8, source: 'rgs' },
    { category: 'behavioral', name: 'sentiment', value: 'positive', confidence: 0.7, source: 'rgs' },
    { category: 'linguistic', name: 'tone', value: 'technical', confidence: 0.9, source: 'rgs' },
  ];

  it('should filter traits by psychographic category', () => {
    const filtered = filterTraitsByCategory(mockTraits, 'psychographic');
    expect(filtered).toHaveLength(1);
    const firstTrait = filtered[0]; expect(firstTrait).toBeDefined(); expect(firstTrait?.category).toBe('psychographic');
  });

  it('should filter traits by behavioral category', () => {
    const filtered = filterTraitsByCategory(mockTraits, 'behavioral');
    expect(filtered).toHaveLength(1);
    const firstTrait = filtered[0]; expect(firstTrait).toBeDefined(); expect(firstTrait?.category).toBe('behavioral');
  });

  it('should return empty array for non-existent category', () => {
    const filtered = filterTraitsByCategory(mockTraits, 'demographic');
    expect(filtered).toEqual([]);
  });
});

describe('filterTraitsByConfidence', () => {
  const mockTraits: PersonaTrait[] = [
    { category: 'psychographic', name: 'test1', value: 'val1', confidence: 0.9, source: 'rgs' },
    { category: 'psychographic', name: 'test2', value: 'val2', confidence: 0.6, source: 'rgs' },
    { category: 'psychographic', name: 'test3', value: 'val3', confidence: 0.3, source: 'rgs' },
  ];

  it('should filter traits above minimum confidence', () => {
    const filtered = filterTraitsByConfidence(mockTraits, 0.5);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((t) => t.confidence >= 0.5)).toBe(true);
  });

  it('should return all traits for minConfidence of 0', () => {
    const filtered = filterTraitsByConfidence(mockTraits, 0);
    expect(filtered).toHaveLength(3);
  });

  it('should return empty array for minConfidence of 1', () => {
    const filtered = filterTraitsByConfidence(mockTraits, 1);
    expect(filtered).toEqual([]);
  });

  it('should throw error for invalid minConfidence', () => {
    expect(() => filterTraitsByConfidence(mockTraits, 1.5)).toThrow(TraitExtractionError);
    expect(() => filterTraitsByConfidence(mockTraits, -0.1)).toThrow(TraitExtractionError);
  });
});

describe('groupTraitsByName', () => {
  const mockTraits: PersonaTrait[] = [
    { category: 'psychographic', name: 'painPoint', value: 'val1', confidence: 0.8, source: 'rgs' },
    { category: 'psychographic', name: 'painPoint', value: 'val2', confidence: 0.7, source: 'rgs' },
    { category: 'behavioral', name: 'sentiment', value: 'positive', confidence: 0.9, source: 'rgs' },
  ];

  it('should group traits by name', () => {
    const grouped = groupTraitsByName(mockTraits);

    expect(grouped.size).toBe(2);
    expect(grouped.get('painPoint')).toHaveLength(2);
    expect(grouped.get('sentiment')).toHaveLength(1);
  });

  it('should handle empty traits array', () => {
    const grouped = groupTraitsByName([]);
    expect(grouped.size).toBe(0);
  });

  it('should handle single trait', () => {
    const firstTrait = mockTraits[0];
    if (firstTrait === undefined) throw new Error('First trait is undefined');
    const grouped = groupTraitsByName([firstTrait]);
    expect(grouped.size).toBe(1);
    expect(grouped.get('painPoint')).toHaveLength(1);
  });
});
