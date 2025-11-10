/**
 * Tests for QueryBuilder
 */

import { QueryBuilder } from '../../storage/QueryBuilder';
import { InMemoryStore } from '../../storage/InMemoryStore';
import type { TelemetryEvent } from '../../types';

describe('QueryBuilder', () => {
  let store: InMemoryStore;
  let builder: QueryBuilder;

  beforeEach(() => {
    store = new InMemoryStore();
    builder = new QueryBuilder(store);

    // Setup test data
    const events: TelemetryEvent[] = [
      {
        id: 'event-1',
        personaId: 'persona-1',
        eventType: 'action',
        action: 'install',
        emotionalState: { frustration: 0.2, delight: 0.8, confidence: 0.7, confusion: 0.1 },
        metadata: {},
        timestamp: new Date('2024-01-01'),
        cohort: 'cohort-a',
      },
      {
        id: 'event-2',
        personaId: 'persona-2',
        eventType: 'observation',
        action: 'configure',
        emotionalState: { frustration: 0.7, delight: 0.3, confidence: 0.5, confusion: 0.6 },
        metadata: {},
        timestamp: new Date('2024-01-02'),
        cohort: 'cohort-b',
      },
      {
        id: 'event-3',
        personaId: 'persona-1',
        eventType: 'action',
        action: 'use_feature',
        emotionalState: { frustration: 0.1, delight: 0.9, confidence: 0.8, confusion: 0.05 },
        metadata: {},
        timestamp: new Date('2024-01-03'),
        cohort: 'cohort-a',
      },
    ];

    store.storeBatch(events);
  });

  describe('fluent interface', () => {
    it('should support method chaining', () => {
      const result = builder
        .forPersona('persona-1')
        .ofType('action')
        .withAction('install')
        .execute();

      expect(result.length).toBe(1);
      expect(result[0]?.id).toBe('event-1');
    });

    it('should allow reset and reuse', () => {
      const result1 = builder.forPersona('persona-1').execute();
      expect(result1.length).toBe(2);

      builder.reset();
      const result2 = builder.forPersona('persona-2').execute();
      expect(result2.length).toBe(1);
    });
  });

  describe('forPersona', () => {
    it('should filter by persona ID', () => {
      const results = builder.forPersona('persona-1').execute();
      expect(results.length).toBe(2);
      expect(results.every((e) => e.personaId === 'persona-1')).toBe(true);
    });
  });

  describe('ofType', () => {
    it('should filter by event type', () => {
      const results = builder.ofType('action').execute();
      expect(results.length).toBe(2);
      expect(results.every((e) => e.eventType === 'action')).toBe(true);
    });
  });

  describe('withAction', () => {
    it('should filter by action', () => {
      const results = builder.withAction('install').execute();
      expect(results.length).toBe(1);
      expect(results[0]?.action).toBe('install');
    });
  });

  describe('inCohort', () => {
    it('should filter by cohort', () => {
      const results = builder.inCohort('cohort-a').execute();
      expect(results.length).toBe(2);
      expect(results.every((e) => e.cohort === 'cohort-a')).toBe(true);
    });
  });

  describe('betweenDates', () => {
    it('should filter by date range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-02');

      const results = builder.betweenDates(start, end).execute();
      expect(results.length).toBe(2);
    });

    it('should exclude events outside range', () => {
      const start = new Date('2024-01-02');
      const end = new Date('2024-01-02');

      const results = builder.betweenDates(start, end).execute();
      expect(results.length).toBe(1);
      expect(results[0]?.id).toBe('event-2');
    });
  });

  describe('emotional state filters', () => {
    it('should filter by min frustration', () => {
      const results = builder.withMinFrustration(0.5).execute();
      expect(results.length).toBe(1);
      expect(results[0]?.id).toBe('event-2');
    });

    it('should filter by max frustration', () => {
      const results = builder.withMaxFrustration(0.3).execute();
      expect(results.length).toBe(2);
    });

    it('should filter by min delight', () => {
      const results = builder.withMinDelight(0.8).execute();
      expect(results.length).toBe(2);
    });

    it('should filter by max delight', () => {
      const results = builder.withMaxDelight(0.5).execute();
      expect(results.length).toBe(1);
      expect(results[0]?.id).toBe('event-2');
    });

    it('should combine emotional state filters', () => {
      const results = builder
        .withMinFrustration(0.1)
        .withMaxFrustration(0.3)
        .execute();
      expect(results.length).toBe(2);
    });
  });

  describe('complex queries', () => {
    it('should combine multiple filters', () => {
      const results = builder
        .forPersona('persona-1')
        .ofType('action')
        .withMinDelight(0.8)
        .execute();

      expect(results.length).toBe(2);
    });

    it('should handle no results', () => {
      const results = builder
        .forPersona('persona-1')
        .withAction('configure')
        .execute();

      expect(results.length).toBe(0);
    });
  });

  describe('getFilter', () => {
    it('should return current filter', () => {
      builder.forPersona('persona-1').withAction('install');

      const filter = builder.getFilter();
      expect(filter.personaId).toBe('persona-1');
      expect(filter.action).toBe('install');
    });

    it('should return copy of filter', () => {
      builder.forPersona('persona-1');
      const filter = builder.getFilter();
      filter.personaId = 'modified';

      expect(builder.getFilter().personaId).toBe('persona-1');
    });
  });

  describe('reset', () => {
    it('should clear all filters', () => {
      builder.forPersona('persona-1').withAction('install');
      builder.reset();

      const filter = builder.getFilter();
      expect(Object.keys(filter).length).toBe(0);
    });

    it('should return builder for chaining', () => {
      const result = builder.reset().forPersona('persona-1');
      expect(result).toBe(builder);
    });
  });

  describe('execute', () => {
    it('should return all events with empty filter', () => {
      const results = builder.execute();
      expect(results.length).toBe(3);
    });

    it('should not modify store', () => {
      builder.forPersona('persona-1').execute();
      expect(store.count()).toBe(3);
    });
  });
});
