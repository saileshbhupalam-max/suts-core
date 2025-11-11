/**
 * TaskFlow adapter for SUTS
 */

import type { PersonaProfile, ProductState } from '@suts/core';

export class TaskFlowAdapter {
  constructor(
    private productName: string,
    private version: string
  ) {}

  /**
   * Convert generic product state to TaskFlow format
   */
  adaptProductState(genericState: ProductState): TaskFlowState {
    const features = genericState.features;
    const projects = this.getFeatureValue(features, 'projects') ?? true;
    const kanban = this.getFeatureValue(features, 'kanban') ?? true;
    const gantt = this.getFeatureValue(features, 'gantt') ?? false;
    const timeTracking = this.getFeatureValue(features, 'timeTracking') ?? true;
    const collaboration = this.getFeatureValue(features, 'collaboration') ?? true;

    return {
      name: this.productName,
      version: this.version,
      features: {
        projects,
        kanban,
        gantt,
        timeTracking,
        collaboration
      }
    };
  }

  /**
   * Safely extract feature flag value
   */
  private getFeatureValue(features: Record<string, boolean | { enabled: boolean }>, key: string): boolean | undefined {
    const feature = features[key];
    if (typeof feature === 'boolean') {
      return feature;
    }
    if (typeof feature === 'object' && feature !== null && 'enabled' in feature) {
      return feature.enabled;
    }
    return undefined;
  }

  /**
   * Simulate a TaskFlow-specific action
   */
  simulateAction(
    action: string,
    persona: PersonaProfile,
    context: TaskFlowState
  ): ActionResult {
    switch (action) {
      case 'create_project':
        return this.simulateCreateProject(persona, context);
      case 'add_task':
        return this.simulateAddTask(persona, context);
      case 'move_to_kanban':
        return this.simulateMoveToKanban(persona, context);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private simulateCreateProject(
    _persona: PersonaProfile,
    _context: TaskFlowState
  ): ActionResult {
    const success = Math.random() > 0.1;
    return {
      success,
      duration: 30000,
      emotionalImpact: {
        frustration: success ? 0 : 0.3,
        confidence: success ? 0.2 : 0,
        delight: success ? 0.3 : 0,
        confusion: 0.1
      },
      telemetry: {
        event: 'project_created',
        properties: { success, personaType: _persona.archetype }
      }
    };
  }

  private simulateAddTask(
    _persona: PersonaProfile,
    _context: TaskFlowState
  ): ActionResult {
    return {
      success: true,
      duration: 10000,
      emotionalImpact: {
        frustration: 0,
        confidence: 0.1,
        delight: 0.2,
        confusion: 0
      },
      telemetry: {
        event: 'task_added',
        properties: {}
      }
    };
  }

  private simulateMoveToKanban(
    _persona: PersonaProfile,
    context: TaskFlowState
  ): ActionResult {
    if (!context.features.kanban) {
      return {
        success: false,
        duration: 5000,
        emotionalImpact: {
          frustration: 0.5,
          confidence: 0,
          delight: 0,
          confusion: 0.3
        },
        telemetry: {
          event: 'feature_not_available',
          properties: { feature: 'kanban' }
        }
      };
    }

    return {
      success: true,
      duration: 8000,
      emotionalImpact: {
        frustration: 0,
        confidence: 0.2,
        delight: 0.4,
        confusion: 0
      },
      telemetry: {
        event: 'kanban_used',
        properties: {}
      }
    };
  }
}

interface TaskFlowState {
  name: string;
  version: string;
  features: {
    projects: boolean;
    kanban: boolean;
    gantt: boolean;
    timeTracking: boolean;
    collaboration: boolean;
  };
}

interface ActionResult {
  success: boolean;
  duration: number;
  emotionalImpact: {
    frustration: number;
    confidence: number;
    delight: number;
    confusion: number;
  };
  telemetry: {
    event: string;
    properties: Record<string, unknown>;
  };
}
