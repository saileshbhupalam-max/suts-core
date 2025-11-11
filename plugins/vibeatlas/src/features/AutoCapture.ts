/**
 * Auto-Capture Telemetry Feature
 * Automatic event tracking and telemetry
 */

import { ActionType } from '@suts/core';
import type { Feature } from './Feature';
import type { UserAction, PersonaProfile } from '@suts/core';
import type { VibeAtlasState } from '../models/VibeAtlasState';

/**
 * Auto-Capture Feature Implementation
 * Automatically tracks user events and telemetry
 */
export class AutoCaptureFeature implements Feature {
  name = 'autoCapture';

  applyAction(state: VibeAtlasState, action: UserAction, _persona: PersonaProfile): VibeAtlasState {
    const newState = { ...state };

    // Auto-capture tracks ALL actions when enabled
    if (state.autoCapture.telemetryEnabled) {
      newState.autoCapture = {
        ...newState.autoCapture,
        eventsTracked: newState.autoCapture.eventsTracked + 1,
      };
    }

    // Specific auto-capture actions
    if (action.type === ActionType.CONFIGURE && action.feature === 'autoCapture') {
      if (action.description.toLowerCase().includes('enable')) {
        newState.autoCapture = {
          ...newState.autoCapture,
          telemetryEnabled: true,
        };
      } else if (action.description.toLowerCase().includes('disable')) {
        newState.autoCapture = {
          ...newState.autoCapture,
          telemetryEnabled: false,
        };
      }
    } else if (action.type === ActionType.USE_FEATURE && action.feature === 'autoCapture') {
      if (action.description.toLowerCase().includes('view') || action.description.toLowerCase().includes('check')) {
        // View captured events (no state change needed)
      }
    }

    return newState;
  }

  getAvailableActions(state: VibeAtlasState, persona: PersonaProfile): UserAction[] {
    const actions: UserAction[] = [];

    // Check if feature is enabled
    const featureValue = state['features']['autoCapture'];
    const featureEnabled = typeof featureValue === 'boolean' ? featureValue :
                          (featureValue !== null && featureValue !== undefined &&
                           typeof featureValue === 'object' && 'enabled' in featureValue ?
                           featureValue.enabled : false);

    if (!featureEnabled) {
      return actions;
    }

    // Privacy-conscious users may want to disable
    const privacyConcerned = persona.fears.some((f: string) =>
      f.toLowerCase().includes('privacy') ||
      f.toLowerCase().includes('tracking') ||
      f.toLowerCase().includes('data')
    );

    if (state.autoCapture.telemetryEnabled && privacyConcerned) {
      actions.push({
        type: ActionType.CONFIGURE,
        feature: 'autoCapture',
        description: 'Disable telemetry tracking',
        expectedOutcome: 'Stop automatic event capture',
        metadata: {
          priority: 0.8,
          persona: persona.id,
        },
      });
    } else if (!state.autoCapture.telemetryEnabled) {
      actions.push({
        type: ActionType.CONFIGURE,
        feature: 'autoCapture',
        description: 'Enable telemetry tracking',
        expectedOutcome: 'Start automatic event capture',
        metadata: {
          priority: 0.4,
          persona: persona.id,
        },
      });
    }

    // Data-driven users view captured events
    const dataFocused = persona.goals.some((g: string) =>
      g.toLowerCase().includes('data') ||
      g.toLowerCase().includes('analytics') ||
      g.toLowerCase().includes('insight')
    );

    if (dataFocused && state.autoCapture.eventsTracked > 0) {
      actions.push({
        type: ActionType.USE_FEATURE,
        feature: 'autoCapture',
        description: 'View captured events',
        expectedOutcome: 'Review telemetry data',
        metadata: {
          priority: 0.6,
          persona: persona.id,
        },
      });
    }

    return actions;
  }
}
