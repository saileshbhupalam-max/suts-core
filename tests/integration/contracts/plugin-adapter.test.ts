/**
 * Contract Test: IProductAdapter Interface
 * Validates that plugin adapters implement the interface correctly
 */

import { describe, it, expect } from '@jest/globals';
import { ProductStateSchema } from '@core/models';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { ActionType } from '@core/types';

describe('Contract: IProductAdapter Interface', () => {
  it('should implement required IProductAdapter methods', () => {
    const adapter = new VibeAtlasAdapter();

    // Required methods
    expect(typeof adapter.getInitialState).toBe('function');
    expect(typeof adapter.applyAction).toBe('function');
    expect(typeof adapter.getAvailableActions).toBe('function');
  });

  it('should return valid ProductState from getInitialState', () => {
    const adapter = new VibeAtlasAdapter();
    const state = adapter.getInitialState();

    // Validate against schema
    const result = ProductStateSchema.safeParse(state);

    if (!result.success) {
      console.error('ProductState validation failed:', result.error.errors);
    }

    expect(result.success).toBe(true);

    // Check required fields
    expect(state.features).toBeDefined();
    expect(typeof state.features).toBe('object');

    expect(state.userData).toBeDefined();
    expect(typeof state.userData).toBe('object');

    expect(state.uiElements).toBeDefined();
    expect(Array.isArray(state.uiElements)).toBe(true);

    expect(state.systemState).toBeDefined();
    expect(typeof state.systemState).toBe('object');
  });

  it('should apply actions and return valid ProductState', () => {
    const adapter = new VibeAtlasAdapter();
    const initialState = adapter.getInitialState();

    // Test a sample action
    const newState = adapter.applyAction(initialState, {
      type: ActionType.CUSTOM,
      name: 'test_action',
      personaId: 'test-persona',
      timestamp: new Date().toISOString(),
    });

    // Should return valid ProductState
    const result = ProductStateSchema.safeParse(newState);
    expect(result.success).toBe(true);

    // State should be different from initial (or same if action had no effect)
    expect(newState).toBeDefined();
  });

  it('should return valid action list from getAvailableActions', () => {
    const adapter = new VibeAtlasAdapter();
    const state = adapter.getInitialState();

    const actions = adapter.getAvailableActions(state, {
      id: 'test-persona',
      archetype: 'Test User',
      role: 'Developer',
      experienceLevel: 'Intermediate',
      companySize: 'Startup',
      techStack: ['TypeScript'],
      painPoints: [],
      goals: [],
      fears: [],
      values: [],
      riskTolerance: 0.5,
      patienceLevel: 0.5,
      techAdoption: 'Early majority',
      learningStyle: 'Trial-error',
      evaluationCriteria: [],
      dealBreakers: [],
      delightTriggers: [],
      referralTriggers: [],
      typicalWorkflow: 'Test workflow',
      timeAvailability: '30 minutes',
      collaborationStyle: 'Solo',
      state: {},
      history: [],
      confidenceScore: 0.8,
      lastUpdated: new Date().toISOString(),
      source: 'test',
    });

    // Should return array of actions
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBeGreaterThan(0);

    // Each action should have required fields
    actions.forEach((action) => {
      expect(action.type).toBeDefined();
      expect(action.name).toBeDefined();
      expect(typeof action.name).toBe('string');

      if (action.weight !== undefined) {
        expect(typeof action.weight).toBe('number');
        expect(action.weight).toBeGreaterThan(0);
      }
    });
  });

  it('should maintain state consistency across actions', () => {
    const adapter = new VibeAtlasAdapter();
    let state = adapter.getInitialState();

    // Apply multiple actions
    for (let i = 0; i < 5; i++) {
      const actions = adapter.getAvailableActions(state, {
        id: 'test-persona',
        archetype: 'Test User',
        role: 'Developer',
        experienceLevel: 'Intermediate',
        companySize: 'Startup',
        techStack: ['TypeScript'],
        painPoints: [],
        goals: [],
        fears: [],
        values: [],
        riskTolerance: 0.5,
        patienceLevel: 0.5,
        techAdoption: 'Early majority',
        learningStyle: 'Trial-error',
        evaluationCriteria: [],
        dealBreakers: [],
        delightTriggers: [],
        referralTriggers: [],
        typicalWorkflow: 'Test workflow',
        timeAvailability: '30 minutes',
        collaborationStyle: 'Solo',
        state: {},
        history: [],
        confidenceScore: 0.8,
        lastUpdated: new Date().toISOString(),
        source: 'test',
      });

      if (actions.length > 0) {
        const action = actions[0]!;
        state = adapter.applyAction(state, {
          type: action.type,
          name: action.name,
          personaId: 'test-persona',
          timestamp: new Date().toISOString(),
        });

        // State should remain valid
        const result = ProductStateSchema.safeParse(state);
        expect(result.success).toBe(true);
      }
    }
  });

  it('should work with SimulationEngine', async () => {
    const { SimulationEngine } = require('../../../packages/simulation/src/index');
    const { generateMockPersonas } = require('../helpers/test-utils');

    const adapter = new VibeAtlasAdapter();
    const personas = generateMockPersonas(2);
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

    // Should complete simulation without errors
    await expect(
      engine.run(personas, productState, 1)
    ).resolves.not.toThrow();
  });
});
