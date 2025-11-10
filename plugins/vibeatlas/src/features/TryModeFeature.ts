/**
 * Try mode feature simulation
 */

import type { ProductState, UserAction, PersonaProfile } from '@suts/core';
import { ActionType } from '@suts/core';

/**
 * Try mode state
 */
export interface TryModeState {
  enabled: boolean;
  tokensUsed: number;
  tokensRemaining: number;
  expiresAt: Date | null;
  activated: boolean;
}

/**
 * Enable try mode
 */
export function enableTryMode(state: ProductState, tokenLimit: number, durationDays: number): ProductState {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  return {
    ...state,
    userData: {
      ...state.userData,
      tryMode: {
        enabled: true,
        tokensUsed: 0,
        tokensRemaining: tokenLimit,
        expiresAt,
        activated: true,
      } as TryModeState,
    },
  };
}

/**
 * Use tokens in try mode
 */
export function useTryModeTokens(state: ProductState, tokensToUse: number): ProductState {
  const tryMode = state.userData['tryMode'] as TryModeState | undefined;
  if (tryMode === undefined || tryMode.enabled === false) {
    return state;
  }

  const tokensUsed = tryMode.tokensUsed + tokensToUse;
  const tokensRemaining = Math.max(0, tryMode.tokensRemaining - tokensToUse);

  return {
    ...state,
    userData: {
      ...state.userData,
      tryMode: {
        ...tryMode,
        tokensUsed,
        tokensRemaining,
        enabled: tokensRemaining > 0,
      } as TryModeState,
    },
  };
}

/**
 * Expire try mode
 */
export function expireTryMode(state: ProductState): ProductState {
  const tryMode = state.userData['tryMode'] as TryModeState | undefined;
  if (tryMode === undefined) {
    return state;
  }

  return {
    ...state,
    userData: {
      ...state.userData,
      tryMode: {
        ...tryMode,
        enabled: false,
      } as TryModeState,
    },
  };
}

/**
 * Check if try mode is active
 */
export function isTryModeActive(state: ProductState): boolean {
  const tryMode = state.userData['tryMode'] as TryModeState | undefined;
  if (tryMode === undefined) {
    return false;
  }

  const now = new Date();
  const expiresAt = tryMode.expiresAt;
  const expired = expiresAt !== null && now > expiresAt;

  return tryMode.enabled === true && tryMode.tokensRemaining > 0 && expired === false;
}

/**
 * Get available try mode actions
 */
export function getTryModeActions(state: ProductState, persona: PersonaProfile): UserAction[] {
  const actions: UserAction[] = [];
  const tryMode = state.userData['tryMode'] as TryModeState | undefined;

  if (tryMode === undefined || tryMode.activated === false) {
    actions.push({
      type: ActionType.CONFIGURE,
      feature: 'tryMode',
      description: 'Enable try mode to test VibeAtlas',
      expectedOutcome: 'Try mode activated with token limit',
      metadata: { persona: persona.id },
    });
  }

  if (isTryModeActive(state) === true) {
    actions.push({
      type: ActionType.USE_FEATURE,
      feature: 'tryMode',
      description: 'Use VibeAtlas in try mode',
      expectedOutcome: 'Tokens consumed, feature works as expected',
      metadata: { tokensRemaining: tryMode?.tokensRemaining, persona: persona.id },
    });
  }

  return actions;
}
