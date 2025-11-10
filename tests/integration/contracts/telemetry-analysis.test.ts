/**
 * Contract Test: Telemetry -> Analysis Engine
 * Validates that telemetry events can be analyzed
 */

import { describe, it, expect } from '@jest/globals';
import { EventCollector } from '../../../packages/telemetry/src/index';
import { AnalysisEngine } from '../../../packages/analysis/src/index';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { generateMockPersonas } from '../helpers/test-utils';

describe('Contract: Telemetry -> Analysis Engine', () => {
  it('should analyze events from simulation without errors', async () => {
    const personas = generateMockPersonas(3);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 2);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    // Should not throw
    const analyzer = new AnalysisEngine();
    await expect(analyzer.analyzeFriction(events)).resolves.not.toThrow();
    await expect(analyzer.analyzeValue(events)).resolves.not.toThrow();
  });

  it('should produce valid friction analysis results', async () => {
    const personas = generateMockPersonas(3);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 2);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    const analyzer = new AnalysisEngine();
    const friction = await analyzer.analyzeFriction(events);

    // Friction should be an array
    expect(Array.isArray(friction)).toBe(true);

    // Each friction point should have required fields
    friction.forEach((point) => {
      expect(point.id).toBeDefined();
      expect(point.type).toBeDefined();
      expect(point.severity).toBeDefined();
      expect(typeof point.severity).toBe('number');
      expect(point.severity).toBeGreaterThanOrEqual(0);
      expect(point.severity).toBeLessThanOrEqual(1);

      expect(point.frequency).toBeDefined();
      expect(typeof point.frequency).toBe('number');

      expect(point.description).toBeDefined();
      expect(typeof point.description).toBe('string');
    });
  });

  it('should produce valid value analysis results', async () => {
    const personas = generateMockPersonas(3);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 2);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    const analyzer = new AnalysisEngine();
    const value = await analyzer.analyzeValue(events);

    // Value should be an array
    expect(Array.isArray(value)).toBe(true);

    // Each value moment should have required fields
    value.forEach((moment) => {
      expect(moment.id).toBeDefined();
      expect(moment.type).toBeDefined();
      expect(moment.impact).toBeDefined();
      expect(typeof moment.impact).toBe('number');
      expect(moment.impact).toBeGreaterThanOrEqual(0);
      expect(moment.impact).toBeLessThanOrEqual(1);

      expect(moment.frequency).toBeDefined();
      expect(typeof moment.frequency).toBe('number');

      expect(moment.description).toBeDefined();
      expect(typeof moment.description).toBe('string');
    });
  });

  it('should handle empty event arrays gracefully', async () => {
    const analyzer = new AnalysisEngine();

    // Should not throw with empty arrays
    await expect(analyzer.analyzeFriction([])).resolves.not.toThrow();
    await expect(analyzer.analyzeValue([])).resolves.not.toThrow();

    const friction = await analyzer.analyzeFriction([]);
    const value = await analyzer.analyzeValue([]);

    expect(Array.isArray(friction)).toBe(true);
    expect(Array.isArray(value)).toBe(true);
  });

  it('should work with MetricsCalculator', async () => {
    const personas = generateMockPersonas(3);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 2);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent(e));

    // Should not throw when calculating metrics
    const { MetricsCalculator } = require('../../../packages/telemetry/src/index');
    const calculator = new MetricsCalculator();

    expect(() => {
      calculator.calculateRetention(state.events);
    }).not.toThrow();
  });
});
