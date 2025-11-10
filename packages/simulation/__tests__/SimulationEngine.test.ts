/**
 * Tests for SimulationEngine
 */

import { SimulationEngine } from '../src/engine';
import type { PersonaProfile } from '@suts/persona';
import type { ProductState, SimulationEngineConfig } from '../src/types';

describe('SimulationEngine', () => {
  let mockPersonas: PersonaProfile[];
  let mockProduct: ProductState;

  beforeEach(() => {
    mockPersonas = [
      {
        id: 'persona-1',
        archetype: 'Developer',
        role: 'Backend Engineer',
        experienceLevel: 'Intermediate',
        companySize: 'Startup',
        techStack: ['Node.js'],
        painPoints: ['Slow'],
        goals: ['Fast'],
        fears: ['Bugs'],
        values: ['Quality'],
        riskTolerance: 0.5,
        patienceLevel: 0.6,
        techAdoption: 'Early adopter',
        learningStyle: 'Trial-error',
        evaluationCriteria: ['Performance'],
        dealBreakers: ['No docs'],
        delightTriggers: ['Fast setup'],
        referralTriggers: ['Great DX'],
        typicalWorkflow: 'Agile',
        timeAvailability: '2 hours/day',
        collaborationStyle: 'Team',
        state: {},
        history: [],
        confidenceScore: 0.7,
        lastUpdated: '2024-01-01',
        source: 'test',
      },
    ];

    mockProduct = {
      version: '1.0.0',
      features: { feature1: true },
      uiElements: {},
      config: {},
      userData: {},
      environment: 'development' as const,
      metadata: {},
    };
  });

  it('should create engine with valid config', () => {
    const engine = new SimulationEngine({ seed: 12345, batchSize: 10, maxActionsPerDay: 5 });
    expect(engine).toBeDefined();
  });

  it('should throw error without seed', () => {
    expect(() => new SimulationEngine({} as SimulationEngineConfig)).toThrow(
      'Seed is required for deterministic simulation'
    );
  });

  it('should run simulation successfully', async () => {
    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 3,
    });

    const result = await engine.run(mockPersonas, mockProduct, 2);

    expect(result).toBeDefined();
    expect(result.personas.length).toBe(1);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.metadata.totalDays).toBe(2);
    expect(result.metadata.totalPersonas).toBe(1);
    expect(result.metadata.seed).toBe(12345);
  });

  it('should throw error for empty personas array', async () => {
    const engine = new SimulationEngine({ seed: 12345, batchSize: 10, maxActionsPerDay: 5 });

    await expect(engine.run([], mockProduct, 7)).rejects.toThrow(
      'At least one persona is required'
    );
  });

  it('should throw error for invalid days', async () => {
    const engine = new SimulationEngine({ seed: 12345, batchSize: 10, maxActionsPerDay: 5 });

    await expect(engine.run(mockPersonas, mockProduct, 0)).rejects.toThrow(
      'Days must be positive'
    );

    await expect(engine.run(mockPersonas, mockProduct, -1)).rejects.toThrow(
      'Days must be positive'
    );
  });

  it('should produce deterministic results with same seed', async () => {
    const engine1 = new SimulationEngine({ seed: 12345, batchSize: 10, maxActionsPerDay: 5 });
    const engine2 = new SimulationEngine({ seed: 12345, batchSize: 10, maxActionsPerDay: 5 });

    const result1 = await engine1.run(mockPersonas, mockProduct, 3);
    const result2 = await engine2.run(mockPersonas, mockProduct, 3);

    expect(result1.events.length).toBe(result2.events.length);
    expect(result1.personas[0]!.finalState).toBe(result2.personas[0]!.finalState);
    expect(result1.personas[0]!.totalActions).toBe(result2.personas[0]!.totalActions);
  });

  it('should produce different results with different seeds', async () => {
    const engine1 = new SimulationEngine({ seed: 12345, batchSize: 10, maxActionsPerDay: 5 });
    const engine2 = new SimulationEngine({ seed: 54321, batchSize: 10, maxActionsPerDay: 5 });

    const result1 = await engine1.run(mockPersonas, mockProduct, 3);
    const result2 = await engine2.run(mockPersonas, mockProduct, 3);

    // Results should differ
    const isDifferent: boolean =
      result1.events.length !== result2.events.length ||
      result1.personas[0]!.totalActions !== result2.personas[0]!.totalActions;

    expect(isDifferent).toBe(true);
  });

  it('should handle progress callback', async () => {
    const engine = new SimulationEngine({ seed: 12345, batchSize: 10, maxActionsPerDay: 5 });
    const progressUpdates: number[] = [];

    await engine.run(mockPersonas, mockProduct, 5, (progress) => {
      progressUpdates.push(progress.currentDay);
    });

    expect(progressUpdates.length).toBe(5);
    expect(progressUpdates).toEqual([1, 2, 3, 4, 5]);
  });

  it('should simulate multiple personas', async () => {
    const multiplePersonas = [
      ...mockPersonas,
      { ...(mockPersonas[0]!), id: 'persona-2' },
      { ...(mockPersonas[0]!), id: 'persona-3' },
    ];

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 2,
    });

    const result = await engine.run(multiplePersonas, mockProduct, 3);

    expect(result.personas.length).toBe(3);
    expect(result.metadata.totalPersonas).toBe(3);
  });

  it('should get configuration', () => {
    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 5,
      maxActionsPerDay: 10,
    });

    const config = engine.getConfig();

    expect(config.seed).toBe(12345);
    expect(config.batchSize).toBe(5);
    expect(config.maxActionsPerDay).toBe(10);
  });

  it('should update configuration', () => {
    const engine = new SimulationEngine({ seed: 12345, batchSize: 10, maxActionsPerDay: 5 });

    engine.updateConfig({ batchSize: 20 });

    const config = engine.getConfig();
    expect(config.batchSize).toBe(20);
  });

  it('should track persona state changes', async () => {
    const engine = new SimulationEngine({
      seed: 12345,
      maxActionsPerDay: 5,
    });

    const result = await engine.run(mockPersonas, mockProduct, 7);
    const persona = result.personas[0]!;

    expect(persona.personaId).toBe('persona-1');
    expect(persona.finalState).toBeDefined();
    expect(persona.totalActions).toBeGreaterThan(0);
    expect(persona.frustrationLevel).toBeGreaterThanOrEqual(0);
    expect(persona.frustrationLevel).toBeLessThanOrEqual(1);
    expect(persona.delightLevel).toBeGreaterThanOrEqual(0);
    expect(persona.delightLevel).toBeLessThanOrEqual(1);
    expect(persona.events.length).toBeGreaterThan(0);
  });

  it('should complete within reasonable time for small simulation', async () => {
    const engine = new SimulationEngine({ seed: 12345, batchSize: 10, maxActionsPerDay: 5 });

    const startTime = Date.now();
    await engine.run(mockPersonas, mockProduct, 7);
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(10000); // Should complete in less than 10 seconds
  }, 15000);

  it('should handle edge case of 0 events gracefully', async () => {
    const engine = new SimulationEngine({
      seed: 12345,
      maxActionsPerDay: 0,
    });

    const result = await engine.run(mockPersonas, mockProduct, 1);

    expect(result).toBeDefined();
    expect(result.personas).toBeDefined();
  });

  it('should create engine with apiKey', async () => {
    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 3,
      apiKey: 'test-api-key',
    });

    const result = await engine.run(mockPersonas, mockProduct, 1);
    expect(result).toBeDefined();
  });

  it('should create engine with model', async () => {
    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 3,
      model: 'claude-3-opus-20240229',
    });

    const result = await engine.run(mockPersonas, mockProduct, 1);
    expect(result).toBeDefined();
  });

  it('should create engine with both apiKey and model', async () => {
    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 3,
      apiKey: 'test-api-key',
      model: 'claude-3-opus-20240229',
    });

    const result = await engine.run(mockPersonas, mockProduct, 1);
    expect(result).toBeDefined();
  });
});
