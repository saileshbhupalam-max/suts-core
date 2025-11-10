/**
 * Contract Test: Telemetry -> Analysis Engine
 * Validates that telemetry events can be analyzed
 */

import { describe, it, expect } from '@jest/globals';
import { EventCollector, MetricsCalculator } from '../../../packages/telemetry/src/index';
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
    state.events.forEach((e) => collector.trackEvent({
      ...e,
      timestamp: new Date(e.timestamp),
      action: e.action ?? '',
      emotionalState: e.emotionalState ?? { frustration: 0, confidence: 0, delight: 0, confusion: 0 },
    }));
    // Flush events from batch queue to storage
    collector.flush();
    const events = collector.query({});

    // Should not throw
    const analyzer = new AnalysisEngine();
    expect(() => analyzer.analyzeFriction(events)).not.toThrow();
    expect(() => analyzer.analyzeValue(events)).not.toThrow();
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
    state.events.forEach((e) => collector.trackEvent({
      ...e,
      timestamp: new Date(e.timestamp),
      action: e.action ?? '',
      emotionalState: e.emotionalState ?? { frustration: 0, confidence: 0, delight: 0, confusion: 0 },
    }));
    // Flush events from batch queue to storage
    collector.flush();
    const events = collector.query({});

    const analyzer = new AnalysisEngine();
    const friction = analyzer.analyzeFriction(events);

    // Friction should be an array
    expect(Array.isArray(friction)).toBe(true);

    // Each friction point should have required fields
    friction.forEach((point) => {
      expect(point.location).toBeDefined();
      expect(point.location.action).toBeDefined();

      expect(point.severity).toBeDefined();
      expect(typeof point.severity).toBe('number');
      expect(point.severity).toBeGreaterThanOrEqual(0);
      expect(point.severity).toBeLessThanOrEqual(1);

      expect(point.frequency).toBeDefined();
      expect(typeof point.frequency).toBe('number');

      expect(point.description).toBeDefined();
      expect(typeof point.description).toBe('string');

      expect(point.priority).toBeDefined();
      expect(typeof point.priority).toBe('number');

      expect(point.confidence).toBeDefined();
      expect(typeof point.confidence).toBe('number');
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
    state.events.forEach((e) => collector.trackEvent({
      ...e,
      timestamp: new Date(e.timestamp),
      action: e.action ?? '',
      emotionalState: e.emotionalState ?? { frustration: 0, confidence: 0, delight: 0, confusion: 0 },
    }));
    // Flush events from batch queue to storage
    collector.flush();
    const events = collector.query({});

    const analyzer = new AnalysisEngine();
    const value = analyzer.analyzeValue(events);

    // Value should be an array
    expect(Array.isArray(value)).toBe(true);

    // Each value moment should have required fields
    value.forEach((moment) => {
      expect(moment.action).toBeDefined();
      expect(moment.eventType).toBeDefined();

      expect(moment.delightScore).toBeDefined();
      expect(typeof moment.delightScore).toBe('number');
      expect(moment.delightScore).toBeGreaterThanOrEqual(0);
      expect(moment.delightScore).toBeLessThanOrEqual(1);

      expect(moment.frequency).toBeDefined();
      expect(typeof moment.frequency).toBe('number');

      expect(moment.description).toBeDefined();
      expect(typeof moment.description).toBe('string');

      expect(moment.priority).toBeDefined();
      expect(typeof moment.priority).toBe('number');

      expect(moment.confidence).toBeDefined();
      expect(typeof moment.confidence).toBe('number');
    });
  });

  it('should handle empty event arrays gracefully', () => {
    const analyzer = new AnalysisEngine();

    // Should not throw with empty arrays
    expect(() => analyzer.analyzeFriction([])).not.toThrow();
    expect(() => analyzer.analyzeValue([])).not.toThrow();

    const friction = analyzer.analyzeFriction([]);
    const value = analyzer.analyzeValue([]);

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
    state.events.forEach((e) => collector.trackEvent({
      ...e,
      timestamp: new Date(e.timestamp),
      action: e.action ?? '',
      emotionalState: e.emotionalState ?? { frustration: 0, confidence: 0, delight: 0, confusion: 0 },
    }));
    // Flush events from batch queue to storage
    collector.flush();
    const events = collector.query({});

    // Should not throw when calculating metrics
    const calculator = new MetricsCalculator();

    // MetricsCalculator needs a cohort parameter
    expect(() => {
      calculator.calculateRetention(events, 'test-cohort', 7);
    }).not.toThrow();

    expect(() => {
      calculator.calculateViralCoefficient(events);
    }).not.toThrow();
  });
});
