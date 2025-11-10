/**
 * Contract Test: Simulation Engine -> Telemetry Layer
 * Validates that simulation events match TelemetryEvent schema
 */

import { describe, it, expect } from '@jest/globals';
import { TelemetryEventSchema } from '@core/models';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { EventCollector } from '../../../packages/telemetry/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { generateMockPersonas } from '../helpers/test-utils';

describe('Contract: Simulation Engine -> Telemetry Layer', () => {
  it('should generate events that match TelemetryEvent schema', async () => {
    const personas = generateMockPersonas(2);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

    const state = await engine.run(personas, productState, 1);

    // Validate each event against schema
    state.events.forEach((event, index) => {
      const result = TelemetryEventSchema.safeParse(event);

      if (!result.success) {
        console.error(`Event ${index} validation failed:`, result.error.errors);
        console.error('Event data:', event);
      }

      expect(result.success).toBe(true);
    });
  });

  it('should generate events with required fields', async () => {
    const personas = generateMockPersonas(2);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

    const state = await engine.run(personas, productState, 1);

    state.events.forEach((event) => {
      // Required fields
      expect(event.id).toBeDefined();
      expect(typeof event.id).toBe('string');
      expect(event.id.length).toBeGreaterThan(0);

      expect(event.action).toBeDefined();
      expect(typeof event.action).toBe('string');

      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe('string');

      expect(event.personaId).toBeDefined();
      expect(typeof event.personaId).toBe('string');

      // Timestamp should be valid ISO string
      expect(() => new Date(event.timestamp)).not.toThrow();
      const date = new Date(event.timestamp);
      expect(date.toISOString()).toBe(event.timestamp);
    });
  });

  it('should work with EventCollector without errors', async () => {
    const personas = generateMockPersonas(2);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

    const state = await engine.run(personas, productState, 1);

    // Should not throw when tracking events
    const collector = new EventCollector();
    expect(() => {
      state.events.forEach((event) => collector.trackEvent(event));
    }).not.toThrow();

    // Should be able to query events
    const events = collector.query({});
    expect(events.length).toBe(state.events.length);
  });

  it('should generate events queryable by EventCollector', async () => {
    const personas = generateMockPersonas(3);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

    const state = await engine.run(personas, productState, 1);

    const collector = new EventCollector();
    state.events.forEach((event) => collector.trackEvent(event));

    // Query by persona
    const firstPersonaId = personas[0]!.id;
    const personaEvents = collector.query({ personaId: firstPersonaId });
    expect(personaEvents.length).toBeGreaterThan(0);
    personaEvents.forEach((event) => {
      expect(event.personaId).toBe(firstPersonaId);
    });

    // Query all events
    const allEvents = collector.query({});
    expect(allEvents.length).toBe(state.events.length);
  });

  it('should generate events with valid metadata', async () => {
    const personas = generateMockPersonas(2);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

    const state = await engine.run(personas, productState, 1);

    state.events.forEach((event) => {
      // Metadata should be an object
      if (event.metadata !== undefined) {
        expect(typeof event.metadata).toBe('object');
        expect(event.metadata).not.toBeNull();
      }

      // Optional numeric fields should be valid if present
      if (event.duration !== undefined) {
        expect(typeof event.duration).toBe('number');
        expect(event.duration).toBeGreaterThanOrEqual(0);
      }

      if (event.emotionalImpact !== undefined) {
        expect(typeof event.emotionalImpact).toBe('number');
      }
    });
  });
});
