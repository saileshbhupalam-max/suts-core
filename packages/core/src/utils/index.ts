/**
 * Utility Modules
 * Common utility functions for validation, serialization, and error handling
 */

// Validation utilities
export {
  validateRange,
  validateNonEmpty,
  validateArrayLength,
  validateISODate,
  validateEnum,
  validateEmail,
  validateASCIIOnly,
  validateUUID,
  validateWithSchema,
  safeValidate,
  validatePercentage,
  validateProbability,
} from './validation';

// Serialization utilities
export {
  serialize,
  deserialize,
  safeDeserialize,
  toQueryString,
  fromQueryString,
  deepClone,
  deepEqual,
  sortObjectKeys,
  datesToISOStrings,
  isoStringsToDates,
  type SerializationOptions,
} from './serialization';

// Error utilities
export {
  SUTSError,
  ValidationError,
  ConfigurationError,
  SimulationError,
  PersonaError,
  TelemetryError,
  AnalysisError,
  ProductError,
  TimeoutError,
  RateLimitError,
  NotFoundError,
  isSUTSError,
  getErrorMessage,
  getErrorStack,
  wrapError,
  formatError,
  withRetry,
  tryCatch,
} from './errors';
