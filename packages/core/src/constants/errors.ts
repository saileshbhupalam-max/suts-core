/**
 * Error Codes and Messages
 * Standardized error codes for the SUTS system
 */

/**
 * Error code categories
 */
export const ERROR_CATEGORIES = {
  VALIDATION: 'VALIDATION',
  CONFIGURATION: 'CONFIGURATION',
  SIMULATION: 'SIMULATION',
  PERSONA: 'PERSONA',
  TELEMETRY: 'TELEMETRY',
  ANALYSIS: 'ANALYSIS',
  PRODUCT: 'PRODUCT',
  SYSTEM: 'SYSTEM',
  API: 'API',
  NETWORK: 'NETWORK',
} as const;

export type ErrorCategory = typeof ERROR_CATEGORIES[keyof typeof ERROR_CATEGORIES];

/**
 * Error codes
 */
export const ERROR_CODES = {
  // Validation errors (1000-1099)
  INVALID_SCHEMA: 'ERR_1000',
  INVALID_PERSONA: 'ERR_1001',
  INVALID_CONFIG: 'ERR_1002',
  INVALID_STATE: 'ERR_1003',
  INVALID_EVENT: 'ERR_1004',
  MISSING_REQUIRED_FIELD: 'ERR_1005',
  INVALID_RANGE: 'ERR_1006',
  INVALID_TYPE: 'ERR_1007',

  // Configuration errors (1100-1199)
  CONFIG_NOT_FOUND: 'ERR_1100',
  CONFIG_INVALID: 'ERR_1101',
  CONFIG_MISSING: 'ERR_1102',
  CONFIG_CONFLICT: 'ERR_1103',

  // Simulation errors (1200-1299)
  SIMULATION_NOT_FOUND: 'ERR_1200',
  SIMULATION_ALREADY_RUNNING: 'ERR_1201',
  SIMULATION_ALREADY_COMPLETED: 'ERR_1202',
  SIMULATION_FAILED: 'ERR_1203',
  SIMULATION_TIMEOUT: 'ERR_1204',
  SIMULATION_CANCELLED: 'ERR_1205',
  SIMULATION_LIMIT_EXCEEDED: 'ERR_1206',
  SESSION_FAILED: 'ERR_1207',
  ACTION_FAILED: 'ERR_1208',

  // Persona errors (1300-1399)
  PERSONA_NOT_FOUND: 'ERR_1300',
  PERSONA_GENERATION_FAILED: 'ERR_1301',
  PERSONA_VALIDATION_FAILED: 'ERR_1302',
  PERSONA_LOAD_FAILED: 'ERR_1303',
  PERSONA_SAVE_FAILED: 'ERR_1304',
  PERSONA_LIMIT_EXCEEDED: 'ERR_1305',
  PERSONA_CONFIDENCE_LOW: 'ERR_1306',

  // Telemetry errors (1400-1499)
  TELEMETRY_RECORD_FAILED: 'ERR_1400',
  TELEMETRY_QUERY_FAILED: 'ERR_1401',
  TELEMETRY_STORAGE_FULL: 'ERR_1402',
  TELEMETRY_CORRUPTION: 'ERR_1403',
  EVENT_VALIDATION_FAILED: 'ERR_1404',

  // Analysis errors (1500-1599)
  ANALYSIS_FAILED: 'ERR_1500',
  ANALYSIS_NOT_FOUND: 'ERR_1501',
  ANALYSIS_TIMEOUT: 'ERR_1502',
  INSUFFICIENT_DATA: 'ERR_1503',
  ANALYSIS_INVALID_TYPE: 'ERR_1504',

  // Product errors (1600-1699)
  PRODUCT_NOT_CONNECTED: 'ERR_1600',
  PRODUCT_ACTION_FAILED: 'ERR_1601',
  PRODUCT_STATE_INVALID: 'ERR_1602',
  PRODUCT_TIMEOUT: 'ERR_1603',
  PRODUCT_INITIALIZATION_FAILED: 'ERR_1604',

  // System errors (1700-1799)
  SYSTEM_ERROR: 'ERR_1700',
  OUT_OF_MEMORY: 'ERR_1701',
  DISK_FULL: 'ERR_1702',
  PERMISSION_DENIED: 'ERR_1703',
  RESOURCE_EXHAUSTED: 'ERR_1704',
  DEADLOCK_DETECTED: 'ERR_1705',

  // API errors (1800-1899)
  API_ERROR: 'ERR_1800',
  RATE_LIMIT_EXCEEDED: 'ERR_1801',
  AUTHENTICATION_FAILED: 'ERR_1802',
  AUTHORIZATION_FAILED: 'ERR_1803',
  API_TIMEOUT: 'ERR_1804',
  INVALID_REQUEST: 'ERR_1805',
  QUOTA_EXCEEDED: 'ERR_1806',

  // Network errors (1900-1999)
  NETWORK_ERROR: 'ERR_1900',
  CONNECTION_FAILED: 'ERR_1901',
  CONNECTION_TIMEOUT: 'ERR_1902',
  DNS_RESOLUTION_FAILED: 'ERR_1903',
  SSL_ERROR: 'ERR_1904',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Error messages mapped to error codes
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Validation errors
  ERR_1000: 'Schema validation failed',
  ERR_1001: 'Invalid persona data',
  ERR_1002: 'Invalid configuration',
  ERR_1003: 'Invalid state',
  ERR_1004: 'Invalid event data',
  ERR_1005: 'Missing required field',
  ERR_1006: 'Value out of valid range',
  ERR_1007: 'Invalid data type',

  // Configuration errors
  ERR_1100: 'Configuration not found',
  ERR_1101: 'Configuration is invalid',
  ERR_1102: 'Configuration is missing',
  ERR_1103: 'Configuration conflict detected',

  // Simulation errors
  ERR_1200: 'Simulation not found',
  ERR_1201: 'Simulation is already running',
  ERR_1202: 'Simulation has already completed',
  ERR_1203: 'Simulation execution failed',
  ERR_1204: 'Simulation timed out',
  ERR_1205: 'Simulation was cancelled',
  ERR_1206: 'Simulation limit exceeded',
  ERR_1207: 'Session execution failed',
  ERR_1208: 'Action execution failed',

  // Persona errors
  ERR_1300: 'Persona not found',
  ERR_1301: 'Persona generation failed',
  ERR_1302: 'Persona validation failed',
  ERR_1303: 'Failed to load personas',
  ERR_1304: 'Failed to save personas',
  ERR_1305: 'Persona limit exceeded',
  ERR_1306: 'Persona confidence too low',

  // Telemetry errors
  ERR_1400: 'Failed to record telemetry event',
  ERR_1401: 'Telemetry query failed',
  ERR_1402: 'Telemetry storage is full',
  ERR_1403: 'Telemetry data corruption detected',
  ERR_1404: 'Event validation failed',

  // Analysis errors
  ERR_1500: 'Analysis execution failed',
  ERR_1501: 'Analysis result not found',
  ERR_1502: 'Analysis timed out',
  ERR_1503: 'Insufficient data for analysis',
  ERR_1504: 'Invalid analysis type',

  // Product errors
  ERR_1600: 'Product is not connected',
  ERR_1601: 'Product action failed',
  ERR_1602: 'Invalid product state',
  ERR_1603: 'Product operation timed out',
  ERR_1604: 'Product initialization failed',

  // System errors
  ERR_1700: 'System error occurred',
  ERR_1701: 'Out of memory',
  ERR_1702: 'Disk is full',
  ERR_1703: 'Permission denied',
  ERR_1704: 'Resource exhausted',
  ERR_1705: 'Deadlock detected',

  // API errors
  ERR_1800: 'API error occurred',
  ERR_1801: 'Rate limit exceeded',
  ERR_1802: 'Authentication failed',
  ERR_1803: 'Authorization failed',
  ERR_1804: 'API request timed out',
  ERR_1805: 'Invalid API request',
  ERR_1806: 'API quota exceeded',

  // Network errors
  ERR_1900: 'Network error occurred',
  ERR_1901: 'Connection failed',
  ERR_1902: 'Connection timed out',
  ERR_1903: 'DNS resolution failed',
  ERR_1904: 'SSL/TLS error',
};

/**
 * Helper to get error category from error code
 */
export function getErrorCategory(code: ErrorCode): ErrorCategory {
  const codeNum = parseInt(code.split('_')[1] || '0', 10);

  if (codeNum >= 1000 && codeNum < 1100) {
return ERROR_CATEGORIES.VALIDATION;
}
  if (codeNum >= 1100 && codeNum < 1200) {
return ERROR_CATEGORIES.CONFIGURATION;
}
  if (codeNum >= 1200 && codeNum < 1300) {
return ERROR_CATEGORIES.SIMULATION;
}
  if (codeNum >= 1300 && codeNum < 1400) {
return ERROR_CATEGORIES.PERSONA;
}
  if (codeNum >= 1400 && codeNum < 1500) {
return ERROR_CATEGORIES.TELEMETRY;
}
  if (codeNum >= 1500 && codeNum < 1600) {
return ERROR_CATEGORIES.ANALYSIS;
}
  if (codeNum >= 1600 && codeNum < 1700) {
return ERROR_CATEGORIES.PRODUCT;
}
  if (codeNum >= 1700 && codeNum < 1800) {
return ERROR_CATEGORIES.SYSTEM;
}
  if (codeNum >= 1800 && codeNum < 1900) {
return ERROR_CATEGORIES.API;
}
  if (codeNum >= 1900 && codeNum < 2000) {
return ERROR_CATEGORIES.NETWORK;
}

  return ERROR_CATEGORIES.SYSTEM;
}
