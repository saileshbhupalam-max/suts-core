/**
 * TaskFlow adapter for SUTS
 */

import type { PersonaProfile } from '@suts/core';

export class TaskFlowAdapter {
  constructor(
    private productName: string,
    private version: string
  ) {}

  /**
   * Convert generic product state to TaskFlow format
   */
  adaptProductState(genericState: any): TaskFlowState {
    return {
      name: this.productName,
      version: this.version,
      features: {
        projects: genericState.features?.projects?.enabled ?? true,
        kanban: genericState.features?.kanban?.enabled ?? true,
        gantt: genericState.features?.gantt?.enabled ?? false,
        timeTracking: genericState.features?.timeTracking?.enabled ?? true,
        collaboration: genericState.features?.collaboration?.enabled ?? true
      }
    };
  }

  /**
   * Simulate a TaskFlow-specific action
   */
  async simulateAction(
    action: string,
    persona: PersonaProfile,
    context: TaskFlowState
  ): Promise<ActionResult> {
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

  private async simulateCreateProject(
    _persona: PersonaProfile,
    _context: TaskFlowState
  ): Promise<ActionResult> {
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

  private async simulateAddTask(
    _persona: PersonaProfile,
    _context: TaskFlowState
  ): Promise<ActionResult> {
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

  private async simulateMoveToKanban(
    _persona: PersonaProfile,
    context: TaskFlowState
  ): Promise<ActionResult> {
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
    properties: Record<string, any>;
  };
}
