/**
 * Processes persona actions and updates state
 */

import type { ActionType, EmotionalState } from '@suts/core';
import type { PersonaProfile } from '@suts/persona';
import type { ProductState } from '../types';

/**
 * Action performed by a persona
 */
export interface PersonaAction {
  type: ActionType;
  timestamp: Date;
  personaId: string;
  target?: string;
  parameters?: Record<string, unknown>;
  success: boolean;
  duration: number;
  reasoning?: string;
}

/**
 * Result of processing an action
 */
export interface ActionResult {
  action: PersonaAction;
  emotionalImpact: Partial<EmotionalState>;
  stateChanges: Record<string, unknown>;
  observations: string[];
}

/**
 * Configuration for action processing
 */
export interface ActionProcessorConfig {
  successRate: number;
  frustrationIncrement: number;
  delightIncrement: number;
}

/**
 * Processes persona actions and determines their effects
 */
export class ActionProcessor {
  private config: ActionProcessorConfig;

  constructor(config?: Partial<ActionProcessorConfig>) {
    this.config = {
      successRate: 0.8,
      frustrationIncrement: 0.1,
      delightIncrement: 0.15,
      ...config,
    };
  }

  /**
   * Process a persona action and determine its effects
   */
  processAction(
    action: PersonaAction,
    persona: PersonaProfile,
    product: ProductState,
    currentEmotion: EmotionalState
  ): ActionResult {
    const emotionalImpact: Partial<EmotionalState> = {};
    const stateChanges: Record<string, unknown> = {};
    const observations: string[] = [];

    // Determine success based on persona experience and product state
    const successProbability = this.calculateSuccessProbability(
      action,
      persona,
      product
    );

    if (action.success) {
      // Successful action increases confidence, may increase delight
      emotionalImpact.confidence = Math.min(
        1,
        (currentEmotion.confidence || 0) + 0.1
      );

      if (successProbability < 0.5) {
        // Unexpected success is more delightful
        emotionalImpact.delight = Math.min(
          1,
          (currentEmotion.delight || 0) + this.config.delightIncrement * 1.5
        );
        observations.push('Succeeded at a challenging task');
      } else {
        emotionalImpact.delight = Math.min(
          1,
          (currentEmotion.delight || 0) + this.config.delightIncrement * 0.5
        );
      }

      // Reduce frustration and confusion on success
      emotionalImpact.frustration = Math.max(
        0,
        (currentEmotion.frustration || 0) - 0.15
      );
      emotionalImpact.confusion = Math.max(
        0,
        (currentEmotion.confusion || 0) - 0.1
      );
    } else {
      // Failed action increases frustration and confusion
      emotionalImpact.frustration = Math.min(
        1,
        (currentEmotion.frustration || 0) + this.config.frustrationIncrement
      );
      emotionalImpact.confusion = Math.min(
        1,
        (currentEmotion.confusion || 0) + 0.15
      );

      // Decrease confidence
      emotionalImpact.confidence = Math.max(
        0,
        (currentEmotion.confidence || 0) - 0.15
      );

      observations.push(`Failed to ${action.type}`);
    }

    // Update persona state based on action
    stateChanges['lastActionType'] = action.type;
    stateChanges['lastActionTimestamp'] = action.timestamp;
    // @ts-expect-error - Index signature access
    stateChanges.totalActions = ((persona.state['totalActions'] as number) || 0) + 1;

    return {
      action,
      emotionalImpact,
      stateChanges,
      observations,
    };
  }

  /**
   * Calculate probability of action success based on persona and product
   */
  private calculateSuccessProbability(
    action: PersonaAction,
    persona: PersonaProfile,
    product: ProductState
  ): number {
    let probability = this.config.successRate;

    // Adjust based on persona experience level
    switch (persona.experienceLevel) {
      case 'Expert':
        probability += 0.15;
        break;
      case 'Intermediate':
        probability += 0.05;
        break;
      case 'Novice':
        probability -= 0.1;
        break;
    }

    // Adjust based on action complexity
    const complexActions = ['CONFIGURE', 'CUSTOMIZE', 'USE_FEATURE'];
    if (complexActions.includes(action.type)) {
      probability -= 0.1;
    }

    // Adjust based on product features
    if (action.target && !product.features[action.target]) {
      probability -= 0.3; // Feature not available
    }

    // Adjust based on persona patience
    if (persona.patienceLevel < 0.3) {
      probability -= 0.05; // Impatient users make more mistakes
    }

    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Determine if action should trigger special events
   */
  checkSpecialTriggers(
    action: PersonaAction,
    result: ActionResult,
    persona: PersonaProfile
  ): string[] {
    const triggers: string[] = [];

    // Check for delight triggers
    if (result.emotionalImpact.delight && result.emotionalImpact.delight > 0.7) {
      if (persona.delightTriggers.some((trigger) =>
        action.type.toLowerCase().includes(trigger.toLowerCase())
      )) {
        triggers.push('delight_trigger');
      }
    }

    // Check for deal breakers
    if (!action.success) {
      if (persona.dealBreakers.some((breaker) =>
        action.type.toLowerCase().includes(breaker.toLowerCase())
      )) {
        triggers.push('deal_breaker');
      }
    }

    return triggers;
  }
}
