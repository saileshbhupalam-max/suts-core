/**
 * VibeAtlas product adapter implementation
 */

import type { IProductAdapter, ProductState, UserAction, PersonaProfile } from '@suts/core';
import { ActionType } from '@suts/core';
import { getConfig } from './config/VibeAtlasConfig';
import { defaultFeatureFlags } from './config/FeatureFlags';
import {
  enableTryMode,
  useTryModeTokens,
  expireTryMode,
  getTryModeActions,
  isTryModeActive,
} from './features/TryModeFeature';
import {
  initializeTokenCounter,
  updateTokenCount,
  toggleTokenCounter,
  getTokenCounterActions,
} from './features/TokenCounterFeature';
import {
  initializeContextPreview,
  showContextPreview,
  changePreviewPosition,
  getContextPreviewActions,
} from './features/ContextPreviewFeature';
import {
  initializeDashboard,
  openDashboard,
  shareDashboard,
  exportDashboard,
  updateDashboardMetrics,
  getDashboardActions,
} from './features/DashboardFeature';

/**
 * VibeAtlas product adapter
 * Implements IProductAdapter for VibeAtlas VS Code extension
 */
export class VibeAtlasAdapter implements IProductAdapter {
  private config = getConfig();
  private featureFlags = defaultFeatureFlags;

  /**
   * Get the initial state of VibeAtlas
   */
  getInitialState(): ProductState {
    const features: Record<string, boolean> = {
      tryMode: this.featureFlags.tryMode,
      tokenCounter: this.featureFlags.tokenCounter,
      contextPreview: this.featureFlags.contextPreview,
      dashboard: this.featureFlags.dashboard,
      shareFeature: this.featureFlags.shareFeature,
      exportFeature: this.featureFlags.exportFeature,
    };

    const uiElements: Record<string, Record<string, unknown>> = {
      tryModeBanner: { visible: false, position: 'top' },
      tokenCounter: { visible: true, position: 'statusBar' },
      contextPreview: { visible: false, position: 'sidebar' },
      dashboard: { visible: false, position: 'panel' },
    };

    const data: Record<string, unknown> = {
      installed: true,
      version: this.config.version,
      onboardingCompleted: false,
    };

    return {
      features,
      uiElements,
      data,
      version: this.config.version,
    };
  }

  /**
   * Apply a user action to the current state
   */
  applyAction(state: ProductState, action: UserAction): ProductState {
    let newState = { ...state };

    switch (action.type) {
      case ActionType.INSTALL:
        newState = this.handleInstall(newState, action);
        break;

      case ActionType.CONFIGURE:
        newState = this.handleConfigure(newState, action);
        break;

      case ActionType.USE_FEATURE:
        newState = this.handleUseFeature(newState, action);
        break;

      case ActionType.CUSTOMIZE:
        newState = this.handleCustomize(newState, action);
        break;

      case ActionType.SHARE:
        newState = this.handleShare(newState, action);
        break;

      case ActionType.READ_DOCS:
        newState = this.handleReadDocs(newState, action);
        break;

      case ActionType.SEEK_HELP:
        newState = this.handleSeekHelp(newState, action);
        break;

      case ActionType.UNINSTALL:
        newState = this.handleUninstall(newState, action);
        break;

      default:
        break;
    }

    return newState;
  }

  /**
   * Get available actions for current state and persona
   */
  getAvailableActions(state: ProductState, persona: PersonaProfile): UserAction[] {
    const actions: UserAction[] = [];

    if (state.features.tryMode === true) {
      actions.push(...getTryModeActions(state, persona));
    }

    if (state.features.tokenCounter === true) {
      actions.push(...getTokenCounterActions(state, persona));
    }

    if (state.features.contextPreview === true) {
      actions.push(...getContextPreviewActions(state, persona));
    }

    if (state.features.dashboard === true) {
      actions.push(...getDashboardActions(state, persona));
    }

    actions.push({
      type: ActionType.READ_DOCS,
      feature: 'vibeatlas',
      description: 'Read documentation',
      expectedOutcome: 'User learns about features',
      metadata: { persona: persona.id },
    });

    return actions;
  }

  /**
   * Handle install action
   */
  private handleInstall(state: ProductState, _action: UserAction): ProductState {
    return {
      ...state,
      data: {
        ...state.data,
        installed: true,
        installedAt: new Date(),
      },
    };
  }

  /**
   * Handle configure action
   */
  private handleConfigure(state: ProductState, action: UserAction): ProductState {
    let newState = { ...state };

    if (action.feature === 'tryMode') {
      newState = enableTryMode(newState, this.config.limits.tryModeTokens, this.config.limits.tryModeDurationDays);
    } else if (action.feature === 'tokenCounter') {
      newState = initializeTokenCounter(newState);
    } else if (action.feature === 'contextPreview') {
      newState = initializeContextPreview(newState);
    } else if (action.feature === 'dashboard') {
      newState = initializeDashboard(newState);
    }

    return newState;
  }

  /**
   * Handle use feature action
   */
  private handleUseFeature(state: ProductState, action: UserAction): ProductState {
    let newState = { ...state };

    if (action.feature === 'tryMode') {
      if (isTryModeActive(newState) === true) {
        const tokensToUse = (action.metadata?.tokensUsed as number) ?? 1000;
        newState = useTryModeTokens(newState, tokensToUse);
        newState = updateTokenCount(newState, tokensToUse);
        newState = updateDashboardMetrics(newState, {
          totalTokens: tokensToUse,
          totalSessions: 1,
        });
      } else {
        newState = expireTryMode(newState);
      }
    } else if (action.feature === 'tokenCounter') {
      newState = toggleTokenCounter(newState);
    } else if (action.feature === 'contextPreview') {
      const before = (action.metadata?.beforeContext as string) ?? 'Previous context';
      const after = (action.metadata?.afterContext as string) ?? 'Updated context';
      newState = showContextPreview(newState, before, after);
    } else if (action.feature === 'dashboard') {
      if (action.description.includes('Export') === true || action.description.includes('export') === true) {
        newState = exportDashboard(newState);
      } else {
        newState = openDashboard(newState);
      }
    }

    return newState;
  }

  /**
   * Handle customize action
   */
  private handleCustomize(state: ProductState, action: UserAction): ProductState {
    let newState = { ...state };

    if (action.feature === 'contextPreview') {
      const position = (action.metadata?.position as 'sidebar' | 'modal' | 'inline') ?? 'sidebar';
      newState = changePreviewPosition(newState, position);
    }

    return newState;
  }

  /**
   * Handle share action
   */
  private handleShare(state: ProductState, action: UserAction): ProductState {
    let newState = { ...state };

    if (action.feature === 'dashboard') {
      newState = shareDashboard(newState);
    }

    return newState;
  }

  /**
   * Handle read docs action
   */
  private handleReadDocs(state: ProductState, _action: UserAction): ProductState {
    return {
      ...state,
      data: {
        ...state.data,
        docsRead: true,
        lastDocsReadAt: new Date(),
      },
    };
  }

  /**
   * Handle seek help action
   */
  private handleSeekHelp(state: ProductState, _action: UserAction): ProductState {
    return {
      ...state,
      data: {
        ...state.data,
        helpSought: true,
        lastHelpAt: new Date(),
      },
    };
  }

  /**
   * Handle uninstall action
   */
  private handleUninstall(state: ProductState, _action: UserAction): ProductState {
    return {
      ...state,
      data: {
        ...state.data,
        installed: false,
        uninstalledAt: new Date(),
      },
    };
  }
}
