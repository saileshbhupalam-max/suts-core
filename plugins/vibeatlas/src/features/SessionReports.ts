/**
 * Session Reports Feature
 * Generate and export session reports
 */

import { ActionType } from '@suts/core';
import type { Feature } from './Feature';
import type { UserAction, PersonaProfile } from '@suts/core';
import type { VibeAtlasState } from '../models/VibeAtlasState';

/**
 * Session Reports Feature Implementation
 * Creates detailed reports of coding sessions
 */
export class SessionReportsFeature implements Feature {
  name = 'sessionReports';

  applyAction(state: VibeAtlasState, action: UserAction, _persona: PersonaProfile): VibeAtlasState {
    const newState = { ...state };

    if (action.type === ActionType.USE_FEATURE && action.feature === 'sessionReports') {
      if (action.description.toLowerCase().includes('generate') || action.description.toLowerCase().includes('create')) {
        // Generate new report
        newState.sessionReports = {
          reportsGenerated: newState.sessionReports.reportsGenerated + 1,
          lastReportDate: new Date(),
        };
      } else if (action.description.toLowerCase().includes('view') || action.description.toLowerCase().includes('open')) {
        // View existing report (no state change needed)
      } else if (action.description.toLowerCase().includes('export') || action.description.toLowerCase().includes('download')) {
        // Export report
        newState.sessionReports = {
          ...newState.sessionReports,
          lastReportDate: new Date(),
        };
      }
    } else if (action.type === ActionType.CONFIGURE && action.feature === 'sessionReports') {
      // Configure report settings (format, frequency, etc.)
    }

    return newState;
  }

  getAvailableActions(state: VibeAtlasState, persona: PersonaProfile): UserAction[] {
    const actions: UserAction[] = [];

    // Check if feature is enabled
    const featureValue = state['features']['sessionReports'];
    const featureEnabled = typeof featureValue === 'boolean' ? featureValue :
                          (featureValue !== null && featureValue !== undefined &&
                           typeof featureValue === 'object' && 'enabled' in featureValue ?
                           featureValue.enabled : false);

    if (!featureEnabled) {
      return actions;
    }

    // Managers and data-focused users generate reports
    const needsReports = persona.role.toLowerCase().includes('manager') ||
                        persona.role.toLowerCase().includes('lead') ||
                        persona.goals.some((g: string) =>
                          g.toLowerCase().includes('report') ||
                          g.toLowerCase().includes('track') ||
                          g.toLowerCase().includes('measure')
                        );

    if (needsReports || state.dashboard.sessionsTracked > 5) {
      actions.push({
        type: ActionType.USE_FEATURE,
        feature: 'sessionReports',
        description: 'Generate session report',
        expectedOutcome: 'Create detailed report of recent sessions',
        metadata: {
          priority: needsReports ? 0.75 : 0.5,
          persona: persona.id,
        },
      });
    }

    if (state.sessionReports.reportsGenerated > 0) {
      actions.push({
        type: ActionType.USE_FEATURE,
        feature: 'sessionReports',
        description: 'Export session report',
        expectedOutcome: 'Download report as PDF or CSV',
        metadata: {
          priority: 0.45,
          persona: persona.id,
        },
      });
    }

    return actions;
  }
}
