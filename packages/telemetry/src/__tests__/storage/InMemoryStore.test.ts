/**
 * Tests for InMemoryStore
 */

import { InMemoryStore } from '../../storage/InMemoryStore';
import type { TelemetryEvent } from '../../types';

describe('InMemoryStore', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
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

  describe('store', () => {
    it('should store a single event', () => {
      const event = createEvent();
      store.store(event);

      expect(store.count()).toBe(1);
      expect(store.getAll()).toContainEqual(event);
    });

    it('should prevent duplicate events by ID', () => {
      const event = createEvent({ id: 'duplicate-id' });
      store.store(event);
      store.store(event);

      expect(store.count()).toBe(1);
    });

    it('should respect max storage size', () => {
      const smallStore = new InMemoryStore(3);
      const event1 = createEvent({ id: 'event-1' });
      const event2 = createEvent({ id: 'event-2' });
      const event3 = createEvent({ id: 'event-3' });
      const event4 = createEvent({ id: 'event-4' });

      smallStore.store(event1);
      smallStore.store(event2);
      smallStore.store(event3);
      smallStore.store(event4);

      expect(smallStore.count()).toBe(3);
      expect(smallStore.getAll()).not.toContainEqual(event1);
      expect(smallStore.getAll()).toContainEqual(event4);
    });
  });

  describe('storeBatch', () => {
    it('should store multiple events', () => {
      const events = [
        createEvent({ id: 'event-1' }),
        createEvent({ id: 'event-2' }),
        createEvent({ id: 'event-3' }),
      ];

      store.storeBatch(events);
      expect(store.count()).toBe(3);
    });

    it('should handle empty batch', () => {
      store.storeBatch([]);
      expect(store.count()).toBe(0);
    });

    it('should prevent duplicates in batch', () => {
      const event = createEvent({ id: 'duplicate' });
      store.storeBatch([event, event]);
      expect(store.count()).toBe(1);
    });
  });

  describe('query', () => {
    beforeEach(() => {
      const events = [
        createEvent({
          id: 'event-1',
          personaId: 'persona-1',
          action: 'install',
          emotionalState: { frustration: 0.2, delight: 0.8, confidence: 0.7, confusion: 0.1 },
        }),
        createEvent({
          id: 'event-2',
          personaId: 'persona-2',
          action: 'configure',
          emotionalState: { frustration: 0.7, delight: 0.3, confidence: 0.5, confusion: 0.6 },
        }),
        createEvent({
          id: 'event-3',
          personaId: 'persona-1',
          action: 'use_feature',
          emotionalState: { frustration: 0.1, delight: 0.9, confidence: 0.8, confusion: 0.05 },
        }),
      ];
      store.storeBatch(events);
    });

    it('should filter by personaId', () => {
      const results = store.query({ personaId: 'persona-1' });
      expect(results.length).toBe(2);
      expect(results.every((e) => e.personaId === 'persona-1')).toBe(true);
    });

    it('should filter by action', () => {
      const results = store.query({ action: 'install' });
      expect(results.length).toBe(1);
      expect(results[0]?.action).toBe('install');
    });

    it('should filter by eventType', () => {
      const results = store.query({ eventType: 'action' });
      expect(results.length).toBe(3);
    });

    it('should filter by minFrustration', () => {
      const results = store.query({ minFrustration: 0.5 });
      expect(results.length).toBe(1);
      expect(results[0]?.personaId).toBe('persona-2');
    });

    it('should filter by maxFrustration', () => {
      const results = store.query({ maxFrustration: 0.3 });
      expect(results.length).toBe(2);
    });

    it('should filter by minDelight', () => {
      const results = store.query({ minDelight: 0.8 });
      expect(results.length).toBe(2);
    });

    it('should filter by maxDelight', () => {
      const results = store.query({ maxDelight: 0.5 });
      expect(results.length).toBe(1);
    });

    it('should filter by time range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const results = store.query({ startTime: yesterday, endTime: tomorrow });
      expect(results.length).toBe(3);
    });

    it('should combine multiple filters', () => {
      const results = store.query({
        personaId: 'persona-1',
        minDelight: 0.8,
      });
      expect(results.length).toBe(2);
    });

    it('should return empty array when no matches', () => {
      const results = store.query({ personaId: 'non-existent' });
      expect(results.length).toBe(0);
    });

    it('should filter by cohort', () => {
      store.clear();
      store.storeBatch([
        createEvent({ id: 'e1', cohort: 'cohort-a' }),
        createEvent({ id: 'e2', cohort: 'cohort-b' }),
      ]);

      const results = store.query({ cohort: 'cohort-a' });
      expect(results.length).toBe(1);
      expect(results[0]?.cohort).toBe('cohort-a');
    });
  });

  describe('getAll', () => {
    it('should return all events', () => {
      const events = [
        createEvent({ id: 'event-1' }),
        createEvent({ id: 'event-2' }),
      ];
      store.storeBatch(events);

      const all = store.getAll();
      expect(all.length).toBe(2);
      expect(all).toEqual(expect.arrayContaining(events));
    });

    it('should return a copy of events array', () => {
      const event = createEvent();
      store.store(event);

      const all1 = store.getAll();
      const all2 = store.getAll();

      expect(all1).not.toBe(all2);
    });
  });

  describe('count', () => {
    it('should return correct count', () => {
      expect(store.count()).toBe(0);

      store.store(createEvent({ id: 'event-1' }));
      expect(store.count()).toBe(1);

      store.storeBatch([
        createEvent({ id: 'event-2' }),
        createEvent({ id: 'event-3' }),
      ]);
      expect(store.count()).toBe(3);
    });
  });

  describe('clear', () => {
    it('should remove all events', () => {
      store.storeBatch([
        createEvent({ id: 'event-1' }),
        createEvent({ id: 'event-2' }),
      ]);
      expect(store.count()).toBe(2);

      store.clear();
      expect(store.count()).toBe(0);
      expect(store.getAll()).toEqual([]);
    });

    it('should allow storing after clear', () => {
      store.store(createEvent({ id: 'event-1' }));
      store.clear();
      store.store(createEvent({ id: 'event-2' }));

      expect(store.count()).toBe(1);
    });
  });

  describe('getByPersonaId', () => {
    it('should return events for specific persona', () => {
      store.storeBatch([
        createEvent({ id: 'e1', personaId: 'persona-1' }),
        createEvent({ id: 'e2', personaId: 'persona-2' }),
        createEvent({ id: 'e3', personaId: 'persona-1' }),
      ]);

      const results = store.getByPersonaId('persona-1');
      expect(results.length).toBe(2);
      expect(results.every((e) => e.personaId === 'persona-1')).toBe(true);
    });
  });

  describe('getByTimeRange', () => {
    it('should return events in time range', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 60000);
      const future = new Date(now.getTime() + 60000);

      store.storeBatch([
        createEvent({ id: 'e1', timestamp: past }),
        createEvent({ id: 'e2', timestamp: now }),
        createEvent({ id: 'e3', timestamp: future }),
      ]);

      const results = store.getByTimeRange(past, now);
      expect(results.length).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle events with missing emotional state fields', () => {
      const event = createEvent({
        emotionalState: { frustration: 0.5 } as any,
      });
      store.store(event);

      const results = store.query({ minDelight: 0 });
      expect(results.length).toBe(1);
    });

    it('should handle large number of events', () => {
      const events = Array.from({ length: 10000 }, (_, i) =>
        createEvent({ id: `event-${i}` })
      );

      store.storeBatch(events);
      expect(store.count()).toBe(10000);
    });
  });
});
