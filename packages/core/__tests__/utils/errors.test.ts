/**
 * Tests for error utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
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
} from '../../src/utils/errors';
import { ERROR_CODES } from '../../src/constants';

describe('SUTSError', () => {
  it('should create error with code and message', () => {
    const error = new SUTSError(ERROR_CODES.SIMULATION_FAILED, 'Test error');
    expect(error.code).toBe(ERROR_CODES.SIMULATION_FAILED);
    expect(error.message).toBe('Test error');
    expect(error.category).toBe('SIMULATION');
  });

  it('should use default message from ERROR_MESSAGES', () => {
    const error = new SUTSError(ERROR_CODES.SIMULATION_FAILED);
    expect(error.message).toBe('Simulation execution failed');
  });

  it('should include timestamp', () => {
    const error = new SUTSError(ERROR_CODES.SIMULATION_FAILED);
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should include metadata', () => {
    const metadata = { simulationId: 'sim-001' };
    const error = new SUTSError(ERROR_CODES.SIMULATION_FAILED, 'Test', metadata);
    expect(error.metadata).toEqual(metadata);
  });

  it('should convert to JSON', () => {
    const error = new SUTSError(ERROR_CODES.SIMULATION_FAILED, 'Test');
    const json = error.toJSON();
    expect(json['name']).toBe('SUTSError');
    expect(json['code']).toBe(ERROR_CODES.SIMULATION_FAILED);
    expect(json['message']).toBe('Test');
  });
});

describe('ValidationError', () => {
  it('should create validation error', () => {
    const error = new ValidationError('Invalid data');
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe(ERROR_CODES.INVALID_SCHEMA);
    expect(error.message).toBe('Invalid data');
  });
});

describe('ConfigurationError', () => {
  it('should create configuration error', () => {
    const error = new ConfigurationError('Invalid config');
    expect(error.name).toBe('ConfigurationError');
    expect(error.code).toBe(ERROR_CODES.CONFIG_INVALID);
  });
});

describe('SimulationError', () => {
  it('should create simulation error', () => {
    const error = new SimulationError();
    expect(error.name).toBe('SimulationError');
    expect(error.code).toBe(ERROR_CODES.SIMULATION_FAILED);
  });

  it('should accept custom code', () => {
    const error = new SimulationError(ERROR_CODES.SIMULATION_TIMEOUT);
    expect(error.code).toBe(ERROR_CODES.SIMULATION_TIMEOUT);
  });
});

describe('PersonaError', () => {
  it('should create persona error', () => {
    const error = new PersonaError();
    expect(error.name).toBe('PersonaError');
    expect(error.code).toBe(ERROR_CODES.PERSONA_GENERATION_FAILED);
  });
});

describe('TelemetryError', () => {
  it('should create telemetry error', () => {
    const error = new TelemetryError();
    expect(error.name).toBe('TelemetryError');
    expect(error.code).toBe(ERROR_CODES.TELEMETRY_RECORD_FAILED);
  });
});

describe('AnalysisError', () => {
  it('should create analysis error', () => {
    const error = new AnalysisError();
    expect(error.name).toBe('AnalysisError');
    expect(error.code).toBe(ERROR_CODES.ANALYSIS_FAILED);
  });
});

describe('ProductError', () => {
  it('should create product error', () => {
    const error = new ProductError();
    expect(error.name).toBe('ProductError');
    expect(error.code).toBe(ERROR_CODES.PRODUCT_ACTION_FAILED);
  });
});

describe('TimeoutError', () => {
  it('should create timeout error', () => {
    const error = new TimeoutError('simulation', 5000);
    expect(error.name).toBe('TimeoutError');
    expect(error.message).toContain('timed out after 5000ms');
    expect(error.timeoutMs).toBe(5000);
  });
});

describe('RateLimitError', () => {
  it('should create rate limit error', () => {
    const error = new RateLimitError('API calls', 100);
    expect(error.name).toBe('RateLimitError');
    expect(error.message).toContain('Rate limit exceeded');
    expect(error.limit).toBe(100);
  });

  it('should include retry after', () => {
    const error = new RateLimitError('API calls', 100, 60000);
    expect(error.retryAfterMs).toBe(60000);
  });
});

describe('NotFoundError', () => {
  it('should create not found error', () => {
    const error = new NotFoundError('Simulation', 'sim-001');
    expect(error.name).toBe('NotFoundError');
    expect(error.message).toContain('sim-001');
    expect(error.resourceType).toBe('Simulation');
    expect(error.resourceId).toBe('sim-001');
  });
});

describe('isSUTSError', () => {
  it('should return true for SUTS errors', () => {
    const error = new SUTSError(ERROR_CODES.SIMULATION_FAILED);
    expect(isSUTSError(error)).toBe(true);
  });

  it('should return false for regular errors', () => {
    const error = new Error('Regular error');
    expect(isSUTSError(error)).toBe(false);
  });

  it('should return false for non-errors', () => {
    expect(isSUTSError('string')).toBe(false);
    expect(isSUTSError(123)).toBe(false);
    expect(isSUTSError(null)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('should get message from Error', () => {
    const error = new Error('Test message');
    expect(getErrorMessage(error)).toBe('Test message');
  });

  it('should convert string to message', () => {
    expect(getErrorMessage('error string')).toBe('error string');
  });

  it('should convert other types to string', () => {
    expect(getErrorMessage(123)).toBe('123');
    expect(getErrorMessage(null)).toBe('null');
  });
});

describe('getErrorStack', () => {
  it('should get stack from Error', () => {
    const error = new Error('Test');
    const stack = getErrorStack(error);
    expect(stack).toBeDefined();
    expect(typeof stack).toBe('string');
  });

  it('should return undefined for non-errors', () => {
    expect(getErrorStack('string')).toBeUndefined();
    expect(getErrorStack(123)).toBeUndefined();
  });
});

describe('wrapError', () => {
  it('should wrap Error with context', () => {
    const original = new Error('Original error');
    const wrapped = wrapError(original, 'Context');
    expect(wrapped.message).toContain('Context');
    expect(wrapped.message).toContain('Original error');
  });

  it('should wrap SUTS error preserving code', () => {
    const original = new SUTSError(ERROR_CODES.SIMULATION_FAILED, 'Original');
    const wrapped = wrapError(original, 'Context');
    expect(wrapped.code).toBe(ERROR_CODES.SIMULATION_FAILED);
  });

  it('should wrap string errors', () => {
    const wrapped = wrapError('error string', 'Context');
    expect(wrapped.message).toContain('Context');
    expect(wrapped.message).toContain('error string');
  });

  it('should include metadata', () => {
    const metadata = { key: 'value' };
    const wrapped = wrapError('error', 'Context', metadata);
    expect(wrapped.metadata).toMatchObject(metadata);
  });
});

describe('formatError', () => {
  it('should format SUTS error', () => {
    const error = new SUTSError(ERROR_CODES.SIMULATION_FAILED, 'Test error');
    const formatted = formatError(error);
    expect(formatted).toContain(error.code);
    expect(formatted).toContain('Test error');
    expect(formatted).toContain('SIMULATION');
  });

  it('should format regular Error', () => {
    const error = new Error('Test error');
    const formatted = formatError(error);
    expect(formatted).toContain('Test error');
  });

  it('should format non-error values', () => {
    expect(formatError('string error')).toBe('string error');
    expect(formatError(123)).toBe('123');
  });

  it('should include metadata in SUTS error formatting', () => {
    const error = new SUTSError(ERROR_CODES.SIMULATION_FAILED, 'Test', { key: 'value' });
    const formatted = formatError(error);
    expect(formatted).toContain('Metadata');
    expect(formatted).toContain('key');
  });

  it('should include stack trace when available', () => {
    const error = new Error('Test');
    const formatted = formatError(error);
    expect(formatted.length).toBeGreaterThan('Test'.length);
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const result = await withRetry(operation);
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    jest.useRealTimers();

    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValue('success');

    const result = await withRetry(operation, {
      maxRetries: 3,
      initialDelayMs: 1,
    });
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);

    jest.useFakeTimers();
  });

  it('should throw after max retries', async () => {
    jest.useRealTimers();

    const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

    await expect(withRetry(operation, {
      maxRetries: 2,
      initialDelayMs: 1,
    })).rejects.toThrow('Always fails');
    expect(operation).toHaveBeenCalledTimes(2);

    jest.useFakeTimers();
  });

  it('should respect shouldRetry callback', async () => {
    jest.useRealTimers();

    const operation = jest.fn().mockRejectedValue(new Error('Special error'));
    const shouldRetry = jest.fn().mockReturnValue(false);

    await expect(withRetry(operation, { shouldRetry })).rejects.toThrow('Special error');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalled();

    jest.useFakeTimers();
  });
});

describe('tryCatch', () => {
  it('should return result on success', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const result = await tryCatch(operation);
    expect(result).toBe('success');
  });

  it('should return undefined on error', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failed'));
    const result = await tryCatch(operation);
    expect(result).toBeUndefined();
  });

  it('should call error handler on error', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failed'));
    const errorHandler = jest.fn();

    await tryCatch(operation, errorHandler);
    expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should handle async error handler', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Failed'));
    const errorHandler = jest.fn().mockResolvedValue(undefined);

    const result = await tryCatch(operation, errorHandler);
    expect(result).toBeUndefined();
    expect(errorHandler).toHaveBeenCalled();
  });
});
