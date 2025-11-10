/**
 * Stress Test: Concurrent Simulations
 * Tests running multiple simulations in parallel
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { generateMockPersonas, cleanupTestOutput, measureTime } from '../helpers/test-utils';

describe('Stress: Concurrent Simulations', () => {
  beforeEach(() => {
    cleanupTestOutput();
  });

  afterEach(() => {
    cleanupTestOutput();
  });

  it(
    'should handle 5 simulations concurrently',
    async () => {
      const simulations = Array(5)
        .fill(null)
        .map((_, i) => {
          const personas = generateMockPersonas(10);
          const adapter = new VibeAtlasAdapter();
          const productState = adapter.getInitialState();

          const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

          return {
            id: i,
            promise: engine.run(personas, productState, 3),
          };
        });

      const [results, duration] = await measureTime(async () => {
        return await Promise.all(simulations.map((s) => s.promise));
      });

      // Verify all completed
      expect(results).toHaveLength(5);
      results.forEach((state, i) => {
        expect(state.personas).toHaveLength(10);
        expect(state.events.length).toBeGreaterThan(0);
        if (process.env['VERBOSE_TESTS'] === 'true') {
          console.log(`Simulation ${i + 1}: ${state.events.length} events`);
        }
      });

      if (process.env['VERBOSE_TESTS'] === 'true') {
        console.log(`5 concurrent simulations completed in ${(duration / 1000).toFixed(1)}s`);
      }
      expect(duration).toBeLessThan(120000); // <2 minutes
    },
    150000
  );

  it(
    'should handle 10 lightweight simulations concurrently',
    async () => {
      const simulations = Array(10)
        .fill(null)
        .map(() => {
          const personas = generateMockPersonas(5);
          const adapter = new VibeAtlasAdapter();
          const productState = adapter.getInitialState();

          const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

          return engine.run(personas, productState, 2);
        });

      const [results, duration] = await measureTime(async () => {
        return await Promise.all(simulations);
      });

      expect(results).toHaveLength(10);
      results.forEach((state) => {
        expect(state.personas).toHaveLength(5);
        expect(state.events.length).toBeGreaterThan(0);
      });

      const totalEvents = results.reduce((sum, state) => sum + state.events.length, 0);

      if (process.env['VERBOSE_TESTS'] === 'true') {
        console.log(`10 concurrent lightweight simulations:`);
        console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);
        console.log(`  Total events: ${totalEvents}`);
      }

      expect(duration).toBeLessThan(90000); // <1.5 minutes
    },
    120000
  );

  it(
    'should maintain isolation between concurrent simulations',
    async () => {
      const simulations = Array(5)
        .fill(null)
        .map((_, i) => {
          // Each simulation uses different number of personas
          const personaCount = 5 + i * 2;
          const personas = generateMockPersonas(personaCount);
          const adapter = new VibeAtlasAdapter();
          const productState = adapter.getInitialState();

          const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 8,
    });

          return {
            expectedPersonas: personaCount,
            promise: engine.run(personas, productState, 2),
          };
        });

      const results = await Promise.all(simulations.map((s) => s.promise));

      // Verify each simulation maintained its own state
      results.forEach((state, i) => {
        const expected = simulations[i]!.expectedPersonas;
        expect(state.personas).toHaveLength(expected);
        if (process.env['VERBOSE_TESTS'] === 'true') {
          console.log(`Simulation ${i + 1}: ${state.personas.length} personas (expected ${expected})`);
        }
      });
    },
    120000
  );

  it(
    'should handle mixed workload (concurrent + sequential)',
    async () => {
      // Run 3 simulations concurrently
      const concurrent = Array(3)
        .fill(null)
        .map(() => {
          const personas = generateMockPersonas(8);
          const adapter = new VibeAtlasAdapter();
          const productState = adapter.getInitialState();

          const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 8,
    });

          return engine.run(personas, productState, 3);
        });

      const concurrentResults = await Promise.all(concurrent);

      // Then run 2 more sequentially
      const sequential = [];
      for (let i = 0; i < 2; i++) {
        const personas = generateMockPersonas(8);
        const adapter = new VibeAtlasAdapter();
        const productState = adapter.getInitialState();

        const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 8,
    });

        const result = await engine.run(personas, productState, 3);

        sequential.push(result);
      }

      // Verify all completed
      expect(concurrentResults).toHaveLength(3);
      expect(sequential).toHaveLength(2);

      const allResults = [...concurrentResults, ...sequential];
      allResults.forEach((state) => {
        expect(state.personas).toHaveLength(8);
        expect(state.events.length).toBeGreaterThan(0);
      });

      if (process.env['VERBOSE_TESTS'] === 'true') {
        console.log('Mixed workload completed successfully');
      }
    },
    150000
  );

  it(
    'should not degrade performance with concurrent load',
    async () => {
      // Run baseline single simulation
      const baselinePersonas = generateMockPersonas(10);
      const baselineAdapter = new VibeAtlasAdapter();
      const baselineState = baselineAdapter.getInitialState();

      const baselineEngine = new SimulationEngine({
        seed: 12345,
        batchSize: 10,
        maxActionsPerDay: 10,
      });

      const [baselineResult, baselineDuration] = await measureTime(async () => {
        return await baselineEngine.run(baselinePersonas, baselineState, 3);
      });

      // Verify simulation actually ran
      expect(baselineResult).toBeDefined();
      expect(baselineResult.events).toBeDefined();
      expect(baselineResult.events.length).toBeGreaterThan(0);

      if (process.env['VERBOSE_TESTS'] === 'true') {
        console.log(`Baseline (single): ${(baselineDuration / 1000).toFixed(1)}s, events: ${baselineResult.events.length}`);
      }

      // Run 5 concurrent simulations - create and execute inside measureTime
      const [, concurrentDuration] = await measureTime(async () => {
        const concurrent = Array(5)
          .fill(null)
          .map(() => {
            const personas = generateMockPersonas(10);
            const adapter = new VibeAtlasAdapter();
            const productState = adapter.getInitialState();

            const engine = new SimulationEngine({
              seed: 12345,
              batchSize: 10,
              maxActionsPerDay: 10,
            });

            return engine.run(personas, productState, 3);
          });

        return await Promise.all(concurrent);
      });

      if (process.env['VERBOSE_TESTS'] === 'true') {
        console.log(`Concurrent (5x): ${(concurrentDuration / 1000).toFixed(1)}s`);
      }

      // Skip performance check if timing precision is insufficient (< 1ms)
      // This can happen in certain test environments where performance.now() is mocked
      if (baselineDuration < 1 || concurrentDuration < 1) {
        // eslint-disable-next-line no-console
        console.warn('Skipping performance degradation check: timing precision insufficient');
        return;
      }

      // Concurrent should not be more than 3x slower per simulation
      const avgConcurrentTime = concurrentDuration / 5;
      const degradation = avgConcurrentTime / baselineDuration;

      if (process.env['VERBOSE_TESTS'] === 'true') {
        console.log(`Performance degradation: ${(degradation * 100).toFixed(1)}%`);
      }

      expect(degradation).toBeLessThan(3);
    },
    180000
  );
});
