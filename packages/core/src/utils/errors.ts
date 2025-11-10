/**
 * Error Utilities
 * Custom error classes and error handling utilities
 */

import { ERROR_CODES, ERROR_MESSAGES, getErrorCategory, type ErrorCode } from '../constants';

/**
 * Base SUTS error class
 * All custom errors extend from this
 */
export class SUTSError extends Error {
  public readonly code: ErrorCode;
  public readonly category: string;
  public readonly timestamp: Date;
  public readonly metadata: Record<string, unknown> | undefined;

  constructor(
    code: ErrorCode,
    message?: string,
    metadata?: Record<string, unknown>
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = 'SUTSError';
    this.code = code;
    this.category = getErrorCategory(code);
    this.timestamp = new Date();
    this.metadata = metadata;

    // Maintain proper stack trace (V8 specific)
    const captureStackTrace = (Error as typeof Error & { captureStackTrace?: (target: Error, constructor: Function) => void }).captureStackTrace;
    if (typeof captureStackTrace === 'function') {
      captureStackTrace(this, SUTSError);
    }
  }

  /**
   * Convert error to JSON-serializable object
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

/**
 * Validation error
 */
export class ValidationError extends SUTSError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(ERROR_CODES.INVALID_SCHEMA, message, metadata);
    this.name = 'ValidationError';
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends SUTSError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(ERROR_CODES.CONFIG_INVALID, message, metadata);
    this.name = 'ConfigurationError';
  }
}

/**
 * Simulation error
 */
export class SimulationError extends SUTSError {
  constructor(
    code: ErrorCode = ERROR_CODES.SIMULATION_FAILED,
    message?: string,
    metadata?: Record<string, unknown>
  ) {
    super(code, message, metadata);
    this.name = 'SimulationError';
  }
}

/**
 * Persona error
 */
export class PersonaError extends SUTSError {
  constructor(
    code: ErrorCode = ERROR_CODES.PERSONA_GENERATION_FAILED,
    message?: string,
    metadata?: Record<string, unknown>
  ) {
    super(code, message, metadata);
    this.name = 'PersonaError';
  }
}

/**
 * Telemetry error
 */
export class TelemetryError extends SUTSError {
  constructor(
    code: ErrorCode = ERROR_CODES.TELEMETRY_RECORD_FAILED,
    message?: string,
    metadata?: Record<string, unknown>
  ) {
    super(code, message, metadata);
    this.name = 'TelemetryError';
  }
}

/**
 * Analysis error
 */
export class AnalysisError extends SUTSError {
  constructor(
    code: ErrorCode = ERROR_CODES.ANALYSIS_FAILED,
    message?: string,
    metadata?: Record<string, unknown>
  ) {
    super(code, message, metadata);
    this.name = 'AnalysisError';
  }
}

/**
 * Product adapter error
 */
export class ProductError extends SUTSError {
  constructor(
    code: ErrorCode = ERROR_CODES.PRODUCT_ACTION_FAILED,
    message?: string,
    metadata?: Record<string, unknown>
  ) {
    super(code, message, metadata);
    this.name = 'ProductError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends SUTSError {
  public readonly timeoutMs: number;

  constructor(operation: string, timeoutMs: number, metadata?: Record<string, unknown>) {
    super(
      ERROR_CODES.SIMULATION_TIMEOUT,
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      { ...metadata, operation, timeoutMs }
    );
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends SUTSError {
  public readonly limit: number;
  public readonly retryAfterMs: number | undefined;

  constructor(
    resource: string,
    limit: number,
    retryAfterMs?: number,
    metadata?: Record<string, unknown>
  ) {
    super(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded for ${resource}: ${limit} requests`,
      { ...metadata, resource, limit, retryAfterMs }
    );
    this.name = 'RateLimitError';
    this.limit = limit;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Not found error
 */
export class NotFoundError extends SUTSError {
  public readonly resourceType: string;
  public readonly resourceId: string;

  constructor(resourceType: string, resourceId: string, metadata?: Record<string, unknown>) {
    super(
      ERROR_CODES.SIMULATION_NOT_FOUND,
      `${resourceType} not found: ${resourceId}`,
      { ...metadata, resourceType, resourceId }
    );
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * Check if error is a SUTS error
 */
export function isSUTSError(error: unknown): error is SUTSError {
  return error instanceof SUTSError;
}

/**
 * Get error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

/**
 * Get error stack from unknown error type
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * Wrap an error with additional context
 */
export function wrapError(
  error: unknown,
  context: string,
  metadata?: Record<string, unknown>
): SUTSError {
  const message = `${context}: ${getErrorMessage(error)}`;

  if (isSUTSError(error)) {
    return new SUTSError(error.code, message, {
      ...error.metadata,
      ...metadata,
      originalError: error.toJSON(),
    });
  }

  return new SUTSError(ERROR_CODES.SYSTEM_ERROR, message, {
    ...metadata,
    originalError: getErrorMessage(error),
    originalStack: getErrorStack(error),
  });
}

/**
 * Format error for logging
 */
export function formatError(error: unknown): string {
  if (isSUTSError(error)) {
    const parts = [
      `[${error.code}] ${error.message}`,
      `Category: ${error.category}`,
      `Timestamp: ${error.timestamp.toISOString()}`,
    ];

    if (error.metadata && Object.keys(error.metadata).length > 0) {
      parts.push(`Metadata: ${JSON.stringify(error.metadata, null, 2)}`);
    }

    if (error.stack) {
      parts.push(`Stack: ${error.stack}`);
    }

    return parts.join('\n');
  }

  if (error instanceof Error) {
    return `${error.message}\n${error.stack || ''}`;
  }

  return String(error);
}

/**
 * Create error handler with retry logic
 */
export function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    shouldRetry = () => true,
  } = options;

  let attempt = 0;

  const execute = async (): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      attempt++;

      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(initialDelayMs * Math.pow(backoffMultiplier, attempt - 1), maxDelayMs);

      await new Promise<void>(resolve => {
        const timer = globalThis.setTimeout(() => resolve(), delay);
        return timer;
      });
      return execute();
    }
  };

  return execute();
}

/**
 * Async error boundary wrapper
 */
export async function tryCatch<T>(
  operation: () => Promise<T>,
  errorHandler?: (error: unknown) => void | Promise<void>
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    if (errorHandler) {
      await errorHandler(error);
    }
    return undefined;
  }
}
