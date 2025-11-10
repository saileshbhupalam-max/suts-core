/**
 * Smoke Test: Package Loading
 * Verifies all packages can be loaded without errors
 */

import { describe, it, expect } from '@jest/globals';

describe('Smoke: Package Loading', () => {
  it('should load @core/models without errors', () => {
    expect(() => require('@core/models')).not.toThrow();
    const models = require('@core/models');
    expect(models.PersonaProfileSchema).toBeDefined();
    expect(models.TelemetryEventSchema).toBeDefined();
    expect(models.ProductStateSchema).toBeDefined();
  });

  it('should load @persona package without errors', () => {
    expect(() => require('../../../packages/persona/src/index')).not.toThrow();
    const persona = require('../../../packages/persona/src/index');
    expect(persona.PersonaGenerator).toBeDefined();
  });

  it('should load @simulation package without errors', () => {
    expect(() => require('../../../packages/simulation/src/index')).not.toThrow();
    const simulation = require('../../../packages/simulation/src/index');
    expect(simulation.SimulationEngine).toBeDefined();
    expect(simulation.SimulationLoop).toBeDefined();
  });

  it('should load @telemetry package without errors', () => {
    expect(() => require('../../../packages/telemetry/src/index')).not.toThrow();
    const telemetry = require('../../../packages/telemetry/src/index');
    expect(telemetry.EventCollector).toBeDefined();
    expect(telemetry.MetricsCalculator).toBeDefined();
  });

  it('should load @network package without errors', () => {
    expect(() => require('../../../packages/network/src/index')).not.toThrow();
    const network = require('../../../packages/network/src/index');
    expect(network.NetworkSimulator).toBeDefined();
  });

  it('should load @analysis package without errors', () => {
    expect(() => require('../../../packages/analysis/src/index')).not.toThrow();
    const analysis = require('../../../packages/analysis/src/index');
    expect(analysis.AnalysisEngine).toBeDefined();
  });

  it('should load @decision package without errors', () => {
    expect(() => require('../../../packages/decision/src/index')).not.toThrow();
    const decision = require('../../../packages/decision/src/index');
    expect(decision.DecisionSystem).toBeDefined();
  });

  it('should load VibeAtlas plugin without errors', () => {
    expect(() => require('../../../plugins/vibeatlas/src/index')).not.toThrow();
    const vibeatlas = require('../../../plugins/vibeatlas/src/index');
    expect(vibeatlas.VibeAtlasAdapter).toBeDefined();
  });
});

describe('Smoke: Class Instantiation', () => {
  it('should instantiate SimulationEngine', () => {
    const { SimulationEngine } = require('../../../packages/simulation/src/index');
    expect(() => new SimulationEngine({})).not.toThrow();
  });

  it('should instantiate EventCollector', () => {
    const { EventCollector } = require('../../../packages/telemetry/src/index');
    expect(() => new EventCollector()).not.toThrow();
  });

  it('should instantiate NetworkSimulator', () => {
    const { NetworkSimulator } = require('../../../packages/network/src/index');
    expect(() => new NetworkSimulator({})).not.toThrow();
  });

  it('should instantiate AnalysisEngine', () => {
    const { AnalysisEngine } = require('../../../packages/analysis/src/index');
    expect(() => new AnalysisEngine()).not.toThrow();
  });

  it('should instantiate DecisionSystem', () => {
    const { DecisionSystem } = require('../../../packages/decision/src/index');
    expect(() => new DecisionSystem()).not.toThrow();
  });

  it('should instantiate VibeAtlasAdapter', () => {
    const { VibeAtlasAdapter } = require('../../../plugins/vibeatlas/src/index');
    expect(() => new VibeAtlasAdapter()).not.toThrow();
  });

  it('should instantiate MetricsCalculator', () => {
    const { MetricsCalculator } = require('../../../packages/telemetry/src/index');
    expect(() => new MetricsCalculator()).not.toThrow();
  });
});
