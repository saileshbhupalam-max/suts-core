/**
 * Dashboard Feature
 * Analytics and insights dashboard
 */

import { ActionType } from '@suts/core';
import type { Feature } from './Feature';
import type { UserAction, PersonaProfile } from '@suts/core';
import type { VibeAtlasState } from '../models/VibeAtlasState';

/**
 * Dashboard Feature Implementation
 * Provides analytics, exports, and sharing capabilities
 */
export class DashboardFeature implements Feature {
  name = 'dashboard';

  applyAction(state: VibeAtlasState, action: UserAction, _persona: PersonaProfile): VibeAtlasState {
    const newState = { ...state };

    if (action.type === ActionType.USE_FEATURE && action.feature === 'dashboard') {
      if (action.description.toLowerCase().includes('export')) {
        newState.dashboard = {
          ...newState.dashboard,
          lastExport: new Date(),
        };
      } else if (action.description.toLowerCase().includes('open') || action.description.toLowerCase().includes('view')) {
        // Track session
        newState.dashboard = {
          ...newState.dashboard,
          sessionsTracked: newState.dashboard.sessionsTracked + 1,
        };
      } else if (action.description.toLowerCase().includes('update')) {
        // Update metrics (called during coding sessions)
        const savingsIncrease = Math.floor(Math.random() * 100) + 50;
        newState.dashboard = {
          ...newState.dashboard,
          totalSavings: newState.dashboard.totalSavings + savingsIncrease,
        };
      }
    } else if (action.type === ActionType.SHARE && action.feature === 'dashboard') {
      // Viral action!
      newState.dashboard = {
        ...newState.dashboard,
        sharedCount: newState.dashboard.sharedCount + 1,
      };
    }

    return newState;
  }

  getAvailableActions(state: VibeAtlasState, persona: PersonaProfile): UserAction[] {
    const actions: UserAction[] = [];

    // Check if feature is enabled
    const featureValue = state['features']['dashboard'];
    const featureEnabled = typeof featureValue === 'boolean' ? featureValue :
                          (featureValue !== null && featureValue !== undefined &&
                           typeof featureValue === 'object' && 'enabled' in featureValue ?
                           featureValue.enabled : false);

    if (!featureEnabled) {
      return actions;
    }

    // View dashboard
    actions.push({
      type: ActionType.USE_FEATURE,
      feature: 'dashboard',
      description: 'Open analytics dashboard',
      expectedOutcome: 'View usage statistics and savings',
      metadata: {
        priority: 0.6,
        persona: persona.id,
      },
    });

    // Export dashboard
    actions.push({
      type: ActionType.USE_FEATURE,
      feature: 'dashboard',
      description: 'Export dashboard data',
      expectedOutcome: 'Download analytics report',
      metadata: {
        priority: 0.4,
        persona: persona.id,
      },
    });

    // Share if satisfied and social
    if (state.tokenCounter.savingsPercent > 30) {
      const social = persona.archetype.toLowerCase().includes('indie') ||
                    persona.archetype.toLowerCase().includes('community') ||
                    persona.collaborationStyle === 'Community-driven';

      const sharePriority = social ? 0.8 : 0.3;

      actions.push({
        type: ActionType.SHARE,
        feature: 'dashboard',
        description: 'Share savings on Twitter',
        expectedOutcome: 'Post results to social media',
        metadata: {
          priority: sharePriority,
          persona: persona.id,
        },
      });
    }

    return actions;
  }
}
