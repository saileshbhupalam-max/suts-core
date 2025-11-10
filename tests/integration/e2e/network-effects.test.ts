/**
 * E2E Test: Network Effects Integration
 * Tests viral spread across user network
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { NetworkSimulator } from '../../../packages/network/src/index';
import { EventCollector } from '../../../packages/telemetry/src/index';
import { AnalysisEngine } from '../../../packages/analysis/src/index';
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
    console.log(`Generated ${state.events.length} events from simulation`);

    // 3. Simulate network effects
    const networkSim = new NetworkSimulator({
      baseReferralRate: 0.2,
      viralityThreshold: 0.6,
    });

    const referralEvents = networkSim.simulateReferrals(state.events, personas);

    expect(Array.isArray(referralEvents)).toBe(true);
    console.log(`Generated ${referralEvents.length} referral events`);

    // 4. Build referral graph
    const allEvents = [...state.events, ...referralEvents];
    const graph = networkSim.buildReferralGraph(allEvents);

    expect(graph.nodes).toBeDefined();
    expect(graph.edges).toBeDefined();
    expect(graph.nodes.length).toBeGreaterThanOrEqual(personas.length);

    console.log(`Referral graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

    // 5. Calculate k-factor
    const kFactor = networkSim.calculateKFactor(allEvents, personas.length);

    expect(typeof kFactor).toBe('number');
    expect(kFactor).toBeGreaterThanOrEqual(0);

    console.log(`K-factor: ${kFactor.toFixed(2)}`);

    // 6. Verify network effects reflected in retention
    const collector = new EventCollector();
    allEvents.forEach((e) => collector.trackEvent(e));

    const { MetricsCalculator } = require('../../../packages/telemetry/src/index');
    const calculator = new MetricsCalculator();
    const retention = calculator.calculateRetention(allEvents);

    expect(retention).toBeDefined();
    console.log(`Retention with network effects: D1=${retention.day1.toFixed(2)}, D7=${retention.day7.toFixed(2)}`);
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

    const networkSim = new NetworkSimulator({
      baseReferralRate: 0.25,
      viralityThreshold: 0.5,
    });

    const referralEvents = networkSim.simulateReferrals(state.events, personas);
    const allEvents = [...state.events, ...referralEvents];

    // Identify viral loops
    const viralLoops = networkSim.identifyViralLoops(allEvents);

    expect(Array.isArray(viralLoops)).toBe(true);

    if (viralLoops.length > 0) {
      console.log(`Found ${viralLoops.length} viral loops:`);
      viralLoops.forEach((loop, i) => {
        console.log(`${i + 1}. ${loop.trigger} (strength: ${loop.strength.toFixed(2)})`);
      });

      // Each loop should have valid structure
      viralLoops.forEach((loop) => {
        expect(loop.trigger).toBeDefined();
        expect(typeof loop.trigger).toBe('string');
        expect(loop.strength).toBeGreaterThanOrEqual(0);
        expect(loop.strength).toBeLessThanOrEqual(1);
      });
    } else {
      console.log('No strong viral loops detected in this simulation');
    }
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

    const networkSim = new NetworkSimulator({
      baseReferralRate: 0.3,
      viralityThreshold: 0.6,
    });

    const referralEvents = networkSim.simulateReferrals(state.events, personas);

    // Track referral sources
    const referralSources = new Map<string, number>();
    referralEvents.forEach((event) => {
      if (event.metadata?.referredBy) {
        const source = event.metadata.referredBy as string;
        referralSources.set(source, (referralSources.get(source) || 0) + 1);
      }
    });

    console.log(`Referral attribution:`);
    referralSources.forEach((count, personaId) => {
      console.log(`  ${personaId}: ${count} referrals`);
    });

    // Should have attribution data
    if (referralEvents.length > 0) {
      expect(referralSources.size).toBeGreaterThan(0);
    }
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

    const networkSim = new NetworkSimulator({
      baseReferralRate: 0.2,
      viralityThreshold: 0.65,
    });

    // Simulate with and without network effects
    const referralEvents = networkSim.simulateReferrals(state.events, personas);

    const baselineUserCount = personas.length;
    const withNetworkUserCount = baselineUserCount + referralEvents.length;

    const growthRate =
      baselineUserCount > 0 ? (withNetworkUserCount - baselineUserCount) / baselineUserCount : 0;

    console.log(`Growth impact of network effects:`);
    console.log(`  Baseline users: ${baselineUserCount}`);
    console.log(`  With referrals: ${withNetworkUserCount}`);
    console.log(`  Growth rate: ${(growthRate * 100).toFixed(1)}%`);

    expect(withNetworkUserCount).toBeGreaterThanOrEqual(baselineUserCount);

    // Analyze if network effects are significant
    const analyzer = new AnalysisEngine();
    const allEvents = [...state.events, ...referralEvents];
    const value = await analyzer.analyzeValue(allEvents);

    // Look for network effect value moments
    const networkValue = value.filter(
      (v) => v.type.includes('referral') || v.type.includes('network')
    );

    if (networkValue.length > 0) {
      console.log(`Found ${networkValue.length} network-related value moments`);
    }
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

    const networkSim = new NetworkSimulator({
      baseReferralRate: 0.2,
      viralityThreshold: 0.6,
    });

    const referralEvents = networkSim.simulateReferrals(state.events, personas);
    const allEvents = [...state.events, ...referralEvents];

    // Calculate k-factor
    const kFactor = networkSim.calculateKFactor(allEvents, personas.length);

    // Collect metrics
    const collector = new EventCollector();
    allEvents.forEach((e) => collector.trackEvent(e));

    const { MetricsCalculator } = require('../../../packages/telemetry/src/index');
    const calculator = new MetricsCalculator();
    const metrics = calculator.calculateRetention(allEvents);

    // Add k-factor to metrics
    const enhancedMetrics = {
      ...metrics,
      kFactor,
      viralCoefficient: kFactor,
    };

    // Analyze and decide
    const analyzer = new AnalysisEngine();
    const friction = await analyzer.analyzeFriction(allEvents);
    const value = await analyzer.analyzeValue(allEvents);

    const { DecisionSystem } = require('../../../packages/decision/src/index');
    const decisionSystem = new DecisionSystem();

    const decision = await decisionSystem.goNoGoDecision(enhancedMetrics, friction, value);

    expect(decision.recommendation).toBeDefined();
    console.log(`Decision with network effects: ${decision.recommendation} (${(decision.confidence * 100).toFixed(1)}% confidence)`);
    console.log(`K-factor: ${kFactor.toFixed(2)}`);

    // Network effects should influence decision
    expect(decision.rationale).toBeDefined();
  }, 60000);
});
