/**
 * Stress Test: High-Volume Telemetry
 * Tests performance with large numbers of events
 */

import { describe, it, expect } from '@jest/globals';
import { EventCollector } from '../../../packages/telemetry/src/index';
import { generateMockEvents, measureTime } from '../helpers/test-utils';

describe('Stress: High-Volume Telemetry', () => {
  it('should handle 10K events efficiently', async () => {
    const collector = new EventCollector();
    const events = generateMockEvents(10000);

    const [, trackingDuration] = await measureTime(async () => {
      events.forEach((e) => collector.trackEvent(e));
      return Promise.resolve();
    });

    expect(collector.query({}).length).toBe(10000);
    expect(trackingDuration).toBeLessThan(2000); // <2s for 10K events

    console.log(`Tracked 10K events in ${trackingDuration}ms`);
    console.log(`Throughput: ${(10000 / (trackingDuration / 1000)).toFixed(0)} events/second`);
  });

  it('should handle 100K events efficiently', async () => {
    const collector = new EventCollector();
    const events = generateMockEvents(100000);

    const [, trackingDuration] = await measureTime(async () => {
      events.forEach((e) => collector.trackEvent(e));
      return Promise.resolve();
    });

    expect(collector.query({}).length).toBe(100000);
    expect(trackingDuration).toBeLessThan(10000); // <10s for 100K events

    console.log(`Tracked 100K events in ${(trackingDuration / 1000).toFixed(1)}s`);
    console.log(`Throughput: ${(100000 / (trackingDuration / 1000)).toFixed(0)} events/second`);
  });

  it('should query 100K events quickly', async () => {
    const collector = new EventCollector();
    const events = generateMockEvents(100000);
    events.forEach((e) => collector.trackEvent(e));

    // Query all events
    const [allEvents, queryAllDuration] = await measureTime(async () => {
      return Promise.resolve(collector.query({}));
    });

    expect(allEvents.length).toBe(100000);
    expect(queryAllDuration).toBeLessThan(500); // <500ms query

    console.log(`Queried all 100K events in ${queryAllDuration}ms`);

    // Query by persona
    const [personaEvents, queryPersonaDuration] = await measureTime(async () => {
      return Promise.resolve(collector.query({ personaId: 'persona-0' }));
    });

    expect(personaEvents.length).toBeGreaterThan(0);
    expect(queryPersonaDuration).toBeLessThan(200); // <200ms for filtered query

    console.log(`Queried persona events in ${queryPersonaDuration}ms (${personaEvents.length} events)`);
  });

  it('should handle incremental event tracking', async () => {
    const collector = new EventCollector();
    const batchSize = 1000;
    const batches = 50; // 50K total events

    const durations: number[] = [];

    for (let i = 0; i < batches; i++) {
      const events = generateMockEvents(batchSize);

      const [, duration] = await measureTime(async () => {
        events.forEach((e) => collector.trackEvent(e));
        return Promise.resolve();
      });

      durations.push(duration);

      if (i % 10 === 0) {
        console.log(`Batch ${i + 1}/${batches}: ${duration}ms`);
      }
    }

    expect(collector.query({}).length).toBe(batchSize * batches);

    // Check for performance degradation
    const firstBatchAvg = durations.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const lastBatchAvg = durations.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const degradation = lastBatchAvg / firstBatchAvg;

    console.log(`First batch avg: ${firstBatchAvg.toFixed(1)}ms`);
    console.log(`Last batch avg: ${lastBatchAvg.toFixed(1)}ms`);
    console.log(`Degradation: ${(degradation * 100).toFixed(1)}%`);

    // Should not degrade by more than 2x
    expect(degradation).toBeLessThan(2);
  });

  it('should handle complex queries on large datasets', async () => {
    const collector = new EventCollector();
    const events = generateMockEvents(50000);
    events.forEach((e) => collector.trackEvent(e));

    // Query by multiple criteria
    const [results1, duration1] = await measureTime(async () => {
      return Promise.resolve(
        collector.query({
          personaId: 'persona-0',
        })
      );
    });

    expect(results1.length).toBeGreaterThan(0);
    expect(duration1).toBeLessThan(200);

    console.log(`Complex query 1: ${duration1}ms (${results1.length} results)`);

    // Query by action
    const [results2, duration2] = await measureTime(async () => {
      return Promise.resolve(
        collector.query({
          action: 'test_action_1',
        })
      );
    });

    expect(results2.length).toBeGreaterThan(0);
    expect(duration2).toBeLessThan(200);

    console.log(`Complex query 2: ${duration2}ms (${results2.length} results)`);
  });

  it('should calculate metrics on large event sets efficiently', async () => {
    const collector = new EventCollector();
    const events = generateMockEvents(50000);
    events.forEach((e) => collector.trackEvent(e));

    const { MetricsCalculator } = require('../../../packages/telemetry/src/index');
    const calculator = new MetricsCalculator();

    const [metrics, duration] = await measureTime(async () => {
      return Promise.resolve(calculator.calculateRetention(events));
    });

    expect(metrics).toBeDefined();
    expect(duration).toBeLessThan(2000); // <2s for metric calculation

    console.log(`Calculated retention metrics on 50K events in ${duration}ms`);
    console.log(`Retention: D1=${metrics.day1.toFixed(2)}, D7=${metrics.day7.toFixed(2)}`);
  });

  it('should handle concurrent event tracking', async () => {
    const collector = new EventCollector();

    // Track events from multiple "threads" concurrently
    const concurrent = Array(10)
      .fill(null)
      .map((_, i) => {
        const events = generateMockEvents(1000);
        return Promise.resolve(events.forEach((e) => collector.trackEvent(e)));
      });

    await Promise.all(concurrent);

    expect(collector.query({}).length).toBe(10000);

    console.log('Concurrent event tracking: 10K events from 10 sources');
  });

  it('should maintain memory efficiency with large event volumes', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    const collector = new EventCollector();
    const events = generateMockEvents(100000);

    events.forEach((e) => collector.trackEvent(e));

    const afterTrackingMemory = process.memoryUsage().heapUsed;
    const memoryUsed = afterTrackingMemory - initialMemory;
    const bytesPerEvent = memoryUsed / 100000;

    console.log(`Memory usage for 100K events:`);
    console.log(`  Total: ${(memoryUsed / 1024 / 1024).toFixed(1)}MB`);
    console.log(`  Per event: ${bytesPerEvent.toFixed(0)} bytes`);

    // Should not use more than 100MB for 100K events
    expect(memoryUsed).toBeLessThan(100 * 1024 * 1024);
  });

  it('should handle bulk operations efficiently', async () => {
    const collector = new EventCollector();
    const events = generateMockEvents(20000);

    // Track in bulk
    const [, bulkDuration] = await measureTime(async () => {
      events.forEach((e) => collector.trackEvent(e));
      return Promise.resolve();
    });

    console.log(`Bulk tracking: ${bulkDuration}ms for 20K events`);

    // Query in bulk
    const [allEvents, bulkQueryDuration] = await measureTime(async () => {
      return Promise.resolve(collector.query({}));
    });

    expect(allEvents.length).toBe(20000);
    console.log(`Bulk query: ${bulkQueryDuration}ms for 20K events`);

    // Both should be fast
    expect(bulkDuration).toBeLessThan(3000);
    expect(bulkQueryDuration).toBeLessThan(500);
  });
});
