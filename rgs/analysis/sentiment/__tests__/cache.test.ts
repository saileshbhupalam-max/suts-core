/**
 * Tests for sentiment cache module
 */

import { SentimentCache } from '../src/cache';
import type { SentimentResult } from '../src/cache';

describe('SentimentCache', () => {
  let cache: SentimentCache;

  const createMockResult = (score: number): SentimentResult => ({
    score,
    magnitude: 0.8,
    emotions: ['excited'],
    confidence: 0.9,
  });

  beforeEach(() => {
    cache = new SentimentCache();
  });

  describe('constructor', () => {
    it('should create cache with default options', () => {
      const cache = new SentimentCache();
      const stats = cache.getStats();
      expect(stats.maxEntries).toBe(10000);
      expect(stats.enabled).toBe(true);
      expect(stats.size).toBe(0);
    });

    it('should create cache with custom max entries', () => {
      const cache = new SentimentCache({ maxEntries: 100 });
      const stats = cache.getStats();
      expect(stats.maxEntries).toBe(100);
    });

    it('should create disabled cache', () => {
      const cache = new SentimentCache({ enabled: false });
      const stats = cache.getStats();
      expect(stats.enabled).toBe(false);
    });

    it('should throw error for invalid maxEntries', () => {
      expect(() => new SentimentCache({ maxEntries: 0 })).toThrow('maxEntries must be positive');
      expect(() => new SentimentCache({ maxEntries: -1 })).toThrow('maxEntries must be positive');
    });
  });

  describe('get and set', () => {
    it('should return undefined for cache miss', () => {
      const result = cache.get('test content');
      expect(result).toBeUndefined();
    });

    it('should return cached result for cache hit', () => {
      const content = 'test content';
      const mockResult = createMockResult(0.8);

      cache.set(content, mockResult);
      const result = cache.get(content);

      expect(result).toEqual(mockResult);
    });

    it('should cache different content separately', () => {
      const content1 = 'test content 1';
      const content2 = 'test content 2';
      const result1 = createMockResult(0.8);
      const result2 = createMockResult(-0.5);

      cache.set(content1, result1);
      cache.set(content2, result2);

      expect(cache.get(content1)).toEqual(result1);
      expect(cache.get(content2)).toEqual(result2);
    });

    it('should update existing cache entry', () => {
      const content = 'test content';
      const result1 = createMockResult(0.8);
      const result2 = createMockResult(0.9);

      cache.set(content, result1);
      cache.set(content, result2);

      expect(cache.get(content)).toEqual(result2);
    });

    it('should not cache when disabled', () => {
      const cache = new SentimentCache({ enabled: false });
      const content = 'test content';
      const result = createMockResult(0.8);

      cache.set(content, result);
      expect(cache.get(content)).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return false for non-cached content', () => {
      expect(cache.has('test content')).toBe(false);
    });

    it('should return true for cached content', () => {
      const content = 'test content';
      cache.set(content, createMockResult(0.8));
      expect(cache.has(content)).toBe(true);
    });

    it('should return false when cache is disabled', () => {
      const cache = new SentimentCache({ enabled: false });
      const content = 'test content';
      cache.set(content, createMockResult(0.8));
      expect(cache.has(content)).toBe(false);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when cache is full', () => {
      const cache = new SentimentCache({ maxEntries: 3 });

      // Fill cache to capacity (use different lengths to avoid hash collision)
      cache.set('a', createMockResult(0.1));
      cache.set('bb', createMockResult(0.2));
      cache.set('ccc', createMockResult(0.3));

      expect(cache.size()).toBe(3);

      // Add one more - should evict 'a' (least recently used)
      cache.set('dddd', createMockResult(0.4));

      expect(cache.size()).toBe(3);
      expect(cache.has('a')).toBe(false);
      expect(cache.has('bb')).toBe(true);
      expect(cache.has('ccc')).toBe(true);
      expect(cache.has('dddd')).toBe(true);
    });

    it('should update LRU order on cache hit', (done) => {
      const cache = new SentimentCache({ maxEntries: 3 });

      cache.set('a', createMockResult(0.1));
      setTimeout(() => {
        cache.set('bb', createMockResult(0.2));
        setTimeout(() => {
          cache.set('ccc', createMockResult(0.3));
          setTimeout(() => {
            // Access 'a' to make it most recently used
            cache.get('a');
            setTimeout(() => {
              // Add new entry - should evict 'bb' (now least recently used)
              cache.set('dddd', createMockResult(0.4));

              expect(cache.has('a')).toBe(true);
              expect(cache.has('bb')).toBe(false);
              expect(cache.has('ccc')).toBe(true);
              expect(cache.has('dddd')).toBe(true);
              done();
            }, 2);
          }, 2);
        }, 2);
      }, 2);
    });

    it('should not evict when updating existing entry', () => {
      const cache = new SentimentCache({ maxEntries: 2 });

      cache.set('a', createMockResult(0.1));
      cache.set('bb', createMockResult(0.2));

      // Update 'a' - should not trigger eviction
      cache.set('a', createMockResult(0.9));

      expect(cache.size()).toBe(2);
      expect(cache.has('a')).toBe(true);
      expect(cache.has('bb')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cache.set('content1', createMockResult(0.1));
      cache.set('content2', createMockResult(0.2));
      cache.set('content3', createMockResult(0.3));

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.has('content1')).toBe(false);
      expect(cache.has('content2')).toBe(false);
      expect(cache.has('content3')).toBe(false);
    });

    it('should allow adding entries after clear', () => {
      cache.set('content1', createMockResult(0.1));
      cache.clear();

      cache.set('content2', createMockResult(0.2));
      expect(cache.size()).toBe(1);
      expect(cache.has('content2')).toBe(true);
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return correct size', () => {
      cache.set('content1', createMockResult(0.1));
      expect(cache.size()).toBe(1);

      cache.set('content2', createMockResult(0.2));
      expect(cache.size()).toBe(2);

      cache.set('content3', createMockResult(0.3));
      expect(cache.size()).toBe(3);
    });

    it('should not increase size when updating existing entry', () => {
      cache.set('content1', createMockResult(0.1));
      expect(cache.size()).toBe(1);

      cache.set('content1', createMockResult(0.9));
      expect(cache.size()).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const cache = new SentimentCache({ maxEntries: 100 });
      cache.set('content1', createMockResult(0.1));
      cache.set('content2', createMockResult(0.2));

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxEntries).toBe(100);
      expect(stats.enabled).toBe(true);
      expect(stats.utilizationPercent).toBe(2);
    });

    it('should calculate utilization percent correctly', () => {
      const cache = new SentimentCache({ maxEntries: 10 });

      for (let i = 0; i < 5; i++) {
        cache.set(`content${i}`, createMockResult(0.1));
      }

      const stats = cache.getStats();
      expect(stats.utilizationPercent).toBe(50);
    });

    it('should show 0 utilization for empty cache', () => {
      const stats = cache.getStats();
      expect(stats.utilizationPercent).toBe(0);
    });

    it('should show 100 utilization for full cache', () => {
      const cache = new SentimentCache({ maxEntries: 2 });
      cache.set('content1', createMockResult(0.1));
      cache.set('content2', createMockResult(0.2));

      const stats = cache.getStats();
      expect(stats.utilizationPercent).toBe(100);
    });
  });

  describe('hash collision handling', () => {
    it('should handle content with same prefix but different length', () => {
      // Create two contents with same first 100 chars but different length
      const prefix = 'a'.repeat(100);
      const content1 = prefix + 'b';
      const content2 = prefix + 'bb';

      const result1 = createMockResult(0.1);
      const result2 = createMockResult(0.2);

      cache.set(content1, result1);
      cache.set(content2, result2);

      // Both should be cached separately due to different length
      expect(cache.get(content1)).toEqual(result1);
      expect(cache.get(content2)).toEqual(result2);
      expect(cache.size()).toBe(2);
    });

    it('should treat content with same hash as same entry', () => {
      // Create two contents with identical first 100 chars and same length
      // This will result in a hash collision
      const prefix = 'a'.repeat(100);
      const content1 = prefix + 'b'; // 101 chars, first 100 are 'a'
      const content2 = prefix + 'c'; // 101 chars, first 100 are 'a'

      const result1 = createMockResult(0.1);
      const result2 = createMockResult(0.2);

      cache.set(content1, result1);
      cache.set(content2, result2);

      // Second set should update the first (same hash: 'aaa...-101')
      expect(cache.size()).toBe(1);
      // The second set should have overwritten the first
      expect(cache.get(content1)).toEqual(result2);
      expect(cache.get(content2)).toEqual(result2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string content', () => {
      const result = createMockResult(0.0);
      cache.set('', result);
      expect(cache.get('')).toEqual(result);
    });

    it('should handle very long content', () => {
      const content = 'a'.repeat(10000);
      const result = createMockResult(0.5);
      cache.set(content, result);
      expect(cache.get(content)).toEqual(result);
    });

    it('should handle unicode content', () => {
      const content = '🎉 This is exciting! 你好世界';
      const result = createMockResult(0.8);
      cache.set(content, result);
      expect(cache.get(content)).toEqual(result);
    });

    it('should handle content with special characters', () => {
      const content = 'Test\nwith\r\nnewlines\tand\ttabs';
      const result = createMockResult(0.3);
      cache.set(content, result);
      expect(cache.get(content)).toEqual(result);
    });
  });
});
