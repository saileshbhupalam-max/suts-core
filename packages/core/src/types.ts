/**
 * Core types for SUTS
 */

import type { PersonaProfile } from './models';

/**
 * Emotional state of a simulated user
 */
export interface EmotionalState {
  frustration: number;
  confidence: number;
  delight: number;
  confusion: number;
}

/**
 * Action types that users can perform
 */
export enum ActionType {
  INSTALL = 'install',
  CONFIGURE = 'configure',
  USE_FEATURE = 'use_feature',
  READ_DOCS = 'read_docs',
  SEEK_HELP = 'seek_help',
  CUSTOMIZE = 'customize',
  SHARE = 'share',
  UNINSTALL = 'uninstall',
}

/**
 * Base configuration for simulations
 */
export interface SimulationConfig {
  id: string;
  name: string;
  description: string;
  personaIds: string[];
  numPersonas: number;
  productVersion: string;
  featuresEnabled: Record<string, boolean>;
  numSessions: number;
  timeCompression: number;
  maxParallel: number;
  calibrationData?: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
}

/**
 * Interface for persona generation
 */
export interface IPersonaGenerator {
  /**
   * Generate personas from stakeholder analysis documents
   * @param docs - Array of analysis documents (text/markdown)
   * @param count - Number of personas to generate
   * @returns Promise resolving to array of generated personas
   */
  generateFromAnalysis(docs: string[], count: number): Promise<PersonaProfile[]>;
}

/**
 * User action in the simulation
 */
export interface UserAction {
  type: ActionType;
  feature: string;
  description: string;
  expectedOutcome: string;
  metadata?: Record<string, unknown>;
}

/**
 * Product state for simulation
 */
export interface ProductState {
  features: Record<string, boolean>;
  uiElements: Record<string, Record<string, unknown>>;
  data: Record<string, unknown>;
  version: string;
}

/**
 * Product adapter interface for simulation
 */
export interface IProductAdapter {
  /**
   * Get the initial state of the product
   */
  getInitialState(): ProductState;

  /**
   * Apply an action to the current state
   */
  applyAction(state: ProductState, action: UserAction): ProductState;

  /**
   * Get available actions for the current state and persona
   */
  getAvailableActions(state: ProductState, persona: PersonaProfile): UserAction[];
}
