/**
 * ITelemetryCollector Interface
 * Defines contract for collecting and storing telemetry events
 */

import { TelemetryEvent, EmotionalState } from '../models/index';

/**
 * Query options for retrieving events
 */
export interface TelemetryQueryOptions {
  /**
   * Filter by simulation ID
   */
  simulationId?: string;

  /**
   * Filter by persona ID
   */
  personaId?: string;

  /**
   * Filter by event type
   */
  eventType?: string | string[];

  /**
   * Filter by time range
   */
  timeRange?: {
    start: Date;
    end: Date;
  };

  /**
   * Filter by tags
   */
  tags?: string[];

  /**
   * Limit number of results
   */
  limit?: number;

  /**
   * Offset for pagination
   */
  offset?: number;

  /**
   * Sort order
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Aggregated metrics from telemetry
 */
export interface AggregatedMetrics {
  /**
   * Total number of events
   */
  totalEvents: number;

  /**
   * Events by type
   */
  eventsByType: Record<string, number>;

  /**
   * Average emotional states
   */
  averageEmotions: EmotionalState;

  /**
   * Time series data
   */
  timeSeries: Array<{
    timestamp: string;
    eventCount: number;
    averageEmotions: EmotionalState;
  }>;

  /**
   * Most common actions
   */
  topActions: Array<{
    action: string;
    count: number;
    averageFrustration: number;
  }>;
}

/**
 * ITelemetryCollector Interface
 * Track and store events from simulations
 */
export interface ITelemetryCollector {
  /**
   * Record a single telemetry event
   *
   * @param event - Event to record
   * @returns Promise resolving when event is recorded
   * @throws Error if recording fails
   *
   * @example
   * ```typescript
   * await collector.recordEvent({
   *   id: 'evt-001',
   *   personaId: 'persona-001',
   *   simulationId: 'sim-001',
   *   sessionNumber: 1,
   *   timestamp: new Date().toISOString(),
   *   eventType: 'action',
   *   action: 'install',
   *   emotionalState: { frustration: 0.2, confidence: 0.7, delight: 0.5, confusion: 0.1 }
   * });
   * ```
   */
  recordEvent(event: TelemetryEvent): Promise<void>;

  /**
   * Record multiple events in batch
   *
   * @param events - Events to record
   * @returns Promise resolving when all events are recorded
   * @throws Error if recording fails
   */
  recordEvents(events: TelemetryEvent[]): Promise<void>;

  /**
   * Query events based on filters
   *
   * @param options - Query options
   * @returns Promise resolving to matching events
   * @throws Error if query fails
   */
  queryEvents(options: TelemetryQueryOptions): Promise<TelemetryEvent[]>;

  /**
   * Get aggregated metrics for a simulation
   *
   * @param simulationId - Simulation identifier
   * @param timeRange - Optional time range
   * @returns Promise resolving to aggregated metrics
   * @throws Error if query fails
   */
  getAggregatedMetrics(
    simulationId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<AggregatedMetrics>;

  /**
   * Get emotional trends over time
   *
   * @param simulationId - Simulation identifier
   * @param personaId - Optional persona filter
   * @param granularity - Time granularity ('hour' | 'day' | 'session')
   * @returns Promise resolving to emotional trends
   * @throws Error if query fails
   */
  getEmotionalTrends(
    simulationId: string,
    personaId?: string,
    granularity?: 'hour' | 'day' | 'session'
  ): Promise<Array<{
    timestamp: string;
    emotions: EmotionalState;
    eventCount: number;
  }>>;

  /**
   * Delete events for a simulation
   *
   * @param simulationId - Simulation identifier
   * @returns Promise resolving to number of deleted events
   * @throws Error if deletion fails
   */
  deleteEvents(simulationId: string): Promise<number>;

  /**
   * Archive old events to cold storage
   *
   * @param olderThan - Archive events older than this date
   * @returns Promise resolving to number of archived events
   * @throws Error if archival fails
   */
  archiveEvents(olderThan: Date): Promise<number>;
}
