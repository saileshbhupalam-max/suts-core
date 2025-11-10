/**
 * Serialization Utilities
 * Helpers for JSON serialization and deserialization
 */

/**
 * Options for JSON serialization
 */
export interface SerializationOptions {
  /**
   * Whether to pretty-print the output
   * @default false
   */
  pretty?: boolean;

  /**
   * Indentation spaces for pretty printing
   * @default 2
   */
  indent?: number;

  /**
   * Whether to sort object keys
   * @default false
   */
  sortKeys?: boolean;
}

/**
 * Serialize object to JSON string with error handling
 * @param obj - Object to serialize
 * @param options - Serialization options
 * @returns JSON string
 * @throws Error if serialization fails
 */
export function serialize(obj: unknown, options: SerializationOptions = {}): string {
  const { pretty = false, indent = 2, sortKeys = false } = options;

  try {
    let target = obj;

    if (sortKeys) {
      target = sortObjectKeys(obj);
    }

    if (pretty) {
      return JSON.stringify(target, null, indent);
    }

    return JSON.stringify(target);
  } catch (error) {
    throw new Error(`Serialization failed: ${getErrorMessage(error)}`);
  }
}

/**
 * Deserialize JSON string to object with error handling
 * @param json - JSON string to deserialize
 * @returns Parsed object
 * @throws Error if deserialization fails
 */
export function deserialize<T = unknown>(json: string): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    throw new Error(`Deserialization failed: ${getErrorMessage(error)}`);
  }
}

/**
 * Safely deserialize JSON with default fallback
 * @param json - JSON string to deserialize
 * @param defaultValue - Default value if deserialization fails
 * @returns Parsed object or default value
 */
export function safeDeserialize<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Convert object to URL query string
 * @param params - Parameters object
 * @returns URL query string (without leading ?)
 */
export function toQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
          .join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    });

  return entries.join('&');
}

/**
 * Parse URL query string to object
 * @param queryString - Query string (with or without leading ?)
 * @returns Parameters object
 */
export function fromQueryString(queryString: string): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  const search = queryString.startsWith('?') ? queryString.slice(1) : queryString;

  if (!search) {
    return params;
  }

  const pairs = search.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(decodeURIComponent);
    if (!key) {
      continue;
    }

    if (key in params) {
      const existing = params[key];
      if (Array.isArray(existing)) {
        existing.push(value || '');
      } else {
        params[key] = [existing as string, value || ''];
      }
    } else {
      params[key] = value || '';
    }
  }

  return params;
}

/**
 * Deep clone an object using JSON serialization
 * @param obj - Object to clone
 * @returns Deep cloned object
 * @throws Error if cloning fails
 */
export function deepClone<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj)) as T;
  } catch (error) {
    throw new Error(`Deep clone failed: ${getErrorMessage(error)}`);
  }
}

/**
 * Check if two objects are deeply equal
 * @param obj1 - First object
 * @param obj2 - Second object
 * @returns True if objects are deeply equal
 */
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) {
    return true;
  }
  if (obj1 === null || obj2 === null) {
    return false;
  }
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }

  try {
    return JSON.stringify(sortObjectKeys(obj1)) === JSON.stringify(sortObjectKeys(obj2));
  } catch {
    return false;
  }
}

/**
 * Sort object keys recursively for consistent serialization
 * @param obj - Object to sort
 * @returns Object with sorted keys
 */
export function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
  }

  return sorted;
}

/**
 * Convert Date objects to ISO strings in an object
 * @param obj - Object containing dates
 * @returns Object with dates converted to strings
 */
export function datesToISOStrings<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(datesToISOStrings) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = datesToISOStrings(value);
  }

  return result as T;
}

/**
 * Convert ISO string dates to Date objects in an object
 * @param obj - Object containing ISO date strings
 * @returns Object with strings converted to Dates
 */
export function isoStringsToDates<T>(obj: T): T {
  if (obj === null) {
    return obj;
  }

  // Check for string first (before checking if it's an object)
  if (typeof obj === 'string') {
    if (isISODateString(obj)) {
      return new Date(obj) as unknown as T;
    }
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(isoStringsToDates) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = isoStringsToDates(value);
  }

  return result as T;
}

/**
 * Check if string is an ISO date string
 * @param value - String to check
 * @returns True if string is ISO date format
 */
function isISODateString(value: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
  return isoDateRegex.test(value);
}

/**
 * Get error message from unknown error type
 * @param error - Error object
 * @returns Error message string
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
