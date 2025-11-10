/**
 * Core Data Models
 * All data models with Zod schemas for runtime validation
 */

// PersonaProfile
export {
  PersonaProfileSchema,
  validatePersonaProfile,
  safeValidatePersonaProfile,
  type PersonaProfile,
} from './PersonaProfile';

// SimulationState
export {
  SimulationStateSchema,
  validateSimulationState,
  safeValidateSimulationState,
  type SimulationState,
} from './SimulationState';

// TelemetryEvent
export {
  TelemetryEventSchema,
  EmotionalStateSchema,
  EventTypeSchema,
  validateTelemetryEvent,
  safeValidateTelemetryEvent,
  type TelemetryEvent,
  type EmotionalState,
  // Note: EventType is also exported from constants/events.ts
  // Use that for the full enum, this is just the schema type
} from './TelemetryEvent';

// AnalysisResult
export {
  AnalysisResultSchema,
  FrictionPointSchema,
  ValueMomentSchema,
  ViralTriggerSchema,
  RetentionAnalysisSchema,
  validateAnalysisResult,
  safeValidateAnalysisResult,
  type AnalysisResult,
  type FrictionPoint,
  type ValueMoment,
  type ViralTrigger,
  type RetentionAnalysis,
} from './AnalysisResult';

// ProductState
export {
  ProductStateSchema,
  FeatureFlagSchema,
  UIElementSchema,
  validateProductState,
  safeValidateProductState,
  productStateToDescription,
  type ProductState,
  type FeatureFlag,
  type UIElement,
} from './ProductState';
