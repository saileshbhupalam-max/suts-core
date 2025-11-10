/**
 * Tests for core types exported from types.ts
 */

import { ActionType } from '../types';
import type { UserAction, ISimpleProductAdapter } from '../types';
import type { PersonaProfile } from '../models/PersonaProfile';
import type { ProductState } from '../models/ProductState';

describe('types', () => {
  describe('ActionType', () => {
    it('should have all expected action types', () => {
      expect(ActionType.INSTALL).toBe('install');
      expect(ActionType.CONFIGURE).toBe('configure');
      expect(ActionType.USE_FEATURE).toBe('use_feature');
      expect(ActionType.READ_DOCS).toBe('read_docs');
      expect(ActionType.SEEK_HELP).toBe('seek_help');
      expect(ActionType.CUSTOMIZE).toBe('customize');
      expect(ActionType.SHARE).toBe('share');
      expect(ActionType.UNINSTALL).toBe('uninstall');
    });
  });

  describe('UserAction', () => {
    it('should accept valid user action', () => {
      const action: UserAction = {
        type: ActionType.USE_FEATURE,
        feature: 'test-feature',
        description: 'Testing a feature',
        expectedOutcome: 'Feature works correctly',
      };
      expect(action.type).toBe(ActionType.USE_FEATURE);
      expect(action.feature).toBe('test-feature');
    });

    it('should accept user action with metadata', () => {
      const action: UserAction = {
        type: ActionType.CONFIGURE,
        feature: 'settings',
        description: 'Configure settings',
        expectedOutcome: 'Settings saved',
        metadata: { key: 'value' },
      };
      expect(action.metadata).toEqual({ key: 'value' });
    });
  });

  describe('ISimpleProductAdapter', () => {
    it('should define adapter interface', () => {
      const mockProductState: ProductState = {
        version: '1.0.0',
        features: { feature1: true },
        uiElements: {},
        config: {},
        userData: {},
        environment: 'development',
        metadata: {},
      };

      const mockAdapter: ISimpleProductAdapter = {
        getInitialState: () => mockProductState,
        applyAction: (state: ProductState, _action: UserAction) => state,
        getAvailableActions: (_state: ProductState, _persona: PersonaProfile) => [],
      };

      expect(typeof mockAdapter.getInitialState).toBe('function');
      expect(typeof mockAdapter.applyAction).toBe('function');
      expect(typeof mockAdapter.getAvailableActions).toBe('function');
    });

    it('should accept valid implementation', () => {
      const mockProductState: ProductState = {
        version: '1.0.0',
        features: { feature1: true },
        uiElements: {},
        config: {},
        userData: {},
        environment: 'development',
        metadata: {},
      };

      const mockPersona: PersonaProfile = {
        id: 'test-1',
        archetype: 'Test',
        role: 'Test Role',
        experienceLevel: 'Expert',
        companySize: 'Enterprise',
        techStack: ['Tech1', 'Tech2', 'Tech3'],
        painPoints: ['Pain1', 'Pain2', 'Pain3'],
        goals: ['Goal1', 'Goal2', 'Goal3'],
        fears: ['Fear1', 'Fear2'],
        values: ['Value1', 'Value2'],
        riskTolerance: 0.5,
        patienceLevel: 0.7,
        techAdoption: 'Early majority',
        learningStyle: 'Documentation',
        evaluationCriteria: ['Criteria1', 'Criteria2', 'Criteria3'],
        dealBreakers: ['Breaker1', 'Breaker2'],
        delightTriggers: ['Delight1', 'Delight2'],
        referralTriggers: ['Referral1', 'Referral2'],
        typicalWorkflow: 'Test workflow',
        timeAvailability: '5 hours',
        collaborationStyle: 'Team',
        state: {},
        history: [],
        confidenceScore: 0.85,
        lastUpdated: '2024-01-01T00:00:00Z',
        source: 'test',
      };

      const mockAdapter: ISimpleProductAdapter = {
        getInitialState: () => mockProductState,
        applyAction: (state: ProductState, _action: UserAction) => ({
          ...state,
          userData: { ...state.userData, modified: true },
        }),
        getAvailableActions: (_state: ProductState, _persona: PersonaProfile) => [
          {
            type: ActionType.USE_FEATURE,
            feature: 'test-feature',
            description: 'Test action',
            expectedOutcome: 'Success',
          },
        ],
      };

      const initialState = mockAdapter.getInitialState();
      expect(initialState.version).toBe('1.0.0');

      const action: UserAction = {
        type: ActionType.USE_FEATURE,
        feature: 'test',
        description: 'Test',
        expectedOutcome: 'Success',
      };
      const newState = mockAdapter.applyAction(initialState, action);
      expect(newState.userData).toHaveProperty('modified', true);

      const actions = mockAdapter.getAvailableActions(initialState, mockPersona);
      expect(actions).toHaveLength(1);
      expect(actions[0]?.type).toBe(ActionType.USE_FEATURE);
    });
  });
});
