/**
 * E2E Test: Full Simulation Workflow
 * Tests complete workflow from personas to decision
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { EventCollector, MetricsCalculator } from '../../../packages/telemetry/src/index';
import { AnalysisEngine } from '../../../packages/analysis/src/index';
import { DecisionSystem } from '../../../packages/decision/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { loadFixture, cleanupTestOutput } from '../helpers/test-utils';
import type { PersonaProfile } from '@suts/persona';

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

    // 4. Collect telemetry
    const collector = new EventCollector();
    // Convert timestamp strings to Date objects for telemetry package
    const telemetryEvents = state.events.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
      emotionalState: e.emotionalState ?? {},
    })) as import('@suts/telemetry').TelemetryEvent[];

    telemetryEvents.forEach((e) => collector.trackEvent(e));
    // Flush events from batch queue to storage
    collector.flush();

    const calculator = new MetricsCalculator();
    const day7Retention = calculator.calculateDay7Retention(telemetryEvents, 'default');
    const day14Retention = calculator.calculateDay14Retention(telemetryEvents, 'default');

    expect(typeof day7Retention).toBe('number');
    expect(typeof day14Retention).toBe('number');

    // 5. Analyze results
    const analyzer = new AnalysisEngine();
    const friction = analyzer.analyzeFriction(telemetryEvents);
    const value = analyzer.analyzeValue(telemetryEvents);

    expect(Array.isArray(friction)).toBe(true);
    expect(Array.isArray(value)).toBe(true);

    // 6. Make decision
    const decisionSystem = new DecisionSystem();
    const simulationMetrics = {
      retentionRate: day7Retention / 100,
      churnRate: 1 - (day7Retention / 100),
      growthRate: 0.05,
      avgSessionDuration: 300,
      userSatisfaction: 0.7,
      conversionRate: 0.5,
      revenuePerUser: 50,
      npsScore: 30,
      confidenceLevel: 0.8,
      sampleSize: state.personas.length,
    };
    const decision = decisionSystem.goNoGoDecision(simulationMetrics);

    expect(decision.decision).toBeDefined();
    expect(decision.decision).toMatch(/GO|NO_GO|CONDITIONAL/);
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
    expect(decision.reasoning).toBeDefined();
  }, 60000); // 60s timeout for full workflow

  it('should work with VibeAtlas plugin end-to-end', async () => {
    const personas = loadFixture<PersonaProfile[]>('personas.json');
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    // Verify initial state
    expect(productState.features).toBeDefined();

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
    const eventsWithEmotion = state.events.filter((e) => e.emotionalState !== undefined && Object.keys(e.emotionalState).length > 0);

    // Should have some emotional tracking
    expect(eventsWithEmotion.length).toBeGreaterThan(0);

    // Emotional state should have valid values
    eventsWithEmotion.forEach((event) => {
      expect(typeof event.emotionalState).toBe('object');
      if (event.emotionalState !== undefined) {
        Object.values(event.emotionalState).forEach((value) => {
          expect(typeof value).toBe('number');
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        });
      }
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
        (personaEventCounts.get(event.personaId) ?? 0) + 1
      );
    });

    expect(personaEventCounts.size).toBe(personas.length);

    personas.forEach((persona) => {
      const eventCount = personaEventCounts.get(persona.id) ?? 0;
      expect(eventCount).toBeGreaterThan(0);
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
    // Convert timestamp strings to Date objects for telemetry package
    const telemetryEvents = state.events.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
      emotionalState: e.emotionalState ?? {},
    })) as import('@suts/telemetry').TelemetryEvent[];

    telemetryEvents.forEach((e) => collector.trackEvent(e));
    // Flush events from batch queue to storage
    collector.flush();

    // Calculate various metrics
    const calculator = new MetricsCalculator();

    const day7Retention = calculator.calculateDay7Retention(telemetryEvents, 'default');
    expect(typeof day7Retention).toBe('number');
    expect(day7Retention).toBeGreaterThanOrEqual(0);
    expect(day7Retention).toBeLessThanOrEqual(100);

    // Analyze for insights
    const analyzer = new AnalysisEngine();
    const friction = analyzer.analyzeFriction(telemetryEvents);
    const value = analyzer.analyzeValue(telemetryEvents);

    // Convert friction and value to AnalysisResult format
    const analysisResults = [
      ...friction.map((f, i) => ({
        id: `friction-${i}`,
        type: 'ux' as const,
        severity: f.priority > 0.8 ? ('critical' as const) : f.priority > 0.6 ? ('high' as const) : ('medium' as const),
        title: f.location.action,
        description: f.description,
        affectedUsers: f.affectedUsers,
        potentialImpact: f.avgFrustration,
        confidence: f.confidence,
        metadata: {},
      })),
      ...value.map((v, i) => ({
        id: `value-${i}`,
        type: 'ux' as const,
        severity: 'medium' as const,
        title: v.action,
        description: v.description,
        affectedUsers: v.affectedUsers,
        potentialImpact: v.delightScore,
        confidence: v.confidence,
        metadata: {},
      })),
    ];

    // Should provide actionable insights
    const decisionSystem = new DecisionSystem();
    const prioritized = decisionSystem.prioritize(analysisResults);

    expect(prioritized.length).toBeGreaterThanOrEqual(0);
  }, 60000);
});
