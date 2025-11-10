/**
 * Stress Test: High-Volume Telemetry
 * Tests performance with large numbers of events
 */

import { describe, it, expect } from '@jest/globals';
import { EventCollector, MetricsCalculator } from '../../../packages/telemetry/src/index';
import { generateMockEvents } from '../helpers/test-utils';

describe('Stress: High-Volume Telemetry', () => {
  it('should handle 10K events efficiently', () => {
    const collector = new EventCollector();
    const events = generateMockEvents(10000);

    const start = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    events.forEach((e) => collector.trackEvent(e));
    const trackingDuration = Date.now() - start;

    // Flush events from batch queue to storage
    collector.flush();
    expect(collector.query({}).length).toBe(10000);
    expect(trackingDuration).toBeLessThan(2000); // <2s for 10K events

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log(`Tracked 10K events in ${trackingDuration}ms`);
      console.log(`Throughput: ${(10000 / (trackingDuration / 1000)).toFixed(0)} events/second`);
    }
  });

  it('should handle 100K events efficiently', () => {
    const collector = new EventCollector();
    const events = generateMockEvents(100000);

    const start = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    events.forEach((e) => collector.trackEvent(e));
    const trackingDuration = Date.now() - start;

    // Flush events from batch queue to storage
    collector.flush();
    expect(collector.query({}).length).toBe(100000);
    expect(trackingDuration).toBeLessThan(10000); // <10s for 100K events

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log(`Tracked 100K events in ${(trackingDuration / 1000).toFixed(1)}s`);
      console.log(`Throughput: ${(100000 / (trackingDuration / 1000)).toFixed(0)} events/second`);
    }
  });

  it('should query 100K events quickly', () => {
    const collector = new EventCollector();
    const events = generateMockEvents(100000);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    events.forEach((e) => collector.trackEvent(e));
    // Flush events from batch queue to storage
    collector.flush();

    // Query all events
    const start1 = Date.now();
    const allEvents = collector.query({});
    const queryAllDuration = Date.now() - start1;

    expect(allEvents.length).toBe(100000);
    expect(queryAllDuration).toBeLessThan(500); // <500ms query

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log(`Queried all 100K events in ${queryAllDuration}ms`);
    }

    // Query by persona
    const start2 = Date.now();
    const personaEvents = collector.query({ personaId: 'persona-0' });
    const queryPersonaDuration = Date.now() - start2;

    expect(personaEvents.length).toBeGreaterThan(0);
    expect(queryPersonaDuration).toBeLessThan(200); // <200ms for filtered query

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log(
        `Queried persona events in ${queryPersonaDuration}ms (${personaEvents.length} events)`
      );
    }
  });

  it('should handle incremental event tracking', () => {
    const collector = new EventCollector();
    const batchSize = 1000;
    const batches = 50; // 50K total events

    const durations: number[] = [];

    for (let i = 0; i < batches; i++) {
      const events = generateMockEvents(batchSize);

      const start = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      events.forEach((e) => collector.trackEvent(e));
      const duration = Date.now() - start;

      durations.push(duration);

      if (process.env['VERBOSE_TESTS'] === 'true' && i % 10 === 0) {
        console.log(`Batch ${i + 1}/${batches}: ${duration}ms`);
      }
    }

    // Flush events from batch queue to storage
    collector.flush();
    expect(collector.query({}).length).toBe(batchSize * batches);

    // Check for performance degradation
    const firstBatchAvg = durations.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const lastBatchAvg = durations.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const degradation = lastBatchAvg / firstBatchAvg;

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log(`First batch avg: ${firstBatchAvg.toFixed(1)}ms`);
      console.log(`Last batch avg: ${lastBatchAvg.toFixed(1)}ms`);
      console.log(`Degradation: ${(degradation * 100).toFixed(1)}%`);
    }
    // Skip degradation check if timing precision is insufficient
    if (firstBatchAvg < 1) {
      // eslint-disable-next-line no-console
      console.warn('Skipping performance degradation check: timing precision insufficient');
      return;
    }

    // Should not degrade by more than 2x
    expect(degradation).toBeLessThan(2);
  });

  it('should handle complex queries on large datasets', () => {
    const collector = new EventCollector();
    const events = generateMockEvents(50000);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    events.forEach((e) => collector.trackEvent(e));
    // Flush events from batch queue to storage
    collector.flush();

    // Query by multiple criteria
    const start1 = Date.now();
    const results1 = collector.query({
      personaId: 'persona-0',
    });
    const duration1 = Date.now() - start1;

    expect(results1.length).toBeGreaterThan(0);
    expect(duration1).toBeLessThan(200);

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log(`Complex query 1: ${duration1}ms (${results1.length} results)`);
    }

    // Query by action
    const start2 = Date.now();
    const results2 = collector.query({
      action: 'test_action_1',
    });
    const duration2 = Date.now() - start2;

    expect(results2.length).toBeGreaterThan(0);
    expect(duration2).toBeLessThan(200);

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log(`Complex query 2: ${duration2}ms (${results2.length} results)`);
    }
  });

  it('should calculate metrics on large event sets efficiently', () => {
    const collector = new EventCollector();
    const events = generateMockEvents(50000);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    events.forEach((e) => collector.trackEvent(e));
    // Flush events from batch queue to storage
    collector.flush();

    const calculator = new MetricsCalculator();

    const start = Date.now();
    const retentionD7 = calculator.calculateRetention(events, 'cohort-a', 7);
    const retentionD14 = calculator.calculateRetention(events, 'cohort-a', 14);
    const duration = Date.now() - start;

    expect(retentionD7).toBeDefined();
    expect(typeof retentionD7).toBe('number');
    expect(duration).toBeLessThan(2000); // <2s for metric calculation

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log(`Calculated retention metrics on 50K events in ${duration}ms`);
      console.log(`Retention: D7=${retentionD7.toFixed(2)}%, D14=${retentionD14.toFixed(2)}%`);
    }
  });

  it('should handle concurrent event tracking', async () => {
    const collector = new EventCollector();

    // Track events from multiple "threads" concurrently
    const concurrent = Array(10)
      .fill(null)
      .map(() => {
        const events = generateMockEvents(1000);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return Promise.resolve(events.forEach((e) => collector.trackEvent(e)));
      });

    await Promise.all(concurrent);

    // Flush events from batch queue to storage
    collector.flush();
    expect(collector.query({}).length).toBe(10000);

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log('Concurrent event tracking: 10K events from 10 sources');
    }
  });

  it('should maintain memory efficiency with large event volumes', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    const collector = new EventCollector();
    const events = generateMockEvents(100000);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    events.forEach((e) => collector.trackEvent(e));
    // Flush events from batch queue to storage
    collector.flush();

    const afterTrackingMemory = process.memoryUsage().heapUsed;
    const memoryUsed = afterTrackingMemory - initialMemory;
    const bytesPerEvent = memoryUsed / 100000;

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log(`Memory usage for 100K events:`);
      console.log(`  Total: ${(memoryUsed / 1024 / 1024).toFixed(1)}MB`);
      console.log(`  Per event: ${bytesPerEvent.toFixed(0)} bytes`);
    }

    // Should not use more than 100MB for 100K events
    expect(memoryUsed).toBeLessThan(100 * 1024 * 1024);
  });

  it('should handle bulk operations efficiently', () => {
    const collector = new EventCollector();
    const events = generateMockEvents(20000);

    // Track in bulk
    const start1 = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    events.forEach((e) => collector.trackEvent(e));
    const bulkDuration = Date.now() - start1;

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log(`Bulk tracking: ${bulkDuration}ms for 20K events`);
    }

    // Flush events from batch queue to storage
    collector.flush();

    // Query in bulk
    const start2 = Date.now();
    const allEvents = collector.query({});
    const bulkQueryDuration = Date.now() - start2;

    expect(allEvents.length).toBe(20000);

    if (process.env['VERBOSE_TESTS'] === 'true') {
      console.log(`Bulk query: ${bulkQueryDuration}ms for 20K events`);
    }

    // Both should be fast
    expect(bulkDuration).toBeLessThan(3000);
    expect(bulkQueryDuration).toBeLessThan(500);
  });
});
