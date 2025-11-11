/**
 * Unit tests for RGS error classes
 */

import {
  ScraperError,
  RateLimitError,
  NetworkError,
  AuthenticationError,
  ValidationError
} from '../src/errors';

describe('ScraperError', () => {
  it('should create error with all properties', () => {
    const cause = new Error('Original error');
    const error = new ScraperError('Test error', 'test-source', true, cause);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ScraperError);
    expect(error.name).toBe('ScraperError');
    expect(error.message).toBe('Test error');
    expect(error.source).toBe('test-source');
    expect(error.retryable).toBe(true);
    expect(error.cause).toBe(cause);
    expect(error.stack).toBeDefined();
  });

  it('should create error without cause', () => {
    const error = new ScraperError('Test error', 'test-source', false);

    expect(error.message).toBe('Test error');
    expect(error.source).toBe('test-source');
    expect(error.retryable).toBe(false);
    expect(error.cause).toBeUndefined();
  });

  it('should convert to JSON', () => {
    const cause = new Error('Original error');
    const error = new ScraperError('Test error', 'test-source', true, cause);

    const json = error.toJSON();

    expect(json['name']).toBe('ScraperError');
    expect(json['message']).toBe('Test error');
    expect(json['source']).toBe('test-source');
    expect(json['retryable']).toBe(true);
    expect(json['cause']).toBeDefined();
    expect(json['cause']).toMatchObject({
      name: 'Error',
      message: 'Original error'
    });
    expect(json['stack']).toBeDefined();
  });

  it('should convert to JSON without cause', () => {
    const error = new ScraperError('Test error', 'test-source', true);

    const json = error.toJSON();

    expect(json['cause']).toBeUndefined();
  });
});

describe('RateLimitError', () => {
  it('should create error with retry after time', () => {
    const error = new RateLimitError('Rate limited', 'reddit', 5000);

    expect(error).toBeInstanceOf(ScraperError);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.name).toBe('RateLimitError');
    expect(error.message).toBe('Rate limited');
    expect(error.source).toBe('reddit');
    expect(error.retryable).toBe(true);
    expect(error.retryAfterMs).toBe(5000);
  });

  it('should create error without retry after time', () => {
    const error = new RateLimitError('Rate limited', 'twitter');

    expect(error.retryable).toBe(true);
    expect(error.retryAfterMs).toBeUndefined();
  });

  it('should convert to JSON with retry after time', () => {
    const error = new RateLimitError('Rate limited', 'reddit', 5000);

    const json = error.toJSON();

    expect(json['retryAfterMs']).toBe(5000);
  });
});

describe('NetworkError', () => {
  it('should create error with status code', () => {
    const error = new NetworkError('Connection failed', 'reddit', 503);

    expect(error).toBeInstanceOf(ScraperError);
    expect(error).toBeInstanceOf(NetworkError);
    expect(error.name).toBe('NetworkError');
    expect(error.message).toBe('Connection failed');
    expect(error.source).toBe('reddit');
    expect(error.statusCode).toBe(503);
    expect(error.retryable).toBe(true);
  });

  it('should create error without status code', () => {
    const error = new NetworkError('Connection failed', 'reddit');

    expect(error.statusCode).toBeUndefined();
    expect(error.retryable).toBe(true);
  });

  it('should create non-retryable error', () => {
    const error = new NetworkError('DNS failed', 'reddit', undefined, false);

    expect(error.retryable).toBe(false);
  });

  it('should convert to JSON with status code', () => {
    const error = new NetworkError('Connection failed', 'reddit', 503);

    const json = error.toJSON();

    expect(json['statusCode']).toBe(503);
  });
});

describe('AuthenticationError', () => {
  it('should create non-retryable auth error', () => {
    const error = new AuthenticationError('Invalid credentials', 'reddit');

    expect(error).toBeInstanceOf(ScraperError);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.name).toBe('AuthenticationError');
    expect(error.message).toBe('Invalid credentials');
    expect(error.source).toBe('reddit');
    expect(error.retryable).toBe(false);
  });

  it('should create auth error with cause', () => {
    const cause = new Error('401 Unauthorized');
    const error = new AuthenticationError('Invalid credentials', 'reddit', cause);

    expect(error.cause).toBe(cause);
  });
});

describe('ValidationError', () => {
  it('should create non-retryable validation error', () => {
    const error = new ValidationError('Invalid data format', 'reddit');

    expect(error).toBeInstanceOf(ScraperError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Invalid data format');
    expect(error.source).toBe('reddit');
    expect(error.retryable).toBe(false);
  });

  it('should create validation error with cause', () => {
    const cause = new Error('Zod validation failed');
    const error = new ValidationError('Invalid data format', 'reddit', cause);

    expect(error.cause).toBe(cause);
  });
});
