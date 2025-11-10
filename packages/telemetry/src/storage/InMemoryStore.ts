/**
 * In-memory storage implementation for telemetry events
 */

import type { TelemetryEvent, EventFilter } from '../types';
import type { IEventStore } from './IEventStore';

/**
 * In-memory event store using array-based storage
 * Optimized for MVP with efficient querying and no duplicates
 */
export class InMemoryStore implements IEventStore {
  private events: TelemetryEvent[] = [];
  private eventIds: Set<string> = new Set();
  private maxSize: number;

  /**
   * Creates a new in-memory store
   * @param maxSize - Maximum number of events to store (default: unlimited)
   */
  constructor(maxSize: number = Number.MAX_SAFE_INTEGER) {
    this.maxSize = maxSize;
  }

  /**
   * Store a single event
   * Prevents duplicates based on event ID
   */
  store(event: TelemetryEvent): void {
    if (this.eventIds.has(event.id)) {
      return; // Prevent duplicates
    }

    if (this.events.length >= this.maxSize) {
      // Remove oldest event if at capacity
      const removed = this.events.shift();
      if (removed !== undefined) {
        this.eventIds.delete(removed.id);
      }
    }

    this.events.push(event);
    this.eventIds.add(event.id);
  }

  /**
   * Store multiple events in batch
   */
  storeBatch(events: TelemetryEvent[]): void {
    events.forEach((event) => this.store(event));
  }

  /**
   * Query events based on filter criteria
   */
  query(filter: EventFilter): TelemetryEvent[] {
    return this.events.filter((event) => {
      if (
        filter.personaId !== undefined &&
        event.personaId !== filter.personaId
      ) {
        return false;
      }
      if (
        filter.eventType !== undefined &&
        event.eventType !== filter.eventType
      ) {
        return false;
      }
      if (filter.action !== undefined && event.action !== filter.action) {
        return false;
      }
      if (filter.cohort !== undefined && event.cohort !== filter.cohort) {
        return false;
      }
      if (
        filter.startTime !== undefined &&
        event.timestamp < filter.startTime
      ) {
        return false;
      }
      if (filter.endTime !== undefined && event.timestamp > filter.endTime) {
        return false;
      }
      if (
        filter.minFrustration !== undefined &&
        (event.emotionalState['frustration'] ?? 0) < filter.minFrustration
      ) {
        return false;
      }
      if (
        filter.maxFrustration !== undefined &&
        (event.emotionalState['frustration'] ?? 0) > filter.maxFrustration
      ) {
        return false;
      }
      if (
        filter.minDelight !== undefined &&
        (event.emotionalState['delight'] ?? 0) < filter.minDelight
      ) {
        return false;
      }
      if (
        filter.maxDelight !== undefined &&
        (event.emotionalState['delight'] ?? 0) > filter.maxDelight
      ) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get all events
   */
  getAll(): TelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Get event count
   */
  count(): number {
    return this.events.length;
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
    this.eventIds.clear();
  }

  /**
   * Get events by persona ID
   */
  getByPersonaId(personaId: string): TelemetryEvent[] {
    return this.events.filter((event) => event.personaId === personaId);
  }

  /**
   * Get events in time range
   */
  getByTimeRange(startTime: Date, endTime: Date): TelemetryEvent[] {
    return this.events.filter(
      (event) => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }
}
