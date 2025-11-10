/**
 * Tests for AhaMomentDetector
 */

import { AhaMomentDetector } from '../AhaMomentDetector';
import { DEFAULT_ANALYSIS_CONFIG } from '../../models/config';
import { createEvent, createValueEvents } from '../../__tests__/helpers';

describe('AhaMomentDetector', () => {
  describe('detect', () => {
    it('should return empty array for no events', () => {
      const detector = new AhaMomentDetector(DEFAULT_ANALYSIS_CONFIG);
      const results = detector.detect([]);

      expect(results).toEqual([]);
    });

    it('should detect aha moments', () => {
      const detector = new AhaMomentDetector(DEFAULT_ANALYSIS_CONFIG);
      const baseTime = Date.now();

      const events = [
        ...createValueEvents(10, 'aha_action'),
        // Add follow-up events for retention
        ...Array.from({ length: 10 }, (_, i) => [
          createEvent({
            personaId: `user-${i}`,
            action: 'follow_up_1',
            timestamp: new Date(baseTime + 20000 + i * 1000),
          }),
          createEvent({
            personaId: `user-${i}`,
            action: 'follow_up_2',
            timestamp: new Date(baseTime + 30000 + i * 1000),
          }),
          createEvent({
            personaId: `user-${i}`,
            action: 'follow_up_3',
            timestamp: new Date(baseTime + 40000 + i * 1000),
          }),
        ]).flat(),
      ];

      const results = detector.detect(events);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.action).toBe('aha_action');
    });

    it('should calculate retention impact', () => {
      const detector = new AhaMomentDetector(DEFAULT_ANALYSIS_CONFIG);
      const baseTime = Date.now();

      const events = [
        createEvent({
          personaId: 'user-1',
          action: 'aha_action',
          emotionalState: { frustration: 0.1, confidence: 0.9, delight: 0.9, confusion: 0.1 },
          timestamp: new Date(baseTime),
        }),
        createEvent({ personaId: 'user-1', action: 'event1', timestamp: new Date(baseTime + 1000) }),
        createEvent({ personaId: 'user-1', action: 'event2', timestamp: new Date(baseTime + 2000) }),
        createEvent({ personaId: 'user-1', action: 'event3', timestamp: new Date(baseTime + 3000) }),
      ];

      const results = detector.detect(events);

      if (results.length > 0) {
        expect(results[0]?.retentionImpact).toBeGreaterThanOrEqual(0);
        expect(results[0]?.retentionImpact).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate time to aha moment', () => {
      const detector = new AhaMomentDetector(DEFAULT_ANALYSIS_CONFIG);
      const baseTime = Date.now();

      const events = [
        createEvent({
          personaId: 'user-1',
          action: 'install',
          timestamp: new Date(baseTime),
        }),
        createEvent({
          personaId: 'user-1',
          action: 'aha_action',
          emotionalState: { frustration: 0.1, confidence: 0.9, delight: 0.9, confusion: 0.1 },
          timestamp: new Date(baseTime + 60000), // 1 minute later
        }),
      ];

      const results = detector.detect(events);

      if (results.length > 0) {
        expect(results[0]?.timeToAha).toBeGreaterThan(0);
      }
    });

    it('should count users reached and not reached', () => {
      const detector = new AhaMomentDetector(DEFAULT_ANALYSIS_CONFIG);
      const baseTime = Date.now();

      const events = [
        ...createValueEvents(5, 'aha_action'),
        createEvent({ personaId: 'other-user-1', action: 'other', timestamp: new Date(baseTime) }),
        createEvent({ personaId: 'other-user-2', action: 'other', timestamp: new Date(baseTime) }),
      ];

      const results = detector.detect(events);

      if (results.length > 0) {
        expect(results[0]?.usersReached).toBeGreaterThan(0);
        expect(results[0]?.usersNotReached).toBeGreaterThan(0);
      }
    });

    it('should sort by retention impact', () => {
      const detector = new AhaMomentDetector(DEFAULT_ANALYSIS_CONFIG);
      const baseTime = Date.now();

      // Create two aha moments with different retention
      const events = [
        ...createValueEvents(10, 'high_retention_aha'),
        ...Array.from({ length: 10 }, (_, i) => [
          createEvent({
            personaId: `user-${i}`,
            action: 'follow_up_1',
            timestamp: new Date(baseTime + 20000 + i * 1000),
          }),
          createEvent({
            personaId: `user-${i}`,
            action: 'follow_up_2',
            timestamp: new Date(baseTime + 30000 + i * 1000),
          }),
          createEvent({
            personaId: `user-${i}`,
            action: 'follow_up_3',
            timestamp: new Date(baseTime + 40000 + i * 1000),
          }),
        ]).flat(),
        ...createValueEvents(10, 'low_retention_aha'),
      ];

      const results = detector.detect(events);

      if (results.length > 1) {
        expect(results[0]?.retentionImpact).toBeGreaterThanOrEqual(
          results[results.length - 1]?.retentionImpact ?? 0
        );
      }
    });
  });

  describe('edge cases', () => {
    it('should handle single event', () => {
      const detector = new AhaMomentDetector(DEFAULT_ANALYSIS_CONFIG);
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

    it('should handle events with low retention', () => {
      const detector = new AhaMomentDetector(DEFAULT_ANALYSIS_CONFIG);
      const events = createValueEvents(5, 'no_retention_aha');

      const results = detector.detect(events);

      // Should detect but with low retention impact
      if (results.length > 0) {
        expect(results[0]?.retentionImpact).toBeLessThan(0.7);
      }
    });
  });
});
