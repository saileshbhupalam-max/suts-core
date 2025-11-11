import { IStorage, WebSignal, Insight, SignalFilter, StorageError } from './interfaces/storage';

/**
 * Cache entry with timestamp for LRU eviction
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * In-memory LRU cache implementation for RGS data
 * Stores signals and insights in memory with a maximum capacity
 */
export class InMemoryCache implements IStorage {
  private readonly maxSignals: number;
  private readonly maxInsights: number;
  private signals: Map<string, CacheEntry<WebSignal>>;
  private insights: Map<string, CacheEntry<Insight>>;

  /**
   * Creates a new InMemoryCache instance
   * @param maxSignals - Maximum number of signals to store (default: 1000)
   * @param maxInsights - Maximum number of insights to store (default: 500)
   */
  constructor(maxSignals: number = 1000, maxInsights: number = 500) {
    if (maxSignals <= 0) {
      throw new StorageError('maxSignals must be greater than 0');
    }
    if (maxInsights <= 0) {
      throw new StorageError('maxInsights must be greater than 0');
    }

    this.maxSignals = maxSignals;
    this.maxInsights = maxInsights;
    this.signals = new Map();
    this.insights = new Map();
  }

  /**
   * Save web signals to cache
   * Uses LRU eviction when capacity is exceeded
   */
  saveSignals(signals: WebSignal[]): Promise<void> {
    try {
      for (const signal of signals) {
        // Update access time for existing entries
        if (this.signals.has(signal.id)) {
          this.signals.delete(signal.id);
        } else {
          // Evict oldest entries if at capacity (only for new entries)
          if (this.signals.size >= this.maxSignals) {
            this.evictOldestSignals(1);
          }
        }

        this.signals.set(signal.id, {
          data: signal,
          timestamp: Date.now(),
        });
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new StorageError('Failed to save signals to cache', error));
    }
  }

  /**
   * Load web signals from cache with optional filtering
   */
  loadSignals(filter?: SignalFilter): Promise<WebSignal[]> {
    try {
      const allSignals = Array.from(this.signals.values())
        .sort((a, b) => b.timestamp - a.timestamp) // Most recently used first
        .map((entry) => entry.data);

      return Promise.resolve(this.applySignalFilter(allSignals, filter));
    } catch (error) {
      return Promise.reject(new StorageError('Failed to load signals from cache', error));
    }
  }

  /**
   * Save insights to cache
   * Uses LRU eviction when capacity is exceeded
   */
  saveInsights(insights: Insight[]): Promise<void> {
    try {
      for (const insight of insights) {
        // Update access time for existing entries
        if (this.insights.has(insight.id)) {
          this.insights.delete(insight.id);
        } else {
          // Evict oldest entries if at capacity (only for new entries)
          if (this.insights.size >= this.maxInsights) {
            this.evictOldestInsights(1);
          }
        }

        this.insights.set(insight.id, {
          data: insight,
          timestamp: Date.now(),
        });
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new StorageError('Failed to save insights to cache', error));
    }
  }

  /**
   * Load insights from cache with optional query filtering
   */
  loadInsights(query?: string): Promise<Insight[]> {
    try {
      const allInsights = Array.from(this.insights.values())
        .sort((a, b) => b.timestamp - a.timestamp) // Most recently used first
        .map((entry) => entry.data);

      return Promise.resolve(this.applyInsightQuery(allInsights, query));
    } catch (error) {
      return Promise.reject(new StorageError('Failed to load insights from cache', error));
    }
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.signals.clear();
    this.insights.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    signals: { count: number; capacity: number };
    insights: { count: number; capacity: number };
  } {
    return {
      signals: {
        count: this.signals.size,
        capacity: this.maxSignals,
      },
      insights: {
        count: this.insights.size,
        capacity: this.maxInsights,
      },
    };
  }

  /**
   * Evict oldest signals to make room for new entries
   */
  private evictOldestSignals(count: number): void {
    const entries = Array.from(this.signals.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    const toEvict = Math.min(count, entries.length);
    for (let i = 0; i < toEvict; i++) {
      const [id] = entries[i] as [string, CacheEntry<WebSignal>];
      this.signals.delete(id);
    }
  }

  /**
   * Evict oldest insights to make room for new entries
   */
  private evictOldestInsights(count: number): void {
    const entries = Array.from(this.insights.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    const toEvict = Math.min(count, entries.length);
    for (let i = 0; i < toEvict; i++) {
      const [id] = entries[i] as [string, CacheEntry<Insight>];
      this.insights.delete(id);
    }
  }

  /**
   * Apply signal filter
   */
  private applySignalFilter(signals: WebSignal[], filter?: SignalFilter): WebSignal[] {
    if (filter === undefined) {
      return signals;
    }

    return signals.filter((signal) => {
      if (filter.source !== undefined && signal.source !== filter.source) {
        return false;
      }

      if (filter.type !== undefined && signal.type !== filter.type) {
        return false;
      }

      if (filter.sentiment !== undefined && signal.sentiment !== filter.sentiment) {
        return false;
      }

      const signalDate = new Date(signal.timestamp);

      if (filter.startDate !== undefined && signalDate < filter.startDate) {
        return false;
      }

      if (filter.endDate !== undefined && signalDate > filter.endDate) {
        return false;
      }

      if (
        filter.tags !== undefined &&
        filter.tags.length > 0 &&
        signal.tags !== undefined &&
        !filter.tags.some((tag) => signal.tags?.includes(tag))
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Apply insight query filter (simple text search)
   */
  private applyInsightQuery(insights: Insight[], query?: string): Insight[] {
    if (query === undefined || query.trim().length === 0) {
      return insights;
    }

    const lowerQuery = query.toLowerCase();

    return insights.filter(
      (insight) =>
        insight.title.toLowerCase().includes(lowerQuery) ||
        insight.summary.toLowerCase().includes(lowerQuery) ||
        insight.category.toLowerCase().includes(lowerQuery)
    );
  }
}
