/**
 * Tests for FrictionDetector
 */

import { FrictionDetector } from '../FrictionDetector';
import { DEFAULT_ANALYSIS_CONFIG } from '../../models/config';
import { createEvent, createFrictionEvents } from '../../__tests__/helpers';

describe('FrictionDetector', () => {
  describe('detect', () => {
    it('should return empty array for no events', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);
      const results = detector.detect([]);

      expect(results).toEqual([]);
    });

    it('should detect high frustration patterns', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = createFrictionEvents(10, 'difficult_action');

      const results = detector.detect(events);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.location.action).toBe('difficult_action');
      expect(results[0]?.avgFrustration).toBeGreaterThan(0.6);
    });

    it('should calculate severity correctly', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = createFrictionEvents(10, 'test_action');

      const results = detector.detect(events);

      expect(results[0]?.severity).toBeGreaterThan(0);
      expect(results[0]?.severity).toBeLessThanOrEqual(1);
    });

    it('should calculate frequency', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = createFrictionEvents(15, 'test_action');

      const results = detector.detect(events);

      expect(results[0]?.frequency).toBe(15);
    });

    it('should count unique users', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = createFrictionEvents(20, 'test_action');

      const results = detector.detect(events);

      expect(results[0]?.affectedUsers).toBeGreaterThan(0);
      expect(results[0]?.affectedUsers).toBeLessThanOrEqual(20);
    });

    it('should not detect low frustration', () => {
      const detector = new FrictionDetector({
        ...DEFAULT_ANALYSIS_CONFIG,
        minFrustrationLevel: 0.9,
      });

      const events = createFrictionEvents(10, 'low_friction');

      const results = detector.detect(events);

      expect(results).toEqual([]);
    });

    it('should respect minimum frequency threshold', () => {
      const detector = new FrictionDetector({
        ...DEFAULT_ANALYSIS_CONFIG,
        minFrictionFrequency: 100,
      });

      const events = createFrictionEvents(10, 'test_action');

      const results = detector.detect(events);

      expect(results).toEqual([]);
    });

    it('should generate suggestions', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = createFrictionEvents(10, 'test_action');

      const results = detector.detect(events);

      expect(results[0]?.suggestedFixes).toBeDefined();
      expect(results[0]?.suggestedFixes?.length).toBeGreaterThan(0);
    });

    it('should sort by priority', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);

      const events = [
        ...createFrictionEvents(30, 'high_priority'),
        ...createFrictionEvents(5, 'low_priority'),
      ];

      const results = detector.detect(events);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.location.action).toBe('high_priority');
    });

    it('should handle multiple actions', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);

      const events = [
        ...createFrictionEvents(10, 'action1'),
        ...createFrictionEvents(10, 'action2'),
      ];

      const results = detector.detect(events);

      expect(results.length).toBe(2);
    });
  });

  describe('confidence and priority calculation', () => {
    it('should calculate higher confidence for more events', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);

      const fewEvents = createFrictionEvents(10, 'action1');
      const manyEvents = createFrictionEvents(100, 'action2');

      const results1 = detector.detect(fewEvents);
      const results2 = detector.detect(manyEvents);

      expect(results2[0]?.confidence).toBeGreaterThan(results1[0]?.confidence ?? 0);
    });

    it('should calculate priority based on severity and frequency', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = createFrictionEvents(50, 'test_action');

      const results = detector.detect(events);

      expect(results[0]?.priority).toBeGreaterThan(0);
      expect(results[0]?.priority).toBeLessThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('should handle single event', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = [
        createEvent({
          emotionalState: {
            frustration: 0.9,
            confidence: 0.1,
            delight: 0.1,
            confusion: 0.8,
          },
        }),
      ];

      expect(() => detector.detect(events)).not.toThrow();
    });

    it('should handle events with zero frustration', () => {
      const detector = new FrictionDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = [
        createEvent({
          emotionalState: {
            frustration: 0,
            confidence: 1,
            delight: 1,
            confusion: 0,
          },
        }),
      ];

      const results = detector.detect(events);
      expect(results).toEqual([]);
    });
  });
});
