/**
 * Core types for SUTS
 */

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
 * Persona profile for simulation
 */
export interface PersonaProfile {
  id: string;
  archetype: string;
  role: string;
  experienceLevel: 'Novice' | 'Intermediate' | 'Expert';
  companySize: 'Startup' | 'SMB' | 'Enterprise';
  techStack: string[];
  painPoints: string[];
  goals: string[];
  fears: string[];
  values: string[];
  riskTolerance: number;
  patienceLevel: number;
  techAdoption: 'Early adopter' | 'Early majority' | 'Late majority' | 'Laggard';
  learningStyle: 'Trial-error' | 'Documentation' | 'Video' | 'Peer learning';
  evaluationCriteria: string[];
  dealBreakers: string[];
  delightTriggers: string[];
  referralTriggers: string[];
  typicalWorkflow: string;
  timeAvailability: string;
  collaborationStyle: 'Solo' | 'Team' | 'Community-driven';
  state: Record<string, unknown>;
  history: Array<Record<string, unknown>>;
  confidenceScore: number;
  lastUpdated: string;
  source: string;
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
