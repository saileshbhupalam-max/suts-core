/**
 * Performance Budgets and Thresholds
 * Define acceptable performance limits for the system
 */

/**
 * Performance budgets for system operations
 */
export const PERFORMANCE_BUDGETS = {
  /**
   * Maximum API response time (p95)
   */
  MAX_API_RESPONSE_TIME_MS: 2000,

  /**
   * Maximum memory usage per simulation
   */
  MAX_MEMORY_PER_SIMULATION_MB: 512,

  /**
   * Maximum storage per 1000 users
   */
  MAX_STORAGE_PER_1000_USERS_GB: 10,

  /**
   * Target simulations per hour
   */
  TARGET_SIMULATIONS_PER_HOUR: 100,

  /**
   * Target personas generated per hour
   */
  TARGET_PERSONAS_PER_HOUR: 50,

  /**
   * Maximum latency for event recording
   */
  MAX_EVENT_RECORD_LATENCY_MS: 100,

  /**
   * Maximum analysis time for 1000 events
   */
  MAX_ANALYSIS_TIME_PER_1000_EVENTS_MS: 5000,
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  /**
   * Maximum LLM API calls per minute
   */
  MAX_LLM_CALLS_PER_MINUTE: 60,

  /**
   * Maximum events recorded per second
   */
  MAX_EVENTS_PER_SECOND: 1000,

  /**
   * Maximum concurrent simulations per user
   */
  MAX_CONCURRENT_SIMULATIONS: 10,

  /**
   * Maximum API requests per hour
   */
  MAX_API_REQUESTS_PER_HOUR: 10000,
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  /**
   * Maximum number of retries for failed operations
   */
  MAX_RETRIES: 3,

  /**
   * Initial delay between retries (ms)
   */
  INITIAL_RETRY_DELAY_MS: 1000,

  /**
   * Backoff multiplier for exponential backoff
   */
  BACKOFF_MULTIPLIER: 2,

  /**
   * Maximum retry delay (ms)
   */
  MAX_RETRY_DELAY_MS: 30000,
} as const;

/**
 * Caching configuration
 */
export const CACHE_CONFIG = {
  /**
   * Default cache TTL (time to live) in seconds
   */
  DEFAULT_TTL_SECONDS: 3600,

  /**
   * Persona cache TTL
   */
  PERSONA_CACHE_TTL_SECONDS: 86400,

  /**
   * Analysis cache TTL
   */
  ANALYSIS_CACHE_TTL_SECONDS: 3600,

  /**
   * Product state cache TTL
   */
  PRODUCT_STATE_CACHE_TTL_SECONDS: 300,

  /**
   * Maximum cache size (number of items)
   */
  MAX_CACHE_SIZE: 10000,
} as const;

/**
 * Quality thresholds
 */
export const QUALITY_THRESHOLDS = {
  /**
   * Minimum test coverage percentage
   */
  MIN_TEST_COVERAGE_PERCENT: 95,

  /**
   * Minimum branch coverage percentage
   */
  MIN_BRANCH_COVERAGE_PERCENT: 90,

  /**
   * Minimum function coverage percentage
   */
  MIN_FUNCTION_COVERAGE_PERCENT: 90,

  /**
   * Maximum acceptable error rate
   */
  MAX_ERROR_RATE_PERCENT: 1,

  /**
   * Minimum persona confidence for use in simulation
   */
  MIN_PERSONA_CONFIDENCE: 0.3,
} as const;
