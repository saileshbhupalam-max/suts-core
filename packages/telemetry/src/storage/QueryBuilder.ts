/**
 * Fluent query builder for telemetry events
 */

import type { EventFilter, TelemetryEvent } from '../types';
import type { IEventStore } from './IEventStore';

/**
 * Fluent query builder for constructing event queries
 */
export class QueryBuilder {
  private filter: EventFilter = {};
  private store: IEventStore;

  /**
   * Creates a new query builder
   * @param store - The event store to query
   */
  constructor(store: IEventStore) {
    this.store = store;
  }

  /**
   * Filter by persona ID
   * @param personaId - The persona ID to filter by
   * @returns This query builder for chaining
   */
  forPersona(personaId: string): this {
    this.filter.personaId = personaId;
    return this;
  }

  /**
   * Filter by event type
   * @param eventType - The event type to filter by
   * @returns This query builder for chaining
   */
  ofType(eventType: string): this {
    this.filter.eventType = eventType;
    return this;
  }

  /**
   * Filter by action
   * @param action - The action to filter by
   * @returns This query builder for chaining
   */
  withAction(action: string): this {
    this.filter.action = action;
    return this;
  }

  /**
   * Filter by cohort
   * @param cohort - The cohort to filter by
   * @returns This query builder for chaining
   */
  inCohort(cohort: string): this {
    this.filter.cohort = cohort;
    return this;
  }

  /**
   * Filter by time range
   * @param startTime - Start of time range
   * @param endTime - End of time range
   * @returns This query builder for chaining
   */
  betweenDates(startTime: Date, endTime: Date): this {
    this.filter.startTime = startTime;
    this.filter.endTime = endTime;
    return this;
  }

  /**
   * Filter by minimum frustration level
   * @param minFrustration - Minimum frustration level (0-1)
   * @returns This query builder for chaining
   */
  withMinFrustration(minFrustration: number): this {
    this.filter.minFrustration = minFrustration;
    return this;
  }

  /**
   * Filter by maximum frustration level
   * @param maxFrustration - Maximum frustration level (0-1)
   * @returns This query builder for chaining
   */
  withMaxFrustration(maxFrustration: number): this {
    this.filter.maxFrustration = maxFrustration;
    return this;
  }

  /**
   * Filter by minimum delight level
   * @param minDelight - Minimum delight level (0-1)
   * @returns This query builder for chaining
   */
  withMinDelight(minDelight: number): this {
    this.filter.minDelight = minDelight;
    return this;
  }

  /**
   * Filter by maximum delight level
   * @param maxDelight - Maximum delight level (0-1)
   * @returns This query builder for chaining
   */
  withMaxDelight(maxDelight: number): this {
    this.filter.maxDelight = maxDelight;
    return this;
  }

  /**
   * Execute the query and return matching events
   * @returns Array of matching events
   */
  execute(): TelemetryEvent[] {
    return this.store.query(this.filter);
  }

  /**
   * Get the current filter
   * @returns The current filter object
   */
  getFilter(): EventFilter {
    return { ...this.filter };
  }

  /**
   * Reset the query builder
   * @returns This query builder for chaining
   */
  reset(): this {
    this.filter = {};
    return this;
  }
}
