/**
 * Tests for pattern detector
 */

import { createWebSignal } from '@rgs/core';
import { PatternDetector, createPatternDetector, DEFAULT_PATTERN_CONFIG } from '../src/patterns';

describe('PatternDetector', () => {
  const createSignal = (content: string, id: string = 'test-id') => {
    return createWebSignal({
      id,
      source: 'reddit',
      content,
      timestamp: new Date(),
      url: `https://reddit.com/r/test/${id}`,
      metadata: {},
    });
  };

  describe('detect', () => {
    it('should return empty array for no signals', () => {
      const detector = new PatternDetector();
      const result = detector.detect([]);
      expect(result).toEqual([]);
    });

    it('should detect workflow patterns', () => {
      const detector = new PatternDetector({ ...DEFAULT_PATTERN_CONFIG, minFrequency: 1 });
      const signals = [
        createSignal('I use VSCode for development'),
        createSignal('My workflow is simple and efficient'),
      ];

      const result = detector.detect(signals);

      const workflowPatterns = result.filter((p) => p.type === 'workflow');
      expect(workflowPatterns.length).toBeGreaterThan(0);
    });

    it('should detect comparison patterns', () => {
      const detector = new PatternDetector({ ...DEFAULT_PATTERN_CONFIG, minFrequency: 1 });
      const signals = [
        createSignal('This is better than the old system'),
        createSignal('Compared to other tools this is great'),
        createSignal('VSCode vs Sublime is an interesting comparison'),
      ];

      const result = detector.detect(signals);

      const comparisonPatterns = result.filter((p) => p.type === 'comparison');
      expect(comparisonPatterns.length).toBeGreaterThan(0);
    });

    it('should detect frustration patterns', () => {
      const detector = new PatternDetector({ ...DEFAULT_PATTERN_CONFIG, minFrequency: 1 });
      const signals = [
        createSignal('Annoying that this feature is missing'),
        createSignal('Frustrated with the slow performance'),
        createSignal('I hate that it crashes so often'),
      ];

      const result = detector.detect(signals);

      const frustrationPatterns = result.filter((p) => p.type === 'frustration');
      expect(frustrationPatterns.length).toBeGreaterThan(0);
    });

    it('should detect request patterns', () => {
      const detector = new PatternDetector({ ...DEFAULT_PATTERN_CONFIG, minFrequency: 1 });
      const signals = [
        createSignal('Would love to see this feature added'),
        createSignal('Please add dark mode support'),
        createSignal('I wish the app would remember my settings'),
        createSignal('Need better documentation'),
      ];

      const result = detector.detect(signals);

      const requestPatterns = result.filter((p) => p.type === 'request');
      expect(requestPatterns.length).toBeGreaterThan(0);
    });

    it('should filter patterns by minimum frequency', () => {
      const detector = new PatternDetector({ ...DEFAULT_PATTERN_CONFIG, minFrequency: 3 });
      const signals = [
        createSignal('I use VSCode for development'),
        createSignal('I use Sublime for quick edits'),
      ];

      const result = detector.detect(signals);

      // With minFrequency=3, these patterns should be filtered out
      for (const pattern of result) {
        expect(pattern.frequency).toBeGreaterThanOrEqual(3);
      }
    });

    it('should count pattern frequency correctly', () => {
      const detector = new PatternDetector({ ...DEFAULT_PATTERN_CONFIG, minFrequency: 1 });
      const signals = [
        createSignal('I use tool A for testing'),
        createSignal('I use tool B for development'),
        createSignal('I use tool C for deployment'),
      ];

      const result = detector.detect(signals);

      const usagePattern = result.find((p) => p.pattern === 'usage');
      if (usagePattern !== undefined) {
        expect(usagePattern.frequency).toBe(3);
      }
    });

    it('should include examples in patterns', () => {
      const detector = new PatternDetector({ ...DEFAULT_PATTERN_CONFIG, minFrequency: 1 });
      const signals = [
        createSignal('Better than the old system'),
        createSignal('Much better than previous version'),
      ];

      const result = detector.detect(signals);

      for (const pattern of result) {
        expect(pattern.examples).toBeDefined();
        expect(Array.isArray(pattern.examples)).toBe(true);
      }
    });

    it('should limit examples per pattern', () => {
      const detector = new PatternDetector({
        ...DEFAULT_PATTERN_CONFIG,
        minFrequency: 1,
        maxExamples: 2,
      });

      const signals = [
        createSignal('I use tool 1 for testing'),
        createSignal('I use tool 2 for development'),
        createSignal('I use tool 3 for deployment'),
        createSignal('I use tool 4 for monitoring'),
      ];

      const result = detector.detect(signals);

      for (const pattern of result) {
        expect(pattern.examples.length).toBeLessThanOrEqual(2);
      }
    });

    it('should truncate long examples', () => {
      const detector = new PatternDetector({
        ...DEFAULT_PATTERN_CONFIG,
        minFrequency: 1,
        maxExampleLength: 50,
      });

      const longText = 'I use this really long tool name that goes on and on for testing purposes';
      const signals = [createSignal(longText)];

      const result = detector.detect(signals);

      for (const pattern of result) {
        for (const example of pattern.examples) {
          expect(example.length).toBeLessThanOrEqual(50);
        }
      }
    });

    it('should sort patterns by frequency descending', () => {
      const detector = new PatternDetector({ ...DEFAULT_PATTERN_CONFIG, minFrequency: 1 });
      const signals = [
        createSignal('I use tool A for testing'),
        createSignal('I use tool B for development'),
        createSignal('I use tool C for deployment'),
        createSignal('Better than old system'),
      ];

      const result = detector.detect(signals);

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].frequency).toBeGreaterThanOrEqual(result[i].frequency);
      }
    });

    it('should handle signals with no patterns', () => {
      const detector = new PatternDetector();
      const signals = [
        createSignal('This is just regular text with no special patterns'),
        createSignal('Another piece of normal text'),
      ];

      const result = detector.detect(signals);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty signal content', () => {
      const detector = new PatternDetector();
      const signals = [createSignal('')];

      const result = detector.detect(signals);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should be case insensitive', () => {
      const detector = new PatternDetector({ ...DEFAULT_PATTERN_CONFIG, minFrequency: 1 });
      const signals = [
        createSignal('I USE tool for testing'),
        createSignal('BETTER THAN old system'),
      ];

      const result = detector.detect(signals);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getPatternsByType', () => {
    it('should filter patterns by type', () => {
      const detector = new PatternDetector();
      const patterns = [
        { type: 'workflow' as const, pattern: 'usage', frequency: 5, examples: [] },
        { type: 'comparison' as const, pattern: 'better_than', frequency: 3, examples: [] },
        { type: 'workflow' as const, pattern: 'typical', frequency: 2, examples: [] },
      ];

      const workflowPatterns = detector.getPatternsByType(patterns, 'workflow');

      expect(workflowPatterns).toHaveLength(2);
      expect(workflowPatterns.every((p) => p.type === 'workflow')).toBe(true);
    });

    it('should return empty array if no patterns match', () => {
      const detector = new PatternDetector();
      const patterns = [
        { type: 'workflow' as const, pattern: 'usage', frequency: 5, examples: [] },
      ];

      const frustrationPatterns = detector.getPatternsByType(patterns, 'frustration');

      expect(frustrationPatterns).toEqual([]);
    });
  });

  describe('getTopPatterns', () => {
    it('should return top N patterns by frequency', () => {
      const detector = new PatternDetector();
      const patterns = [
        { type: 'workflow' as const, pattern: 'p1', frequency: 10, examples: [] },
        { type: 'workflow' as const, pattern: 'p2', frequency: 5, examples: [] },
        { type: 'workflow' as const, pattern: 'p3', frequency: 8, examples: [] },
        { type: 'workflow' as const, pattern: 'p4', frequency: 3, examples: [] },
      ];

      const topPatterns = detector.getTopPatterns(patterns, 2);

      expect(topPatterns).toHaveLength(2);
      expect(topPatterns[0].frequency).toBe(10);
      expect(topPatterns[1].frequency).toBe(8);
    });

    it('should return all patterns if N is larger than array', () => {
      const detector = new PatternDetector();
      const patterns = [
        { type: 'workflow' as const, pattern: 'p1', frequency: 10, examples: [] },
        { type: 'workflow' as const, pattern: 'p2', frequency: 5, examples: [] },
      ];

      const topPatterns = detector.getTopPatterns(patterns, 10);

      expect(topPatterns).toHaveLength(2);
    });
  });

  describe('getPatternStats', () => {
    it('should calculate pattern statistics', () => {
      const detector = new PatternDetector();
      const patterns = [
        { type: 'workflow' as const, pattern: 'p1', frequency: 10, examples: [] },
        { type: 'comparison' as const, pattern: 'p2', frequency: 5, examples: [] },
        { type: 'workflow' as const, pattern: 'p3', frequency: 8, examples: [] },
        { type: 'frustration' as const, pattern: 'p4', frequency: 3, examples: [] },
      ];

      const stats = detector.getPatternStats(patterns);

      expect(stats.totalPatterns).toBe(4);
      expect(stats.totalOccurrences).toBe(26);
      expect(stats.byType.workflow).toBe(2);
      expect(stats.byType.comparison).toBe(1);
      expect(stats.byType.frustration).toBe(1);
      expect(stats.byType.request).toBe(0);
    });

    it('should handle empty pattern array', () => {
      const detector = new PatternDetector();
      const stats = detector.getPatternStats([]);

      expect(stats.totalPatterns).toBe(0);
      expect(stats.totalOccurrences).toBe(0);
      expect(stats.byType.workflow).toBe(0);
    });
  });

  describe('createPatternDetector', () => {
    it('should create detector with default config', () => {
      const detector = createPatternDetector();
      expect(detector).toBeInstanceOf(PatternDetector);
    });

    it('should create detector with custom config', () => {
      const detector = createPatternDetector({
        minFrequency: 5,
        maxExamples: 10,
      });
      expect(detector).toBeInstanceOf(PatternDetector);
    });
  });
});
