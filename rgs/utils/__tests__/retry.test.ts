/**
 * Unit tests for RGS retry policy
 */

import { RetryPolicy, withRetry } from '../src/retry';
import { ScraperError, NetworkError, AuthenticationError } from '../src/errors';

describe('RetryPolicy', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('construction', () => {
    it('should create retry policy with default options', () => {
      const policy = new RetryPolicy();
      expect(policy).toBeDefined();
    });

    it('should throw error for invalid maxRetries', () => {
      expect(() => new RetryPolicy({ maxRetries: -1 })).toThrow(
        'maxRetries must be non-negative'
      );
    });

    it('should throw error for invalid backoffMs', () => {
      expect(() => new RetryPolicy({ backoffMs: 0 })).toThrow(
        'backoffMs must be positive'
      );
      expect(() => new RetryPolicy({ backoffMs: -100 })).toThrow(
        'backoffMs must be positive'
      );
    });

    it('should throw error for invalid maxBackoffMs', () => {
      expect(() => new RetryPolicy({ backoffMs: 1000, maxBackoffMs: 500 })).toThrow(
        'maxBackoffMs must be >= backoffMs'
      );
    });

    it('should throw error for invalid jitter', () => {
      expect(() => new RetryPolicy({ jitter: -0.1 })).toThrow(
        'jitter must be between 0 and 1'
      );
      expect(() => new RetryPolicy({ jitter: 1.5 })).toThrow(
        'jitter must be between 0 and 1'
      );
    });
  });

  describe('successful execution', () => {
    it('should execute function successfully', async () => {
      const policy = new RetryPolicy();
      const fn = jest.fn().mockResolvedValue('success');

      const result = await policy.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry on success', async () => {
      const policy = new RetryPolicy({ maxRetries: 3 });
      const fn = jest.fn().mockResolvedValue('success');

      await policy.execute(fn);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('retry on retryable errors', () => {
    it('should retry on retryable ScraperError', async () => {
      const policy = new RetryPolicy({ maxRetries: 2, backoffMs: 100 });
      const fn = jest.fn()
        .mockRejectedValueOnce(new NetworkError('Network error', 'test', 503, true))
        .mockResolvedValueOnce('success');

      const promise = policy.execute(fn);

      // Advance time through retry delay
      await jest.advanceTimersByTimeAsync(200);

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const policy = new RetryPolicy({ maxRetries: 3 });
      const fn = jest.fn().mockRejectedValue(
        new AuthenticationError('Invalid credentials', 'test')
      );

      await expect(policy.execute(fn)).rejects.toThrow('Invalid credentials');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries limit', async () => {
      const policy = new RetryPolicy({ maxRetries: 2, backoffMs: 100 });
      const error = new NetworkError('Network error', 'test', 503, true);
      const fn = jest.fn().mockRejectedValue(error);

      const promise = policy.execute(fn);

      // Advance through all retries
      await jest.advanceTimersByTimeAsync(1000);

      await expect(promise).rejects.toThrow('Network error');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('exponential backoff', () => {
    it('should use exponential backoff delays', async () => {
      const policy = new RetryPolicy({ maxRetries: 3, backoffMs: 100, jitter: 0 });
      const error = new NetworkError('Network error', 'test', 503, true);
      const fn = jest.fn().mockRejectedValue(error);

      const promise = policy.execute(fn);

      // First retry: 100ms
      await jest.advanceTimersByTimeAsync(100);
      expect(fn).toHaveBeenCalledTimes(2);

      // Second retry: 200ms
      await jest.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(3);

      // Third retry: 400ms
      await jest.advanceTimersByTimeAsync(400);
      expect(fn).toHaveBeenCalledTimes(4);

      await expect(promise).rejects.toThrow('Network error');
    });

    it('should cap backoff at maxBackoffMs', async () => {
      const policy = new RetryPolicy({
        maxRetries: 3,
        backoffMs: 100,
        maxBackoffMs: 200,
        jitter: 0
      });
      const error = new NetworkError('Network error', 'test', 503, true);
      const fn = jest.fn().mockRejectedValue(error);

      const promise = policy.execute(fn);

      // First retry: 100ms
      await jest.advanceTimersByTimeAsync(100);
      expect(fn).toHaveBeenCalledTimes(2);

      // Second retry: 200ms (would be 200ms)
      await jest.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(3);

      // Third retry: 200ms (capped, would be 400ms)
      await jest.advanceTimersByTimeAsync(200);
      expect(fn).toHaveBeenCalledTimes(4);

      await expect(promise).rejects.toThrow('Network error');
    });

    it('should apply jitter to backoff delays', async () => {
      const policy = new RetryPolicy({ maxRetries: 1, backoffMs: 100, jitter: 0.5 });
      const error = new NetworkError('Network error', 'test', 503, true);
      const fn = jest.fn().mockRejectedValue(error);

      const promise = policy.execute(fn);

      // With 50% jitter, delay should be between 50ms and 150ms
      // We can't predict exact value due to randomness, but can verify it retries
      await jest.advanceTimersByTimeAsync(200);

      await expect(promise).rejects.toThrow('Network error');
      expect(fn).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('retry all errors mode', () => {
    it('should retry all errors when retryAllErrors is true', async () => {
      const policy = new RetryPolicy({ maxRetries: 2, backoffMs: 100, retryAllErrors: true });
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Generic error'))
        .mockResolvedValueOnce('success');

      const promise = policy.execute(fn);
      await jest.advanceTimersByTimeAsync(200);

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-ScraperError by default', async () => {
      const policy = new RetryPolicy({ maxRetries: 2 });
      const fn = jest.fn().mockRejectedValue(new Error('Generic error'));

      await expect(policy.execute(fn)).rejects.toThrow('Generic error');

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('override options', () => {
    it('should override maxRetries per execution', async () => {
      const policy = new RetryPolicy({ maxRetries: 1, backoffMs: 50 });
      const error = new NetworkError('Network error', 'test', 503, true);
      const fn = jest.fn().mockRejectedValue(error);

      const promise = policy.execute(fn, { maxRetries: 3 });

      await jest.advanceTimersByTimeAsync(800);

      await expect(promise).rejects.toThrow('Network error');
      expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should override retryAllErrors per execution', async () => {
      const policy = new RetryPolicy({ maxRetries: 2, backoffMs: 100 });
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Generic error'))
        .mockResolvedValueOnce('success');

      const promise = policy.execute(fn, { retryAllErrors: true });
      await jest.advanceTimersByTimeAsync(200);

      const result = await promise;

      expect(result).toBe('success');
    });
  });

  describe('convenience methods', () => {
    it('should execute with specific retry count', async () => {
      const policy = new RetryPolicy({ backoffMs: 50 });
      const error = new NetworkError('Network error', 'test', 503, true);
      const fn = jest.fn().mockRejectedValue(error);

      const promise = policy.executeWithRetries(fn, 2);

      await jest.advanceTimersByTimeAsync(300);

      await expect(promise).rejects.toThrow('Network error');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('withRetry helper', () => {
    it('should create and execute retry policy', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new NetworkError('Network error', 'test', 503, true))
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn, { maxRetries: 1, backoffMs: 100 });

      await jest.advanceTimersByTimeAsync(200);

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should use default options', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
    });
  });

  describe('error handling', () => {
    it('should propagate last error after all retries', async () => {
      const policy = new RetryPolicy({ maxRetries: 2, backoffMs: 50 });
      const error = new NetworkError('Network error', 'test', 503, true);
      const fn = jest.fn().mockRejectedValue(error);

      const promise = policy.execute(fn);

      await jest.advanceTimersByTimeAsync(400);

      await expect(promise).rejects.toBe(error);
    });

    it('should handle successful retry after failures', async () => {
      const policy = new RetryPolicy({ maxRetries: 3, backoffMs: 50 });
      const error = new NetworkError('Network error', 'test', 503, true);
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = policy.execute(fn);

      await jest.advanceTimersByTimeAsync(250);

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });
});
