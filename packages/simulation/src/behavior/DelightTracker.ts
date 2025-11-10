/**
 * Tracks and manages persona delight moments
 */

import type { EmotionalState } from '@suts/core';
import type { PersonaProfile } from '@suts/persona';

/**
 * Delight moment that contributes to overall delight
 */
export interface DelightMoment {
  timestamp: Date;
  intensity: number; // 0-1
  trigger: string;
  category: 'feature' | 'usability' | 'performance' | 'aesthetic' | 'support';
}

/**
 * Delight state for a persona
 */
export interface DelightState {
  level: number; // Current delight level 0-1
  moments: DelightMoment[];
  peakDelight: number;
  sustainedDelightDays: number;
  referralLikelihood: number;
}

/**
 * Tracks persona delight moments over time
 */
export class DelightTracker {
  private states: Map<string, DelightState> = new Map();
  private readonly delightDecayPerDay = 0.15;
  private readonly sustainedDelightThreshold = 0.6;

  /**
   * Initialize delight state for a persona
   */
  initializePersona(personaId: string, _persona: PersonaProfile): void {
    this.states.set(personaId, {
      level: 0,
      moments: [],
      peakDelight: 0,
      sustainedDelightDays: 0,
      referralLikelihood: 0,
    });
  }

  /**
   * Record a delight moment
   */
  recordDelight(
    personaId: string,
    intensity: number,
    trigger: string,
    category: DelightMoment['category'],
    timestamp: Date,
    persona: PersonaProfile
  ): void {
    const state = this.getState(personaId);

    state.moments.push({
      timestamp,
      intensity,
      trigger,
      category,
    });

    // Check if trigger matches persona's delight triggers
    const isPersonalTrigger = persona.delightTriggers.some((dt: string) =>
      trigger.toLowerCase().includes(dt.toLowerCase())
    );

    // Amplify intensity if it matches personal triggers
    const effectiveIntensity = isPersonalTrigger ? intensity * 1.5 : intensity;

    // Increase delight level
    state.level = Math.min(1, state.level + effectiveIntensity * 0.3);

    // Update peak delight
    state.peakDelight = Math.max(state.peakDelight, state.level);

    // Update referral likelihood
    this.updateReferralLikelihood(personaId, persona);
  }

  /**
   * Update delight over time (natural decay)
   */
  updateOverTime(personaId: string, deltaDays: number): void {
    const state = this.getState(personaId);

    // Track sustained delight
    if (state.level >= this.sustainedDelightThreshold) {
      state.sustainedDelightDays += deltaDays;
    } else {
      state.sustainedDelightDays = 0;
    }

    // Natural decay of delight
    const decay = deltaDays * this.delightDecayPerDay;
    state.level = Math.max(0, state.level - decay);
  }

  /**
   * Get current delight level
   */
  getDelightLevel(personaId: string): number {
    return this.getState(personaId).level;
  }

  /**
   * Get delight state
   */
  getState(personaId: string): DelightState {
    const state = this.states.get(personaId);
    if (!state) {
      throw new Error(`Persona ${personaId} not initialized`);
    }
    return state;
  }

  /**
   * Check if persona is likely to refer others
   */
  isLikelyToRefer(personaId: string): boolean {
    const state = this.getState(personaId);
    return state.referralLikelihood > 0.7;
  }

  /**
   * Get recent delight moments
   */
  getRecentMoments(personaId: string, count: number): DelightMoment[] {
    const state = this.getState(personaId);
    return state.moments.slice(-count);
  }

  /**
   * Get delight moments by category
   */
  getMomentsByCategory(
    personaId: string,
    category: DelightMoment['category']
  ): DelightMoment[] {
    const state = this.getState(personaId);
    return state.moments.filter((m) => m.category === category);
  }

  /**
   * Update referral likelihood based on delight state
   */
  private updateReferralLikelihood(
    personaId: string,
    persona: PersonaProfile
  ): void {
    const state = this.getState(personaId);

    // Base referral likelihood on current delight
    let likelihood = state.level * 0.5;

    // Increase if sustained delight
    if (state.sustainedDelightDays >= 2) {
      likelihood += 0.2;
    }

    // Increase if multiple delight moments
    if (state.moments.length >= 3) {
      likelihood += 0.1;
    }

    // Adjust based on persona characteristics
    if (persona.collaborationStyle === 'Community-driven') {
      likelihood += 0.15;
    }

    state.referralLikelihood = Math.min(1, likelihood);
  }

  /**
   * Update emotional state with delight
   */
  updateEmotionalState(
    personaId: string,
    emotionalState: EmotionalState
  ): EmotionalState {
    const delightLevel = this.getDelightLevel(personaId);

    return {
      ...emotionalState,
      delight: delightLevel,
    };
  }

  /**
   * Check if persona has reached delight threshold
   */
  hasReachedThreshold(personaId: string, threshold: number): boolean {
    return this.getDelightLevel(personaId) >= threshold;
  }

  /**
   * Reset delight state for a persona
   */
  reset(personaId: string): void {
    const state = this.getState(personaId);
    state.level = 0;
    state.moments = [];
    state.peakDelight = 0;
    state.sustainedDelightDays = 0;
    state.referralLikelihood = 0;
  }
}
