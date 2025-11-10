/**
 * Constants
 * Centralized constants for configuration, performance budgets, events, and errors
 */

// Simulation constants
export {
  SIMULATION_DEFAULTS,
  SIMULATION_LIMITS,
  SIMULATION_TIMEOUTS,
  SESSION_PHASES,
  type SessionPhase,
} from './simulation';

// Performance constants
export {
  PERFORMANCE_BUDGETS,
  RATE_LIMITS,
  RETRY_CONFIG,
  CACHE_CONFIG,
  QUALITY_THRESHOLDS,
} from './performance';

// Event constants
export {
  EVENT_TYPES,
  ACTION_TYPES,
  MILESTONE_TYPES,
  EMOTION_CATEGORIES,
  EVENT_PRIORITIES,
  SIMULATION_EVENTS,
  PERSONA_EVENTS,
  ANALYSIS_EVENTS,
  type EventType,
  type ActionType,
  type MilestoneType,
  type EmotionCategory,
  type EventPriority,
  type SimulationEvent,
  type PersonaEvent,
  type AnalysisEvent,
} from './events';

// Error constants
export {
  ERROR_CATEGORIES,
  ERROR_CODES,
  ERROR_MESSAGES,
  getErrorCategory,
  type ErrorCategory,
  type ErrorCode,
} from './errors';
