/**
 * Tests for simulation package exports
 */

import * as simulationExports from '../index';

describe('simulation package exports', () => {
  it('should export SimulationEngine', () => {
    expect(simulationExports.SimulationEngine).toBeDefined();
  });

  it('should create SimulationEngine instance', () => {
    const engine = new simulationExports.SimulationEngine({ seed: 42, apiKey: 'test-key' });
    expect(engine).toBeInstanceOf(simulationExports.SimulationEngine);
  });

  it('should create instance with custom model', () => {
    const engine = new simulationExports.SimulationEngine({
      seed: 42,
      apiKey: 'test-key',
      model: 'custom-model',
    });
    expect(engine).toBeInstanceOf(simulationExports.SimulationEngine);
  });
});
