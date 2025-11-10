/**
 * Tests for MetricsCalculator
 */

import { MetricsCalculator } from '../MetricsCalculator';
import type { TelemetryEvent } from '../types';

describe('MetricsCalculator', () => {
  let calculator: MetricsCalculator;

  beforeEach(() => {
    calculator = new MetricsCalculator();
  });

  const createEvent = (overrides?: Partial<TelemetryEvent>): TelemetryEvent => ({
    id: `event-${Math.random()}`,
    personaId: 'persona-1',
    eventType: 'action',
    action: 'install',
    emotionalState: {
      frustration: 0.2,
      delight: 0.8,
      confidence: 0.7,
      confusion: 0.1,
    },
    metadata: {},
    timestamp: new Date(),
    ...overrides,
  });

  describe('calculateRetention', () => {
    it('should calculate retention correctly', () => {
      const baseDate = new Date('2024-01-01');
      const day7Date = new Date('2024-01-08');
      const day10Date = new Date('2024-01-11');

      const events: TelemetryEvent[] = [
        // User 1: retained (active on day 7+)
        createEvent({
          id: 'e1',
          personaId: 'user-1',
          cohort: 'cohort-a',
          timestamp: baseDate,
        }),
        createEvent({
          id: 'e2',
          personaId: 'user-1',
          cohort: 'cohort-a',
          timestamp: day7Date,
        }),
        // User 2: not retained (no activity on day 7+)
        createEvent({
          id: 'e3',
          personaId: 'user-2',
          cohort: 'cohort-a',
          timestamp: baseDate,
        }),
        // User 3: retained (active on day 10)
        createEvent({
          id: 'e4',
          personaId: 'user-3',
          cohort: 'cohort-a',
          timestamp: baseDate,
        }),
        createEvent({
          id: 'e5',
          personaId: 'user-3',
          cohort: 'cohort-a',
          timestamp: day10Date,
        }),
      ];

      const retention = calculator.calculateRetention(events, 'cohort-a', 7);
      expect(retention).toBeCloseTo(66.67, 1); // 2 out of 3 users retained
    });

    it('should return 0 for empty cohort', () => {
      const retention = calculator.calculateRetention([], 'cohort-a', 7);
      expect(retention).toBe(0);
    });

    it('should return 0 for non-existent cohort', () => {
      const events = [createEvent({ cohort: 'cohort-a' })];
      const retention = calculator.calculateRetention(events, 'cohort-b', 7);
      expect(retention).toBe(0);
    });

    it('should handle all users retained', () => {
      const baseDate = new Date('2024-01-01');
      const day7Date = new Date('2024-01-08');

      const events: TelemetryEvent[] = [
        createEvent({
          id: 'e1',
          personaId: 'user-1',
          cohort: 'cohort-a',
          timestamp: baseDate,
        }),
        createEvent({
          id: 'e2',
          personaId: 'user-1',
          cohort: 'cohort-a',
          timestamp: day7Date,
        }),
      ];

      const retention = calculator.calculateRetention(events, 'cohort-a', 7);
      expect(retention).toBe(100);
    });

    it('should handle no users retained', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          id: 'e1',
          personaId: 'user-1',
          cohort: 'cohort-a',
          timestamp: new Date('2024-01-01'),
        }),
        createEvent({
          id: 'e2',
          personaId: 'user-2',
          cohort: 'cohort-a',
          timestamp: new Date('2024-01-01'),
        }),
      ];

      const retention = calculator.calculateRetention(events, 'cohort-a', 7);
      expect(retention).toBe(0);
    });
  });

  describe('calculateDay7Retention', () => {
    it('should calculate day-7 retention', () => {
      const baseDate = new Date('2024-01-01');
      const day7Date = new Date('2024-01-08');

      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'user-1',
          cohort: 'cohort-a',
          timestamp: baseDate,
        }),
        createEvent({
          personaId: 'user-1',
          cohort: 'cohort-a',
          timestamp: day7Date,
        }),
      ];

      const retention = calculator.calculateDay7Retention(events, 'cohort-a');
      expect(retention).toBe(100);
    });
  });

  describe('calculateDay14Retention', () => {
    it('should calculate day-14 retention', () => {
      const baseDate = new Date('2024-01-01');
      const day14Date = new Date('2024-01-15');

      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'user-1',
          cohort: 'cohort-a',
          timestamp: baseDate,
        }),
        createEvent({
          personaId: 'user-1',
          cohort: 'cohort-a',
          timestamp: day14Date,
        }),
      ];

      const retention = calculator.calculateDay14Retention(events, 'cohort-a');
      expect(retention).toBe(100);
    });
  });

  describe('calculateDay30Retention', () => {
    it('should calculate day-30 retention', () => {
      const baseDate = new Date('2024-01-01');
      const day30Date = new Date('2024-01-31');

      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'user-1',
          cohort: 'cohort-a',
          timestamp: baseDate,
        }),
        createEvent({
          personaId: 'user-1',
          cohort: 'cohort-a',
          timestamp: day30Date,
        }),
      ];

      const retention = calculator.calculateDay30Retention(events, 'cohort-a');
      expect(retention).toBe(100);
    });
  });

  describe('calculateFrustration', () => {
    it('should calculate average frustration', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'persona-1',
          emotionalState: { frustration: 0.2, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'persona-1',
          emotionalState: { frustration: 0.4, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'persona-1',
          emotionalState: { frustration: 0.6, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const frustration = calculator.calculateFrustration(events, 'persona-1');
      expect(frustration).toBeCloseTo(0.4, 2);
    });

    it('should return 0 for empty events', () => {
      const frustration = calculator.calculateFrustration([], 'persona-1');
      expect(frustration).toBe(0);
    });

    it('should return 0 for non-existent persona', () => {
      const events = [createEvent({ personaId: 'persona-1' })];
      const frustration = calculator.calculateFrustration(events, 'persona-2');
      expect(frustration).toBe(0);
    });

    it('should handle missing frustration values', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'persona-1',
          emotionalState: {} as any,
        }),
      ];

      const frustration = calculator.calculateFrustration(events, 'persona-1');
      expect(frustration).toBe(0);
    });
  });

  describe('calculateDelight', () => {
    it('should calculate average delight', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'persona-1',
          emotionalState: { frustration: 0, delight: 0.6, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'persona-1',
          emotionalState: { frustration: 0, delight: 0.8, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'persona-1',
          emotionalState: { frustration: 0, delight: 1.0, confidence: 0, confusion: 0 },
        }),
      ];

      const delight = calculator.calculateDelight(events, 'persona-1');
      expect(delight).toBeCloseTo(0.8, 2);
    });

    it('should return 0 for empty events', () => {
      const delight = calculator.calculateDelight([], 'persona-1');
      expect(delight).toBe(0);
    });
  });

  describe('calculateViralCoefficient', () => {
    it('should calculate viral coefficient', () => {
      const events: TelemetryEvent[] = [
        // 3 users, 2 shares total
        createEvent({ id: 'e1', personaId: 'user-1', action: 'install' }),
        createEvent({ id: 'e2', personaId: 'user-1', action: 'share' }),
        createEvent({ id: 'e3', personaId: 'user-2', action: 'share' }),
        createEvent({ id: 'e4', personaId: 'user-3', action: 'install' }),
      ];

      const viral = calculator.calculateViralCoefficient(events);
      // invitations per user = 2/3
      // new users installing = 2
      // conversion rate = 2/2 = 1
      // viral coefficient = (2/3) * 1 = 0.667
      expect(viral).toBeCloseTo(0.667, 2);
    });

    it('should return 0 for no shares', () => {
      const events: TelemetryEvent[] = [
        createEvent({ action: 'install' }),
        createEvent({ action: 'configure' }),
      ];

      const viral = calculator.calculateViralCoefficient(events);
      expect(viral).toBe(0);
    });

    it('should return 0 for empty events', () => {
      const viral = calculator.calculateViralCoefficient([]);
      expect(viral).toBe(0);
    });

    it('should handle shares without installs', () => {
      const events: TelemetryEvent[] = [
        createEvent({ personaId: 'user-1', action: 'share' }),
        createEvent({ personaId: 'user-2', action: 'share' }),
      ];

      const viral = calculator.calculateViralCoefficient(events);
      expect(viral).toBeGreaterThanOrEqual(0);
    });
  });

  describe('detectFrictionPoints', () => {
    it('should detect high frustration actions', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          action: 'configure',
          emotionalState: { frustration: 0.8, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          action: 'configure',
          emotionalState: { frustration: 0.9, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          action: 'install',
          emotionalState: { frustration: 0.2, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const friction = calculator.detectFrictionPoints(events, 0.7);
      expect(friction.length).toBe(1);
      expect(friction[0]?.action).toBe('configure');
      expect(friction[0]?.avgFrustration).toBeGreaterThan(0.8);
    });

    it('should return empty array when no friction', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          emotionalState: { frustration: 0.1, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const friction = calculator.detectFrictionPoints(events, 0.7);
      expect(friction).toEqual([]);
    });

    it('should sort by frustration level', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          action: 'action-a',
          emotionalState: { frustration: 0.75, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          action: 'action-b',
          emotionalState: { frustration: 0.9, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const friction = calculator.detectFrictionPoints(events, 0.7);
      expect(friction[0]?.action).toBe('action-b');
      expect(friction[1]?.action).toBe('action-a');
    });

    it('should include occurrence count', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          action: 'configure',
          emotionalState: { frustration: 0.8, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          action: 'configure',
          emotionalState: { frustration: 0.9, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          action: 'configure',
          emotionalState: { frustration: 0.7, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const friction = calculator.detectFrictionPoints(events, 0.7);
      expect(friction[0]?.count).toBe(3);
    });
  });

  describe('detectValueMoments', () => {
    it('should detect high delight actions', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          action: 'use_feature',
          emotionalState: { frustration: 0, delight: 0.9, confidence: 0, confusion: 0 },
        }),
        createEvent({
          action: 'use_feature',
          emotionalState: { frustration: 0, delight: 0.8, confidence: 0, confusion: 0 },
        }),
        createEvent({
          action: 'configure',
          emotionalState: { frustration: 0, delight: 0.2, confidence: 0, confusion: 0 },
        }),
      ];

      const value = calculator.detectValueMoments(events, 0.7);
      expect(value.length).toBe(1);
      expect(value[0]?.action).toBe('use_feature');
      expect(value[0]?.avgDelight).toBeGreaterThan(0.8);
    });

    it('should return empty array when no value moments', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          emotionalState: { frustration: 0, delight: 0.3, confidence: 0, confusion: 0 },
        }),
      ];

      const value = calculator.detectValueMoments(events, 0.7);
      expect(value).toEqual([]);
    });

    it('should sort by delight level', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          action: 'action-a',
          emotionalState: { frustration: 0, delight: 0.75, confidence: 0, confusion: 0 },
        }),
        createEvent({
          action: 'action-b',
          emotionalState: { frustration: 0, delight: 0.95, confidence: 0, confusion: 0 },
        }),
      ];

      const value = calculator.detectValueMoments(events, 0.7);
      expect(value[0]?.action).toBe('action-b');
      expect(value[1]?.action).toBe('action-a');
    });
  });

  describe('calculateAverageEmotionalState', () => {
    it('should calculate average emotional state', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          emotionalState: { frustration: 0.2, delight: 0.8, confidence: 0.7, confusion: 0.1 },
        }),
        createEvent({
          emotionalState: { frustration: 0.4, delight: 0.6, confidence: 0.5, confusion: 0.3 },
        }),
      ];

      const avg = calculator.calculateAverageEmotionalState(events);
      expect(avg.frustration).toBeCloseTo(0.3, 2);
      expect(avg.delight).toBeCloseTo(0.7, 2);
      expect(avg.confidence).toBeCloseTo(0.6, 2);
      expect(avg.confusion).toBeCloseTo(0.2, 2);
    });

    it('should return zeros for empty events', () => {
      const avg = calculator.calculateAverageEmotionalState([]);
      expect(avg.frustration).toBe(0);
      expect(avg.delight).toBe(0);
      expect(avg.confidence).toBe(0);
      expect(avg.confusion).toBe(0);
    });

    it('should handle missing emotional state fields', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          emotionalState: { frustration: 0.5 } as any,
        }),
      ];

      const avg = calculator.calculateAverageEmotionalState(events);
      expect(avg.frustration).toBe(0.5);
      expect(avg.delight).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle single event', () => {
      const events = [createEvent()];
      const frustration = calculator.calculateFrustration(events, 'persona-1');
      expect(frustration).toBe(0.2);
    });

    it('should handle large datasets', () => {
      const events = Array.from({ length: 10000 }, () =>
        createEvent({
          emotionalState: { frustration: 0.5, delight: 0.5, confidence: 0.5, confusion: 0.5 },
        })
      );

      const avg = calculator.calculateAverageEmotionalState(events);
      expect(avg.frustration).toBeCloseTo(0.5, 2);
    });
  });
});
