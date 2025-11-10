/**
 * Tracks and manages persona frustration levels
 */

import type { EmotionalState } from '@suts/core';
import type { PersonaProfile } from '@suts/persona';

/**
 * Frustration event that contributes to overall frustration
 */
export interface FrustrationEvent {
  timestamp: Date;
  severity: number; // 0-1
  reason: string;
  recoverable: boolean;
}

/**
 * Frustration state for a persona
 */
export interface FrustrationState {
  level: number; // Current frustration level 0-1
  events: FrustrationEvent[];
  consecutiveFailures: number;
  timeSinceLastSuccess: number; // in minutes
  recoveryRate: number; // How fast frustration decreases
}

/**
 * Tracks persona frustration over time
 */
export class FrustrationTracker {
  private states: Map<string, FrustrationState> = new Map();
  private readonly baseRecoveryRate = 0.1;
  private readonly maxFrustration = 1.0;
  private readonly frustrationDecayPerDay = 0.2;

  /**
   * Initialize frustration state for a persona
   */
  initializePersona(personaId: string, persona: PersonaProfile): void {
    const recoveryRate = this.calculateRecoveryRate(persona);

    this.states.set(personaId, {
      level: 0,
      events: [],
      consecutiveFailures: 0,
      timeSinceLastSuccess: 0,
      recoveryRate,
    });
  }

  /**
   * Record a frustration event
   */
  recordFrustration(
    personaId: string,
    severity: number,
    reason: string,
    recoverable: boolean,
    timestamp: Date
  ): void {
    const state = this.getState(personaId);

    state.events.push({
      timestamp,
      severity,
      reason,
      recoverable,
    });

    state.consecutiveFailures++;

    // Increase frustration based on severity and consecutive failures
    const multiplier = 1 + state.consecutiveFailures * 0.1;
    const increase = severity * multiplier;

    state.level = Math.min(this.maxFrustration, state.level + increase);
  }

  /**
   * Record a success (reduces frustration)
   */
  recordSuccess(personaId: string): void {
    const state = this.getState(personaId);

    state.consecutiveFailures = 0;
    state.timeSinceLastSuccess = 0;

    // Reduce frustration on success
    state.level = Math.max(0, state.level - state.recoveryRate);
  }

  /**
   * Update frustration over time (natural decay)
   */
  updateOverTime(personaId: string, deltaMinutes: number): void {
    const state = this.getState(personaId);

    state.timeSinceLastSuccess += deltaMinutes;

    // Natural decay of frustration
    const decay = (deltaMinutes / (24 * 60)) * this.frustrationDecayPerDay;
    state.level = Math.max(0, state.level - decay);
  }

  /**
   * Get current frustration level
   */
  getFrustrationLevel(personaId: string): number {
    return this.getState(personaId).level;
  }

  /**
   * Get frustration state
   */
  getState(personaId: string): FrustrationState {
    const state = this.states.get(personaId);
    if (!state) {
      throw new Error(`Persona ${personaId} not initialized`);
    }
    return state;
  }

  /**
   * Check if persona has reached frustration threshold
   */
  hasReachedThreshold(personaId: string, threshold: number): boolean {
    return this.getFrustrationLevel(personaId) >= threshold;
  }

  /**
   * Get recent frustration events
   */
  getRecentEvents(personaId: string, count: number): FrustrationEvent[] {
    const state = this.getState(personaId);
    return state.events.slice(-count);
  }

  /**
   * Calculate recovery rate based on persona characteristics
   */
  private calculateRecoveryRate(persona: PersonaProfile): number {
    let rate = this.baseRecoveryRate;

    // Patient personas recover faster
    rate += persona.patienceLevel * 0.1;

    // Expert personas recover faster (less frustrated by setbacks)
    if (persona.experienceLevel === 'Expert') {
      rate += 0.05;
    } else if (persona.experienceLevel === 'Novice') {
      rate -= 0.03;
    }

    return Math.max(0.05, Math.min(0.3, rate));
  }

  /**
   * Update emotional state with frustration
   */
  updateEmotionalState(
    personaId: string,
    emotionalState: EmotionalState
  ): EmotionalState {
    const frustrationLevel = this.getFrustrationLevel(personaId);

    return {
      ...emotionalState,
      frustration: frustrationLevel,
    };
  }

  /**
   * Reset frustration state for a persona
   */
  reset(personaId: string): void {
    const state = this.getState(personaId);
    state.level = 0;
    state.events = [];
    state.consecutiveFailures = 0;
    state.timeSinceLastSuccess = 0;
  }
}
