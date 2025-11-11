import { InMemoryCache } from '../src/cache';
import { WebSignal, Insight, StorageError } from '../src/interfaces/storage';

describe('InMemoryCache', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache(5, 3); // Small limits for testing
  });

  describe('constructor', () => {
    it('should create cache with default limits', () => {
      const defaultCache = new InMemoryCache();
      const stats = defaultCache.getStats();

      expect(stats.signals.capacity).toBe(1000);
      expect(stats.insights.capacity).toBe(500);
    });

    it('should create cache with custom limits', () => {
      const customCache = new InMemoryCache(100, 50);
      const stats = customCache.getStats();

      expect(stats.signals.capacity).toBe(100);
      expect(stats.insights.capacity).toBe(50);
    });

    it('should throw error for invalid maxSignals', () => {
      expect(() => new InMemoryCache(0, 10)).toThrow(StorageError);
      expect(() => new InMemoryCache(-1, 10)).toThrow(StorageError);
    });

    it('should throw error for invalid maxInsights', () => {
      expect(() => new InMemoryCache(10, 0)).toThrow(StorageError);
      expect(() => new InMemoryCache(10, -1)).toThrow(StorageError);
    });
  });

  describe('saveSignals', () => {
    const mockSignals: WebSignal[] = [
      {
        id: 'signal-1',
        source: 'reddit',
        type: 'post',
        content: 'Test post',
        author: 'user1',
        url: 'https://reddit.com/1',
        timestamp: '2025-01-15T10:00:00.000Z',
      },
      {
        id: 'signal-2',
        source: 'twitter',
        type: 'tweet',
        content: 'Test tweet',
        author: 'user2',
        url: 'https://twitter.com/1',
        timestamp: '2025-01-15T11:00:00.000Z',
      },
    ];

    it('should save signals to cache', async () => {
      await cache.saveSignals(mockSignals);

      const stats = cache.getStats();
      expect(stats.signals.count).toBe(2);
    });

    it('should update existing signal', async () => {
      await cache.saveSignals([mockSignals[0] as WebSignal]);
      await cache.saveSignals([mockSignals[0] as WebSignal]);

      const stats = cache.getStats();
      expect(stats.signals.count).toBe(1);
    });

    it('should evict oldest signals when at capacity', async () => {
      const signals: WebSignal[] = [];
      for (let i = 0; i < 7; i++) {
        signals.push({
          id: `signal-${i}`,
          source: 'reddit',
          type: 'post',
          content: `Content ${i}`,
          author: `user${i}`,
          url: `https://example.com/${i}`,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        });
      }

      await cache.saveSignals(signals);

      const stats = cache.getStats();
      expect(stats.signals.count).toBe(5); // Max capacity

      const allSignals = await cache.loadSignals();
      expect(allSignals.some((s) => s.id === 'signal-0')).toBe(false);
      expect(allSignals.some((s) => s.id === 'signal-1')).toBe(false);
    });

    it('should handle empty array', async () => {
      await expect(cache.saveSignals([])).resolves.not.toThrow();
    });
  });

  describe('loadSignals', () => {
    const mockSignals: WebSignal[] = [
      {
        id: 'signal-1',
        source: 'reddit',
        type: 'post',
        content: 'Test post',
        author: 'user1',
        url: 'https://reddit.com/1',
        timestamp: '2025-01-15T10:00:00.000Z',
        sentiment: 'positive',
        tags: ['feature'],
      },
      {
        id: 'signal-2',
        source: 'twitter',
        type: 'tweet',
        content: 'Test tweet',
        author: 'user2',
        url: 'https://twitter.com/1',
        timestamp: '2025-01-16T10:00:00.000Z',
        sentiment: 'negative',
        tags: ['bug'],
      },
    ];

    beforeEach(async () => {
      await cache.saveSignals(mockSignals);
    });

    it('should load all signals', async () => {
      const signals = await cache.loadSignals();
      expect(signals).toHaveLength(2);
    });

    it('should filter by source', async () => {
      const signals = await cache.loadSignals({ source: 'reddit' });
      expect(signals).toHaveLength(1);
      expect(signals[0]?.source).toBe('reddit');
    });

    it('should filter by type', async () => {
      const signals = await cache.loadSignals({ type: 'post' });
      expect(signals).toHaveLength(1);
      expect(signals[0]?.type).toBe('post');
    });

    it('should filter by sentiment', async () => {
      const signals = await cache.loadSignals({ sentiment: 'positive' });
      expect(signals).toHaveLength(1);
      expect(signals[0]?.sentiment).toBe('positive');
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2025-01-15T00:00:00.000Z');
      const endDate = new Date('2025-01-15T23:59:59.999Z');

      const signals = await cache.loadSignals({ startDate, endDate });
      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('signal-1');
    });

    it('should filter by tags', async () => {
      const signals = await cache.loadSignals({ tags: ['feature'] });
      expect(signals).toHaveLength(1);
      expect(signals[0]?.tags).toContain('feature');
    });

    it('should return empty array when no matches', async () => {
      const signals = await cache.loadSignals({ source: 'github' });
      expect(signals).toHaveLength(0);
    });

    it('should return signals in LRU order', async () => {
      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const signal3: WebSignal = {
        id: 'signal-3',
        source: 'github',
        type: 'issue',
        content: 'Test issue',
        author: 'user3',
        url: 'https://github.com/1',
        timestamp: '2025-01-17T10:00:00.000Z',
      };

      await cache.saveSignals([signal3]);

      // signal-3 was added last, so it should be first
      const signals = await cache.loadSignals();
      expect(signals[0]?.id).toBe('signal-3');
    });
  });

  describe('saveInsights', () => {
    const mockInsights: Insight[] = [
      {
        id: 'insight-1',
        title: 'Feature Request',
        summary: 'Dark mode requested',
        category: 'feature-request',
        confidence: 0.85,
        sources: ['signal-1'],
        timestamp: '2025-01-15T12:00:00.000Z',
      },
      {
        id: 'insight-2',
        title: 'Bug Report',
        summary: 'Login issues',
        category: 'bug-report',
        confidence: 0.92,
        sources: ['signal-2'],
        timestamp: '2025-01-15T13:00:00.000Z',
      },
    ];

    it('should save insights to cache', async () => {
      await cache.saveInsights(mockInsights);

      const stats = cache.getStats();
      expect(stats.insights.count).toBe(2);
    });

    it('should update existing insight', async () => {
      await cache.saveInsights([mockInsights[0] as Insight]);
      await cache.saveInsights([mockInsights[0] as Insight]);

      const stats = cache.getStats();
      expect(stats.insights.count).toBe(1);
    });

    it('should evict oldest insights when at capacity', async () => {
      const insights: Insight[] = [];
      for (let i = 0; i < 5; i++) {
        insights.push({
          id: `insight-${i}`,
          title: `Title ${i}`,
          summary: `Summary ${i}`,
          category: 'feature-request',
          confidence: 0.8,
          sources: [],
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        });
      }

      await cache.saveInsights(insights);

      const stats = cache.getStats();
      expect(stats.insights.count).toBe(3); // Max capacity

      const allInsights = await cache.loadInsights();
      expect(allInsights.some((i) => i.id === 'insight-0')).toBe(false);
      expect(allInsights.some((i) => i.id === 'insight-1')).toBe(false);
    });

    it('should handle empty array', async () => {
      await expect(cache.saveInsights([])).resolves.not.toThrow();
    });
  });

  describe('loadInsights', () => {
    const mockInsights: Insight[] = [
      {
        id: 'insight-1',
        title: 'Feature Request Trend',
        summary: 'Users want dark mode',
        category: 'feature-request',
        confidence: 0.85,
        sources: ['signal-1'],
        timestamp: '2025-01-15T12:00:00.000Z',
      },
      {
        id: 'insight-2',
        title: 'Bug Report Pattern',
        summary: 'Login issues',
        category: 'bug-report',
        confidence: 0.92,
        sources: ['signal-2'],
        timestamp: '2025-01-15T13:00:00.000Z',
      },
    ];

    beforeEach(async () => {
      await cache.saveInsights(mockInsights);
    });

    it('should load all insights', async () => {
      const insights = await cache.loadInsights();
      expect(insights).toHaveLength(2);
    });

    it('should filter by query in title', async () => {
      const insights = await cache.loadInsights('feature');
      expect(insights).toHaveLength(1);
      expect(insights[0]?.title).toContain('Feature');
    });

    it('should filter by query in summary', async () => {
      const insights = await cache.loadInsights('login');
      expect(insights).toHaveLength(1);
      expect(insights[0]?.summary).toContain('Login');
    });

    it('should filter by query in category', async () => {
      const insights = await cache.loadInsights('bug-report');
      expect(insights).toHaveLength(1);
      expect(insights[0]?.category).toBe('bug-report');
    });

    it('should be case insensitive', async () => {
      const insights = await cache.loadInsights('FEATURE');
      expect(insights).toHaveLength(1);
    });

    it('should return all insights when query is empty', async () => {
      const insights = await cache.loadInsights('');
      expect(insights).toHaveLength(2);
    });

    it('should return empty array when no matches', async () => {
      const insights = await cache.loadInsights('nonexistent');
      expect(insights).toHaveLength(0);
    });

    it('should return insights in LRU order', async () => {
      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const insight3: Insight = {
        id: 'insight-3',
        title: 'Pain Point',
        summary: 'Performance issues',
        category: 'pain-point',
        confidence: 0.9,
        sources: ['signal-3'],
        timestamp: '2025-01-15T14:00:00.000Z',
      };

      await cache.saveInsights([insight3]);

      // insight-3 was added last, so it should be first
      const insights = await cache.loadInsights();
      expect(insights[0]?.id).toBe('insight-3');
    });
  });

  describe('clear', () => {
    it('should clear all cached data', async () => {
      const signal: WebSignal = {
        id: 'signal-1',
        source: 'reddit',
        type: 'post',
        content: 'Test',
        author: 'user1',
        url: 'https://reddit.com/1',
        timestamp: '2025-01-15T10:00:00.000Z',
      };

      const insight: Insight = {
        id: 'insight-1',
        title: 'Test',
        summary: 'Test',
        category: 'feature-request',
        confidence: 0.8,
        sources: [],
        timestamp: '2025-01-15T12:00:00.000Z',
      };

      await cache.saveSignals([signal]);
      await cache.saveInsights([insight]);

      cache.clear();

      const stats = cache.getStats();
      expect(stats.signals.count).toBe(0);
      expect(stats.insights.count).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const signals: WebSignal[] = [
        {
          id: 'signal-1',
          source: 'reddit',
          type: 'post',
          content: 'Test',
          author: 'user1',
          url: 'https://reddit.com/1',
          timestamp: '2025-01-15T10:00:00.000Z',
        },
        {
          id: 'signal-2',
          source: 'twitter',
          type: 'tweet',
          content: 'Test',
          author: 'user2',
          url: 'https://twitter.com/1',
          timestamp: '2025-01-15T11:00:00.000Z',
        },
      ];

      await cache.saveSignals(signals);

      const stats = cache.getStats();
      expect(stats.signals.count).toBe(2);
      expect(stats.signals.capacity).toBe(5);
      expect(stats.insights.count).toBe(0);
      expect(stats.insights.capacity).toBe(3);
    });
  });
});
