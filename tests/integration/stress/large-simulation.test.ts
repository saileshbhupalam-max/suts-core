/**
 * Stress Test: Large Simulation
 * Tests performance with large number of personas and days
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { generateMockPersonas, cleanupTestOutput, measureTime } from '../helpers/test-utils';

describe('Stress: Large Simulation', () => {
  beforeEach(() => {
    cleanupTestOutput();
  });

  afterEach(() => {
    cleanupTestOutput();
  });

  it(
    'should handle 50 personas for 7 days in reasonable time',
    async () => {
      const personas = generateMockPersonas(50);
      const adapter = new VibeAtlasAdapter();
      const productState = adapter.getInitialState();

      const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

      const [state, duration] = await measureTime(async () => {
        return await engine.run(personas, productState, 7);
      });

      // Verify results
      expect(state.personas).toHaveLength(50);
      expect(state.events.length).toBeGreaterThan(50);

      // Verify performance - should complete in under 2 minutes
      expect(duration).toBeLessThan(120000);

      // Performance logging for stress tests
      if (process.env['VERBOSE_TESTS'] === 'true') {
        console.log(`Large simulation (50 personas, 7 days):`);
        console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);
        console.log(`  Events: ${state.events.length}`);
        console.log(`  Events/second: ${(state.events.length / (duration / 1000)).toFixed(1)}`);
      }
    },
    150000
  ); // 2.5min timeout

  it(
    'should handle 100 personas for 3 days',
    async () => {
      const personas = generateMockPersonas(100);
      const adapter = new VibeAtlasAdapter();
      const productState = adapter.getInitialState();

      const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 8,
    });

      const [state, duration] = await measureTime(async () => {
        return await engine.run(personas, productState, 3);
      });

      expect(state.personas).toHaveLength(100);
      expect(state.events.length).toBeGreaterThan(100);
      expect(duration).toBeLessThan(120000); // <2 minutes

      if (process.env['VERBOSE_TESTS'] === 'true') {
        console.log(`Very large simulation (100 personas, 3 days):`);
        console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);
        console.log(`  Events: ${state.events.length}`);
        console.log(`  Events/second: ${(state.events.length / (duration / 1000)).toFixed(1)}`);
      }
    },
    150000
  );

  it(
    'should not leak memory with multiple large simulations',
    async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Run multiple simulations
      for (let i = 0; i < 5; i++) {
        const personas = generateMockPersonas(30);
        const adapter = new VibeAtlasAdapter();
        const productState = adapter.getInitialState();

        const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 8,
    });

        await engine.run(personas, productState, 2);

        if (process.env['VERBOSE_TESTS'] === 'true') {
          console.log(`Completed simulation ${i + 1}/5`);
        }
      }

      // Force garbage collection if available
      if (global.gc !== null && global.gc !== undefined) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const growth = finalMemory - initialMemory;
      const growthMB = growth / 1024 / 1024;

      if (process.env['VERBOSE_TESTS'] === 'true') {
        console.log(`Memory growth: ${growthMB.toFixed(1)}MB`);
      }

      // Should not grow by more than 100MB
      expect(growth).toBeLessThan(100 * 1024 * 1024);
    },
    180000
  ); // 3min timeout

  it(
    'should maintain performance consistency',
    async () => {
      const durations: number[] = [];

      // Run simulation 3 times
      for (let i = 0; i < 3; i++) {
        const personas = generateMockPersonas(20);
        const adapter = new VibeAtlasAdapter();
        const productState = adapter.getInitialState();

        const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

        const [, duration] = await measureTime(async () => {
          return await engine.run(personas, productState, 5);
        });

        durations.push(duration);
        if (process.env['VERBOSE_TESTS'] === 'true') {
          console.log(`Run ${i + 1}: ${(duration / 1000).toFixed(1)}s`);
        }
      }

      // Calculate variance
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

      // Skip consistency check if timing precision is insufficient
      if (avg < 1) {
        // eslint-disable-next-line no-console
        console.warn('Skipping performance consistency check: timing precision insufficient');
        return;
      }

      const variance =
        durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avg;

      if (process.env['VERBOSE_TESTS'] === 'true') {
        console.log(`Average duration: ${(avg / 1000).toFixed(1)}s`);
        console.log(`Standard deviation: ${(stdDev / 1000).toFixed(1)}s`);
        console.log(`Coefficient of variation: ${(coefficientOfVariation * 100).toFixed(1)}%`);
      }

      // Performance should be consistent (CV < 20%)
      expect(coefficientOfVariation).toBeLessThan(0.2);
    },
    180000
  );

  it(
    'should handle long-running simulations',
    async () => {
      const personas = generateMockPersonas(10);
      const adapter = new VibeAtlasAdapter();
      const productState = adapter.getInitialState();

      const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 15,
    });

      const [state, duration] = await measureTime(async () => {
        return await engine.run(personas, productState, 30); // Full month
      });

      expect(state.personas).toHaveLength(10);
      expect(state.events.length).toBeGreaterThan(100);
      expect(duration).toBeLessThan(180000); // <3 minutes

      if (process.env['VERBOSE_TESTS'] === 'true') {
        console.log(`Long-running simulation (10 personas, 30 days):`);
        console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);
        console.log(`  Events: ${state.events.length}`);
      }
    },
    200000
  ); // 3.3min timeout
});
