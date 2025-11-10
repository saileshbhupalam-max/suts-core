/**
 * Event collector implementation for telemetry
 */

import type {
  TelemetryEvent,
  TelemetryConfig,
  EventFilter,
  ITelemetryCollector,
} from './types';
import { InMemoryStore } from './storage/InMemoryStore';
import type { IEventStore } from './storage/IEventStore';

// Type declarations for timer functions
declare function setInterval(callback: () => void, ms: number): unknown;
declare function clearInterval(id: unknown): void;

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<TelemetryConfig> = {
  batchSize: 100,
  flushInterval: 5000,
  enableAsync: true,
  maxStorageSize: Number.MAX_SAFE_INTEGER,
};

/**
 * Event collector for tracking and querying telemetry events
 * Implements ITelemetryCollector interface with async batching support
 */
export class EventCollector implements ITelemetryCollector {
  private config: Required<TelemetryConfig>;
  private store: IEventStore;
  private batchQueue: TelemetryEvent[] = [];
  private flushTimer: unknown | null = null;

  /**
   * Creates a new event collector
   * @param config - Optional telemetry configuration
   * @param store - Optional custom event store (defaults to InMemoryStore)
   */
  constructor(config?: TelemetryConfig, store?: IEventStore) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    this.store = store ?? new InMemoryStore(this.config.maxStorageSize);

    // Start flush timer if async batching is enabled
    if (this.config.enableAsync && this.config.flushInterval > 0) {
      this.startFlushTimer();
    }
  }

  /**
   * Track a telemetry event
   * Uses async batching if enabled, otherwise stores immediately
   * @param event - The event to track
   */
  trackEvent(event: TelemetryEvent): void {
    if (this.config.enableAsync) {
      this.batchQueue.push(event);

      // Flush if batch size reached
      if (this.batchQueue.length >= this.config.batchSize) {
        this.flush();
      }
    } else {
      this.store.store(event);
    }
  }

  /**
   * Query events based on filter criteria
   * @param filter - Filter criteria for querying events
   * @returns Array of matching events
   */
  query(filter: EventFilter): TelemetryEvent[] {
    return this.store.query(filter);
  }

  /**
   * Get all tracked events
   * @returns Array of all events
   */
  getAllEvents(): TelemetryEvent[] {
    return this.store.getAll();
  }

  /**
   * Get total event count
   * @returns Total number of tracked events
   */
  getEventCount(): number {
    return this.store.count();
  }

  /**
   * Clear all tracked events
   */
  clear(): void {
    this.batchQueue = [];
    this.store.clear();
  }

  /**
   * Manually flush the batch queue
   * Processes all queued events immediately
   */
  flush(): void {
    if (this.batchQueue.length === 0) {
      return;
    }

    this.store.storeBatch([...this.batchQueue]);
    this.batchQueue = [];
  }

  /**
   * Stop the flush timer and cleanup
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flush(); // Flush any remaining events
  }

  /**
   * Get current batch queue size
   * @returns Number of events in batch queue
   */
  getBatchQueueSize(): number {
    return this.batchQueue.length;
  }

  /**
   * Start the automatic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop the automatic flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
