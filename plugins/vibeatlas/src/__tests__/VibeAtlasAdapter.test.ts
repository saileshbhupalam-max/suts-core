/**
 * Tests for VibeAtlasAdapter
 */

import { VibeAtlasAdapter } from '../VibeAtlasAdapter';
import type { ProductState, UserAction, PersonaProfile } from '@suts/core';
import { ActionType } from '@suts/core';
import { earlyAdopter } from '../testdata/PersonaTemplates';

describe('VibeAtlasAdapter', () => {
  let adapter: VibeAtlasAdapter;
  let persona: PersonaProfile;

  beforeEach(() => {
    adapter = new VibeAtlasAdapter();
    persona = earlyAdopter;
  });

  describe('getInitialState', () => {
    it('should return initial product state', () => {
      const state = adapter.getInitialState();

      expect(state).toBeDefined();
      expect(state.version).toBe('1.0.0');
      expect(state.features.tryMode).toBe(true);
      expect(state.features.tokenCounter).toBe(true);
      expect(state.features.contextPreview).toBe(true);
      expect(state.features.dashboard).toBe(true);
      expect(state.userData.installed).toBe(true);
    });

    it('should initialize all UI elements', () => {
      const state = adapter.getInitialState();

      expect(state.uiElements.tryModeBanner).toBeDefined();
      expect(state.uiElements.tokenCounter).toBeDefined();
      expect(state.uiElements.contextPreview).toBeDefined();
      expect(state.uiElements.dashboard).toBeDefined();
    });
  });

  describe('applyAction', () => {
    let initialState: ProductState;

    beforeEach(() => {
      initialState = adapter.getInitialState();
    });

    it('should handle INSTALL action', () => {
      const action: UserAction = {
        type: ActionType.INSTALL,
        feature: 'vibeatlas',
        description: 'Install extension',
        expectedOutcome: 'Extension installed',
      };

      const newState = adapter.applyAction(initialState, action);

      expect(newState.userData.installed).toBe(true);
      expect(newState.userData.installedAt).toBeDefined();
    });

    it('should handle CONFIGURE action for tryMode', () => {
      const action: UserAction = {
        type: ActionType.CONFIGURE,
        feature: 'tryMode',
        description: 'Enable try mode',
        expectedOutcome: 'Try mode activated',
      };

      const newState = adapter.applyAction(initialState, action);
      const tryMode = newState.userData.tryMode as { enabled: boolean; tokensRemaining: number } | undefined;

      expect(tryMode).toBeDefined();
      expect(tryMode?.enabled).toBe(true);
      expect(tryMode?.tokensRemaining).toBe(100000);
    });

    it('should handle USE_FEATURE action for contextPreview', () => {
      let state = initialState;

      const configAction: UserAction = {
        type: ActionType.CONFIGURE,
        feature: 'contextPreview',
        description: 'Enable context preview',
        expectedOutcome: 'Preview enabled',
      };
      state = adapter.applyAction(state, configAction);

      const useAction: UserAction = {
        type: ActionType.USE_FEATURE,
        feature: 'contextPreview',
        description: 'View context',
        expectedOutcome: 'Context visible',
        metadata: { beforeContext: 'old', afterContext: 'new' },
      };

      const newState = adapter.applyAction(state, useAction);
      const preview = newState.userData.contextPreview as { showing: boolean } | undefined;

      expect(preview).toBeDefined();
      expect(preview?.showing).toBe(true);
    });

    it('should handle SHARE action for dashboard', () => {
      let state = initialState;

      const configAction: UserAction = {
        type: ActionType.CONFIGURE,
        feature: 'dashboard',
        description: 'Initialize dashboard',
        expectedOutcome: 'Dashboard ready',
      };
      state = adapter.applyAction(state, configAction);

      const shareAction: UserAction = {
        type: ActionType.SHARE,
        feature: 'dashboard',
        description: 'Share dashboard',
        expectedOutcome: 'Dashboard shared',
      };

      const newState = adapter.applyAction(state, shareAction);
      const dashboard = newState.userData.dashboard as { sharedCount: number } | undefined;

      expect(dashboard).toBeDefined();
      expect(dashboard?.sharedCount).toBe(1);
    });

    it('should handle UNINSTALL action', () => {
      const action: UserAction = {
        type: ActionType.UNINSTALL,
        feature: 'vibeatlas',
        description: 'Uninstall extension',
        expectedOutcome: 'Extension removed',
      };

      const newState = adapter.applyAction(initialState, action);

      expect(newState.userData.installed).toBe(false);
      expect(newState.userData.uninstalledAt).toBeDefined();
    });
  });

  describe('getAvailableActions', () => {
    it('should return available actions for initial state', () => {
      const state = adapter.getInitialState();
      const actions = adapter.getAvailableActions(state, persona);

      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some((a) => a.feature === 'tryMode')).toBe(true);
      expect(actions.some((a) => a.feature === 'tokenCounter')).toBe(true);
      expect(actions.some((a) => a.feature === 'contextPreview')).toBe(true);
      expect(actions.some((a) => a.feature === 'dashboard')).toBe(true);
    });

    it('should include documentation action', () => {
      const state = adapter.getInitialState();
      const actions = adapter.getAvailableActions(state, persona);

      const docsAction = actions.find((a) => a.type === ActionType.READ_DOCS);
      expect(docsAction).toBeDefined();
    });

    it('should return different actions based on state', () => {
      let state = adapter.getInitialState();

      const configAction: UserAction = {
        type: ActionType.CONFIGURE,
        feature: 'tryMode',
        description: 'Enable try mode',
        expectedOutcome: 'Try mode activated',
      };
      state = adapter.applyAction(state, configAction);

      const actions = adapter.getAvailableActions(state, persona);
      const tryModeActions = actions.filter((a) => a.feature === 'tryMode');

      expect(tryModeActions.length).toBeGreaterThan(0);
    });
  });
});
