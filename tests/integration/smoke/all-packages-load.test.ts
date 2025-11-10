/**
 * Smoke Test: Package Loading
 * Verifies all packages can be loaded without errors
 */

import { describe, it, expect } from '@jest/globals';
import {
  PersonaProfileSchema,
  TelemetryEventSchema,
  ProductStateSchema,
} from '../../../packages/core/src/index';
import { PersonaGenerator } from '../../../packages/persona/src/index';
import { SimulationEngine, SimulationLoop } from '../../../packages/simulation/src/index';
import { EventCollector, MetricsCalculator } from '../../../packages/telemetry/src/index';
import { NetworkSimulator } from '../../../packages/network/src/index';
import { AnalysisEngine } from '../../../packages/analysis/src/index';
import { DecisionSystem } from '../../../packages/decision/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';

describe('Smoke: Package Loading', () => {
  it('should load @core/models without errors', () => {
    expect(PersonaProfileSchema).toBeDefined();
    expect(TelemetryEventSchema).toBeDefined();
    expect(ProductStateSchema).toBeDefined();
  });

  it('should load @persona package without errors', () => {
    expect(PersonaGenerator).toBeDefined();
  });

  it('should load @simulation package without errors', () => {
    expect(SimulationEngine).toBeDefined();
    expect(SimulationLoop).toBeDefined();
  });

  it('should load @telemetry package without errors', () => {
    expect(EventCollector).toBeDefined();
    expect(MetricsCalculator).toBeDefined();
  });

  it('should load @network package without errors', () => {
    expect(NetworkSimulator).toBeDefined();
  });

  it('should load @analysis package without errors', () => {
    expect(AnalysisEngine).toBeDefined();
  });

  it('should load @decision package without errors', () => {
    expect(DecisionSystem).toBeDefined();
  });

  it('should load VibeAtlas plugin without errors', () => {
    expect(VibeAtlasAdapter).toBeDefined();
  });
});

describe('Smoke: Class Instantiation', () => {
  it('should instantiate SimulationEngine', () => {
    expect(() => new SimulationEngine({ seed: 12345 })).not.toThrow();
  });

  it('should instantiate EventCollector', () => {
    expect(() => new EventCollector()).not.toThrow();
  });

  it('should instantiate NetworkSimulator', () => {
    expect(() => new NetworkSimulator()).not.toThrow();
  });

  it('should instantiate AnalysisEngine', () => {
    expect(() => new AnalysisEngine()).not.toThrow();
  });

  it('should instantiate DecisionSystem', () => {
    expect(() => new DecisionSystem()).not.toThrow();
  });

  it('should instantiate VibeAtlasAdapter', () => {
    expect(() => new VibeAtlasAdapter()).not.toThrow();
  });

  it('should instantiate MetricsCalculator', () => {
    expect(() => new MetricsCalculator()).not.toThrow();
  });
});
