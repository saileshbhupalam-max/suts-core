/**
 * RGS Calibration - Main Index
 *
 * Exports all public APIs for persona calibration with RGS insights.
 */

// Calibrator
export {
  PersonaCalibrator,
  createCalibrator,
  type CalibratorConfig,
  CalibrationError,
} from './calibrator';

// Traits
export {
  type PersonaTrait,
  type TraitCategory,
  extractTraits,
  filterTraitsByCategory,
  filterTraitsByConfidence,
  groupTraitsByName,
  TraitExtractionError,
} from './traits';

// Merger
export {
  mergeTraits,
  resolveConflict,
  deduplicateTraits,
  calculateAverageConfidence,
  validateTraits,
  type ConflictResolutionStrategy,
  TraitMergeError,
} from './merger';

// Profiles
export {
  type CalibratedPersona,
  CalibratedPersonaSchema,
  createCalibratedPersona,
  validateCalibratedPersona,
  extractUniqueSources,
  ProfileGenerationError,
} from './profiles';
