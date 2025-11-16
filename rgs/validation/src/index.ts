/**
 * RGS Validation Framework
 * A/B testing framework to prove RGS improves SUTS accuracy
 */

// Core classes
export { SUTSValidator } from './validator';
export { SUTSSimulator } from './simulator';

// Metrics functions
export {
  calculateAccuracy,
  calculateAccuracyBreakdown,
  calculateConfidence,
  calculateImprovement,
} from './metrics';

// Reporter functions
export {
  generateReport,
  generateJSONReport,
  generateCSVReport,
} from './reporter';

// Types and schemas
export type {
  CalibratedPersona,
  SUTSResult,
  ActualData,
  AccuracyBreakdown,
  ValidationResult,
  TestConfig,
} from './types';

export {
  CalibratedPersonaSchema,
  SUTSResultSchema,
  ActualDataSchema,
  AccuracyBreakdownSchema,
  ValidationResultSchema,
  TestConfigSchema,
  ValidationError,
  SimulatorError,
  MetricsError,
  validatePersonaProfile,
  validateCalibratedPersona,
  safeValidateCalibratedPersona,
} from './types';
