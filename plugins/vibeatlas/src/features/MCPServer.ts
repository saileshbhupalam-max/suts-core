/**
 * MCP Server Feature
 * Model Context Protocol server integration
 */

import { ActionType } from '@suts/core';
import type { Feature } from './Feature';
import type { UserAction, PersonaProfile } from '@suts/core';
import type { VibeAtlasState } from '../models/VibeAtlasState';

/**
 * MCP Server Feature Implementation
 * Enables Model Context Protocol server connections
 */
export class MCPServerFeature implements Feature {
  name = 'mcpServer';

  applyAction(state: VibeAtlasState, action: UserAction, _persona: PersonaProfile): VibeAtlasState {
    const newState = { ...state };

    if (action.type === ActionType.CONFIGURE && action.feature === 'mcpServer') {
      if (action.description.toLowerCase().includes('enable') || action.description.toLowerCase().includes('start')) {
        newState.mcpServer = {
          enabled: true,
          connectionsActive: 0,
        };
      } else if (action.description.toLowerCase().includes('disable') || action.description.toLowerCase().includes('stop')) {
        newState.mcpServer = {
          enabled: false,
          connectionsActive: 0,
        };
      }
    } else if (action.type === ActionType.USE_FEATURE && action.feature === 'mcpServer') {
      if (action.description.toLowerCase().includes('connect')) {
        // New connection
        if (newState.mcpServer.enabled) {
          newState.mcpServer = {
            ...newState.mcpServer,
            connectionsActive: newState.mcpServer.connectionsActive + 1,
          };
        }
      } else if (action.description.toLowerCase().includes('disconnect')) {
        // Close connection
        newState.mcpServer = {
          ...newState.mcpServer,
          connectionsActive: Math.max(0, newState.mcpServer.connectionsActive - 1),
        };
      }
    }

    return newState;
  }

  getAvailableActions(state: VibeAtlasState, persona: PersonaProfile): UserAction[] {
    const actions: UserAction[] = [];

    // Check if feature is enabled
    const featureValue = state['features']['mcpServer'];
    const featureEnabled = typeof featureValue === 'boolean' ? featureValue :
                          (featureValue !== null && featureValue !== undefined &&
                           typeof featureValue === 'object' && 'enabled' in featureValue ?
                           featureValue.enabled : false);

    if (!featureEnabled) {
      return actions;
    }

    // Advanced/Expert users discover MCP
    if (persona.experienceLevel === 'Expert' || persona.techAdoption === 'Early adopter') {
      if (!state.mcpServer.enabled) {
        actions.push({
          type: ActionType.CONFIGURE,
          feature: 'mcpServer',
          description: 'Enable MCP server',
          expectedOutcome: 'Start Model Context Protocol server',
          metadata: {
            priority: 0.65,
            persona: persona.id,
          },
        });
      } else {
        actions.push({
          type: ActionType.USE_FEATURE,
          feature: 'mcpServer',
          description: 'Connect to MCP server',
          expectedOutcome: 'Establish new MCP connection',
          metadata: {
            priority: 0.6,
            persona: persona.id,
          },
        });

        if (state.mcpServer.connectionsActive > 0) {
          actions.push({
            type: ActionType.USE_FEATURE,
            feature: 'mcpServer',
            description: 'Disconnect from MCP server',
            expectedOutcome: 'Close MCP connection',
            metadata: {
              priority: 0.3,
              persona: persona.id,
            },
          });
        }
      }
    }

    return actions;
  }
}
