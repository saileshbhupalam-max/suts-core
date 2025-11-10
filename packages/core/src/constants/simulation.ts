/**
 * Simulation Configuration Constants
 * Default values and limits for simulation parameters
 */

/**
 * Default simulation configuration values
 */
export const SIMULATION_DEFAULTS = {
  /**
   * Default number of sessions to simulate
   */
  NUM_SESSIONS: 30,

  /**
   * Default time compression factor
   */
  TIME_COMPRESSION: 1,

  /**
   * Default maximum parallel simulations
   */
  MAX_PARALLEL: 50,

  /**
   * Default diversity weight for persona generation
   */
  DIVERSITY_WEIGHT: 0.8,

  /**
   * Default number of personas to generate
   */
  NUM_PERSONAS: 30,

  /**
   * Default persona confidence score
   */
  PERSONA_CONFIDENCE: 0.5,

  /**
   * Default emotional baseline values
   */
  EMOTIONAL_BASELINE: {
    frustration: 0.3,
    confidence: 0.5,
    delight: 0.3,
    confusion: 0.2,
  },
} as const;

/**
 * Simulation limits and constraints
 */
export const SIMULATION_LIMITS = {
  /**
   * Maximum number of personas per simulation
   */
  MAX_PERSONAS: 10000,

  /**
   * Minimum number of personas per simulation
   */
  MIN_PERSONAS: 1,

  /**
   * Maximum number of sessions
   */
  MAX_SESSIONS: 365,

  /**
   * Minimum number of sessions
   */
  MIN_SESSIONS: 1,

  /**
   * Maximum time compression factor
   */
  MAX_TIME_COMPRESSION: 100,

  /**
   * Minimum time compression factor
   */
  MIN_TIME_COMPRESSION: 1,

  /**
   * Maximum parallel simulations
   */
  MAX_PARALLEL_LIMIT: 1000,

  /**
   * Maximum events per simulation
   */
  MAX_EVENTS_PER_SIMULATION: 1000000,

  /**
   * Maximum actions per session
   */
  MAX_ACTIONS_PER_SESSION: 100,
} as const;

/**
 * Simulation timeouts (in milliseconds)
 */
export const SIMULATION_TIMEOUTS = {
  /**
   * Timeout for single action execution
   */
  ACTION_TIMEOUT_MS: 30000,

  /**
   * Timeout for single session
   */
  SESSION_TIMEOUT_MS: 300000,

  /**
   * Timeout for entire simulation
   */
  SIMULATION_TIMEOUT_MS: 3600000,

  /**
   * Timeout for persona generation
   */
  PERSONA_GENERATION_TIMEOUT_MS: 120000,

  /**
   * Timeout for analysis
   */
  ANALYSIS_TIMEOUT_MS: 600000,
} as const;

/**
 * Session phase names
 */
export const SESSION_PHASES = {
  INITIALIZATION: 'initialization',
  ONBOARDING: 'onboarding',
  ACTIVE_USE: 'active_use',
  EXPLORATION: 'exploration',
  DECISION: 'decision',
  COMPLETION: 'completion',
} as const;

export type SessionPhase = typeof SESSION_PHASES[keyof typeof SESSION_PHASES];
