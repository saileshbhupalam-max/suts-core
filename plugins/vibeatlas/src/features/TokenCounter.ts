/**
 * Token Counter Feature
 * Tracks token usage and savings
 */

import { ActionType } from '@suts/core';
import type { Feature } from './Feature';
import type { UserAction, PersonaProfile } from '@suts/core';
import type { VibeAtlasState } from '../models/VibeAtlasState';

/**
 * Token Counter Feature Implementation
 * Displays real-time token usage and cost savings
 */
export class TokenCounterFeature implements Feature {
  name = 'tokenCounter';

  applyAction(state: VibeAtlasState, action: UserAction, _persona: PersonaProfile): VibeAtlasState {
    const newState = { ...state };

    if (action.type === ActionType.USE_FEATURE && action.feature === 'tokenCounter') {
      if (action.description.toLowerCase().includes('view') || action.description.toLowerCase().includes('check')) {
        // User checks token counter
        newState.tokenCounter = {
          ...newState.tokenCounter,
          visible: true,
        };
      } else if (action.description.toLowerCase().includes('toggle') || action.description.toLowerCase().includes('hide')) {
        // Toggle visibility
        newState.tokenCounter = {
          ...newState.tokenCounter,
          visible: !state.tokenCounter.visible,
        };
      }
    } else if (action.type === ActionType.USE_FEATURE && action.description.toLowerCase().includes('coding')) {
      // Tokens accumulate during coding session
      const tokensUsed = Math.floor(Math.random() * 1000) + 500;
      const baselineCost = tokensUsed * 1.5; // Without optimization
      const actualCost = tokensUsed;
      const savings = ((baselineCost - actualCost) / baselineCost) * 100;

      newState.tokenCounter = {
        ...newState.tokenCounter,
        sessionTokens: newState.tokenCounter.sessionTokens + tokensUsed,
        totalTokens: newState.tokenCounter.totalTokens + tokensUsed,
        savingsPercent: Math.round(savings * 10) / 10, // Round to 1 decimal
      };
    }

    return newState;
  }

  getAvailableActions(state: VibeAtlasState, persona: PersonaProfile): UserAction[] {
    const actions: UserAction[] = [];

    // Check if feature is enabled
    const featureValue = state['features']['tokenCounter'];
    const featureEnabled = typeof featureValue === 'boolean' ? featureValue :
                          (featureValue !== null && featureValue !== undefined &&
                           typeof featureValue === 'object' && 'enabled' in featureValue ?
                           featureValue.enabled : false);

    if (!featureEnabled) {
      return actions;
    }

    // Always available - view token count
    const costFocused = persona.goals.some((g: string) =>
      g.toLowerCase().includes('cost') ||
      g.toLowerCase().includes('budget') ||
      g.toLowerCase().includes('save')
    );

    actions.push({
      type: ActionType.USE_FEATURE,
      feature: 'tokenCounter',
      description: 'Check token usage',
      expectedOutcome: 'View current token usage and savings',
      metadata: {
        priority: costFocused ? 0.9 : 0.5,
        persona: persona.id,
      },
    });

    // Toggle visibility if currently visible
    if (state.tokenCounter.visible) {
      actions.push({
        type: ActionType.CUSTOMIZE,
        feature: 'tokenCounter',
        description: 'Toggle token counter visibility',
        expectedOutcome: 'Hide or show token counter',
        metadata: {
          priority: 0.3,
          persona: persona.id,
        },
      });
    }

    return actions;
  }
}
