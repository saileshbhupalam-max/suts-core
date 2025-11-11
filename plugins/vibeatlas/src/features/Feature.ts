/**
 * Feature Interface
 * Base interface for all VibeAtlas features
 */

import type { UserAction, PersonaProfile } from '@suts/core';
import type { VibeAtlasState } from '../models/VibeAtlasState';

/**
 * Feature interface
 * Each feature implements this to handle its own state transitions
 */
export interface Feature {
  /**
   * Feature name (matches feature key in state)
   */
  name: string;

  /**
   * Apply an action to the state
   * @param state - Current VibeAtlas state
   * @param action - User action to apply
   * @param persona - User persona
   * @returns Updated state
   */
  applyAction(state: VibeAtlasState, action: UserAction, persona: PersonaProfile): VibeAtlasState;

  /**
   * Get available actions for this feature
   * @param state - Current VibeAtlas state
   * @param persona - User persona
   * @returns List of available actions
   */
  getAvailableActions(state: VibeAtlasState, persona: PersonaProfile): UserAction[];
}
