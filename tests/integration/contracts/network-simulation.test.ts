/**
 * Contract Test: Simulation -> Network Effects
 * Validates network effects integration with simulation
 */

import { describe, it, expect } from '@jest/globals';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { NetworkSimulator } from '../../../packages/network/src/index';
import { EventCollector } from '../../../packages/telemetry/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { generateMockPersonas } from '../helpers/test-utils';

describe('Contract: Simulation -> Network Effects', () => {
  it('should integrate NetworkSimulator with simulation events', async () => {
    const personas = generateMockPersonas(5);
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

    // Should work with NetworkSimulator
    const networkSim = new NetworkSimulator({
      baseReferralProbability: 0.1,
      delightThreshold: 0.7,
    });

    expect(() => {
      networkSim.simulateReferrals(personas, events);
    }).not.toThrow();
  });

  it('should generate referral graph from delighted personas', async () => {
    const personas = generateMockPersonas(5);
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

    const networkSim = new NetworkSimulator({
      baseReferralProbability: 0.3,
      delightThreshold: 0.5,
    });

    const graph = networkSim.simulateReferrals(personas, events);

    // Should return a ReferralGraph object
    expect(graph).toBeDefined();
    expect(typeof graph).toBe('object');
    expect(graph.nodes).toBeDefined();
    expect(graph.totalUsers).toBeDefined();
    expect(typeof graph.totalUsers).toBe('number');
  });

  it('should calculate network metrics from simulation', async () => {
    const personas = generateMockPersonas(10);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

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

    const networkSim = new NetworkSimulator({
      baseReferralProbability: 0.2,
      delightThreshold: 0.6,
    });

    const graph = networkSim.simulateReferrals(personas, events);

    // Calculate viral coefficient (k-factor)
    const kFactor = networkSim.calculateViralCoefficient(graph);

    expect(typeof kFactor).toBe('number');
    expect(kFactor).toBeGreaterThanOrEqual(0);
  });

  it('should build referral graph from events', async () => {
    const personas = generateMockPersonas(8);
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

    const networkSim = new NetworkSimulator({
      baseReferralProbability: 0.15,
      delightThreshold: 0.7,
    });

    const graph = networkSim.simulateReferrals(personas, events);

    // Graph should be an object
    expect(typeof graph).toBe('object');
    expect(graph).not.toBeNull();

    // Should have nodes for personas (Map structure)
    expect(graph.nodes).toBeDefined();
    expect(graph.nodes instanceof Map).toBe(true);

    // Should have totalUsers count
    expect(graph.totalUsers).toBeDefined();
    expect(typeof graph.totalUsers).toBe('number');
  });

  it('should calculate network metrics including growth projection', async () => {
    const personas = generateMockPersonas(6);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

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

    const networkSim = new NetworkSimulator({
      baseReferralProbability: 0.25,
      delightThreshold: 0.5,
    });

    const graph = networkSim.simulateReferrals(personas, events);
    const kFactor = networkSim.calculateViralCoefficient(graph);

    // Calculate metrics from graph
    const metrics = networkSim.calculateMetrics(graph);

    expect(metrics).toBeDefined();
    expect(typeof metrics).toBe('object');
    expect(metrics.kFactor).toBeDefined();
    expect(typeof metrics.kFactor).toBe('number');
    expect(metrics.kFactor).toBeGreaterThanOrEqual(0);

    // Predict growth
    const projection = networkSim.predictGrowth(personas.length, kFactor, 30);
    expect(projection).toBeDefined();
    expect(projection.dataPoints).toBeDefined();
    expect(Array.isArray(projection.dataPoints)).toBe(true);
  });
});
