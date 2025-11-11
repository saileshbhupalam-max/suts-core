/**
 * Performance Optimization Feature
 * Automatic performance tuning and monitoring
 */

import { ActionType } from '@suts/core';
import type { Feature } from './Feature';
import type { UserAction, PersonaProfile } from '@suts/core';
import type { VibeAtlasState } from '../models/VibeAtlasState';

/**
 * Performance Optimization Feature Implementation
 * Monitors and optimizes response times
 */
export class PerformanceOptFeature implements Feature {
  name = 'performanceOpt';

  applyAction(state: VibeAtlasState, action: UserAction, _persona: PersonaProfile): VibeAtlasState {
    const newState = { ...state };

    if (action.type === ActionType.USE_FEATURE && action.feature === 'performanceOpt') {
      if (action.description.toLowerCase().includes('optimize') || action.description.toLowerCase().includes('tune')) {
        // Apply optimization
        const currentLevel = state.performance.optimizationLevel;
        const newLevel = currentLevel === 'low' ? 'medium' : currentLevel === 'medium' ? 'high' : 'high';

        const responseTimeReduction = newLevel === 'high' ? 0.7 : newLevel === 'medium' ? 0.85 : 1.0;

        newState.performance = {
          avgResponseTime: Math.round(state.performance.avgResponseTime * responseTimeReduction),
          optimizationLevel: newLevel,
        };
      } else if (action.description.toLowerCase().includes('measure') || action.description.toLowerCase().includes('benchmark')) {
        // Measure current performance
        const responseTime = 30 + Math.floor(Math.random() * 40); // 30-70ms
        newState.performance = {
          ...newState.performance,
          avgResponseTime: responseTime,
        };
      }
    } else if (action.type === ActionType.CONFIGURE && action.feature === 'performanceOpt') {
      // Configure performance settings
      const level = action.metadata?.['level'] as 'low' | 'medium' | 'high' | undefined;
      if (level !== undefined && level !== null) {
        newState.performance = {
          ...newState.performance,
          optimizationLevel: level,
        };
      }
    }

    return newState;
  }

  getAvailableActions(state: VibeAtlasState, persona: PersonaProfile): UserAction[] {
    const actions: UserAction[] = [];

    // Check if feature is enabled
    const featureValue = state['features']['performanceOpt'];
    const featureEnabled = typeof featureValue === 'boolean' ? featureValue :
                          (featureValue !== null && featureValue !== undefined &&
                           typeof featureValue === 'object' && 'enabled' in featureValue ?
                           featureValue.enabled : false);

    if (!featureEnabled) {
      return actions;
    }

    // Performance-conscious users optimize
    const perfFocused = persona.goals.some((g: string) =>
      g.toLowerCase().includes('speed') ||
      g.toLowerCase().includes('performance') ||
      g.toLowerCase().includes('fast')
    ) || persona.painPoints.some((p: string) =>
      p.toLowerCase().includes('slow') ||
      p.toLowerCase().includes('lag')
    );

    if (perfFocused) {
      if (state.performance.optimizationLevel !== 'high') {
        actions.push({
          type: ActionType.USE_FEATURE,
          feature: 'performanceOpt',
          description: 'Optimize performance settings',
          expectedOutcome: 'Improve response times',
          metadata: {
            priority: 0.75,
            persona: persona.id,
          },
        });
      }

      actions.push({
        type: ActionType.USE_FEATURE,
        feature: 'performanceOpt',
        description: 'Measure current performance',
        expectedOutcome: 'Benchmark response times',
        metadata: {
          priority: 0.5,
          persona: persona.id,
        },
      });
    }

    return actions;
  }
}
