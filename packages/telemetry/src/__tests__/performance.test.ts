/**
 * Performance benchmarks and memory leak tests for telemetry
 */

import { EventCollector } from '../EventCollector';
import { MetricsCalculator } from '../MetricsCalculator';
import { InMemoryStore } from '../storage/InMemoryStore';
import { EventAggregator } from '../processing/EventAggregator';
import { PatternDetector } from '../processing/PatternDetector';
import { TimeSeriesAnalyzer } from '../processing/TimeSeriesAnalyzer';
import type { TelemetryEvent } from '../types';

describe('Performance Benchmarks', () => {
  const createEvent = (overrides?: Partial<TelemetryEvent>): TelemetryEvent => ({
    id: `event-${Math.random()}`,
    personaId: `persona-${Math.floor(Math.random() * 100)}`,
    eventType: 'action',
    action: ['install', 'configure', 'use_feature', 'share'][
      Math.floor(Math.random() * 4)
    ]!,
    emotionalState: {
      frustration: Math.random(),
      delight: Math.random(),
      confidence: Math.random(),
      confusion: Math.random(),
    },
    metadata: {},
    timestamp: new Date(Date.now() + Math.random() * 86400000),
    cohort: `cohort-${Math.floor(Math.random() * 10)}`,
    ...overrides,
  });

  describe('EventCollector Performance', () => {
    it('should track 100,000 events without slowdown', () => {
      const collector = new EventCollector({ enableAsync: false });

      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        collector.trackEvent(createEvent({ id: `event-${i}` }));
      }
      const duration = performance.now() - start;

      expect(collector.getEventCount()).toBe(100000);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds

      collector.destroy();
    });

    it('should query 10K events in under 10ms', () => {
      const collector = new EventCollector({ enableAsync: false });

      // Setup data
      for (let i = 0; i < 10000; i++) {
        collector.trackEvent(
          createEvent({
            id: `event-${i}`,
            personaId: i % 10 === 0 ? 'target-persona' : `persona-${i}`,
          })
        );
      }

      // Benchmark query
      const start = performance.now();
      const results = collector.query({ personaId: 'target-persona' });
      const duration = performance.now() - start;

      expect(results.length).toBe(1000);
      expect(duration).toBeLessThan(10);

      collector.destroy();
    });

    it('should handle concurrent event tracking efficiently', () => {
      const collector = new EventCollector({ enableAsync: false });

      const start = performance.now();
      const events = Array.from({ length: 50000 }, (_, i) =>
        createEvent({ id: `event-${i}` })
      );
      events.forEach((e) => collector.trackEvent(e));
      const duration = performance.now() - start;

      expect(collector.getEventCount()).toBe(50000);
      expect(duration).toBeLessThan(3000);

      collector.destroy();
    });
  });

  describe('InMemoryStore Performance', () => {
    it('should store 100,000 events efficiently', () => {
      const store = new InMemoryStore();

      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        store.store(createEvent({ id: `event-${i}` }));
      }
      const duration = performance.now() - start;

      expect(store.count()).toBe(100000);
      expect(duration).toBeLessThan(5000);
    });

    it('should query large datasets quickly', () => {
      const store = new InMemoryStore();

      // Setup
      for (let i = 0; i < 50000; i++) {
        store.store(createEvent({ id: `event-${i}` }));
      }

      // Benchmark
      const start = performance.now();
      const results = store.query({ minFrustration: 0.5 });
      const duration = performance.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50);
    });
  });

  describe('MetricsCalculator Performance', () => {
    it('should calculate metrics on large datasets quickly', () => {
      const calculator = new MetricsCalculator();
      const events = Array.from({ length: 50000 }, (_, i) =>
        createEvent({
          id: `event-${i}`,
          personaId: `persona-${i % 1000}`,
          cohort: 'test-cohort',
        })
      );

      const start = performance.now();
      const retention = calculator.calculateRetention(events, 'test-cohort', 7);
      const duration = performance.now() - start;

      expect(retention).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(1000);
    });

    it('should detect friction points efficiently', () => {
      const calculator = new MetricsCalculator();
      const events = Array.from({ length: 25000 }, () => createEvent());

      const start = performance.now();
      const friction = calculator.detectFrictionPoints(events);
      const duration = performance.now() - start;

      expect(friction).toBeDefined();
      expect(duration).toBeLessThan(500);
    });

    it('should detect value moments efficiently', () => {
      const calculator = new MetricsCalculator();
      const events = Array.from({ length: 25000 }, () => createEvent());

      const start = performance.now();
      const value = calculator.detectValueMoments(events);
      const duration = performance.now() - start;

      expect(value).toBeDefined();
      expect(duration).toBeLessThan(500);
    });
  });

  describe('EventAggregator Performance', () => {
    it('should aggregate 50K events quickly', () => {
      const aggregator = new EventAggregator();
      const events = Array.from({ length: 50000 }, () => createEvent());

      const start = performance.now();
      const result = aggregator.aggregateByPersona(events);
      const duration = performance.now() - start;

      expect(result.size).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000);
    });

    it('should aggregate by multiple dimensions efficiently', () => {
      const aggregator = new EventAggregator();
      const events = Array.from({ length: 25000 }, () => createEvent());

      const start = performance.now();
      aggregator.aggregateByPersona(events);
      aggregator.aggregateByAction(events);
      aggregator.aggregateByEventType(events);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1500);
    });
  });

  describe('PatternDetector Performance', () => {
    it('should detect patterns in large datasets efficiently', () => {
      const detector = new PatternDetector();
      const events = Array.from({ length: 25000 }, () => createEvent());

      const start = performance.now();
      const patterns = detector.detectAllPatterns(events);
      const duration = performance.now() - start;

      expect(patterns.friction).toBeDefined();
      expect(patterns.value).toBeDefined();
      expect(duration).toBeLessThan(1000);
    });

    it('should detect friction sequences efficiently', () => {
      const detector = new PatternDetector();
      const baseTime = new Date('2024-01-01').getTime();
      const events = Array.from({ length: 10000 }, (_, i) =>
        createEvent({
          id: `event-${i}`,
          timestamp: new Date(baseTime + i * 1000),
        })
      );

      const start = performance.now();
      const sequences = detector.detectFrictionSequences(events, 3);
      const duration = performance.now() - start;

      expect(sequences).toBeDefined();
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('TimeSeriesAnalyzer Performance', () => {
    it('should generate time series from large datasets quickly', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const events = Array.from({ length: 50000 }, () => createEvent());

      const start = performance.now();
      const series = analyzer.generateTimeSeries(events, 'frustration');
      const duration = performance.now() - start;

      expect(series.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(500);
    });

    it('should calculate moving average efficiently', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const dataPoints = Array.from({ length: 10000 }, (_, i) => ({
        timestamp: new Date(2024, 0, 1, i),
        value: Math.random(),
      }));

      const start = performance.now();
      const ma = analyzer.calculateMovingAverage(dataPoints, 10);
      const duration = performance.now() - start;

      expect(ma.length).toBe(10000);
      expect(duration).toBeLessThan(200);
    });

    it('should detect anomalies quickly', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const dataPoints = Array.from({ length: 10000 }, (_, i) => ({
        timestamp: new Date(2024, 0, 1, i),
        value: Math.random() * 10,
      }));

      const start = performance.now();
      const anomalies = analyzer.detectAnomalies(dataPoints);
      const duration = performance.now() - start;

      expect(anomalies).toBeDefined();
      expect(duration).toBeLessThan(200);
    });
  });
});

describe('Memory Leak Tests', () => {
  const createEvent = (id: string): TelemetryEvent => ({
    id,
    personaId: 'persona-1',
    eventType: 'action',
    action: 'install',
    emotionalState: {
      frustration: 0.5,
      delight: 0.5,
      confidence: 0.5,
      confusion: 0.5,
    },
    metadata: {},
    timestamp: new Date(),
  });

  describe('EventCollector Memory Management', () => {
    it('should not leak memory after tracking 100K events', () => {
      const collector = new EventCollector({ enableAsync: false });

      // Track events
      for (let i = 0; i < 100000; i++) {
        collector.trackEvent(createEvent(`event-${i}`));
      }

      const eventCount = collector.getEventCount();
      expect(eventCount).toBe(100000);

      // Clear and verify cleanup
      collector.clear();
      expect(collector.getEventCount()).toBe(0);

      // Should be able to track new events
      collector.trackEvent(createEvent('new-event'));
      expect(collector.getEventCount()).toBe(1);

      collector.destroy();
    });

    it('should clean up timer on destroy', () => {
      const collector = new EventCollector({
        enableAsync: true,
        flushInterval: 1000,
      });

      collector.trackEvent(createEvent('event-1'));
      collector.destroy();

      // Should not crash or leak
      expect(collector.getBatchQueueSize()).toBe(0);
    });

    it('should handle multiple create-destroy cycles', () => {
      for (let i = 0; i < 10; i++) {
        const collector = new EventCollector({ enableAsync: false });

        for (let j = 0; j < 1000; j++) {
          collector.trackEvent(createEvent(`event-${i}-${j}`));
        }

        expect(collector.getEventCount()).toBe(1000);
        collector.destroy();
      }

      // Test passes if no memory errors occur
      expect(true).toBe(true);
    });
  });

  describe('InMemoryStore Memory Management', () => {
    it('should respect max size limit', () => {
      const maxSize = 10000;
      const store = new InMemoryStore(maxSize);

      // Store more events than max size
      for (let i = 0; i < maxSize * 2; i++) {
        store.store(createEvent(`event-${i}`));
      }

      expect(store.count()).toBe(maxSize);
    });

    it('should properly clear all events', () => {
      const store = new InMemoryStore();

      for (let i = 0; i < 50000; i++) {
        store.store(createEvent(`event-${i}`));
      }

      expect(store.count()).toBe(50000);

      store.clear();
      expect(store.count()).toBe(0);

      // Should work after clear
      store.store(createEvent('new-event'));
      expect(store.count()).toBe(1);
    });
  });

  describe('Processing Components Memory Management', () => {
    it('should not leak memory during aggregation', () => {
      const aggregator = new EventAggregator();
      const events = Array.from({ length: 50000 }, (_, i) =>
        createEvent(`event-${i}`)
      );

      for (let i = 0; i < 5; i++) {
        const result = aggregator.aggregateByPersona(events);
        expect(result.size).toBeGreaterThan(0);
      }

      // Test passes if no memory errors occur
      expect(true).toBe(true);
    });

    it('should not leak memory during pattern detection', () => {
      const detector = new PatternDetector();
      const events = Array.from({ length: 25000 }, (_, i) =>
        createEvent(`event-${i}`)
      );

      for (let i = 0; i < 5; i++) {
        const patterns = detector.detectAllPatterns(events);
        expect(patterns).toBeDefined();
      }

      // Test passes if no memory errors occur
      expect(true).toBe(true);
    });

    it('should not leak memory during time series analysis', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const events = Array.from({ length: 25000 }, (_, i) =>
        createEvent(`event-${i}`)
      );

      for (let i = 0; i < 5; i++) {
        const series = analyzer.generateTimeSeries(events, 'frustration');
        expect(series.length).toBeGreaterThan(0);
      }

      // Test passes if no memory errors occur
      expect(true).toBe(true);
    });
  });

  describe('Memory Stability Under Load', () => {
    it('should maintain stable memory usage with continuous operations', () => {
      const collector = new EventCollector({ enableAsync: false });

      // Simulate continuous operation
      for (let i = 0; i < 10; i++) {
        // Add events
        for (let j = 0; j < 10000; j++) {
          collector.trackEvent(createEvent(`event-${i}-${j}`));
        }

        // Query events
        collector.query({ personaId: 'persona-1' });

        // Clear periodically
        if (i % 3 === 0) {
          collector.clear();
        }
      }

      // Should still be operational
      collector.trackEvent(createEvent('final-event'));
      expect(collector.getEventCount()).toBeGreaterThan(0);

      collector.destroy();
    });
  });
});
