/**
 * Event Types and Categories
 * Defines all event types and categories used in telemetry
 */

/**
 * Core event types
 */
export const EVENT_TYPES = {
  ACTION: 'action',
  OBSERVATION: 'observation',
  DECISION: 'decision',
  EMOTION: 'emotion',
  ERROR: 'error',
  MILESTONE: 'milestone',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

/**
 * Action types that users can perform
 */
export const ACTION_TYPES = {
  INSTALL: 'install',
  UNINSTALL: 'uninstall',
  CONFIGURE: 'configure',
  USE_FEATURE: 'use_feature',
  READ_DOCS: 'read_docs',
  SEEK_HELP: 'seek_help',
  CUSTOMIZE: 'customize',
  SHARE: 'share',
  REFER: 'refer',
  REPORT_ISSUE: 'report_issue',
  PROVIDE_FEEDBACK: 'provide_feedback',
  UPGRADE: 'upgrade',
  DOWNGRADE: 'downgrade',
} as const;

export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

/**
 * Milestone types
 */
export const MILESTONE_TYPES = {
  FIRST_USE: 'first_use',
  ACTIVATION: 'activation',
  AHA_MOMENT: 'aha_moment',
  HABIT_FORMED: 'habit_formed',
  POWER_USER: 'power_user',
  CHURNED: 'churned',
  REFERRED: 'referred',
  UPGRADED: 'upgraded',
} as const;

export type MilestoneType = typeof MILESTONE_TYPES[keyof typeof MILESTONE_TYPES];

/**
 * Emotion categories
 */
export const EMOTION_CATEGORIES = {
  FRUSTRATION: 'frustration',
  CONFIDENCE: 'confidence',
  DELIGHT: 'delight',
  CONFUSION: 'confusion',
} as const;

export type EmotionCategory = typeof EMOTION_CATEGORIES[keyof typeof EMOTION_CATEGORIES];

/**
 * Event priority levels
 */
export const EVENT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type EventPriority = typeof EVENT_PRIORITIES[keyof typeof EVENT_PRIORITIES];

/**
 * Simulation lifecycle events
 */
export const SIMULATION_EVENTS = {
  CREATED: 'simulation.created',
  STARTED: 'simulation.started',
  PAUSED: 'simulation.paused',
  RESUMED: 'simulation.resumed',
  COMPLETED: 'simulation.completed',
  FAILED: 'simulation.failed',
  CANCELLED: 'simulation.cancelled',
  PROGRESS: 'simulation.progress',
} as const;

export type SimulationEvent = typeof SIMULATION_EVENTS[keyof typeof SIMULATION_EVENTS];

/**
 * Persona lifecycle events
 */
export const PERSONA_EVENTS = {
  GENERATED: 'persona.generated',
  VALIDATED: 'persona.validated',
  ACTIVATED: 'persona.activated',
  DEACTIVATED: 'persona.deactivated',
  UPDATED: 'persona.updated',
  ARCHIVED: 'persona.archived',
} as const;

export type PersonaEvent = typeof PERSONA_EVENTS[keyof typeof PERSONA_EVENTS];

/**
 * Analysis events
 */
export const ANALYSIS_EVENTS = {
  STARTED: 'analysis.started',
  COMPLETED: 'analysis.completed',
  FAILED: 'analysis.failed',
  FRICTION_DETECTED: 'analysis.friction_detected',
  VALUE_DETECTED: 'analysis.value_detected',
  INSIGHT_GENERATED: 'analysis.insight_generated',
} as const;

export type AnalysisEvent = typeof ANALYSIS_EVENTS[keyof typeof ANALYSIS_EVENTS];
