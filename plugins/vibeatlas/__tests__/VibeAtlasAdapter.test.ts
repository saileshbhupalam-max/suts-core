/**
 * VibeAtlas Adapter Tests
 * Comprehensive test suite for the main adapter
 */

import { VibeAtlasAdapter } from '../src/VibeAtlasAdapter';
import { ActionType, type PersonaProfile, type UserAction } from '@suts/core';
import type { VibeAtlasState } from '../src/models/VibeAtlasState';

describe('VibeAtlasAdapter', () => {
  let adapter: VibeAtlasAdapter;
  let mockPersona: PersonaProfile;

  beforeEach(() => {
    adapter = new VibeAtlasAdapter();
    mockPersona = {
      id: 'test-persona',
      archetype: 'Skeptical Senior Dev',
      role: 'Senior Developer',
      experienceLevel: 'Expert',
      companySize: 'Startup',
      techStack: ['TypeScript', 'React', 'Node.js'],
      painPoints: ['Slow AI responses', 'High costs'],
      goals: ['Code quality', 'Understand costs', 'Reduce costs'],
      fears: ['Privacy concerns', 'Vendor lock-in'],
      values: ['Transparency', 'Control'],
      riskTolerance: 0.3,
      patienceLevel: 0.4,
      techAdoption: 'Early adopter',
      learningStyle: 'Documentation',
      evaluationCriteria: ['Cost', 'Performance', 'Quality'],
      dealBreakers: ['No trial', 'Hidden costs'],
      delightTriggers: ['Saves time', 'Clear savings'],
      referralTriggers: ['Impressive results'],
      typicalWorkflow: 'Code review and refactoring',
      timeAvailability: '4-6 hours/day',
      collaborationStyle: 'Team',
      state: {},
      history: [],
      confidenceScore: 0.8,
      lastUpdated: new Date().toISOString(),
      source: 'test',
    };
  });

  describe('constructor', () => {
    it('should create adapter instance', () => {
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(VibeAtlasAdapter);
    });

    it('should initialize all features', () => {
      const state = adapter.getInitialState() as VibeAtlasState;
      expect(state['features']['tokenCounter']).toBe(true);
      expect(state['features']['contextPreview']).toBe(true);
      expect(state['features']['tryMode']).toBe(true);
      expect(state['features']['dashboard']).toBe(true);
      expect(state['features']['persistentMemory']).toBe(true);
      expect(state['features']['performanceOpt']).toBe(true);
      expect(state['features']['autoCapture']).toBe(true);
      expect(state['features']['sessionReports']).toBe(true);
      expect(state['features']['mcpServer']).toBe(true);
    });
  });

  describe('getInitialState', () => {
    it('should return complete VibeAtlas state', () => {
      const state = adapter.getInitialState() as VibeAtlasState;

      expect(state['version']).toBe('0.4.0');
      expect(state['buildNumber']).toBe('040001');
      expect(state.tokenCounter).toBeDefined();
      expect(state.tryMode).toBeDefined();
      expect(state.contextPreview).toBeDefined();
      expect(state.dashboard).toBeDefined();
      expect(state.persistentMemory).toBeDefined();
      expect(state.performanceOptimization).toBeDefined();
      expect(state.autoCapture).toBeDefined();
      expect(state.sessionReports).toBeDefined();
      expect(state.mcpServer).toBeDefined();
    });

    it('should have all V4 features enabled', () => {
      const state = adapter.getInitialState() as VibeAtlasState;

      expect(state['features']['tokenCounter']).toBe(true);
      expect(state['features']['tryMode']).toBe(true);
      expect(state['features']['persistentMemory']).toBe(true);
      expect(state['features']['mcpServer']).toBe(true);
    });

    it('should initialize tokenCounter state correctly', () => {
      const state = adapter.getInitialState() as VibeAtlasState;

      expect(state.tokenCounter.sessionTokens).toBe(0);
      expect(state.tokenCounter.totalTokens).toBe(0);
      expect(state.tokenCounter.savingsPercent).toBe(0);
      expect(state.tokenCounter.visible).toBe(true);
    });

    it('should initialize tryMode state correctly', () => {
      const state = adapter.getInitialState() as VibeAtlasState;

      expect(state.tryMode.enabled).toBe(false);
      expect(state.tryMode.daysRemaining).toBe(14);
      expect(state.tryMode.activatedAt).toBeNull();
      expect(state.tryMode.conversionDecision).toBe('pending');
    });

    it('should initialize dashboard state correctly', () => {
      const state = adapter.getInitialState() as VibeAtlasState;

      expect(state.dashboard.totalSavings).toBe(0);
      expect(state.dashboard.sessionsTracked).toBe(0);
      expect(state.dashboard.sharedCount).toBe(0);
      expect(state.dashboard.lastExport).toBeNull();
    });

    it('should initialize performance state correctly', () => {
      const state = adapter.getInitialState() as VibeAtlasState;

      expect(state.performanceOptimization.avgResponseTime).toBe(50);
      expect(state.performanceOptimization.optimizationLevel).toBe('medium');
    });
  });

  describe('applyAction', () => {
    it('should handle token counter view action', () => {
      const initialState = adapter.getInitialState();
      const action: UserAction = {
        type: ActionType.USE_FEATURE,
        feature: 'tokenCounter',
        description: 'Check token usage',
        expectedOutcome: 'View current token usage',
      };

      const newState = adapter.applyAction(initialState, action) as VibeAtlasState;

      expect(newState.tokenCounter.visible).toBe(true);
    });

    it('should handle try mode activation', () => {
      const initialState = adapter.getInitialState();
      const action: UserAction = {
        type: ActionType.CONFIGURE,
        feature: 'tryMode',
        description: 'Start 14-day trial',
        expectedOutcome: 'Activate try mode',
      };

      const newState = adapter.applyAction(initialState, action) as VibeAtlasState;

      expect(newState.tryMode.enabled).toBe(true);
      expect(newState.tryMode.daysRemaining).toBe(14);
      expect(newState.tryMode.activatedAt).not.toBeNull();
    });

    it('should handle context preview action', () => {
      const initialState = adapter.getInitialState();
      const action: UserAction = {
        type: ActionType.USE_FEATURE,
        feature: 'contextPreview',
        description: 'Review AI context before sending',
        expectedOutcome: 'See context optimization',
      };

      const newState = adapter.applyAction(initialState, action) as VibeAtlasState;

      expect(newState.contextPreview.userReviewed).toBe(true);
      expect(newState.contextPreview.optimizationApplied).toBe(true);
      expect(newState.contextPreview.beforeContext.length).toBeGreaterThan(0);
    });

    it('should handle dashboard share action', () => {
      const initialState = adapter.getInitialState();
      const action: UserAction = {
        type: ActionType.SHARE,
        feature: 'dashboard',
        description: 'Share savings on Twitter',
        expectedOutcome: 'Post results',
      };

      const newState = adapter.applyAction(initialState, action) as VibeAtlasState;

      expect(newState.dashboard.sharedCount).toBe(1);
    });

    it('should handle persistent memory capture', () => {
      const initialState = adapter.getInitialState();
      const action: UserAction = {
        type: ActionType.USE_FEATURE,
        feature: 'persistentMemory',
        description: 'Save project context',
        expectedOutcome: 'Capture context',
      };

      const newState = adapter.applyAction(initialState, action) as VibeAtlasState;

      expect(newState.persistentMemory.contextsCaptured).toBe(1);
    });

    it('should track events even for unknown actions', () => {
      const initialState = adapter.getInitialState();
      const action: UserAction = {
        type: ActionType.USE_FEATURE,
        feature: 'unknownFeature',
        description: 'Unknown action',
        expectedOutcome: 'Nothing',
      };

      const newState = adapter.applyAction(initialState, action) as VibeAtlasState;

      // AutoCapture feature should still track the event
      expect(newState.autoCapture.eventsTracked).toBe(1);
    });

    it('should not mutate original state', () => {
      const initialState = adapter.getInitialState();
      const originalStateJson = JSON.stringify(initialState);

      const action: UserAction = {
        type: ActionType.CONFIGURE,
        feature: 'tryMode',
        description: 'Start trial',
        expectedOutcome: 'Activate',
      };

      adapter.applyAction(initialState, action);

      expect(JSON.stringify(initialState)).toBe(originalStateJson);
    });
  });

  describe('getAvailableActions', () => {
    it('should return appropriate actions for skeptical persona', () => {
      const state = adapter.getInitialState() as VibeAtlasState;
      const actions = adapter.getAvailableActions(state, mockPersona);

      expect(actions.length).toBeGreaterThan(0);

      // Skeptical persona should have high-priority trial action
      const tryModeAction = actions.find(a => a.type === ActionType.CONFIGURE && a.feature === 'tryMode');
      expect(tryModeAction).toBeDefined();
      if (tryModeAction !== undefined && tryModeAction.metadata !== undefined) {
        expect(tryModeAction.metadata['priority']).toBeGreaterThan(0.8);
      }
    });

    it('should return token counter actions for cost-focused persona', () => {
      const state = adapter.getInitialState() as VibeAtlasState;
      const actions = adapter.getAvailableActions(state, mockPersona);

      const tokenAction = actions.find(a => a.feature === 'tokenCounter');
      expect(tokenAction).toBeDefined();
      if (tokenAction !== undefined && tokenAction.metadata !== undefined) {
        expect(tokenAction.metadata['priority']).toBeGreaterThan(0.5);
      }
    });

    it('should return context preview actions for quality-focused persona', () => {
      const state = adapter.getInitialState() as VibeAtlasState;
      const actions = adapter.getAvailableActions(state, mockPersona);

      const previewAction = actions.find(a => a.feature === 'contextPreview');
      expect(previewAction).toBeDefined();
      if (previewAction !== undefined && previewAction.metadata !== undefined) {
        expect(previewAction.metadata['priority']).toBeGreaterThan(0.9);
      }
    });

    it('should return persistent memory actions for expert persona', () => {
      const state = adapter.getInitialState() as VibeAtlasState;
      const actions = adapter.getAvailableActions(state, mockPersona);

      const memoryAction = actions.find(a => a.feature === 'persistentMemory');
      expect(memoryAction).toBeDefined();
    });

    it('should not return share action when savings are low', () => {
      const state = adapter.getInitialState() as VibeAtlasState;
      const actions = adapter.getAvailableActions(state, mockPersona);

      const shareAction = actions.find(a => a.type === ActionType.SHARE && a.feature === 'dashboard');
      expect(shareAction).toBeUndefined();
    });

    it('should return share action when savings are high', () => {
      const state = adapter.getInitialState() as VibeAtlasState;
      state.tokenCounter.savingsPercent = 40;

      const actions = adapter.getAvailableActions(state, mockPersona);

      const shareAction = actions.find(a => a.type === ActionType.SHARE && a.feature === 'dashboard');
      expect(shareAction).toBeDefined();
    });

    it('should not return disabled feature actions', () => {
      const state = adapter.getInitialState() as VibeAtlasState;
      state['features']['mcpServer'] = false;

      const actions = adapter.getAvailableActions(state, mockPersona);

      const mcpAction = actions.find(a => a.feature === 'mcpServer');
      expect(mcpAction).toBeUndefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle full try mode lifecycle', () => {
      let state = adapter.getInitialState() as VibeAtlasState;

      // Activate try mode
      const activateAction: UserAction = {
        type: ActionType.CONFIGURE,
        feature: 'tryMode',
        description: 'Start 14-day trial',
        expectedOutcome: 'Activate',
      };
      state = adapter.applyAction(state, activateAction) as VibeAtlasState;
      expect(state.tryMode.enabled).toBe(true);

      // Day passes
      const dayAction: UserAction = {
        type: ActionType.USE_FEATURE,
        feature: 'tryMode',
        description: 'day elapsed',
        expectedOutcome: 'Decrement days',
      };
      state = adapter.applyAction(state, dayAction) as VibeAtlasState;
      expect(state.tryMode.daysRemaining).toBe(13);
    });

    it('should handle coding session with token tracking', () => {
      let state = adapter.getInitialState() as VibeAtlasState;

      const codingAction: UserAction = {
        type: ActionType.USE_FEATURE,
        feature: 'coding', // Feature name different from tokenCounter to trigger coding session logic
        description: 'coding session started',
        expectedOutcome: 'Track tokens',
      };

      state = adapter.applyAction(state, codingAction) as VibeAtlasState;
      expect(state.tokenCounter.totalTokens).toBeGreaterThan(0);
      expect(state.tokenCounter.savingsPercent).toBeGreaterThan(0);
    });

    it('should handle dashboard export workflow', () => {
      let state = adapter.getInitialState() as VibeAtlasState;

      // View dashboard
      const viewAction: UserAction = {
        type: ActionType.USE_FEATURE,
        feature: 'dashboard',
        description: 'Open analytics dashboard',
        expectedOutcome: 'View stats',
      };
      state = adapter.applyAction(state, viewAction) as VibeAtlasState;
      expect(state.dashboard.sessionsTracked).toBe(1);

      // Export dashboard
      const exportAction: UserAction = {
        type: ActionType.USE_FEATURE,
        feature: 'dashboard',
        description: 'Export dashboard data',
        expectedOutcome: 'Download',
      };
      state = adapter.applyAction(state, exportAction) as VibeAtlasState;
      expect(state.dashboard.lastExport).not.toBeNull();
    });
  });
});
