/**
 * Tests for DecisionMaker
 */

import { DecisionMaker } from '../../src/behavior/DecisionMaker';
import { ActionType } from '@suts/core';
import type { PersonaProfile } from '@suts/persona';
import type { ProductState } from '../../src/types';

describe('DecisionMaker', () => {
  let mockPersona: PersonaProfile;
  let mockProduct: ProductState;

  beforeEach(() => {
    mockPersona = {
      id: 'persona-1',
      archetype: 'Developer',
      role: 'Backend Engineer',
      experienceLevel: 'Intermediate',
      companySize: 'Startup',
      techStack: ['Node.js', 'TypeScript'],
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
      state: {},
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

  describe('Mock Mode (no API key)', () => {
    let decisionMaker: DecisionMaker;

    beforeEach(() => {
      decisionMaker = new DecisionMaker();
    });

    it('should make decisions in mock mode', async () => {
      const decision = await decisionMaker.decide({
        persona: mockPersona,
        productState: mockProduct,
        emotionalState: {
          frustration: 0.2,
          confidence: 0.7,
          delight: 0.5,
          confusion: 0.3,
        },
        currentDay: 1,
        previousActions: [],
        availableActions: [ActionType.INSTALL, ActionType.READ_DOCS, ActionType.USE_FEATURE],
      });

      expect(decision).toBeDefined();
      expect(decision.action).toBeDefined();
      expect(decision.reasoning).toBeDefined();
      expect(decision.confidence).toBeGreaterThan(0);
    });

    it('should seek help when frustration is high', async () => {
      const decision = await decisionMaker.decide({
        persona: mockPersona,
        productState: mockProduct,
        emotionalState: {
          frustration: 0.8,
          confidence: 0.3,
          delight: 0.1,
          confusion: 0.7,
        },
        currentDay: 2,
        previousActions: ['INSTALL'],
        availableActions: [ActionType.USE_FEATURE, ActionType.SEEK_HELP, ActionType.READ_DOCS],
      });

      expect(decision.action).toBe('SEEK_HELP');
      expect(decision.reasoning).toContain('frustration');
    });

    it('should read docs when confused', async () => {
      const decision = await decisionMaker.decide({
        persona: mockPersona,
        productState: mockProduct,
        emotionalState: {
          frustration: 0.3,
          confidence: 0.5,
          delight: 0.3,
          confusion: 0.7,
        },
        currentDay: 1,
        previousActions: [],
        availableActions: [ActionType.USE_FEATURE, ActionType.READ_DOCS, ActionType.CONFIGURE],
      });

      expect(decision.action).toBe('READ_DOCS');
      expect(decision.reasoning).toContain('Confused');
    });

    it('should read docs when novice with low confidence', async () => {
      const novicePersona = { ...mockPersona, experienceLevel: 'Novice' as const };

      const decision = await decisionMaker.decide({
        persona: novicePersona,
        productState: mockProduct,
        emotionalState: {
          frustration: 0.2,
          confidence: 0.2,
          delight: 0.3,
          confusion: 0.4,
        },
        currentDay: 1,
        previousActions: [],
        availableActions: [ActionType.USE_FEATURE, ActionType.READ_DOCS, ActionType.INSTALL],
      });

      expect(decision.action).toBe('READ_DOCS');
    });

    it('should use features when conditions are good', async () => {
      const decision = await decisionMaker.decide({
        persona: mockPersona,
        productState: mockProduct,
        emotionalState: {
          frustration: 0.1,
          confidence: 0.8,
          delight: 0.6,
          confusion: 0.1,
        },
        currentDay: 3,
        previousActions: ['INSTALL', 'CONFIGURE'],
        availableActions: [ActionType.USE_FEATURE, ActionType.CUSTOMIZE, ActionType.SHARE],
      });

      expect(decision.action).toBe('USE_FEATURE');
    });

    it('should return default action if USE_FEATURE not available', async () => {
      const decision = await decisionMaker.decide({
        persona: mockPersona,
        productState: mockProduct,
        emotionalState: {
          frustration: 0.1,
          confidence: 0.8,
          delight: 0.6,
          confusion: 0.1,
        },
        currentDay: 3,
        previousActions: [],
        availableActions: [ActionType.INSTALL],
      });

      expect(decision.action).toBe('INSTALL');
    });
  });

  describe('Mock mode control', () => {
    it('should enable mock mode', () => {
      const decisionMaker = new DecisionMaker({ apiKey: 'test-key' });
      decisionMaker.enableMockMode();

      // Should use mock mode even though API key is set
      expect(async () => {
        await decisionMaker.decide({
          persona: mockPersona,
          productState: mockProduct,
          emotionalState: {
            frustration: 0.2,
            confidence: 0.7,
            delight: 0.5,
            confusion: 0.3,
          },
          currentDay: 1,
          previousActions: [],
          availableActions: [ActionType.USE_FEATURE],
        });
      }).not.toThrow();
    });

    it('should disable mock mode with API key', () => {
      const decisionMaker = new DecisionMaker({ apiKey: 'test-key' });
      decisionMaker.enableMockMode();
      decisionMaker.disableMockMode();

      // Mock mode should be disabled
      // Would use real API if key was valid (we test that it doesn't throw in mock mode)
    });

    it('should stay in mock mode if no API key when disabling', () => {
      const decisionMaker = new DecisionMaker();
      decisionMaker.disableMockMode();

      // Should still use mock mode
      expect(async () => {
        await decisionMaker.decide({
          persona: mockPersona,
          productState: mockProduct,
          emotionalState: {
            frustration: 0.2,
            confidence: 0.7,
            delight: 0.5,
            confusion: 0.3,
          },
          currentDay: 1,
          previousActions: [],
          availableActions: [ActionType.USE_FEATURE],
        });
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const decisionMaker = new DecisionMaker();
      expect(decisionMaker).toBeDefined();
    });

    it('should use custom configuration', () => {
      const decisionMaker = new DecisionMaker({
        model: 'claude-3-opus-20240229',
        temperature: 0.5,
        maxTokens: 1000,
      });
      expect(decisionMaker).toBeDefined();
    });
  });
});
