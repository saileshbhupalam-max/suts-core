import { z } from 'zod';

/**
 * Web signal data structure from various sources (Reddit, Twitter, etc.)
 */
export const WebSignalSchema = z.object({
  id: z.string(),
  source: z.enum(['reddit', 'twitter', 'github', 'stackoverflow', 'hackernews']),
  type: z.enum(['post', 'comment', 'issue', 'discussion', 'tweet']),
  content: z.string(),
  author: z.string(),
  url: z.string().url(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional(),
  tags: z.array(z.string()).optional(),
});

export type WebSignal = z.infer<typeof WebSignalSchema>;

/**
 * Insight generated from web signals
 */
export const InsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  category: z.enum(['feature-request', 'bug-report', 'user-feedback', 'trend', 'pain-point']),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()), // WebSignal IDs
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export type Insight = z.infer<typeof InsightSchema>;

/**
 * Filter for querying web signals
 */
export interface SignalFilter {
  source?: WebSignal['source'];
  type?: WebSignal['type'];
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  sentiment?: WebSignal['sentiment'];
}

/**
 * Storage interface for RGS data persistence
 */
export interface IStorage {
  /**
   * Save web signals to storage
   * @param signals - Array of web signals to save
   * @throws {StorageError} If save operation fails
   */
  saveSignals(signals: WebSignal[]): Promise<void>;

  /**
   * Load web signals from storage
   * @param filter - Optional filter criteria
   * @returns Array of web signals matching the filter
   * @throws {StorageError} If load operation fails
   */
  loadSignals(filter?: SignalFilter): Promise<WebSignal[]>;

  /**
   * Save insights to storage
   * @param insights - Array of insights to save
   * @throws {StorageError} If save operation fails
   */
  saveInsights(insights: Insight[]): Promise<void>;

  /**
   * Load insights from storage
   * @param query - Optional search query string
   * @returns Array of insights matching the query
   * @throws {StorageError} If load operation fails
   */
  loadInsights(query?: string): Promise<Insight[]>;
}

/**
 * Custom error for storage operations
 */
export class StorageError extends Error {
  public override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}
