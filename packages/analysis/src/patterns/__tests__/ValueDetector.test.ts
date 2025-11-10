/**
 * Tests for ValueDetector
 */

import { ValueDetector } from '../ValueDetector';
import { DEFAULT_ANALYSIS_CONFIG } from '../../models/config';
import { createEvent, createValueEvents } from '../../test-utils';

describe('ValueDetector', () => {
  describe('detect', () => {
    it('should return empty array for no events', () => {
      const detector = new ValueDetector(DEFAULT_ANALYSIS_CONFIG);
      const results = detector.detect([]);

      expect(results).toEqual([]);
    });

    it('should detect high delight patterns', () => {
      const detector = new ValueDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = createValueEvents(10, 'amazing_feature');

      const results = detector.detect(events);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.action).toBe('amazing_feature');
      expect(results[0]?.delightScore).toBeGreaterThan(0.7);
    });

    it('should calculate delight score correctly', () => {
      const detector = new ValueDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = createValueEvents(10, 'test_action');

      const results = detector.detect(events);

      expect(results[0]?.delightScore).toBeGreaterThan(0);
      expect(results[0]?.delightScore).toBeLessThanOrEqual(1);
    });

    it('should count unique users', () => {
      const detector = new ValueDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = createValueEvents(20, 'test_action');

      const results = detector.detect(events);

      expect(results[0]?.affectedUsers).toBeGreaterThan(0);
    });

    it('should not detect low delight', () => {
      const detector = new ValueDetector({
        ...DEFAULT_ANALYSIS_CONFIG,
        minDelightLevel: 0.95,
      });

      const events = createValueEvents(10, 'low_value');

      const results = detector.detect(events);

      expect(results).toEqual([]);
    });

    it('should generate amplification suggestions', () => {
      const detector = new ValueDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = createValueEvents(10, 'test_action');

      const results = detector.detect(events);

      expect(results[0]?.amplificationSuggestions).toBeDefined();
      expect(results[0]?.amplificationSuggestions?.length).toBeGreaterThan(0);
    });

    it('should sort by priority', () => {
      const detector = new ValueDetector(DEFAULT_ANALYSIS_CONFIG);

      const events = [
        ...createValueEvents(30, 'high_value'),
        ...createValueEvents(5, 'low_value'),
      ];

      const results = detector.detect(events);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.action).toBe('high_value');
    });

    it('should calculate retention correlation', () => {
      const detector = new ValueDetector(DEFAULT_ANALYSIS_CONFIG);
      const baseTime = Date.now();

      const events = [
        createEvent({
          personaId: 'user-1',
          action: 'value_action',
          emotionalState: { frustration: 0.1, confidence: 0.9, delight: 0.9, confusion: 0.1 },
          timestamp: new Date(baseTime),
        }),
        createEvent({
          personaId: 'user-1',
          action: 'other_action',
          timestamp: new Date(baseTime + 10000),
        }),
      ];

      const results = detector.detect(events);

      expect(results[0]?.retentionCorrelation).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('should handle single event', () => {
      const detector = new ValueDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = [
        createEvent({
          emotionalState: {
            frustration: 0.1,
            confidence: 0.9,
            delight: 0.9,
            confusion: 0.1,
          },
        }),
      ];

      expect(() => detector.detect(events)).not.toThrow();
    });

    it('should handle events with zero delight', () => {
      const detector = new ValueDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = [
        createEvent({
          emotionalState: {
            frustration: 0,
            confidence: 0,
            delight: 0,
            confusion: 0,
          },
        }),
      ];

      const results = detector.detect(events);
      expect(results).toEqual([]);
    });
  });
});
