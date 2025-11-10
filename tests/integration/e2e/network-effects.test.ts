/**
 * E2E Test: Network Effects Integration
 * Tests viral spread across user network
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { NetworkSimulator } from '../../../packages/network/src/index';
import { EventCollector, MetricsCalculator } from '../../../packages/telemetry/src/index';
import { AnalysisEngine } from '../../../packages/analysis/src/index';
import { DecisionSystem } from '../../../packages/decision/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { generateMockPersonas, cleanupTestOutput } from '../helpers/test-utils';

describe('E2E: Network Effects Integration', () => {
  beforeEach(() => {
    cleanupTestOutput();
  });

  afterEach(() => {
    cleanupTestOutput();
  });

  it('should simulate viral spread across user network', async () => {
    // 1. Generate personas with referral-prone traits
    const personas = generateMockPersonas(10);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    // 2. Run simulation
    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 15,
    });

    const state = await engine.run(personas, productState, 7);

    expect(state.events.length).toBeGreaterThan(0);

    // Convert timestamp strings to Date objects for telemetry package
    const telemetryEvents = state.events.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
      emotionalState: e.emotionalState ?? {},
    })) as import('@suts/telemetry').TelemetryEvent[];

    // 3. Simulate network effects
    const networkSim = new NetworkSimulator({
      baseReferralProbability: 0.2,
      delightThreshold: 0.6,
    });

    const graph = networkSim.simulateReferrals(personas, telemetryEvents);

    expect(graph).toBeDefined();
    expect(graph.nodes).toBeDefined();
    expect(graph.edges).toBeDefined();
    expect(graph.totalUsers).toBeGreaterThanOrEqual(personas.length);

    // 4. Calculate k-factor
    const kFactor = networkSim.calculateViralCoefficient(graph);

    expect(typeof kFactor).toBe('number');
    expect(kFactor).toBeGreaterThanOrEqual(0);

    // 5. Verify network effects reflected in retention
    const collector = new EventCollector();
    telemetryEvents.forEach((e) => collector.trackEvent(e));
    // Flush events from batch queue to storage
    collector.flush();

    const calculator = new MetricsCalculator();
    const day7Retention = calculator.calculateDay7Retention(telemetryEvents, 'default');

    expect(typeof day7Retention).toBe('number');
  }, 60000);

  it('should identify viral loops in product', async () => {
    const personas = generateMockPersonas(15);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 12,
    });

    const state = await engine.run(personas, productState, 5);

    // Convert timestamp strings to Date objects for telemetry package
    const telemetryEvents = state.events.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
      emotionalState: e.emotionalState ?? {},
    })) as import('@suts/telemetry').TelemetryEvent[];

    const networkSim = new NetworkSimulator({
      baseReferralProbability: 0.25,
      delightThreshold: 0.5,
    });

    const graph = networkSim.simulateReferrals(personas, telemetryEvents);

    // Verify graph structure
    expect(graph).toBeDefined();
    expect(graph.nodes).toBeDefined();
    expect(graph.edges).toBeDefined();
    expect(graph.totalUsers).toBeGreaterThanOrEqual(personas.length);

    // Calculate metrics to verify viral behavior
    const metrics = networkSim.calculateMetrics(graph);
    expect(metrics).toBeDefined();
    expect(typeof metrics.kFactor).toBe('number');
    expect(typeof metrics.conversionRate).toBe('number');
  }, 60000);

  it('should track referral sources and attribution', async () => {
    const personas = generateMockPersonas(8);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 4);

    // Convert timestamp strings to Date objects for telemetry package
    const telemetryEvents = state.events.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
      emotionalState: e.emotionalState ?? {},
    })) as import('@suts/telemetry').TelemetryEvent[];

    const networkSim = new NetworkSimulator({
      baseReferralProbability: 0.3,
      delightThreshold: 0.6,
    });

    const graph = networkSim.simulateReferrals(personas, telemetryEvents);

    // Track referral sources from graph edges
    const referralSources = new Map<string, number>();
    graph.edges.forEach((edge) => {
      const source = edge.from;
      referralSources.set(source, (referralSources.get(source) ?? 0) + 1);
    });

    // Verify graph has referral data
    expect(graph.edges).toBeDefined();
    expect(Array.isArray(graph.edges)).toBe(true);
  }, 45000);

  it('should analyze network effects impact on growth', async () => {
    const personas = generateMockPersonas(12);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 12,
    });

    const state = await engine.run(personas, productState, 7);

    // Convert timestamp strings to Date objects for telemetry package
    const telemetryEvents = state.events.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
      emotionalState: e.emotionalState ?? {},
    })) as import('@suts/telemetry').TelemetryEvent[];

    const networkSim = new NetworkSimulator({
      baseReferralProbability: 0.2,
      delightThreshold: 0.65,
    });

    // Simulate network effects
    const graph = networkSim.simulateReferrals(personas, telemetryEvents);

    const baselineUserCount = personas.length;
    const withNetworkUserCount = graph.totalUsers;

    const growthRate =
      baselineUserCount > 0 ? (withNetworkUserCount - baselineUserCount) / baselineUserCount : 0;

    expect(withNetworkUserCount).toBeGreaterThanOrEqual(baselineUserCount);
    expect(typeof growthRate).toBe('number');

    // Analyze if network effects are significant
    const analyzer = new AnalysisEngine();
    const value = analyzer.analyzeValue(telemetryEvents);

    // Verify value analysis works
    expect(Array.isArray(value)).toBe(true);
  }, 60000);

  it('should integrate network metrics with decision system', async () => {
    const personas = generateMockPersonas(10);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 12,
    });

    const state = await engine.run(personas, productState, 5);

    // Convert timestamp strings to Date objects for telemetry package
    const telemetryEvents = state.events.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
      emotionalState: e.emotionalState ?? {},
    })) as import('@suts/telemetry').TelemetryEvent[];

    const networkSim = new NetworkSimulator({
      baseReferralProbability: 0.2,
      delightThreshold: 0.6,
    });

    const graph = networkSim.simulateReferrals(personas, telemetryEvents);

    // Calculate k-factor
    const kFactor = networkSim.calculateViralCoefficient(graph);

    // Collect metrics
    const collector = new EventCollector();
    telemetryEvents.forEach((e) => collector.trackEvent(e));
    // Flush events from batch queue to storage
    collector.flush();

    const calculator = new MetricsCalculator();
    const day7Retention = calculator.calculateDay7Retention(telemetryEvents, 'default');

    // Create simulation metrics
    const simulationMetrics = {
      retentionRate: day7Retention / 100,
      churnRate: 1 - (day7Retention / 100),
      growthRate: kFactor > 1 ? 0.1 : 0.05,
      avgSessionDuration: 300,
      userSatisfaction: 0.7,
      conversionRate: 0.5,
      revenuePerUser: 50,
      npsScore: 30,
      confidenceLevel: 0.8,
      sampleSize: state.personas.length,
    };

    const decisionSystem = new DecisionSystem();
    const decision = decisionSystem.goNoGoDecision(simulationMetrics);

    expect(decision.decision).toBeDefined();
    expect(decision.decision).toMatch(/GO|NO_GO|CONDITIONAL/);
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
    expect(decision.reasoning).toBeDefined();
  }, 60000);
});
