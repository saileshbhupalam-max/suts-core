/**
 * Contract Test: Analysis -> Decision System
 * Validates that analysis results can be used by decision system
 */

import { describe, it, expect } from '@jest/globals';
import { AnalysisEngine } from '../../../packages/analysis/src/index';
import { DecisionSystem } from '../../../packages/decision/src/index';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { EventCollector } from '../../../packages/telemetry/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { generateMockPersonas } from '../helpers/test-utils';

describe('Contract: Analysis -> Decision System', () => {
  it('should prioritize friction and value results without errors', async () => {
    const personas = generateMockPersonas(5);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    const analyzer = new AnalysisEngine();
    const friction = await analyzer.analyzeFriction(events);
    const value = await analyzer.analyzeValue(events);

    // Should not throw
    const decisionSystem = new DecisionSystem();
    const combined = [...friction, ...value];
    await expect(decisionSystem.prioritize(combined)).resolves.not.toThrow();
  });

  it('should produce prioritized insights with valid structure', async () => {
    const personas = generateMockPersonas(5);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    const analyzer = new AnalysisEngine();
    const friction = await analyzer.analyzeFriction(events);
    const value = await analyzer.analyzeValue(events);

    const decisionSystem = new DecisionSystem();
    const insights = await decisionSystem.prioritize([...friction, ...value]);

    // Insights should be an array
    expect(Array.isArray(insights)).toBe(true);

    // Each insight should have priority score
    insights.forEach((insight) => {
      expect(insight.priority).toBeDefined();
      expect(typeof insight.priority).toBe('number');
      expect(insight.priority).toBeGreaterThanOrEqual(0);
      expect(insight.priority).toBeLessThanOrEqual(1);
    });

    // Should be sorted by priority (descending)
    for (let i = 1; i < insights.length; i++) {
      expect(insights[i]!.priority).toBeLessThanOrEqual(insights[i - 1]!.priority);
    }
  });

  it('should make go/no-go decisions from metrics', async () => {
    const personas = generateMockPersonas(5);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    const analyzer = new AnalysisEngine();
    const friction = await analyzer.analyzeFriction(events);
    const value = await analyzer.analyzeValue(events);

    // Calculate basic metrics
    const { MetricsCalculator } = require('../../../packages/telemetry/src/index');
    const calculator = new MetricsCalculator();
    const metrics = calculator.calculateRetention(events);

    const decisionSystem = new DecisionSystem();

    // Should not throw
    await expect(
      decisionSystem.goNoGoDecision(metrics, friction, value)
    ).resolves.not.toThrow();
  });

  it('should produce valid go/no-go decision structure', async () => {
    const personas = generateMockPersonas(5);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    const analyzer = new AnalysisEngine();
    const friction = await analyzer.analyzeFriction(events);
    const value = await analyzer.analyzeValue(events);

    const { MetricsCalculator } = require('../../../packages/telemetry/src/index');
    const calculator = new MetricsCalculator();
    const metrics = calculator.calculateRetention(events);

    const decisionSystem = new DecisionSystem();
    const decision = await decisionSystem.goNoGoDecision(metrics, friction, value);

    // Decision should have required fields
    expect(decision.recommendation).toBeDefined();
    expect(decision.recommendation).toMatch(/GO|NO-GO|ITERATE/);

    expect(decision.confidence).toBeDefined();
    expect(typeof decision.confidence).toBe('number');
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);

    expect(decision.rationale).toBeDefined();
    expect(typeof decision.rationale).toBe('string');
  });

  it('should handle empty inputs gracefully', async () => {
    const decisionSystem = new DecisionSystem();

    // Should not throw with empty arrays
    await expect(decisionSystem.prioritize([])).resolves.not.toThrow();

    const insights = await decisionSystem.prioritize([]);
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBe(0);
  });
});
