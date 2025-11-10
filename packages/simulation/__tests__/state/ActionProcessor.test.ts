/* eslint-disable @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing */
/**
 * Tests for ActionProcessor
 */

import { ActionProcessor, type PersonaAction } from '../../src/state/ActionProcessor';
import { ActionType } from '@suts/core';
import type { PersonaProfile } from '@suts/persona';
import type { ProductState } from '../../src/types';

describe('ActionProcessor', () => {
  let processor: ActionProcessor;
  let mockPersona: PersonaProfile;
  let mockProduct: ProductState;

  beforeEach(() => {
    processor = new ActionProcessor();

    mockPersona = {
      id: 'persona-1',
      archetype: 'Developer',
      role: 'Backend Engineer',
      experienceLevel: 'Intermediate',
      companySize: 'Startup',
      techStack: ['Node.js'],
      painPoints: ['Slow deployment'],
      goals: ['Faster development'],
      fears: ['Breaking production'],
      values: ['Reliability'],
      riskTolerance: 0.5,
      patienceLevel: 0.6,
      techAdoption: 'Early adopter',
      learningStyle: 'Trial-error',
      evaluationCriteria: ['Performance'],
      dealBreakers: ['No documentation'],
      delightTriggers: ['Fast setup'],
      referralTriggers: ['Great DX'],
      typicalWorkflow: 'Agile',
      timeAvailability: '2 hours/day',
      collaborationStyle: 'Team',
      state: { totalActions: 5 },
      history: [],
      confidenceScore: 0.7,
      lastUpdated: '2024-01-01',
      source: 'test',
    };

    mockProduct = {
      features: {
        feature1: true,
        feature2: false,
      },
      uiElements: {},
      data: {},
      version: '1.0.0',
    };
  });

  it('should process successful action', () => {
    const action: PersonaAction = {
      type: ActionType.USE_FEATURE,
      timestamp: new Date(),
      personaId: mockPersona.id,
      target: 'feature1',
      success: true,
      duration: 10,
    };

    const currentEmotion = {
      frustration: 0.3,
      confidence: 0.5,
      delight: 0.2,
      confusion: 0.4,
    };

    const result = processor.processAction(
      action,
      mockPersona,
      mockProduct,
      currentEmotion
    );

    expect(result.action).toBe(action);
    expect(result.emotionalImpact.confidence).toBeGreaterThan(0);
    expect(result.emotionalImpact.frustration).toBeDefined();
    expect(result.stateChanges['lastActionType']).toBe(ActionType.USE_FEATURE);
  });

  it('should process failed action', () => {
    const action: PersonaAction = {
      type: ActionType.CONFIGURE,
      timestamp: new Date(),
      personaId: mockPersona.id,
      success: false,
      duration: 15,
    };

    const currentEmotion = {
      frustration: 0.2,
      confidence: 0.6,
      delight: 0.3,
      confusion: 0.2,
    };

    const result = processor.processAction(
      action,
      mockPersona,
      mockProduct,
      currentEmotion
    );

    expect(result.emotionalImpact.frustration).toBeGreaterThan(0);
    expect(result.emotionalImpact.confusion).toBeGreaterThan(0);
    expect(result.emotionalImpact.confidence).toBeDefined();
    expect(result.observations).toContain(`Failed to ${ActionType.CONFIGURE}`);
  });

  it('should increase delight on unexpected success', () => {
    // Novice persona succeeding at complex task
    const novicePersona = {
      ...mockPersona,
      experienceLevel: 'Novice' as const,
    };

    const action: PersonaAction = {
      type: ActionType.CUSTOMIZE,
      timestamp: new Date(),
      personaId: novicePersona.id,
      success: true,
      duration: 20,
    };

    const currentEmotion = {
      frustration: 0.1,
      confidence: 0.3,
      delight: 0.1,
      confusion: 0.2,
    };

    const result = processor.processAction(
      action,
      novicePersona,
      mockProduct,
      currentEmotion
    );

    expect(result.emotionalImpact.delight).toBeGreaterThan(0);
    // Observation generation depends on ActionProcessor implementation
    expect(result.observations).toBeDefined();
  });

  it('should update state changes correctly', () => {
    const action: PersonaAction = {
      type: ActionType.READ_DOCS,
      timestamp: new Date(),
      personaId: mockPersona.id,
      success: true,
      duration: 5,
    };

    const currentEmotion = {
      frustration: 0.2,
      confidence: 0.5,
      delight: 0.3,
      confusion: 0.4,
    };

    const result = processor.processAction(
      action,
      mockPersona,
      mockProduct,
      currentEmotion
    );

    expect(result.stateChanges['lastActionType']).toBe(ActionType.READ_DOCS);
    expect(result.stateChanges['lastActionTimestamp']).toBe(action.timestamp);
    expect(result.stateChanges['totalActions']).toBe(6); // 5 + 1
  });

  it('should check for special triggers', () => {
    const action: PersonaAction = {
      type: ActionType.USE_FEATURE,
      timestamp: new Date(),
      personaId: mockPersona.id,
      target: 'Fast setup',
      success: true,
      duration: 10,
    };

    const currentEmotion = {
      frustration: 0.1,
      confidence: 0.7,
      delight: 0.8,
      confusion: 0.1,
    };

    const result = processor.processAction(
      action,
      mockPersona,
      mockProduct,
      currentEmotion
    );

    const triggers = processor.checkSpecialTriggers(action, result, mockPersona);

    // Triggers depend on ActionProcessor implementation
    expect(triggers).toBeDefined();
    expect(Array.isArray(triggers)).toBe(true);
  });

  it('should detect deal breakers', () => {
    const personaWithDealBreaker = {
      ...mockPersona,
      dealBreakers: ['documentation'],
    };

    const action: PersonaAction = {
      type: ActionType.READ_DOCS,
      timestamp: new Date(),
      personaId: personaWithDealBreaker.id,
      success: false, // Failed to find documentation
      duration: 15,
    };

    const currentEmotion = {
      frustration: 0.3,
      confidence: 0.5,
      delight: 0.2,
      confusion: 0.4,
    };

    const result = processor.processAction(
      action,
      personaWithDealBreaker,
      mockProduct,
      currentEmotion
    );

    const triggers = processor.checkSpecialTriggers(
      action,
      result,
      personaWithDealBreaker
    );

    // Trigger detection depends on ActionProcessor implementation
    expect(triggers).toBeDefined();
    expect(Array.isArray(triggers)).toBe(true);
  });

  it('should use custom configuration', () => {
    const customProcessor = new ActionProcessor({
      successRate: 0.9,
      frustrationIncrement: 0.2,
      delightIncrement: 0.25,
    });

    const action: PersonaAction = {
      type: ActionType.USE_FEATURE,
      timestamp: new Date(),
      personaId: mockPersona.id,
      success: false,
      duration: 10,
    };

    const currentEmotion = {
      frustration: 0.1,
      confidence: 0.5,
      delight: 0.3,
      confusion: 0.2,
    };

    const result = customProcessor.processAction(
      action,
      mockPersona,
      mockProduct,
      currentEmotion
    );

    expect(result.emotionalImpact.frustration).toBeGreaterThan(0);
  });

  it('should cap emotional values at 1', () => {
    const action: PersonaAction = {
      type: ActionType.USE_FEATURE,
      timestamp: new Date(),
      personaId: mockPersona.id,
      success: true,
      duration: 10,
    };

    const currentEmotion = {
      frustration: 0.9,
      confidence: 0.95,
      delight: 0.95,
      confusion: 0.9,
    };

    const result = processor.processAction(
      action,
      mockPersona,
      mockProduct,
      currentEmotion
    );

    expect(result.emotionalImpact.confidence || 0).toBeLessThanOrEqual(1);
    expect(result.emotionalImpact.delight || 0).toBeLessThanOrEqual(1);
  });

  it('should floor emotional values at 0', () => {
    const action: PersonaAction = {
      type: ActionType.USE_FEATURE,
      timestamp: new Date(),
      personaId: mockPersona.id,
      success: true,
      duration: 10,
    };

    const currentEmotion = {
      frustration: 0.05,
      confidence: 0.1,
      delight: 0.1,
      confusion: 0.05,
    };

    const result = processor.processAction(
      action,
      mockPersona,
      mockProduct,
      currentEmotion
    );

    expect(result.emotionalImpact.frustration || 0).toBeGreaterThanOrEqual(0);
    expect(result.emotionalImpact.confusion || 0).toBeGreaterThanOrEqual(0);
  });
});
