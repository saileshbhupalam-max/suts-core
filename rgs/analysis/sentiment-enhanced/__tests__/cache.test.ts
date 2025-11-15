/**
 * Tests for sentiment cache
 */

import { SentimentCache } from '../src/cache';
import { SentimentScale } from '../src/scales';
import { EnhancedSentiment } from '../src/types';

describe('SentimentCache', () => {
  let cache: SentimentCache;

  const mockSentiment: EnhancedSentiment = {
    scale: SentimentScale.Positive,
    score: 0.5,
    magnitude: 0.7,
    emotions: [
      { label: 'excited', intensity: 0.8 }
    ],
    confidence: 0.9,
    reasoning: 'Test sentiment'
  };

  beforeEach(() => {
    cache = new SentimentCache(3, 1000); // Small cache for testing
  });

  describe('constructor', () => {
    it('should create cache with valid parameters', () => {
      expect(() => new SentimentCache(100, 1000)).not.toThrow();
    });

    it('should throw error for maxEntries <= 0', () => {
      expect(() => new SentimentCache(0, 1000)).toThrow('maxEntries must be greater than 0');
      expect(() => new SentimentCache(-1, 1000)).toThrow('maxEntries must be greater than 0');
    });

    it('should throw error for ttlMs <= 0', () => {
      expect(() => new SentimentCache(100, 0)).toThrow('ttlMs must be greater than 0');
      expect(() => new SentimentCache(100, -1)).toThrow('ttlMs must be greater than 0');
    });
  });

  describe('get and set', () => {
    it('should store and retrieve sentiment', () => {
      const content = 'This is a test';
      cache.set(content, mockSentiment);

      const retrieved = cache.get(content);
      expect(retrieved).toEqual(mockSentiment);
    });

    it('should return undefined for non-existent content', () => {
      const retrieved = cache.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should handle multiple entries', () => {
      const content1 = 'Test 1';
      const content2 = 'Test 2';

      const sentiment1 = { ...mockSentiment, scale: SentimentScale.Positive };
      const sentiment2 = { ...mockSentiment, scale: SentimentScale.Negative };

      cache.set(content1, sentiment1);
      cache.set(content2, sentiment2);

      expect(cache.get(content1)).toEqual(sentiment1);
      expect(cache.get(content2)).toEqual(sentiment2);
    });

    it('should evict oldest entry when capacity is exceeded', () => {
      const content1 = 'Test 1';
      const content2 = 'Test 2';
      const content3 = 'Test 3';
      const content4 = 'Test 4';

      cache.set(content1, mockSentiment);
      cache.set(content2, mockSentiment);
      cache.set(content3, mockSentiment);

      // This should evict content1
      cache.set(content4, mockSentiment);

      expect(cache.get(content1)).toBeUndefined();
      expect(cache.get(content2)).toBeDefined();
      expect(cache.get(content3)).toBeDefined();
      expect(cache.get(content4)).toBeDefined();
    });

    it('should update existing entry without eviction', () => {
      const content = 'Test';
      const sentiment1 = { ...mockSentiment, scale: SentimentScale.Positive };
      const sentiment2 = { ...mockSentiment, scale: SentimentScale.VeryPositive };

      cache.set(content, sentiment1);
      cache.set(content, sentiment2);

      expect(cache.get(content)).toEqual(sentiment2);
      expect(cache.getStats().size).toBe(1);
    });

    it('should handle same content with different hashes correctly', () => {
      const content = 'Test content';
      cache.set(content, mockSentiment);

      const retrieved1 = cache.get(content);
      const retrieved2 = cache.get(content);

      expect(retrieved1).toEqual(mockSentiment);
      expect(retrieved2).toEqual(mockSentiment);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('Test 1', mockSentiment);
      cache.set('Test 2', mockSentiment);

      expect(cache.getStats().size).toBe(2);

      cache.clear();

      expect(cache.getStats().size).toBe(0);
      expect(cache.get('Test 1')).toBeUndefined();
      expect(cache.get('Test 2')).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return correct stats for empty cache', () => {
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.capacity).toBe(3);
    });

    it('should return correct stats after adding entries', () => {
      cache.set('Test 1', mockSentiment);
      cache.set('Test 2', mockSentiment);

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.capacity).toBe(3);
    });

    it('should not exceed capacity in stats', () => {
      cache.set('Test 1', mockSentiment);
      cache.set('Test 2', mockSentiment);
      cache.set('Test 3', mockSentiment);
      cache.set('Test 4', mockSentiment); // Should evict Test 1

      const stats = cache.getStats();
      expect(stats.size).toBe(3);
      expect(stats.capacity).toBe(3);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const shortTtlCache = new SentimentCache(10, 50); // 50ms TTL

      shortTtlCache.set('Test', mockSentiment);
      expect(shortTtlCache.get('Test')).toBeDefined();

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(shortTtlCache.get('Test')).toBeUndefined();
    });

    it('should not expire entries before TTL', async () => {
      const longTtlCache = new SentimentCache(10, 10000); // 10s TTL

      longTtlCache.set('Test', mockSentiment);

      // Wait 50ms (well before TTL)
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(longTtlCache.get('Test')).toBeDefined();
    });
  });

  describe('LRU behavior', () => {
    it('should mark entry as recently used on get', () => {
      cache.set('Test 1', mockSentiment);
      cache.set('Test 2', mockSentiment);
      cache.set('Test 3', mockSentiment);

      // Access Test 1 to mark it as recently used
      cache.get('Test 1');

      // Add new entry, should evict Test 2 (oldest unused)
      cache.set('Test 4', mockSentiment);

      expect(cache.get('Test 1')).toBeDefined();
      expect(cache.get('Test 2')).toBeUndefined();
      expect(cache.get('Test 3')).toBeDefined();
      expect(cache.get('Test 4')).toBeDefined();
    });
  });
});
