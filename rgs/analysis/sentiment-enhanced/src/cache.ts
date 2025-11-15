/**
 * Sentiment Analysis Cache
 * Simple in-memory cache for sentiment analysis results
 */

import { EnhancedSentiment } from './types';
import crypto from 'crypto';

/**
 * Cache entry with timestamp
 */
interface CacheEntry {
  sentiment: EnhancedSentiment;
  timestamp: number;
}

/**
 * Simple LRU cache for sentiment analysis results
 */
export class SentimentCache {
  private readonly cache: Map<string, CacheEntry>;
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  /**
   * Creates a new SentimentCache
   *
   * @param maxEntries - Maximum number of entries (default: 1000)
   * @param ttlMs - Time to live in milliseconds (default: 24 hours)
   */
  constructor(maxEntries: number = 1000, ttlMs: number = 24 * 60 * 60 * 1000) {
    if (maxEntries <= 0) {
      throw new Error('maxEntries must be greater than 0');
    }
    if (ttlMs <= 0) {
      throw new Error('ttlMs must be greater than 0');
    }

    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  /**
   * Generates cache key from content
   *
   * @param content - Content to hash
   * @returns Cache key
   */
  private generateKey(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Gets sentiment from cache
   *
   * @param content - Content to look up
   * @returns Cached sentiment or undefined if not found/expired
   */
  get(content: string): EnhancedSentiment | undefined {
    const key = this.generateKey(content);
    const entry = this.cache.get(key);

    if (entry === undefined) {
      return undefined;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (mark as recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.sentiment;
  }

  /**
   * Sets sentiment in cache
   *
   * @param content - Content key
   * @param sentiment - Sentiment to cache
   */
  set(content: string, sentiment: EnhancedSentiment): void {
    const key = this.generateKey(content);

    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value as string;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      sentiment,
      timestamp: Date.now()
    });
  }

  /**
   * Clears all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   *
   * @returns Cache stats
   */
  getStats(): { size: number; capacity: number; hitRate?: number } {
    return {
      size: this.cache.size,
      capacity: this.maxEntries
    };
  }
}
