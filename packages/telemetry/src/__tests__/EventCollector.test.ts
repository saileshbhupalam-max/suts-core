/**
 * Tests for EventCollector
 */

import { EventCollector } from '../EventCollector';
import type { TelemetryEvent } from '../types';

describe('EventCollector', () => {
  // eslint-disable-next-line @typescript-eslint/init-declarations
  let collector: EventCollector;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (collector !== undefined) {
      collector.destroy();
    }
    jest.useRealTimers();
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

  describe('constructor', () => {
    it('should create with default config', () => {
      collector = new EventCollector();
      expect(collector).toBeDefined();
      expect(collector.getEventCount()).toBe(0);
    });

    it('should create with custom config', () => {
      collector = new EventCollector({
        batchSize: 50,
        enableAsync: false,
      });
      expect(collector).toBeDefined();
    });

    it('should start flush timer when async enabled', () => {
      collector = new EventCollector({
        enableAsync: true,
        flushInterval: 1000,
      });

      const event = createEvent();
      collector.trackEvent(event);
      expect(collector.getBatchQueueSize()).toBe(1);

      jest.advanceTimersByTime(1000);
      expect(collector.getBatchQueueSize()).toBe(0);
    });

    it('should not start timer when async disabled', () => {
      collector = new EventCollector({ enableAsync: false });
      const event = createEvent();
      collector.trackEvent(event);
      expect(collector.getBatchQueueSize()).toBe(0);
    });
  });

  describe('trackEvent', () => {
    it('should track event immediately when async disabled', () => {
      collector = new EventCollector({ enableAsync: false });
      const event = createEvent();

      collector.trackEvent(event);
      expect(collector.getEventCount()).toBe(1);
      expect(collector.getBatchQueueSize()).toBe(0);
    });

    it('should queue event when async enabled', () => {
      collector = new EventCollector({ enableAsync: true });
      const event = createEvent();

      collector.trackEvent(event);
      expect(collector.getBatchQueueSize()).toBe(1);
      expect(collector.getEventCount()).toBe(0);
    });

    it('should auto-flush when batch size reached', () => {
      collector = new EventCollector({
        enableAsync: true,
        batchSize: 3,
      });

      collector.trackEvent(createEvent({ id: 'e1' }));
      collector.trackEvent(createEvent({ id: 'e2' }));
      expect(collector.getBatchQueueSize()).toBe(2);

      collector.trackEvent(createEvent({ id: 'e3' }));
      expect(collector.getBatchQueueSize()).toBe(0);
      expect(collector.getEventCount()).toBe(3);
    });

    it('should handle multiple events', () => {
      collector = new EventCollector({ enableAsync: false });
      const events = Array.from({ length: 100 }, (_, i) =>
        createEvent({ id: `event-${i}` })
      );

      events.forEach((e) => collector.trackEvent(e));
      expect(collector.getEventCount()).toBe(100);
    });
  });

  describe('query', () => {
    beforeEach(() => {
      collector = new EventCollector({ enableAsync: false });
    });

    it('should query events by filter', () => {
      const events = [
        createEvent({ id: 'e1', personaId: 'persona-1', action: 'install' }),
        createEvent({ id: 'e2', personaId: 'persona-2', action: 'configure' }),
        createEvent({ id: 'e3', personaId: 'persona-1', action: 'use_feature' }),
      ];

      events.forEach((e) => collector.trackEvent(e));

      const results = collector.query({ personaId: 'persona-1' });
      expect(results.length).toBe(2);
    });

    it('should return empty array when no matches', () => {
      const results = collector.query({ personaId: 'non-existent' });
      expect(results.length).toBe(0);
    });

    it('should query with multiple filters', () => {
      collector.trackEvent(
        createEvent({
          id: 'e1',
          personaId: 'persona-1',
          action: 'install',
          emotionalState: { frustration: 0.8, delight: 0.2, confidence: 0.3, confusion: 0.7 },
        })
      );

      const results = collector.query({
        personaId: 'persona-1',
        minFrustration: 0.5,
      });
      expect(results.length).toBe(1);
    });
  });

  describe('getAllEvents', () => {
    it('should return all tracked events', () => {
      collector = new EventCollector({ enableAsync: false });
      const events = [
        createEvent({ id: 'e1' }),
        createEvent({ id: 'e2' }),
      ];

      events.forEach((e) => collector.trackEvent(e));

      const all = collector.getAllEvents();
      expect(all.length).toBe(2);
    });

    it('should not include queued events', () => {
      collector = new EventCollector({ enableAsync: true });
      collector.trackEvent(createEvent());

      expect(collector.getAllEvents().length).toBe(0);
      expect(collector.getBatchQueueSize()).toBe(1);
    });
  });

  describe('getEventCount', () => {
    it('should return correct count', () => {
      collector = new EventCollector({ enableAsync: false });

      expect(collector.getEventCount()).toBe(0);

      collector.trackEvent(createEvent());
      expect(collector.getEventCount()).toBe(1);

      collector.trackEvent(createEvent());
      expect(collector.getEventCount()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all events and queue', () => {
      collector = new EventCollector({ enableAsync: true });

      collector.trackEvent(createEvent());
      collector.flush();
      collector.trackEvent(createEvent());

      expect(collector.getEventCount()).toBe(1);
      expect(collector.getBatchQueueSize()).toBe(1);

      collector.clear();

      expect(collector.getEventCount()).toBe(0);
      expect(collector.getBatchQueueSize()).toBe(0);
    });
  });

  describe('flush', () => {
    it('should flush queued events to storage', () => {
      collector = new EventCollector({ enableAsync: true });

      collector.trackEvent(createEvent({ id: 'e1' }));
      collector.trackEvent(createEvent({ id: 'e2' }));

      expect(collector.getBatchQueueSize()).toBe(2);
      expect(collector.getEventCount()).toBe(0);

      collector.flush();

      expect(collector.getBatchQueueSize()).toBe(0);
      expect(collector.getEventCount()).toBe(2);
    });

    it('should handle flush when queue is empty', () => {
      collector = new EventCollector();
      expect(() => collector.flush()).not.toThrow();
    });

    it('should be called automatically by timer', () => {
      collector = new EventCollector({
        enableAsync: true,
        flushInterval: 5000,
      });

      collector.trackEvent(createEvent());
      expect(collector.getBatchQueueSize()).toBe(1);

      jest.advanceTimersByTime(5000);

      expect(collector.getBatchQueueSize()).toBe(0);
      expect(collector.getEventCount()).toBe(1);
    });
  });

  describe('destroy', () => {
    it('should stop timer and flush remaining events', () => {
      collector = new EventCollector({ enableAsync: true });

      collector.trackEvent(createEvent());
      expect(collector.getBatchQueueSize()).toBe(1);

      collector.destroy();

      expect(collector.getBatchQueueSize()).toBe(0);
      expect(collector.getEventCount()).toBe(1);
    });

    it('should handle destroy when no events', () => {
      collector = new EventCollector();
      expect(() => collector.destroy()).not.toThrow();
    });
  });

  describe('performance', () => {
    it('should handle 100,000 events without slowdown', () => {
      collector = new EventCollector({ enableAsync: false });

      const start = Date.now();
      for (let i = 0; i < 100000; i++) {
        collector.trackEvent(createEvent({ id: `event-${i}` }));
      }
      const duration = Date.now() - start;

      expect(collector.getEventCount()).toBe(100000);
      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    });

    it('should query 10K events in under 10ms', () => {
      collector = new EventCollector({ enableAsync: false });

      for (let i = 0; i < 10000; i++) {
        collector.trackEvent(
          createEvent({
            id: `event-${i}`,
            personaId: i % 10 === 0 ? 'target-persona' : `persona-${i}`,
          })
        );
      }

      const start = Date.now();
      const results = collector.query({ personaId: 'target-persona' });
      const duration = Date.now() - start;

      expect(results.length).toBe(1000);
      expect(duration).toBeLessThan(10);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent event tracking', () => {
      collector = new EventCollector({ enableAsync: false });

      const events = Array.from({ length: 1000 }, (_, i) =>
        createEvent({ id: `event-${i}` })
      );

      // Simulate concurrent tracking
      events.forEach((e) => collector.trackEvent(e));

      expect(collector.getEventCount()).toBe(1000);
    });
  });

  describe('getBatchQueueSize', () => {
    it('should return current queue size', () => {
      collector = new EventCollector({ enableAsync: true, batchSize: 10 });

      expect(collector.getBatchQueueSize()).toBe(0);

      collector.trackEvent(createEvent());
      expect(collector.getBatchQueueSize()).toBe(1);

      collector.trackEvent(createEvent());
      expect(collector.getBatchQueueSize()).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle zero flush interval', () => {
      collector = new EventCollector({
        enableAsync: true,
        flushInterval: 0,
      });

      collector.trackEvent(createEvent());
      expect(collector).toBeDefined();
    });

    it('should handle very large batch size', () => {
      collector = new EventCollector({
        enableAsync: true,
        batchSize: 1000000,
      });

      collector.trackEvent(createEvent());
      expect(collector.getBatchQueueSize()).toBe(1);
    });
  });
});
