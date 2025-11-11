/**
 * Try Mode Feature
 * 14-day trial with full features
 */

import { ActionType } from '@suts/core';
import type { Feature } from './Feature';
import type { UserAction, PersonaProfile } from '@suts/core';
import type { VibeAtlasState } from '../models/VibeAtlasState';

/**
 * Try Mode Feature Implementation
 * Manages 14-day trial period and conversion decisions
 */
export class TryModeFeature implements Feature {
  name = 'tryMode';

  applyAction(state: VibeAtlasState, action: UserAction, persona: PersonaProfile): VibeAtlasState {
    const newState = { ...state };

    if (action.type === ActionType.CONFIGURE && action.feature === 'tryMode') {
      if (action.description.toLowerCase().includes('activate') || action.description.toLowerCase().includes('start')) {
        newState.tryMode = {
          enabled: true,
          daysRemaining: 14,
          activatedAt: new Date(),
          conversionDecision: 'pending',
        };
      }
    } else if (action.type === ActionType.USE_FEATURE && action.description.toLowerCase().includes('day elapsed')) {
      if (newState.tryMode.enabled) {
        const daysLeft = newState.tryMode.daysRemaining - 1;
        newState.tryMode = {
          ...newState.tryMode,
          daysRemaining: Math.max(0, daysLeft),
        };

        // Try mode expires
        if (daysLeft <= 0) {
          // Decision based on persona satisfaction
          const satisfaction = this.calculateSatisfaction(newState, persona);
          newState.tryMode = {
            ...newState.tryMode,
            enabled: false,
            conversionDecision: satisfaction > 0.7 ? 'keep' : 'uninstall',
          };
        }
      }
    }

    return newState;
  }

  /**
   * Calculate user satisfaction based on usage and persona traits
   */
  private calculateSatisfaction(state: VibeAtlasState, persona: PersonaProfile): number {
    let satisfaction = 0.5; // Base satisfaction

    // Cost-conscious personas care about savings
    const costFocused = persona.goals.some((g: string) =>
      g.toLowerCase().includes('cost') ||
      g.toLowerCase().includes('save') ||
      g.toLowerCase().includes('budget')
    );

    if (costFocused) {
      satisfaction += state.tokenCounter.savingsPercent * 0.005; // 0-50% savings adds 0-0.25
    }

    // Quality-focused personas care about context control
    const qualityFocused = persona.goals.some((g: string) =>
      g.toLowerCase().includes('quality') ||
      g.toLowerCase().includes('control')
    );

    if (qualityFocused) {
      satisfaction += state.contextPreview.userReviewed ? 0.3 : 0;
    }

    // Active users (high session count) are more satisfied
    if (state.dashboard.sessionsTracked > 10) {
      satisfaction += 0.2;
    }

    return Math.min(satisfaction, 1.0);
  }

  getAvailableActions(state: VibeAtlasState, persona: PersonaProfile): UserAction[] {
    const actions: UserAction[] = [];

    // Check if feature is enabled
    const featureValue = state['features']['tryMode'];
    const featureEnabled = typeof featureValue === 'boolean' ? featureValue :
                          (featureValue !== null && featureValue !== undefined &&
                           typeof featureValue === 'object' && 'enabled' in featureValue ?
                           featureValue.enabled : false);

    if (!featureEnabled) {
      return actions;
    }

    if (!state.tryMode.enabled && state.tryMode.conversionDecision === 'pending') {
      // Skeptics love trials
      const priority = persona.riskTolerance < 0.5 ? 0.9 : 0.6;

      actions.push({
        type: ActionType.CONFIGURE,
        feature: 'tryMode',
        description: 'Start 14-day trial',
        expectedOutcome: 'Activate try mode with full features',
        metadata: {
          priority,
          persona: persona.id,
        },
      });
    }

    return actions;
  }
}
