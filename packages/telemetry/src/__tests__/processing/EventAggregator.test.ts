/**
 * Tests for EventAggregator
 */

import { EventAggregator } from '../../processing/EventAggregator';
import type { TelemetryEvent } from '../../types';

describe('EventAggregator', () => {
  let aggregator: EventAggregator;

  beforeEach(() => {
    aggregator = new EventAggregator();
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

  describe('aggregateByPersona', () => {
    it('should aggregate events by persona', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'persona-1',
          emotionalState: { frustration: 0.2, delight: 0.8, confidence: 0.7, confusion: 0.1 },
        }),
        createEvent({
          personaId: 'persona-1',
          emotionalState: { frustration: 0.4, delight: 0.6, confidence: 0.5, confusion: 0.3 },
        }),
        createEvent({
          personaId: 'persona-2',
          emotionalState: { frustration: 0.1, delight: 0.9, confidence: 0.8, confusion: 0.05 },
        }),
      ];

      const result = aggregator.aggregateByPersona(events);

      expect(result.size).toBe(2);
      expect(result.get('persona-1')?.count).toBe(2);
      expect(result.get('persona-2')?.count).toBe(1);
    });

    it('should calculate average emotional state', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'persona-1',
          emotionalState: { frustration: 0.2, delight: 0.8, confidence: 0.6, confusion: 0.1 },
        }),
        createEvent({
          personaId: 'persona-1',
          emotionalState: { frustration: 0.4, delight: 0.6, confidence: 0.4, confusion: 0.3 },
        }),
      ];

      const result = aggregator.aggregateByPersona(events);
      const persona1 = result.get('persona-1')!;

      expect(persona1.avgFrustration).toBeCloseTo(0.3, 2);
      expect(persona1.avgDelight).toBeCloseTo(0.7, 2);
      expect(persona1.avgConfidence).toBeCloseTo(0.5, 2);
      expect(persona1.avgConfusion).toBeCloseTo(0.2, 2);
    });

    it('should collect timestamps', () => {
      const ts1 = new Date('2024-01-01');
      const ts2 = new Date('2024-01-02');

      const events: TelemetryEvent[] = [
        createEvent({ personaId: 'persona-1', timestamp: ts1 }),
        createEvent({ personaId: 'persona-1', timestamp: ts2 }),
      ];

      const result = aggregator.aggregateByPersona(events);
      const persona1 = result.get('persona-1')!;

      expect(persona1.timestamps).toHaveLength(2);
      expect(persona1.timestamps).toContainEqual(ts1);
      expect(persona1.timestamps).toContainEqual(ts2);
    });

    it('should handle empty events', () => {
      const result = aggregator.aggregateByPersona([]);
      expect(result.size).toBe(0);
    });
  });

  describe('aggregateByAction', () => {
    it('should aggregate events by action', () => {
      const events: TelemetryEvent[] = [
        createEvent({ action: 'install' }),
        createEvent({ action: 'install' }),
        createEvent({ action: 'configure' }),
      ];

      const result = aggregator.aggregateByAction(events);

      expect(result.size).toBe(2);
      expect(result.get('install')?.count).toBe(2);
      expect(result.get('configure')?.count).toBe(1);
    });

    it('should set action field in aggregated data', () => {
      const events: TelemetryEvent[] = [createEvent({ action: 'install' })];

      const result = aggregator.aggregateByAction(events);
      const install = result.get('install')!;

      expect(install.action).toBe('install');
    });
  });

  describe('aggregateByEventType', () => {
    it('should aggregate events by event type', () => {
      const events: TelemetryEvent[] = [
        createEvent({ eventType: 'action' }),
        createEvent({ eventType: 'action' }),
        createEvent({ eventType: 'observation' }),
      ];

      const result = aggregator.aggregateByEventType(events);

      expect(result.size).toBe(2);
      expect(result.get('action')?.count).toBe(2);
      expect(result.get('observation')?.count).toBe(1);
    });

    it('should set eventType field in aggregated data', () => {
      const events: TelemetryEvent[] = [createEvent({ eventType: 'action' })];

      const result = aggregator.aggregateByEventType(events);
      const action = result.get('action')!;

      expect(action.eventType).toBe('action');
    });
  });

  describe('aggregateByTime', () => {
    it('should aggregate events by time buckets', () => {
      const hourInMs = 60 * 60 * 1000;
      const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

      const events: TelemetryEvent[] = [
        createEvent({ timestamp: new Date(baseTime) }),
        createEvent({ timestamp: new Date(baseTime + 1000) }), // Same hour
        createEvent({ timestamp: new Date(baseTime + hourInMs * 2) }), // 2 hours later
      ];

      const result = aggregator.aggregateByTime(events, hourInMs);

      expect(result.size).toBe(2);
    });

    it('should calculate averages per bucket', () => {
      const hourInMs = 60 * 60 * 1000;
      const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

      const events: TelemetryEvent[] = [
        createEvent({
          timestamp: new Date(baseTime),
          emotionalState: { frustration: 0.2, delight: 0.8, confidence: 0.6, confusion: 0.1 },
        }),
        createEvent({
          timestamp: new Date(baseTime + 1000),
          emotionalState: { frustration: 0.4, delight: 0.6, confidence: 0.4, confusion: 0.3 },
        }),
      ];

      const result = aggregator.aggregateByTime(events, hourInMs);
      const firstBucket = Array.from(result.values())[0]!;

      expect(firstBucket.count).toBe(2);
      expect(firstBucket.avgFrustration).toBeCloseTo(0.3, 2);
    });
  });

  describe('aggregateByPersonaAndAction', () => {
    it('should aggregate by persona and action combination', () => {
      const events: TelemetryEvent[] = [
        createEvent({ personaId: 'persona-1', action: 'install' }),
        createEvent({ personaId: 'persona-1', action: 'install' }),
        createEvent({ personaId: 'persona-1', action: 'configure' }),
        createEvent({ personaId: 'persona-2', action: 'install' }),
      ];

      const result = aggregator.aggregateByPersonaAndAction(events);

      expect(result.size).toBe(3);
      expect(result.get('persona-1:install')?.count).toBe(2);
      expect(result.get('persona-1:configure')?.count).toBe(1);
      expect(result.get('persona-2:install')?.count).toBe(1);
    });

    it('should set personaId and action in aggregated data', () => {
      const events: TelemetryEvent[] = [
        createEvent({ personaId: 'persona-1', action: 'install' }),
      ];

      const result = aggregator.aggregateByPersonaAndAction(events);
      const data = result.get('persona-1:install')!;

      expect(data.personaId).toBe('persona-1');
      expect(data.action).toBe('install');
    });
  });

  describe('running average calculation', () => {
    it('should correctly update running averages', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          emotionalState: { frustration: 0.0, delight: 1.0, confidence: 0.5, confusion: 0.0 },
        }),
        createEvent({
          personaId: 'p1',
          emotionalState: { frustration: 1.0, delight: 0.0, confidence: 0.5, confusion: 1.0 },
        }),
        createEvent({
          personaId: 'p1',
          emotionalState: { frustration: 0.5, delight: 0.5, confidence: 0.5, confusion: 0.5 },
        }),
      ];

      const result = aggregator.aggregateByPersona(events);
      const p1 = result.get('p1')!;

      expect(p1.avgFrustration).toBeCloseTo(0.5, 2);
      expect(p1.avgDelight).toBeCloseTo(0.5, 2);
      expect(p1.avgConfidence).toBeCloseTo(0.5, 2);
      expect(p1.avgConfusion).toBeCloseTo(0.5, 2);
    });
  });

  describe('edge cases', () => {
    it('should handle single event', () => {
      const events = [createEvent()];
      const result = aggregator.aggregateByPersona(events);

      expect(result.size).toBe(1);
    });

    it('should handle large datasets', () => {
      const events = Array.from({ length: 10000 }, (_, i) =>
        createEvent({ personaId: `persona-${i % 100}` })
      );

      const result = aggregator.aggregateByPersona(events);

      expect(result.size).toBe(100);
      Array.from(result.values()).forEach((data) => {
        expect(data.count).toBe(100);
      });
    });

    it('should handle missing emotional state values', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          emotionalState: { frustration: 0.5 } as any,
        }),
      ];

      const result = aggregator.aggregateByPersona(events);
      expect(result.size).toBe(1);
    });

    it('should use default 0 for missing emotional state fields', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          emotionalState: {} as any,
        }),
      ];

      const result = aggregator.aggregateByPersona(events);
      const p1 = result.get('p1')!;

      expect(p1.avgFrustration).toBe(0);
      expect(p1.avgDelight).toBe(0);
      expect(p1.avgConfidence).toBe(0);
      expect(p1.avgConfusion).toBe(0);
    });

    it('should handle undefined values when updating aggregated data', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          emotionalState: { frustration: 0.5, delight: 0.5, confidence: 0.5, confusion: 0.5 },
        }),
        createEvent({
          personaId: 'p1',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          emotionalState: {} as any,
        }),
      ];

      const result = aggregator.aggregateByPersona(events);
      const p1 = result.get('p1')!;

      expect(p1.count).toBe(2);
      expect(p1.avgFrustration).toBeCloseTo(0.25, 2);
      expect(p1.avgDelight).toBeCloseTo(0.25, 2);
      expect(p1.avgConfidence).toBeCloseTo(0.25, 2);
      expect(p1.avgConfusion).toBeCloseTo(0.25, 2);
    });
  });
});
