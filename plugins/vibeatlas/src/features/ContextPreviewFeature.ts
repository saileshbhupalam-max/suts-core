/**
 * Context preview feature (before/after)
 */

import type { ProductState, UserAction, PersonaProfile } from '@suts/core';
import { ActionType } from '@suts/core';

/**
 * Context preview state
 */
export interface ContextPreviewState {
  enabled: boolean;
  beforeContext: string;
  afterContext: string;
  showing: boolean;
  position: 'sidebar' | 'modal' | 'inline';
  usageCount: number;
}

/**
 * Initialize context preview
 */
export function initializeContextPreview(state: ProductState): ProductState {
  return {
    ...state,
    userData: {
      ...state.data,
      contextPreview: {
        enabled: true,
        beforeContext: '',
        afterContext: '',
        showing: false,
        position: 'sidebar',
        usageCount: 0,
      } as ContextPreviewState,
    },
  };
}

/**
 * Show context preview
 */
export function showContextPreview(state: ProductState, before: string, after: string): ProductState {
  const preview = state.userData.contextPreview as ContextPreviewState | undefined;
  if (preview === undefined || preview.enabled === false) {
    return state;
  }

  return {
    ...state,
    userData: {
      ...state.data,
      contextPreview: {
        ...preview,
        beforeContext: before,
        afterContext: after,
        showing: true,
        usageCount: preview.usageCount + 1,
      } as ContextPreviewState,
    },
  };
}

/**
 * Hide context preview
 */
export function hideContextPreview(state: ProductState): ProductState {
  const preview = state.userData.contextPreview as ContextPreviewState | undefined;
  if (preview === undefined) {
    return state;
  }

  return {
    ...state,
    userData: {
      ...state.data,
      contextPreview: {
        ...preview,
        showing: false,
      } as ContextPreviewState,
    },
  };
}

/**
 * Change preview position
 */
export function changePreviewPosition(
  state: ProductState,
  position: 'sidebar' | 'modal' | 'inline'
): ProductState {
  const preview = state.userData.contextPreview as ContextPreviewState | undefined;
  if (preview === undefined) {
    return state;
  }

  return {
    ...state,
    userData: {
      ...state.data,
      contextPreview: {
        ...preview,
        position,
      } as ContextPreviewState,
    },
  };
}

/**
 * Check if context preview is showing
 */
export function isContextPreviewShowing(state: ProductState): boolean {
  const preview = state.userData.contextPreview as ContextPreviewState | undefined;
  return preview !== undefined && preview.showing === true;
}

/**
 * Get available context preview actions
 */
export function getContextPreviewActions(state: ProductState, persona: PersonaProfile): UserAction[] {
  const actions: UserAction[] = [];
  const preview = state.userData.contextPreview as ContextPreviewState | undefined;

  if (preview === undefined) {
    actions.push({
      type: ActionType.CONFIGURE,
      feature: 'contextPreview',
      description: 'Enable context preview',
      expectedOutcome: 'Context preview feature is available',
      metadata: { persona: persona.id },
    });
  } else {
    if (preview.enabled === true) {
      actions.push({
        type: ActionType.USE_FEATURE,
        feature: 'contextPreview',
        description: 'View before/after context',
        expectedOutcome: 'Context changes are clearly visible',
        metadata: { usageCount: preview.usageCount, persona: persona.id },
      });

      if (preview.showing === true) {
        actions.push({
          type: ActionType.CUSTOMIZE,
          feature: 'contextPreview',
          description: 'Change preview position',
          expectedOutcome: 'Preview position updated',
          metadata: { currentPosition: preview.position, persona: persona.id },
        });
      }
    }
  }

  return actions;
}
