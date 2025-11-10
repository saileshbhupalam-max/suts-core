/**
 * E2E Test: Full Simulation Workflow
 * Tests complete workflow from personas to decision
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { EventCollector } from '../../../packages/telemetry/src/index';
import { AnalysisEngine } from '../../../packages/analysis/src/index';
import { DecisionSystem } from '../../../packages/decision/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { loadFixture, cleanupTestOutput } from '../helpers/test-utils';
import type { PersonaProfile } from '@core/models';

describe('E2E: Full Simulation Workflow', () => {
  beforeEach(() => {
    cleanupTestOutput();
  });

  afterEach(() => {
    cleanupTestOutput();
  });

  it('should run complete simulation from personas to decision', async () => {
    // 1. Load personas
    const personas = loadFixture<PersonaProfile[]>('personas.json');
    expect(personas).toHaveLength(3);

    // 2. Setup simulation
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 15,
    });

    // 3. Run simulation
    const state = await engine.run(personas, productState, 7);

    expect(state.personas).toHaveLength(3);
    expect(state.events.length).toBeGreaterThan(0);
    console.log(`Generated ${state.events.length} events from 7-day simulation`);

    // 4. Collect telemetry
    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent(e));

    const { MetricsCalculator } = require('../../../packages/telemetry/src/index');
    const calculator = new MetricsCalculator();
    const metrics = calculator.calculateRetention(state.events);

    expect(metrics).toBeDefined();
    console.log(`Retention metrics:`, {
      day1: metrics.day1,
      day7: metrics.day7,
    });

    // 5. Analyze results
    const analyzer = new AnalysisEngine();
    const friction = await analyzer.analyzeFriction(state.events);
    const value = await analyzer.analyzeValue(state.events);

    expect(Array.isArray(friction)).toBe(true);
    expect(Array.isArray(value)).toBe(true);
    console.log(`Found ${friction.length} friction points, ${value.length} value moments`);

    // 6. Make decision
    const decisionSystem = new DecisionSystem();
    const decision = await decisionSystem.goNoGoDecision(metrics, friction, value);

    expect(decision.recommendation).toBeDefined();
    expect(decision.recommendation).toMatch(/GO|NO-GO|ITERATE/);
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
    expect(decision.rationale).toBeDefined();

    console.log(`Decision: ${decision.recommendation} (${(decision.confidence * 100).toFixed(1)}% confidence)`);
  }, 60000); // 60s timeout for full workflow

  it('should work with VibeAtlas plugin end-to-end', async () => {
    const personas = loadFixture<PersonaProfile[]>('personas.json');
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    // Verify initial state
    expect(productState.features).toBeDefined();
    expect(productState.systemState).toBeDefined();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

    // Verify simulation completed
    expect(state.personas).toHaveLength(personas.length);
    expect(state.events.length).toBeGreaterThan(0);

    // Verify events have VibeAtlas-specific actions
    const actions = new Set(state.events.map((e) => e.action));
    expect(actions.size).toBeGreaterThan(0);

    console.log(`VibeAtlas actions: ${Array.from(actions).join(', ')}`);
  }, 45000);

  it('should track persona emotional states throughout simulation', async () => {
    const personas = loadFixture<PersonaProfile[]>('personas.json');
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 5);

    // Check for emotional tracking in events
    const eventsWithEmotion = state.events.filter((e) => e.emotionalImpact !== undefined);

    console.log(
      `${eventsWithEmotion.length}/${state.events.length} events have emotional impact`
    );

    // Should have some emotional tracking
    expect(eventsWithEmotion.length).toBeGreaterThan(0);

    // Emotional impact should be in valid range
    eventsWithEmotion.forEach((event) => {
      expect(typeof event.emotionalImpact).toBe('number');
      expect(event.emotionalImpact).toBeGreaterThanOrEqual(-1);
      expect(event.emotionalImpact).toBeLessThanOrEqual(1);
    });
  }, 45000);

  it('should handle diverse persona archetypes', async () => {
    const personas = loadFixture<PersonaProfile[]>('personas.json');
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    // Verify we have different archetypes
    const archetypes = new Set(personas.map((p) => p.archetype));
    expect(archetypes.size).toBeGreaterThan(1);

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

    // Each persona should have generated events
    const personaEventCounts = new Map<string, number>();
    state.events.forEach((event) => {
      personaEventCounts.set(
        event.personaId,
        (personaEventCounts.get(event.personaId) || 0) + 1
      );
    });

    expect(personaEventCounts.size).toBe(personas.length);

    personas.forEach((persona) => {
      const eventCount = personaEventCounts.get(persona.id) || 0;
      expect(eventCount).toBeGreaterThan(0);
      console.log(`${persona.archetype}: ${eventCount} events`);
    });
  }, 45000);

  it('should produce analyzable metrics for product decisions', async () => {
    const personas = loadFixture<PersonaProfile[]>('personas.json');
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 15,
    });

    const state = await engine.run(personas, productState, 7);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent(e));

    // Calculate various metrics
    const { MetricsCalculator } = require('../../../packages/telemetry/src/index');
    const calculator = new MetricsCalculator();

    const retention = calculator.calculateRetention(state.events);
    expect(retention).toBeDefined();
    expect(retention.day1).toBeGreaterThanOrEqual(0);
    expect(retention.day1).toBeLessThanOrEqual(1);

    // Analyze for insights
    const analyzer = new AnalysisEngine();
    const friction = await analyzer.analyzeFriction(state.events);
    const value = await analyzer.analyzeValue(state.events);

    // Should provide actionable insights
    const decisionSystem = new DecisionSystem();
    const prioritized = await decisionSystem.prioritize([...friction, ...value]);

    expect(prioritized.length).toBeGreaterThanOrEqual(0);

    console.log(`Top insights:`);
    prioritized.slice(0, 3).forEach((insight, i) => {
      console.log(`${i + 1}. ${insight.description} (priority: ${insight.priority.toFixed(2)})`);
    });
  }, 60000);
});
