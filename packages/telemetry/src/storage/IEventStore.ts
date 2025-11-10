/**
 * Storage interface for telemetry events
 */

import type { TelemetryEvent, EventFilter } from '../types';

/**
 * Interface for event storage implementations
 */
export interface IEventStore {
  /**
   * Store a single event
   * @param event - The event to store
   */
  store(event: TelemetryEvent): void;

  /**
   * Store multiple events in batch
   * @param events - Array of events to store
   */
  storeBatch(events: TelemetryEvent[]): void;

  /**
   * Query events based on filter criteria
   * @param filter - Filter criteria
   * @returns Array of matching events
   */
  query(filter: EventFilter): TelemetryEvent[];

  /**
   * Get all events
   * @returns Array of all events
   */
  getAll(): TelemetryEvent[];

  /**
   * Get event count
   * @returns Total number of stored events
   */
  count(): number;

  /**
   * Clear all events
   */
  clear(): void;

  /**
   * Get events by persona ID
   * @param personaId - The persona ID to filter by
   * @returns Array of events for the persona
   */
  getByPersonaId(personaId: string): TelemetryEvent[];

  /**
   * Get events in time range
   * @param startTime - Start of time range
   * @param endTime - End of time range
   * @returns Array of events in the time range
   */
  getByTimeRange(startTime: Date, endTime: Date): TelemetryEvent[];
}
