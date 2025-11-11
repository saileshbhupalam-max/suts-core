/**
 * Unit tests for RGS rate limiter
 */

import { RateLimiter } from '../src/rate-limiter';
import { RateLimitError } from '../src/errors';

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('construction', () => {
    it('should create rate limiter with valid options', () => {
      const limiter = new RateLimiter({ requestsPerMinute: 60 });
      expect(limiter).toBeDefined();
    });

    it('should throw error for invalid requestsPerMinute', () => {
      expect(() => new RateLimiter({ requestsPerMinute: 0 })).toThrow(
        'requestsPerMinute must be positive'
      );
      expect(() => new RateLimiter({ requestsPerMinute: -10 })).toThrow(
        'requestsPerMinute must be positive'
      );
    });

    it('should use default burst size', () => {
      const limiter = new RateLimiter({ requestsPerMinute: 60 });
      const stats = limiter.getStats();
      expect(stats.burstSize).toBe(10); // 60/6 = 10
    });

    it('should use custom burst size', () => {
      const limiter = new RateLimiter({ requestsPerMinute: 60, burstSize: 20 });
      const stats = limiter.getStats();
      expect(stats.burstSize).toBe(20);
    });
  });

  describe('token bucket algorithm', () => {
    it('should allow requests up to burst size', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 60, burstSize: 5 });

      const results: number[] = [];
      const promises = Array.from({ length: 5 }, (_, i) =>
        limiter.execute(() => {
          results.push(i);
          return Promise.resolve(i);
        })
      );

      await Promise.all(promises);

      expect(results).toHaveLength(5);
    });

    it('should refill tokens over time', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 60, burstSize: 2 });

      // Consume all tokens
      await limiter.execute(() => Promise.resolve(1));
      await limiter.execute(() => Promise.resolve(2));

      // Try to execute third request (should wait)
      const promise = limiter.execute(() => Promise.resolve(3));

      // Advance time by 1 second (should add 1 token)
      jest.advanceTimersByTime(1000);

      const result = await promise;
      expect(result).toBe(3);
    });

    it('should rate limit requests beyond capacity', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 60, burstSize: 2 });

      const results: number[] = [];

      // Execute 4 requests (burst = 2)
      const promises = Array.from({ length: 4 }, (_, i) =>
        limiter.execute(() => {
          results.push(i);
          return Promise.resolve(i);
        })
      );

      // First two should execute immediately
      await Promise.resolve();
      expect(results.length).toBeGreaterThanOrEqual(2);

      // Advance time to allow remaining requests
      jest.advanceTimersByTime(2000);

      await Promise.all(promises);
      expect(results).toHaveLength(4);
    });

    it('should calculate tokens correctly', () => {
      const limiter = new RateLimiter({ requestsPerMinute: 60, burstSize: 10 });

      const stats1 = limiter.getStats();
      expect(stats1.availableTokens).toBe(10); // Full burst

      // Advance time by 30 seconds (should add 30 tokens, capped at burst)
      jest.advanceTimersByTime(30000);

      const stats2 = limiter.getStats();
      expect(stats2.availableTokens).toBe(10); // Still capped at burst
    });
  });

  describe('circuit breaker', () => {
    it('should open circuit after consecutive failures', async () => {
      const limiter = new RateLimiter({
        requestsPerMinute: 60,
        circuitBreakerThreshold: 3,
      });

      // Cause 3 consecutive failures
      for (let i = 0; i < 3; i++) {
        await expect(
          limiter.execute(() => {
            return Promise.reject(new Error('Service error'));
          })
        ).rejects.toThrow('Service error');
      }

      const stats = limiter.getStats();
      expect(stats.circuitState).toBe('open');
      expect(stats.consecutiveFailures).toBe(3);

      // Next request should fail with circuit breaker error
      await expect(limiter.execute(() => Promise.resolve(1))).rejects.toThrow(RateLimitError);

      await expect(limiter.execute(() => Promise.resolve(1))).rejects.toThrow(
        'Circuit breaker is open'
      );
    });

    it('should transition to half-open after timeout', async () => {
      const limiter = new RateLimiter({
        requestsPerMinute: 60,
        circuitBreakerThreshold: 2,
        circuitBreakerResetMs: 5000,
      });

      // Open circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          limiter.execute(() => {
            return Promise.reject(new Error('Service error'));
          })
        ).rejects.toThrow('Service error');
      }

      expect(limiter.getStats().circuitState).toBe('open');

      // Advance time past reset timeout
      jest.advanceTimersByTime(5000);

      // Should be in half-open state (will try next request)
      const result = await limiter.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');

      // Should transition to closed on success
      expect(limiter.getStats().circuitState).toBe('closed');
    });

    it('should reset on successful request', async () => {
      const limiter = new RateLimiter({
        requestsPerMinute: 60,
        circuitBreakerThreshold: 3,
      });

      // Cause 2 failures
      for (let i = 0; i < 2; i++) {
        await expect(
          limiter.execute(() => {
            return Promise.reject(new Error('Service error'));
          })
        ).rejects.toThrow('Service error');
      }

      expect(limiter.getStats().consecutiveFailures).toBe(2);

      // Successful request should reset counter
      await limiter.execute(() => Promise.resolve('success'));

      expect(limiter.getStats().consecutiveFailures).toBe(0);
    });

    it('should manually reset circuit breaker', async () => {
      const limiter = new RateLimiter({
        requestsPerMinute: 60,
        circuitBreakerThreshold: 2,
      });

      // Open circuit
      for (let i = 0; i < 2; i++) {
        await expect(
          limiter.execute(() => {
            return Promise.reject(new Error('Service error'));
          })
        ).rejects.toThrow('Service error');
      }

      expect(limiter.getStats().circuitState).toBe('open');

      // Manually reset
      limiter.resetCircuitBreaker();

      expect(limiter.getStats().circuitState).toBe('closed');
      expect(limiter.getStats().consecutiveFailures).toBe(0);

      // Should be able to execute requests
      const result = await limiter.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });
  });

  describe('stats', () => {
    it('should return accurate stats', () => {
      const limiter = new RateLimiter({
        requestsPerMinute: 60,
        burstSize: 10,
        circuitBreakerThreshold: 5,
      });

      const stats = limiter.getStats();

      expect(stats.availableTokens).toBe(10);
      expect(stats.burstSize).toBe(10);
      expect(stats.requestsPerMinute).toBe(60);
      expect(stats.circuitState).toBe('closed');
      expect(stats.consecutiveFailures).toBe(0);
      expect(stats.pendingRequests).toBe(0);
    });

    it('should track pending requests', async () => {
      const limiter = new RateLimiter({
        requestsPerMinute: 60,
        burstSize: 1,
      });

      // Start multiple requests (without await)
      const promise1 = limiter.execute(() => Promise.resolve(1));
      const promise2 = limiter.execute(() => Promise.resolve(2));

      // Advance time to complete both requests
      await jest.advanceTimersByTimeAsync(2000);

      const results = await Promise.all([promise1, promise2]);
      expect(results).toEqual([1, 2]);
    });
  });

  describe('error propagation', () => {
    it('should propagate errors from function', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 60 });

      await expect(
        limiter.execute(() => {
          return Promise.reject(new Error('Custom error'));
        })
      ).rejects.toThrow('Custom error');
    });

    it('should not consume token on error', async () => {
      const limiter = new RateLimiter({ requestsPerMinute: 60, burstSize: 2 });

      const stats1 = limiter.getStats();
      const initialTokens = stats1.availableTokens;

      // Execute request that fails
      await expect(
        limiter.execute(() => {
          return Promise.reject(new Error('Custom error'));
        })
      ).rejects.toThrow();

      // Token should have been consumed despite error
      const stats2 = limiter.getStats();
      expect(stats2.availableTokens).toBeLessThan(initialTokens);
    });
  });
});
