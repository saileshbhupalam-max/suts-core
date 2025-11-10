/**
 * Core types for SUTS
 * Only types that are not in models/ or interfaces/
 */

import type { PersonaProfile } from './models/PersonaProfile';
import type { ProductState } from './models/ProductState';

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
 * Simple product adapter interface for basic simulations
 * For full-featured adapters, use IProductAdapter from ./interfaces
 * @deprecated Use IProductAdapter for new implementations
 */
export interface ISimpleProductAdapter {
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
