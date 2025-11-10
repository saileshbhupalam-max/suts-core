/**
 * Contract Test: Simulation Engine -> Telemetry Layer
 * Validates that simulation events match TelemetryEvent schema
 */

import { describe, it, expect } from '@jest/globals';
import { TelemetryEventSchema } from '../../../packages/core/src/models/index';
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
    state.events.forEach((event) => {
      const result = TelemetryEventSchema.safeParse(event);
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

      expect(event.personaId).toBeDefined();
      expect(typeof event.personaId).toBe('string');

      expect(event.simulationId).toBeDefined();
      expect(typeof event.simulationId).toBe('string');

      expect(event.sessionNumber).toBeDefined();
      expect(typeof event.sessionNumber).toBe('number');

      expect(event.timestamp).toBeDefined();
      expect(typeof event.timestamp).toBe('string');

      expect(event.eventType).toBeDefined();
      expect(typeof event.eventType).toBe('string');

      // Timestamp should be valid ISO string
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
      state.events.forEach((event) => collector.trackEvent({
        ...event,
        timestamp: new Date(event.timestamp),
        action: event.action ?? '',
        emotionalState: event.emotionalState ?? { frustration: 0, confidence: 0, delight: 0, confusion: 0 },
      }));
    }).not.toThrow();

    // Flush events from batch queue to storage
    collector.flush();

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
    state.events.forEach((event) => collector.trackEvent({
      ...event,
      timestamp: new Date(event.timestamp),
      action: event.action ?? '',
      emotionalState: event.emotionalState ?? { frustration: 0, confidence: 0, delight: 0, confusion: 0 },
    }));

    // Flush events from batch queue to storage
    collector.flush();

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

  it('should generate events with valid metadata and emotional state', async () => {
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
      expect(event.metadata).toBeDefined();
      expect(typeof event.metadata).toBe('object');
      expect(event.metadata).not.toBeNull();

      // Optional emotional state should be valid if present
      if (event.emotionalState !== undefined) {
        expect(typeof event.emotionalState).toBe('object');
        if (event.emotionalState.frustration !== undefined) {
          expect(typeof event.emotionalState.frustration).toBe('number');
          expect(event.emotionalState.frustration).toBeGreaterThanOrEqual(0);
          expect(event.emotionalState.frustration).toBeLessThanOrEqual(1);
        }
        if (event.emotionalState.delight !== undefined) {
          expect(typeof event.emotionalState.delight).toBe('number');
          expect(event.emotionalState.delight).toBeGreaterThanOrEqual(0);
          expect(event.emotionalState.delight).toBeLessThanOrEqual(1);
        }
      }
    });
  });
});
