/**
 * Token counter feature
 */

import type { ProductState, UserAction, PersonaProfile } from '@suts/core';
import { ActionType } from '@suts/core';

/**
 * Token counter state
 */
export interface TokenCounterState {
  visible: boolean;
  currentTokens: number;
  warningThreshold: number;
  alertThreshold: number;
  showWarning: boolean;
  showAlert: boolean;
}

/**
 * Initialize token counter
 */
export function initializeTokenCounter(state: ProductState): ProductState {
  return {
    ...state,
    userData: {
      ...state.userData,
      tokenCounter: {
        visible: true,
        currentTokens: 0,
        warningThreshold: 150000,
        alertThreshold: 180000,
        showWarning: false,
        showAlert: false,
      } as TokenCounterState,
    },
  };
}

/**
 * Update token count
 */
export function updateTokenCount(state: ProductState, tokens: number): ProductState {
  const counter = state.userData.tokenCounter as TokenCounterState | undefined;
  if (counter === undefined) {
    return initializeTokenCounter(state);
  }

  const currentTokens = tokens;
  const showWarning = currentTokens >= counter.warningThreshold && currentTokens < counter.alertThreshold;
  const showAlert = currentTokens >= counter.alertThreshold;

  return {
    ...state,
    userData: {
      ...state.userData,
      tokenCounter: {
        ...counter,
        currentTokens,
        showWarning,
        showAlert,
      } as TokenCounterState,
    },
  };
}

/**
 * Toggle token counter visibility
 */
export function toggleTokenCounter(state: ProductState): ProductState {
  const counter = state.userData.tokenCounter as TokenCounterState | undefined;
  if (counter === undefined) {
    return state;
  }

  return {
    ...state,
    userData: {
      ...state.userData,
      tokenCounter: {
        ...counter,
        visible: counter.visible === false,
      } as TokenCounterState,
    },
  };
}

/**
 * Check if token counter shows warning
 */
export function isTokenCounterWarning(state: ProductState): boolean {
  const counter = state.userData.tokenCounter as TokenCounterState | undefined;
  return counter !== undefined && counter.showWarning === true;
}

/**
 * Check if token counter shows alert
 */
export function isTokenCounterAlert(state: ProductState): boolean {
  const counter = state.userData.tokenCounter as TokenCounterState | undefined;
  return counter !== undefined && counter.showAlert === true;
}

/**
 * Get available token counter actions
 */
export function getTokenCounterActions(state: ProductState, persona: PersonaProfile): UserAction[] {
  const actions: UserAction[] = [];
  const counter = state.userData.tokenCounter as TokenCounterState | undefined;

  if (counter === undefined) {
    actions.push({
      type: ActionType.CONFIGURE,
      feature: 'tokenCounter',
      description: 'Enable token counter',
      expectedOutcome: 'Token counter is visible',
      metadata: { persona: persona.id },
    });
  } else {
    actions.push({
      type: ActionType.USE_FEATURE,
      feature: 'tokenCounter',
      description: counter.visible === true ? 'Hide token counter' : 'Show token counter',
      expectedOutcome: 'Token counter visibility toggled',
      metadata: { currentTokens: counter.currentTokens, persona: persona.id },
    });

    if (counter.showWarning === true || counter.showAlert === true) {
      actions.push({
        type: ActionType.USE_FEATURE,
        feature: 'tokenCounter',
        description: 'Check token usage warning',
        expectedOutcome: 'User aware of high token usage',
        metadata: { warning: counter.showWarning, alert: counter.showAlert, persona: persona.id },
      });
    }
  }

  return actions;
}
