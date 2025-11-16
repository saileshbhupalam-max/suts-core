/**
 * Tests for RGS Calibration - Trait Merger
 */

import { PersonaTrait } from '../src/traits';
import {
  mergeTraits,
  resolveConflict,
  deduplicateTraits,
  calculateAverageConfidence,
  validateTraits,
  TraitMergeError,
} from '../src/merger';

describe('mergeTraits', () => {
  const baseTraits: PersonaTrait[] = [
    { category: 'psychographic', name: 'painPoint', value: 'slow', confidence: 0.6, source: 'base' },
    { category: 'behavioral', name: 'risk', value: 'low', confidence: 0.7, source: 'base' },
  ];

  const groundedTraits: PersonaTrait[] = [
    { category: 'psychographic', name: 'painPoint', value: 'performance', confidence: 0.9, source: 'rgs-insight' },
    { category: 'linguistic', name: 'tone', value: 'technical', confidence: 0.8, source: 'rgs-insight' },
  ];

  it('should merge traits with rgs-priority strategy (default)', () => {
    const merged = mergeTraits(baseTraits, groundedTraits);

    expect(merged).toBeDefined();
    expect(merged.length).toBeGreaterThan(0);

    // Should prefer RGS trait for painPoint
    const painPointTrait = merged.find((t) => t.category === 'psychographic' && t.name === 'painPoint');
    expect(painPointTrait?.source).toBe('rgs-insight');
    expect(painPointTrait?.value).toBe('performance');
  });

  it('should merge traits with base-priority strategy', () => {
    const merged = mergeTraits(baseTraits, groundedTraits, 'base-priority');

    const painPointTrait = merged.find((t) => t.category === 'psychographic' && t.name === 'painPoint');
    expect(painPointTrait?.source).toBe('base');
    expect(painPointTrait?.value).toBe('slow');
  });

  it('should merge traits with highest-confidence strategy', () => {
    const merged = mergeTraits(baseTraits, groundedTraits, 'highest-confidence');

    const painPointTrait = merged.find((t) => t.category === 'psychographic' && t.name === 'painPoint');
    // RGS trait has higher confidence (0.9 vs 0.6)
    expect(painPointTrait?.confidence).toBe(0.9);
    expect(painPointTrait?.source).toBe('rgs-insight');
  });

  it('should include non-conflicting traits from both sources', () => {
    const merged = mergeTraits(baseTraits, groundedTraits);

    // Should have behavioral trait from base
    expect(merged.some((t) => t.category === 'behavioral' && t.name === 'risk')).toBe(true);

    // Should have linguistic trait from grounded
    expect(merged.some((t) => t.category === 'linguistic' && t.name === 'tone')).toBe(true);
  });

  it('should handle empty base traits', () => {
    const merged = mergeTraits([], groundedTraits);
    expect(merged).toHaveLength(groundedTraits.length);
  });

  it('should handle empty grounded traits', () => {
    const merged = mergeTraits(baseTraits, []);
    expect(merged).toHaveLength(baseTraits.length);
  });

  it('should handle both empty arrays', () => {
    const merged = mergeTraits([], []);
    expect(merged).toEqual([]);
  });
});

describe('resolveConflict', () => {
  const conflictingTraits: PersonaTrait[] = [
    { category: 'psychographic', name: 'painPoint', value: 'base-value', confidence: 0.6, source: 'base' },
    { category: 'psychographic', name: 'painPoint', value: 'rgs-value', confidence: 0.9, source: 'rgs-insight' },
  ];

  it('should resolve with rgs-priority strategy', () => {
    const resolved = resolveConflict(conflictingTraits, 'rgs-priority');
    expect(resolved.source).toBe('rgs-insight');
    expect(resolved.value).toBe('rgs-value');
  });

  it('should resolve with base-priority strategy', () => {
    const resolved = resolveConflict(conflictingTraits, 'base-priority');
    expect(resolved.source).toBe('base');
    expect(resolved.value).toBe('base-value');
  });

  it('should resolve with highest-confidence strategy', () => {
    const resolved = resolveConflict(conflictingTraits, 'highest-confidence');
    expect(resolved.confidence).toBe(0.9);
    expect(resolved.source).toBe('rgs-insight');
  });

  it('should return single trait when no conflict', () => {
    const firstTrait = conflictingTraits[0];
    if (firstTrait === undefined) throw new Error('First trait is undefined');
    const resolved = resolveConflict([firstTrait], 'rgs-priority');
    expect(resolved).toEqual(firstTrait);
  });

  it('should throw error for empty traits array', () => {
    expect(() => resolveConflict([], 'rgs-priority')).toThrow(TraitMergeError);
  });

  it('should fall back to highest confidence when no RGS trait in rgs-priority', () => {
    const traitsWithoutRgs: PersonaTrait[] = [
      { category: 'psychographic', name: 'test', value: 'val1', confidence: 0.7, source: 'base' },
      { category: 'psychographic', name: 'test', value: 'val2', confidence: 0.9, source: 'other' },
    ];

    const resolved = resolveConflict(traitsWithoutRgs, 'rgs-priority');
    expect(resolved.confidence).toBe(0.9);
  });

  it('should fall back to highest confidence when no base trait in base-priority', () => {
    const traitsWithoutBase: PersonaTrait[] = [
      { category: 'psychographic', name: 'test', value: 'val1', confidence: 0.7, source: 'rgs-insight' },
      { category: 'psychographic', name: 'test', value: 'val2', confidence: 0.9, source: 'rgs-insight' },
    ];

    const resolved = resolveConflict(traitsWithoutBase, 'base-priority');
    expect(resolved.confidence).toBe(0.9);
  });
});

describe('deduplicateTraits', () => {
  it('should remove exact duplicates', () => {
    const duplicateTraits: PersonaTrait[] = [
      { category: 'psychographic', name: 'painPoint', value: 'slow', confidence: 0.8, source: 'rgs' },
      { category: 'psychographic', name: 'painPoint', value: 'slow', confidence: 0.8, source: 'rgs' },
      { category: 'behavioral', name: 'risk', value: 'low', confidence: 0.7, source: 'rgs' },
    ];

    const deduplicated = deduplicateTraits(duplicateTraits);
    expect(deduplicated).toHaveLength(2);
  });

  it('should deduplicate traits with same category/name/value/source', () => {
    const traits: PersonaTrait[] = [
      { category: 'psychographic', name: 'painPoint', value: 'slow', confidence: 0.8, source: 'rgs' },
      { category: 'psychographic', name: 'painPoint', value: 'slow', confidence: 0.9, source: 'rgs' },
    ];

    const deduplicated = deduplicateTraits(traits);
    // Deduplication ignores confidence differences for same category/name/value/source
    expect(deduplicated).toHaveLength(1);
  });

  it('should handle empty array', () => {
    const deduplicated = deduplicateTraits([]);
    expect(deduplicated).toEqual([]);
  });

  it('should handle array with no duplicates', () => {
    const uniqueTraits: PersonaTrait[] = [
      { category: 'psychographic', name: 'painPoint', value: 'slow', confidence: 0.8, source: 'rgs' },
      { category: 'behavioral', name: 'risk', value: 'low', confidence: 0.7, source: 'rgs' },
    ];

    const deduplicated = deduplicateTraits(uniqueTraits);
    expect(deduplicated).toHaveLength(uniqueTraits.length);
  });
});

describe('calculateAverageConfidence', () => {
  it('should calculate correct average for multiple traits', () => {
    const traits: PersonaTrait[] = [
      { category: 'psychographic', name: 'test1', value: 'val', confidence: 0.8, source: 'rgs' },
      { category: 'psychographic', name: 'test2', value: 'val', confidence: 0.6, source: 'rgs' },
      { category: 'psychographic', name: 'test3', value: 'val', confidence: 1.0, source: 'rgs' },
    ];

    const avg = calculateAverageConfidence(traits);
    expect(avg).toBeCloseTo(0.8, 2);
  });

  it('should return same value for single trait', () => {
    const traits: PersonaTrait[] = [
      { category: 'psychographic', name: 'test', value: 'val', confidence: 0.75, source: 'rgs' },
    ];

    const avg = calculateAverageConfidence(traits);
    expect(avg).toBe(0.75);
  });

  it('should throw error for empty array', () => {
    expect(() => calculateAverageConfidence([])).toThrow(TraitMergeError);
  });
});

describe('validateTraits', () => {
  it('should validate traits with valid confidence scores', () => {
    const validTraits: PersonaTrait[] = [
      { category: 'psychographic', name: 'test1', value: 'val', confidence: 0.5, source: 'rgs' },
      { category: 'psychographic', name: 'test2', value: 'val', confidence: 1.0, source: 'rgs' },
      { category: 'psychographic', name: 'test3', value: 'val', confidence: 0.0, source: 'rgs' },
    ];

    expect(validateTraits(validTraits)).toBe(true);
  });

  it('should throw error for confidence > 1', () => {
    const invalidTraits: PersonaTrait[] = [
      { category: 'psychographic', name: 'test', value: 'val', confidence: 1.5, source: 'rgs' },
    ];

    expect(() => validateTraits(invalidTraits)).toThrow(TraitMergeError);
  });

  it('should throw error for confidence < 0', () => {
    const invalidTraits: PersonaTrait[] = [
      { category: 'psychographic', name: 'test', value: 'val', confidence: -0.1, source: 'rgs' },
    ];

    expect(() => validateTraits(invalidTraits)).toThrow(TraitMergeError);
  });

  it('should throw error for NaN confidence', () => {
    const invalidTraits: PersonaTrait[] = [
      { category: 'psychographic', name: 'test', value: 'val', confidence: NaN, source: 'rgs' },
    ];

    expect(() => validateTraits(invalidTraits)).toThrow(TraitMergeError);
  });

  it('should handle empty array', () => {
    expect(validateTraits([])).toBe(true);
  });
});
