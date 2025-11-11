/**
 * Persistent Memory Feature
 * Stores and retrieves project context across sessions
 */

import { ActionType } from '@suts/core';
import type { Feature } from './Feature';
import type { UserAction, PersonaProfile } from '@suts/core';
import type { VibeAtlasState } from '../models/VibeAtlasState';

/**
 * Persistent Memory Feature Implementation
 * Captures and retrieves project schemas, repos, and contexts
 */
export class PersistentMemoryFeature implements Feature {
  name = 'persistentMemory';

  applyAction(state: VibeAtlasState, action: UserAction, _persona: PersonaProfile): VibeAtlasState {
    const newState = { ...state };

    if (action.type === ActionType.USE_FEATURE && action.feature === 'persistentMemory') {
      if (action.description.toLowerCase().includes('capture') || action.description.toLowerCase().includes('save')) {
        // Capture context
        newState.persistentMemory = {
          ...newState.persistentMemory,
          contextsCaptured: newState.persistentMemory.contextsCaptured + 1,
          schemasStored: newState.persistentMemory.schemasStored + Math.floor(Math.random() * 3),
        };
      } else if (action.description.toLowerCase().includes('retrieve') || action.description.toLowerCase().includes('load')) {
        // Memory retrieval success depends on usage
        const successRate = Math.min(newState.persistentMemory.contextsCaptured * 0.1, 0.95);
        newState.persistentMemory = {
          ...newState.persistentMemory,
          retrievalSuccessRate: successRate,
        };
      } else if (action.description.toLowerCase().includes('track repo')) {
        // Track new repository
        newState.persistentMemory = {
          ...newState.persistentMemory,
          reposTracked: newState.persistentMemory.reposTracked + 1,
        };
      }
    } else if (action.type === ActionType.CONFIGURE && action.feature === 'persistentMemory') {
      // Initialize or configure memory system
      newState.persistentMemory = {
        ...newState.persistentMemory,
        contextsCaptured: 0,
        schemasStored: 0,
        reposTracked: 1, // Current repo
        retrievalSuccessRate: 0,
      };
    }

    return newState;
  }

  getAvailableActions(state: VibeAtlasState, persona: PersonaProfile): UserAction[] {
    const actions: UserAction[] = [];

    // Check if feature is enabled
    const featureValue = state['features']['persistentMemory'];
    const featureEnabled = typeof featureValue === 'boolean' ? featureValue :
                          (featureValue !== null && featureValue !== undefined &&
                           typeof featureValue === 'object' && 'enabled' in featureValue ?
                           featureValue.enabled : false);

    if (!featureEnabled) {
      return actions;
    }

    // Power users discover memory features
    if (persona.experienceLevel === 'Expert') {
      actions.push({
        type: ActionType.USE_FEATURE,
        feature: 'persistentMemory',
        description: 'Save project context',
        expectedOutcome: 'Capture current project state for future sessions',
        metadata: {
          priority: 0.7,
          persona: persona.id,
        },
      });

      if (state.persistentMemory.contextsCaptured > 0) {
        actions.push({
          type: ActionType.USE_FEATURE,
          feature: 'persistentMemory',
          description: 'Retrieve saved context',
          expectedOutcome: 'Load previously saved project context',
          metadata: {
            priority: 0.65,
            persona: persona.id,
          },
        });
      }
    }

    return actions;
  }
}
