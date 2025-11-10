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
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    // Should work with NetworkSimulator
    const networkSim = new NetworkSimulator({
      baseReferralRate: 0.1,
      viralityThreshold: 0.7,
    });

    expect(() => {
      networkSim.simulateReferrals(events, personas);
    }).not.toThrow();
  });

  it('should generate referral events from delighted personas', async () => {
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
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    const networkSim = new NetworkSimulator({
      baseReferralRate: 0.3,
      viralityThreshold: 0.5,
    });

    const referralEvents = networkSim.simulateReferrals(events, personas);

    // Should return array
    expect(Array.isArray(referralEvents)).toBe(true);

    // Each referral event should be valid
    referralEvents.forEach((event) => {
      expect(event.id).toBeDefined();
      expect(event.action).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.personaId).toBeDefined();
      expect(event.metadata).toBeDefined();
    });
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
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    const networkSim = new NetworkSimulator({
      baseReferralRate: 0.2,
      viralityThreshold: 0.6,
    });

    // Calculate k-factor
    const kFactor = networkSim.calculateKFactor(events, personas.length);

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
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    const networkSim = new NetworkSimulator({
      baseReferralRate: 0.15,
      viralityThreshold: 0.7,
    });

    const referralEvents = networkSim.simulateReferrals(events, personas);
    const graph = networkSim.buildReferralGraph([...events, ...referralEvents]);

    // Graph should be an object
    expect(typeof graph).toBe('object');
    expect(graph).not.toBeNull();

    // Should have nodes for personas
    expect(graph.nodes).toBeDefined();
    expect(Array.isArray(graph.nodes)).toBe(true);

    // Should have edges for referrals
    expect(graph.edges).toBeDefined();
    expect(Array.isArray(graph.edges)).toBe(true);
  });

  it('should identify viral loops in network', async () => {
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
    state.events.forEach((e) => collector.trackEvent(e));
    const events = collector.query({});

    const networkSim = new NetworkSimulator({
      baseReferralRate: 0.25,
      viralityThreshold: 0.5,
    });

    const referralEvents = networkSim.simulateReferrals(events, personas);
    const viralLoops = networkSim.identifyViralLoops([...events, ...referralEvents]);

    // Should return array
    expect(Array.isArray(viralLoops)).toBe(true);

    // Each viral loop should have required properties
    viralLoops.forEach((loop) => {
      expect(loop.trigger).toBeDefined();
      expect(loop.strength).toBeDefined();
      expect(typeof loop.strength).toBe('number');
      expect(loop.strength).toBeGreaterThanOrEqual(0);
      expect(loop.strength).toBeLessThanOrEqual(1);
    });
  });
});
