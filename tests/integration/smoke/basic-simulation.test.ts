/**
 * Smoke Test: Basic Simulation
 * Verifies minimal simulation completes quickly
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { generateMockPersonas, cleanupTestOutput, measureTime } from '../helpers/test-utils';

describe('Smoke: Basic Simulation', () => {
  beforeEach(() => {
    cleanupTestOutput();
  });

  afterEach(() => {
    cleanupTestOutput();
  });

  it('should complete minimal simulation in <10 seconds', async () => {
    // Minimal simulation: 3 personas, 1 day
    const personas = generateMockPersonas(3);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const [state, duration] = await measureTime(async () => {
      return await engine.run(personas, productState, 1);
    });

    // Verify results
    expect(state.personas).toHaveLength(3);
    expect(state.events.length).toBeGreaterThan(0);

    // Verify performance
    expect(duration).toBeLessThan(10000); // <10 seconds
  }, 15000); // 15s timeout for safety

  it('should handle single persona simulation', async () => {
    const personas = generateMockPersonas(1);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

    const state = await engine.run(personas, productState, 1);

    expect(state.personas).toHaveLength(1);
    expect(state.events.length).toBeGreaterThan(0);
  });

  it('should generate valid telemetry events', async () => {
    const personas = generateMockPersonas(2);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

    const state = await engine.run(personas, productState, 1);

    // Verify event structure - required fields
    state.events.forEach((event) => {
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.personaId).toBeDefined();
      expect(event.simulationId).toBeDefined();
      expect(event.sessionNumber).toBeDefined();
      expect(event.eventType).toBeDefined();

      // Verify timestamp is valid ISO string
      expect(() => new Date(event.timestamp)).not.toThrow();
      expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
    });
  });

  it('should track persona state changes', async () => {
    const personas = generateMockPersonas(2);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

    const state = await engine.run(personas, productState, 1);

    // Each persona should have state tracked
    expect(state.personas).toHaveLength(2);
    state.personas.forEach((persona) => {
      expect(persona.personaId).toBeDefined();
      expect(persona.finalState).toBeDefined();
    });
  });
});
