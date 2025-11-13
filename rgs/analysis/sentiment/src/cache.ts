/**
 * RGS Sentiment Cache Module
 *
 * LRU cache for sentiment analysis results to avoid re-analyzing the same content
 */

import type { Emotion } from './emotions';

/**
 * Sentiment analysis result structure
 */
export interface SentimentResult {
  /** Sentiment score from -1 (very negative) to +1 (very positive) */
  score: number;
  /** Magnitude from 0 (neutral) to 1 (very strong emotion) */
  magnitude: number;
  /** Detected emotions */
  emotions: Emotion[];
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Reasoning from Claude (optional) */
  reasoning?: string;
}

/**
 * Cache entry with access timestamp for LRU eviction
 */
interface CacheEntry {
  result: SentimentResult;
  lastAccessedAt: number;
}

/**
 * LRU cache configuration options
 */
export interface SentimentCacheOptions {
  /** Maximum number of entries (default: 10000) */
  maxEntries?: number;
  /** Whether to enable cache (default: true) */
  enabled?: boolean;
}

/**
 * LRU cache for sentiment analysis results
 *
 * Implements Least Recently Used eviction policy:
 * - Limits cache size to maxEntries
 * - Evicts least recently accessed entries when full
 * - Uses content hash as key to detect duplicate content
 */
export class SentimentCache {
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly maxEntries: number;
  private readonly enabled: boolean;

  /**
   * Creates a new SentimentCache instance
   */
  constructor(options: SentimentCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 10000;
    this.enabled = options.enabled ?? true;

    if (this.maxEntries <= 0) {
      throw new Error('maxEntries must be positive');
    }
  }

  /**
   * Generates a hash key for content
   * Uses first 100 characters + length as a simple hash
   */
  private hash(content: string): string {
    const prefix = content.slice(0, 100);
    const length = content.length;
    return `${prefix}-${length}`;
  }

  /**
   * Gets a cached sentiment result
   *
   * @param content - The content to look up
   * @returns Cached result if found, undefined otherwise
   */
  get(content: string): SentimentResult | undefined {
    if (!this.enabled) {
      return undefined;
    }

    const key = this.hash(content);
    const entry = this.cache.get(key);

    if (entry === undefined) {
      return undefined;
    }

    // Update last accessed time (LRU)
    entry.lastAccessedAt = Date.now();
    return entry.result;
  }

  /**
   * Stores a sentiment result in the cache
   *
   * @param content - The content that was analyzed
   * @param result - The sentiment analysis result
   */
  set(content: string, result: SentimentResult): void {
    if (!this.enabled) {
      return;
    }

    const key = this.hash(content);

    // If cache is full, evict least recently used entry
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      result,
      lastAccessedAt: Date.now(),
    });
  }

  /**
   * Evicts the least recently used entry from the cache
   */
  private evictLRU(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    // Find the entry with the oldest access time
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clears all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets the current number of cached entries
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Checks if cache contains a result for the given content
   */
  has(content: string): boolean {
    if (!this.enabled) {
      return false;
    }
    const key = this.hash(content);
    return this.cache.has(key);
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    size: number;
    maxEntries: number;
    enabled: boolean;
    utilizationPercent: number;
  } {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      enabled: this.enabled,
      utilizationPercent: (this.cache.size / this.maxEntries) * 100,
    };
  }
}
