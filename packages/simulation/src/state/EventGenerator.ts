/**
 * Generates telemetry events from persona actions
 */

import type { SimulationEvent, EmotionalState } from '@suts/core';
import type { PersonaAction, ActionResult } from './ActionProcessor';
import { randomUUID } from 'node:crypto';

/**
 * Event context for generation
 */
export interface EventContext {
  personaId: string;
  day: number;
  sessionId: string;
  emotionalState: EmotionalState;
}

/**
 * Generates simulation events from actions
 */
export class EventGenerator {
  /**
   * Generate an action event
   */
  generateActionEvent(
    action: PersonaAction,
    context: EventContext
  ): SimulationEvent {
    return {
      id: randomUUID(),
      personaId: context.personaId,
      timestamp: action.timestamp,
      eventType: 'action',
      action: action.type,
      context: {
        sessionId: context.sessionId,
        day: context.day,
        target: action.target,
        parameters: action.parameters,
        success: action.success,
        duration: action.duration,
      },
      reasoning: action.reasoning,
      emotionalState: context.emotionalState,
      metadata: {
        actionId: randomUUID(),
      },
    };
  }

  /**
   * Generate an observation event
   */
  generateObservationEvent(
    observation: string,
    context: EventContext,
    timestamp: Date
  ): SimulationEvent {
    return {
      id: randomUUID(),
      personaId: context.personaId,
      timestamp,
      eventType: 'observation',
      context: {
        sessionId: context.sessionId,
        day: context.day,
        observation,
      },
      emotionalState: context.emotionalState,
      metadata: {},
    };
  }

  /**
   * Generate a decision event
   */
  generateDecisionEvent(
    decision: string,
    reasoning: string,
    context: EventContext,
    timestamp: Date
  ): SimulationEvent {
    return {
      id: randomUUID(),
      personaId: context.personaId,
      timestamp,
      eventType: 'decision',
      action: decision,
      reasoning,
      context: {
        sessionId: context.sessionId,
        day: context.day,
      },
      emotionalState: context.emotionalState,
      metadata: {},
    };
  }

  /**
   * Generate an emotion event
   */
  generateEmotionEvent(
    emotionalState: EmotionalState,
    trigger: string,
    context: EventContext,
    timestamp: Date
  ): SimulationEvent {
    return {
      id: randomUUID(),
      personaId: context.personaId,
      timestamp,
      eventType: 'emotion',
      emotionalState,
      context: {
        sessionId: context.sessionId,
        day: context.day,
        trigger,
      },
      metadata: {},
    };
  }

  /**
   * Generate all events from an action result
   */
  generateEventsFromResult(
    result: ActionResult,
    context: EventContext
  ): SimulationEvent[] {
    const events: SimulationEvent[] = [];

    // Always generate action event
    events.push(this.generateActionEvent(result.action, context));

    // Generate observation events
    for (const observation of result.observations) {
      events.push(
        this.generateObservationEvent(
          observation,
          context,
          result.action.timestamp
        )
      );
    }

    // Generate emotion event if significant emotional change
    const hasSignificantEmotionalChange = Object.values(
      result.emotionalImpact
    ).some((value) => Math.abs(value || 0) > 0.2);

    if (hasSignificantEmotionalChange) {
      const newEmotionalState: EmotionalState = {
        ...context.emotionalState,
        ...result.emotionalImpact,
      };

      events.push(
        this.generateEmotionEvent(
          newEmotionalState,
          result.action.type,
          context,
          result.action.timestamp
        )
      );
    }

    return events;
  }
}
