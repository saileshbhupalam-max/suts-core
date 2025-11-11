/**
 * Feature Tests
 * Comprehensive tests for all VibeAtlas features
 */

import { ActionType, type PersonaProfile, type UserAction } from '@suts/core';
import type { VibeAtlasState } from '../src/models/VibeAtlasState';
import { TokenCounterFeature } from '../src/features/TokenCounter';
import { ContextPreviewFeature } from '../src/features/ContextPreview';
import { TryModeFeature } from '../src/features/TryMode';
import { DashboardFeature } from '../src/features/Dashboard';
import { PersistentMemoryFeature } from '../src/features/PersistentMemory';
import { PerformanceOptFeature } from '../src/features/PerformanceOpt';
import { AutoCaptureFeature } from '../src/features/AutoCapture';
import { SessionReportsFeature } from '../src/features/SessionReports';
import { MCPServerFeature } from '../src/features/MCPServer';

// Helper to create mock state
function createMockState(): VibeAtlasState {
  return {
    version: '0.4.0',
    features: {
      tokenCounter: true,
      contextPreview: true,
      tryMode: true,
      dashboard: true,
      persistentMemory: true,
      performanceOpt: true,
      autoCapture: true,
      sessionReports: true,
      mcpServer: true,
    },
    uiElements: {},
    config: {},
    userData: {},
    environment: 'development',
    metadata: {},
    tokenCounter: {
      sessionTokens: 0,
      totalTokens: 0,
      savingsPercent: 0,
      visible: true,
    },
    contextPreview: {
      beforeContext: [],
      afterContext: [],
      optimizationApplied: false,
      userReviewed: false,
    },
    tryMode: {
      enabled: false,
      daysRemaining: 14,
      activatedAt: null,
      conversionDecision: 'pending',
    },
    dashboard: {
      totalSavings: 0,
      sessionsTracked: 0,
      sharedCount: 0,
      lastExport: null,
    },
    persistentMemory: {
      schemasStored: 0,
      reposTracked: 0,
      contextsCaptured: 0,
      retrievalSuccessRate: 0,
    },
    performanceOptimization: {
      avgResponseTime: 50,
      optimizationLevel: 'medium',
    },
    autoCapture: {
      eventsTracked: 0,
      telemetryEnabled: true,
    },
    sessionReports: {
      reportsGenerated: 0,
      lastReportDate: null,
    },
    mcpServer: {
      enabled: false,
      connectionsActive: 0,
    },
  };
}

// Helper to create mock persona
function createMockPersona(overrides?: Partial<PersonaProfile>): PersonaProfile {
  return {
    id: 'test-persona',
    archetype: 'Test Developer',
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
    typicalWorkflow: 'Typical workflow',
    timeAvailability: '2-4 hours/day',
    collaborationStyle: 'Solo',
    state: {},
    history: [],
    confidenceScore: 0.5,
    lastUpdated: new Date().toISOString(),
    source: 'test',
    ...overrides,
  };
}

describe('TokenCounterFeature', () => {
  let feature: TokenCounterFeature;
  let state: VibeAtlasState;
  let persona: PersonaProfile;

  beforeEach(() => {
    feature = new TokenCounterFeature();
    state = createMockState();
    persona = createMockPersona({ goals: ['Reduce costs'] });
  });

  it('should have correct name', () => {
    expect(feature.name).toBe('tokenCounter');
  });

  it('should handle view action', () => {
    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'tokenCounter',
      description: 'view token count',
      expectedOutcome: 'See tokens',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.tokenCounter.visible).toBe(true);
  });

  it('should handle toggle action', () => {
    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'tokenCounter',
      description: 'toggle visibility',
      expectedOutcome: 'Hide counter',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.tokenCounter.visible).toBe(false);
  });

  it('should accumulate tokens during coding session', () => {
    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'any',
      description: 'coding session started',
      expectedOutcome: 'Track tokens',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.tokenCounter.totalTokens).toBeGreaterThan(0);
    expect(newState.tokenCounter.sessionTokens).toBeGreaterThan(0);
    expect(newState.tokenCounter.savingsPercent).toBeGreaterThan(0);
  });

  it('should return actions for cost-focused persona', () => {
    const actions = feature.getAvailableActions(state, persona);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0]?.metadata?.['priority']).toBeGreaterThan(0.8);
  });

  it('should return lower priority for non-cost-focused persona', () => {
    const nonCostPersona = createMockPersona({ goals: ['Code quality'] });
    const actions = feature.getAvailableActions(state, nonCostPersona);
    expect(actions.length).toBeGreaterThan(0);
    if (actions[0]?.metadata?.['priority'] !== undefined) {
      expect(actions[0].metadata['priority']).toBeLessThan(0.7);
    }
  });

  it('should not return actions when feature is disabled', () => {
    state['features']['tokenCounter'] = false;
    const actions = feature.getAvailableActions(state, persona);
    expect(actions.length).toBe(0);
  });
});

describe('ContextPreviewFeature', () => {
  let feature: ContextPreviewFeature;
  let state: VibeAtlasState;
  let persona: PersonaProfile;

  beforeEach(() => {
    feature = new ContextPreviewFeature();
    state = createMockState();
    persona = createMockPersona({ goals: ['Code quality'] });
  });

  it('should have correct name', () => {
    expect(feature.name).toBe('contextPreview');
  });

  it('should handle preview action', () => {
    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'contextPreview',
      description: 'preview context',
      expectedOutcome: 'See optimization',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.contextPreview.userReviewed).toBe(true);
    expect(newState.contextPreview.optimizationApplied).toBe(true);
    expect(newState.contextPreview.beforeContext.length).toBeGreaterThan(0);
    expect(newState.contextPreview.afterContext.length).toBeLessThan(newState.contextPreview.beforeContext.length);
  });

  it('should handle revert action', () => {
    state.contextPreview.optimizationApplied = true;
    state.contextPreview.beforeContext = ['file1', 'file2'];
    state.contextPreview.afterContext = ['file1'];

    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'contextPreview',
      description: 'revert context changes',
      expectedOutcome: 'Restore original',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.contextPreview.optimizationApplied).toBe(false);
  });

  it('should return high priority for quality-focused persona', () => {
    const actions = feature.getAvailableActions(state, persona);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0]?.metadata?.['priority']).toBeGreaterThan(0.9);
  });

  it('should return revert action when optimization is applied', () => {
    state.contextPreview.optimizationApplied = true;
    const actions = feature.getAvailableActions(state, persona);
    const revertAction = actions.find(a => a.description.toLowerCase().includes('revert'));
    expect(revertAction).toBeDefined();
  });
});

describe('TryModeFeature', () => {
  let feature: TryModeFeature;
  let state: VibeAtlasState;
  let persona: PersonaProfile;

  beforeEach(() => {
    feature = new TryModeFeature();
    state = createMockState();
    persona = createMockPersona({ riskTolerance: 0.3 });
  });

  it('should have correct name', () => {
    expect(feature.name).toBe('tryMode');
  });

  it('should handle activation', () => {
    const action: UserAction = {
      type: ActionType.CONFIGURE,
      feature: 'tryMode',
      description: 'activate try mode',
      expectedOutcome: 'Start trial',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.tryMode.enabled).toBe(true);
    expect(newState.tryMode.daysRemaining).toBe(14);
    expect(newState.tryMode.activatedAt).not.toBeNull();
  });

  it('should handle day elapsed', () => {
    state.tryMode.enabled = true;
    state.tryMode.daysRemaining = 5;

    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'tryMode',
      description: 'day elapsed',
      expectedOutcome: 'Decrement days',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.tryMode.daysRemaining).toBe(4);
  });

  it('should expire try mode when days reach zero', () => {
    state.tryMode.enabled = true;
    state.tryMode.daysRemaining = 1;
    state.tokenCounter.savingsPercent = 50; // High satisfaction

    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'tryMode',
      description: 'day elapsed',
      expectedOutcome: 'Expire trial',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.tryMode.enabled).toBe(false);
    expect(newState.tryMode.conversionDecision).not.toBe('pending');
  });

  it('should return high priority for skeptical persona', () => {
    const actions = feature.getAvailableActions(state, persona);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0]?.metadata?.['priority']).toBeGreaterThan(0.8);
  });

  it('should not return activation action when already enabled', () => {
    state.tryMode.enabled = true;
    const actions = feature.getAvailableActions(state, persona);
    expect(actions.length).toBe(0);
  });
});

describe('DashboardFeature', () => {
  let feature: DashboardFeature;
  let state: VibeAtlasState;
  let persona: PersonaProfile;

  beforeEach(() => {
    feature = new DashboardFeature();
    state = createMockState();
    persona = createMockPersona();
  });

  it('should have correct name', () => {
    expect(feature.name).toBe('dashboard');
  });

  it('should handle export action', () => {
    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'dashboard',
      description: 'export dashboard data',
      expectedOutcome: 'Download report',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.dashboard.lastExport).not.toBeNull();
  });

  it('should handle share action', () => {
    const action: UserAction = {
      type: ActionType.SHARE,
      feature: 'dashboard',
      description: 'share savings',
      expectedOutcome: 'Post to social media',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.dashboard.sharedCount).toBe(1);
  });

  it('should track sessions when viewing dashboard', () => {
    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'dashboard',
      description: 'open dashboard',
      expectedOutcome: 'View stats',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.dashboard.sessionsTracked).toBe(1);
  });

  it('should return share action only when savings are high', () => {
    state.tokenCounter.savingsPercent = 40;
    const actions = feature.getAvailableActions(state, persona);
    const shareAction = actions.find(a => a.type === ActionType.SHARE);
    expect(shareAction).toBeDefined();
  });

  it('should not return share action when savings are low', () => {
    state.tokenCounter.savingsPercent = 20;
    const actions = feature.getAvailableActions(state, persona);
    const shareAction = actions.find(a => a.type === ActionType.SHARE);
    expect(shareAction).toBeUndefined();
  });
});

describe('PersistentMemoryFeature', () => {
  let feature: PersistentMemoryFeature;
  let state: VibeAtlasState;
  let persona: PersonaProfile;

  beforeEach(() => {
    feature = new PersistentMemoryFeature();
    state = createMockState();
    persona = createMockPersona({ experienceLevel: 'Expert' });
  });

  it('should have correct name', () => {
    expect(feature.name).toBe('persistentMemory');
  });

  it('should handle capture action', () => {
    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'persistentMemory',
      description: 'capture context',
      expectedOutcome: 'Save context',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.persistentMemory.contextsCaptured).toBe(1);
    expect(newState.persistentMemory.schemasStored).toBeGreaterThanOrEqual(0);
  });

  it('should handle retrieve action', () => {
    state.persistentMemory.contextsCaptured = 10;

    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'persistentMemory',
      description: 'retrieve context',
      expectedOutcome: 'Load context',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.persistentMemory.retrievalSuccessRate).toBeGreaterThan(0);
  });

  it('should only return actions for expert users', () => {
    const actions = feature.getAvailableActions(state, persona);
    expect(actions.length).toBeGreaterThan(0);
  });

  it('should not return actions for novice users', () => {
    const novicePersona = createMockPersona({ experienceLevel: 'Novice' });
    const actions = feature.getAvailableActions(state, novicePersona);
    expect(actions.length).toBe(0);
  });
});

describe('PerformanceOptFeature', () => {
  let feature: PerformanceOptFeature;
  let state: VibeAtlasState;
  let persona: PersonaProfile;

  beforeEach(() => {
    feature = new PerformanceOptFeature();
    state = createMockState();
    persona = createMockPersona({ goals: ['Improve speed'], painPoints: ['Slow responses'] });
  });

  it('should have correct name', () => {
    expect(feature.name).toBe('performanceOpt');
  });

  it('should handle optimize action', () => {
    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'performanceOpt',
      description: 'optimize performance',
      expectedOutcome: 'Improve speed',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.performanceOptimization.avgResponseTime).toBeLessThan(state.performanceOptimization.avgResponseTime);
  });

  it('should upgrade optimization level', () => {
    state.performanceOptimization.optimizationLevel = 'low';

    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'performanceOpt',
      description: 'optimize',
      expectedOutcome: 'Improve',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.performanceOptimization.optimizationLevel).toBe('medium');
  });

  it('should return actions for performance-focused persona', () => {
    const actions = feature.getAvailableActions(state, persona);
    expect(actions.length).toBeGreaterThan(0);
  });
});

describe('AutoCaptureFeature', () => {
  let feature: AutoCaptureFeature;
  let state: VibeAtlasState;
  let persona: PersonaProfile;

  beforeEach(() => {
    feature = new AutoCaptureFeature();
    state = createMockState();
    persona = createMockPersona();
  });

  it('should have correct name', () => {
    expect(feature.name).toBe('autoCapture');
  });

  it('should increment events when enabled', () => {
    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'any',
      description: 'any action',
      expectedOutcome: 'Track event',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.autoCapture.eventsTracked).toBe(1);
  });

  it('should handle disable action', () => {
    const action: UserAction = {
      type: ActionType.CONFIGURE,
      feature: 'autoCapture',
      description: 'disable telemetry',
      expectedOutcome: 'Stop tracking',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.autoCapture.telemetryEnabled).toBe(false);
  });

  it('should return disable action for privacy-concerned persona', () => {
    const privacyPersona = createMockPersona({ fears: ['Privacy concerns'] });
    const actions = feature.getAvailableActions(state, privacyPersona);
    const disableAction = actions.find(a => a.description.toLowerCase().includes('disable'));
    expect(disableAction).toBeDefined();
  });
});

describe('SessionReportsFeature', () => {
  let feature: SessionReportsFeature;
  let state: VibeAtlasState;
  let persona: PersonaProfile;

  beforeEach(() => {
    feature = new SessionReportsFeature();
    state = createMockState();
    persona = createMockPersona({ role: 'Engineering Manager' });
  });

  it('should have correct name', () => {
    expect(feature.name).toBe('sessionReports');
  });

  it('should handle generate action', () => {
    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'sessionReports',
      description: 'generate report',
      expectedOutcome: 'Create report',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.sessionReports.reportsGenerated).toBe(1);
    expect(newState.sessionReports.lastReportDate).not.toBeNull();
  });

  it('should return actions for managers', () => {
    const actions = feature.getAvailableActions(state, persona);
    expect(actions.length).toBeGreaterThan(0);
  });
});

describe('MCPServerFeature', () => {
  let feature: MCPServerFeature;
  let state: VibeAtlasState;
  let persona: PersonaProfile;

  beforeEach(() => {
    feature = new MCPServerFeature();
    state = createMockState();
    persona = createMockPersona({ experienceLevel: 'Expert', techAdoption: 'Early adopter' });
  });

  it('should have correct name', () => {
    expect(feature.name).toBe('mcpServer');
  });

  it('should handle enable action', () => {
    const action: UserAction = {
      type: ActionType.CONFIGURE,
      feature: 'mcpServer',
      description: 'enable mcp server',
      expectedOutcome: 'Start server',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.mcpServer.enabled).toBe(true);
  });

  it('should handle connect action', () => {
    state.mcpServer.enabled = true;

    const action: UserAction = {
      type: ActionType.USE_FEATURE,
      feature: 'mcpServer',
      description: 'connect to server',
      expectedOutcome: 'Establish connection',
    };

    const newState = feature.applyAction(state, action, persona);
    expect(newState.mcpServer.connectionsActive).toBe(1);
  });

  it('should only return actions for advanced users', () => {
    const actions = feature.getAvailableActions(state, persona);
    expect(actions.length).toBeGreaterThan(0);
  });

  it('should not return actions for novice users', () => {
    const novicePersona = createMockPersona({ experienceLevel: 'Novice', techAdoption: 'Late majority' });
    const actions = feature.getAvailableActions(state, novicePersona);
    expect(actions.length).toBe(0);
  });
});
