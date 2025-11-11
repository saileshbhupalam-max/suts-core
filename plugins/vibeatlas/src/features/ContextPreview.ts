/**
 * Context Preview Feature
 * Allows users to review and optimize AI context before sending
 */

import { ActionType } from '@suts/core';
import type { Feature } from './Feature';
import type { UserAction, PersonaProfile } from '@suts/core';
import type { VibeAtlasState } from '../models/VibeAtlasState';

/**
 * Context Preview Feature Implementation
 * Shows before/after context comparison with optimization suggestions
 */
export class ContextPreviewFeature implements Feature {
  name = 'contextPreview';

  applyAction(state: VibeAtlasState, action: UserAction, _persona: PersonaProfile): VibeAtlasState {
    const newState = { ...state };

    if (action.type === ActionType.USE_FEATURE && action.feature === 'contextPreview') {
      if (action.description.toLowerCase().includes('preview') || action.description.toLowerCase().includes('review')) {
        // User reviews context before AI call
        const mockFiles = ['src/main.ts', 'src/utils.ts', 'src/config.ts', 'package.json', 'README.md'];
        const optimizedFiles = mockFiles.slice(0, 3); // Remove package.json and README

        newState.contextPreview = {
          beforeContext: mockFiles,
          afterContext: optimizedFiles,
          optimizationApplied: true,
          userReviewed: true,
        };
      } else if (action.description.toLowerCase().includes('revert')) {
        // User reverts to original context
        newState.contextPreview = {
          ...newState.contextPreview,
          optimizationApplied: false,
          afterContext: newState.contextPreview.beforeContext,
        };
      } else if (action.description.toLowerCase().includes('apply') || action.description.toLowerCase().includes('accept')) {
        // User accepts optimization
        newState.contextPreview = {
          ...newState.contextPreview,
          optimizationApplied: true,
          userReviewed: true,
        };
      }
    } else if (action.type === ActionType.CUSTOMIZE && action.feature === 'contextPreview') {
      // Customization handled (position changes, etc.)
      newState.contextPreview = {
        ...newState.contextPreview,
        userReviewed: true,
      };
    }

    return newState;
  }

  getAvailableActions(state: VibeAtlasState, persona: PersonaProfile): UserAction[] {
    const actions: UserAction[] = [];

    // Check if feature is enabled
    const featureValue = state['features']['contextPreview'];
    const featureEnabled = typeof featureValue === 'boolean' ? featureValue :
                          (featureValue !== null && featureValue !== undefined &&
                           typeof featureValue === 'object' && 'enabled' in featureValue ?
                           featureValue.enabled : false);

    if (!featureEnabled) {
      return actions;
    }

    // Quality-focused personas always preview
    const qualityFocused = persona.goals.some((g: string) =>
      g.toLowerCase().includes('quality') ||
      g.toLowerCase().includes('accuracy') ||
      g.toLowerCase().includes('control')
    );

    const priority = qualityFocused ? 0.95 : 0.6;

    actions.push({
      type: ActionType.USE_FEATURE,
      feature: 'contextPreview',
      description: 'Review AI context before sending',
      expectedOutcome: 'See context optimization suggestions',
      metadata: {
        priority,
        persona: persona.id,
      },
    });

    if (state.contextPreview.optimizationApplied) {
      actions.push({
        type: ActionType.USE_FEATURE,
        feature: 'contextPreview',
        description: 'Revert context changes',
        expectedOutcome: 'Restore original context',
        metadata: {
          priority: 0.3,
          persona: persona.id,
        },
      });
    }

    return actions;
  }
}
