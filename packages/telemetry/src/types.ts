/**
 * Telemetry-related types
 */

/**
 * Telemetry event
 */
export interface TelemetryEvent {
  id: string;
  personaId: string;
  eventType: string;
  action: string;
  emotionalState: Record<string, number>;
  metadata: Record<string, unknown>;
  timestamp: Date;
  cohort?: string;
}

/**
 * Telemetry configuration
 */
export interface TelemetryConfig {
  batchSize?: number;
  flushInterval?: number;
  enableAsync?: boolean;
  maxStorageSize?: number;
}

/**
 * Event filter for querying events
 */
export interface EventFilter {
  personaId?: string;
  eventType?: string;
  action?: string;
  cohort?: string;
  startTime?: Date;
  endTime?: Date;
  minFrustration?: number;
  maxFrustration?: number;
  minDelight?: number;
  maxDelight?: number;
}

/**
 * Interface for telemetry collectors
 */
export interface ITelemetryCollector {
  trackEvent(event: TelemetryEvent): void;
  query(filter: EventFilter): TelemetryEvent[];
}

/**
 * Aggregated event data
 */
export interface AggregatedEventData {
  personaId?: string;
  action?: string;
  eventType?: string;
  count: number;
  avgFrustration: number;
  avgDelight: number;
  avgConfidence: number;
  avgConfusion: number;
  timestamps: Date[];
}

/**
 * Pattern detection result
 */
export interface Pattern {
  type: 'friction' | 'value';
  personaId: string;
  action: string;
  confidence: number;
  occurrences: number;
  avgEmotionalState: Record<string, number>;
  timestamps: Date[];
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
}

/**
 * Retention cohort data
 */
export interface RetentionCohort {
  cohort: string;
  totalUsers: number;
  day7Retention: number;
  day14Retention: number;
  day30Retention: number;
}
