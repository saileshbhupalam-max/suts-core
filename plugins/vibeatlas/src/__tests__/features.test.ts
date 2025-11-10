/**
 * Tests for feature modules
 */

import type { ProductState } from '@suts/core';
import {
  enableTryMode,
  useTryModeTokens,
  expireTryMode,
  isTryModeActive,
  getTryModeActions,
} from '../features/TryModeFeature';
import {
  initializeTokenCounter,
  updateTokenCount,
  toggleTokenCounter,
  isTokenCounterWarning,
  isTokenCounterAlert,
  getTokenCounterActions,
} from '../features/TokenCounterFeature';
import {
  initializeContextPreview,
  showContextPreview,
  hideContextPreview,
  changePreviewPosition,
  isContextPreviewShowing,
  getContextPreviewActions,
} from '../features/ContextPreviewFeature';
import {
  initializeDashboard,
  openDashboard,
  closeDashboard,
  shareDashboard,
  exportDashboard,
  isDashboardOpen,
  getDashboardActions,
} from '../features/DashboardFeature';
import { earlyAdopter } from '../testdata/PersonaTemplates';

describe('TryModeFeature', () => {
  let initialState: ProductState;

  beforeEach(() => {
    initialState = {
      version: '1.0.0',
      features: { tryMode: true },
      uiElements: {},
      config: {},
      userData: {},
      environment: 'development' as const,
      metadata: {},
    };
  });

  it('should enable try mode', () => {
    const state = enableTryMode(initialState, 100000, 14);
    const tryMode = state.userData.tryMode as { enabled: boolean; tokensRemaining: number; activated: boolean } | undefined;

    expect(tryMode).toBeDefined();
    expect(tryMode?.enabled).toBe(true);
    expect(tryMode?.tokensRemaining).toBe(100000);
    expect(tryMode?.activated).toBe(true);
  });

  it('should use try mode tokens', () => {
    let state = enableTryMode(initialState, 100000, 14);
    state = useTryModeTokens(state, 5000);

    const tryMode = state.userData.tryMode as { tokensUsed: number; tokensRemaining: number } | undefined;

    expect(tryMode?.tokensUsed).toBe(5000);
    expect(tryMode?.tokensRemaining).toBe(95000);
  });

  it('should disable try mode when tokens exhausted', () => {
    let state = enableTryMode(initialState, 1000, 14);
    state = useTryModeTokens(state, 1500);

    const tryMode = state.userData.tryMode as { enabled: boolean; tokensRemaining: number } | undefined;

    expect(tryMode?.enabled).toBe(false);
    expect(tryMode?.tokensRemaining).toBe(0);
  });

  it('should expire try mode', () => {
    let state = enableTryMode(initialState, 100000, 14);
    state = expireTryMode(state);

    const tryMode = state.userData.tryMode as { enabled: boolean } | undefined;

    expect(tryMode?.enabled).toBe(false);
  });

  it('should check if try mode is active', () => {
    let state = enableTryMode(initialState, 100000, 14);

    expect(isTryModeActive(state)).toBe(true);

    state = expireTryMode(state);

    expect(isTryModeActive(state)).toBe(false);
  });

  it('should get try mode actions', () => {
    const actions = getTryModeActions(initialState, earlyAdopter);

    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0]?.feature).toBe('tryMode');
  });
});

describe('TokenCounterFeature', () => {
  let initialState: ProductState;

  beforeEach(() => {
    initialState = {
      features: { tokenCounter: true },
      uiElements: {},
      data: {},
      version: '1.0.0',
    };
  });

  it('should initialize token counter', () => {
    const state = initializeTokenCounter(initialState);
    const counter = state.userData.tokenCounter as { visible: boolean; currentTokens: number } | undefined;

    expect(counter).toBeDefined();
    expect(counter?.visible).toBe(true);
    expect(counter?.currentTokens).toBe(0);
  });

  it('should update token count', () => {
    let state = initializeTokenCounter(initialState);
    state = updateTokenCount(state, 50000);

    const counter = state.userData.tokenCounter as { currentTokens: number } | undefined;

    expect(counter?.currentTokens).toBe(50000);
  });

  it('should show warning at threshold', () => {
    let state = initializeTokenCounter(initialState);
    state = updateTokenCount(state, 160000);

    expect(isTokenCounterWarning(state)).toBe(true);
    expect(isTokenCounterAlert(state)).toBe(false);
  });

  it('should show alert at threshold', () => {
    let state = initializeTokenCounter(initialState);
    state = updateTokenCount(state, 190000);

    expect(isTokenCounterAlert(state)).toBe(true);
  });

  it('should toggle token counter visibility', () => {
    let state = initializeTokenCounter(initialState);
    const initialVisibility = (state.userData.tokenCounter as { visible: boolean } | undefined)?.visible;

    state = toggleTokenCounter(state);
    const toggledVisibility = (state.userData.tokenCounter as { visible: boolean } | undefined)?.visible;

    expect(toggledVisibility).toBe(initialVisibility === false);
  });

  it('should get token counter actions', () => {
    const state = initializeTokenCounter(initialState);
    const actions = getTokenCounterActions(state, earlyAdopter);

    expect(actions.length).toBeGreaterThan(0);
  });
});

describe('ContextPreviewFeature', () => {
  let initialState: ProductState;

  beforeEach(() => {
    initialState = {
      features: { contextPreview: true },
      uiElements: {},
      data: {},
      version: '1.0.0',
    };
  });

  it('should initialize context preview', () => {
    const state = initializeContextPreview(initialState);
    const preview = state.userData.contextPreview as { enabled: boolean; showing: boolean } | undefined;

    expect(preview).toBeDefined();
    expect(preview?.enabled).toBe(true);
    expect(preview?.showing).toBe(false);
  });

  it('should show context preview', () => {
    let state = initializeContextPreview(initialState);
    state = showContextPreview(state, 'before', 'after');

    const preview = state.userData.contextPreview as {
      showing: boolean;
      beforeContext: string;
      afterContext: string;
      usageCount: number;
    } | undefined;

    expect(preview?.showing).toBe(true);
    expect(preview?.beforeContext).toBe('before');
    expect(preview?.afterContext).toBe('after');
    expect(preview?.usageCount).toBe(1);
  });

  it('should hide context preview', () => {
    let state = initializeContextPreview(initialState);
    state = showContextPreview(state, 'before', 'after');
    state = hideContextPreview(state);

    const preview = state.userData.contextPreview as { showing: boolean } | undefined;

    expect(preview?.showing).toBe(false);
  });

  it('should change preview position', () => {
    let state = initializeContextPreview(initialState);
    state = changePreviewPosition(state, 'modal');

    const preview = state.userData.contextPreview as { position: string } | undefined;

    expect(preview?.position).toBe('modal');
  });

  it('should check if context preview is showing', () => {
    let state = initializeContextPreview(initialState);

    expect(isContextPreviewShowing(state)).toBe(false);

    state = showContextPreview(state, 'before', 'after');

    expect(isContextPreviewShowing(state)).toBe(true);
  });

  it('should get context preview actions', () => {
    const state = initializeContextPreview(initialState);
    const actions = getContextPreviewActions(state, earlyAdopter);

    expect(actions.length).toBeGreaterThan(0);
  });
});

describe('DashboardFeature', () => {
  let initialState: ProductState;

  beforeEach(() => {
    initialState = {
      features: { dashboard: true },
      uiElements: {},
      data: {},
      version: '1.0.0',
    };
  });

  it('should initialize dashboard', () => {
    const state = initializeDashboard(initialState);
    const dashboard = state.userData.dashboard as { opened: boolean; sharedCount: number } | undefined;

    expect(dashboard).toBeDefined();
    expect(dashboard?.opened).toBe(false);
    expect(dashboard?.sharedCount).toBe(0);
  });

  it('should open dashboard', () => {
    let state = initializeDashboard(initialState);
    state = openDashboard(state);

    const dashboard = state.userData.dashboard as { opened: boolean } | undefined;

    expect(dashboard?.opened).toBe(true);
  });

  it('should close dashboard', () => {
    let state = initializeDashboard(initialState);
    state = openDashboard(state);
    state = closeDashboard(state);

    const dashboard = state.userData.dashboard as { opened: boolean } | undefined;

    expect(dashboard?.opened).toBe(false);
  });

  it('should share dashboard', () => {
    let state = initializeDashboard(initialState);
    state = shareDashboard(state);

    const dashboard = state.userData.dashboard as { sharedCount: number; lastShared: Date | null } | undefined;

    expect(dashboard?.sharedCount).toBe(1);
    expect(dashboard?.lastShared).toBeDefined();
  });

  it('should export dashboard', () => {
    let state = initializeDashboard(initialState);
    state = exportDashboard(state);

    const dashboard = state.userData.dashboard as { exportedCount: number; lastExported: Date | null } | undefined;

    expect(dashboard?.exportedCount).toBe(1);
    expect(dashboard?.lastExported).toBeDefined();
  });

  it('should check if dashboard is open', () => {
    let state = initializeDashboard(initialState);

    expect(isDashboardOpen(state)).toBe(false);

    state = openDashboard(state);

    expect(isDashboardOpen(state)).toBe(true);
  });

  it('should get dashboard actions', () => {
    const state = initializeDashboard(initialState);
    const actions = getDashboardActions(state, earlyAdopter);

    expect(actions.length).toBeGreaterThan(0);
  });
});
