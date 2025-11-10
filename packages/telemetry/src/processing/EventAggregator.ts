/**
 * Event aggregator for grouping and summarizing telemetry events
 */

import type { TelemetryEvent, AggregatedEventData } from '../types';

/**
 * Aggregates telemetry events by various dimensions
 */
export class EventAggregator {
  /**
   * Aggregate events by persona ID
   * @param events - Array of telemetry events
   * @returns Map of persona ID to aggregated data
   */
  aggregateByPersona(
    events: TelemetryEvent[]
  ): Map<string, AggregatedEventData> {
    const aggregated = new Map<string, AggregatedEventData>();

    events.forEach((event) => {
      const existing = aggregated.get(event.personaId);
      if (existing) {
        this.updateAggregatedData(existing, event);
      } else {
        aggregated.set(event.personaId, this.createAggregatedData(event));
      }
    });

    return aggregated;
  }

  /**
   * Aggregate events by action
   * @param events - Array of telemetry events
   * @returns Map of action to aggregated data
   */
  aggregateByAction(
    events: TelemetryEvent[]
  ): Map<string, AggregatedEventData> {
    const aggregated = new Map<string, AggregatedEventData>();

    events.forEach((event) => {
      const existing = aggregated.get(event.action);
      if (existing) {
        this.updateAggregatedData(existing, event);
      } else {
        const data = this.createAggregatedData(event);
        data.action = event.action;
        aggregated.set(event.action, data);
      }
    });

    return aggregated;
  }

  /**
   * Aggregate events by event type
   * @param events - Array of telemetry events
   * @returns Map of event type to aggregated data
   */
  aggregateByEventType(
    events: TelemetryEvent[]
  ): Map<string, AggregatedEventData> {
    const aggregated = new Map<string, AggregatedEventData>();

    events.forEach((event) => {
      const existing = aggregated.get(event.eventType);
      if (existing) {
        this.updateAggregatedData(existing, event);
      } else {
        const data = this.createAggregatedData(event);
        data.eventType = event.eventType;
        aggregated.set(event.eventType, data);
      }
    });

    return aggregated;
  }

  /**
   * Aggregate events by time bucket (e.g., hourly, daily)
   * @param events - Array of telemetry events
   * @param bucketSizeMs - Size of time bucket in milliseconds
   * @returns Map of time bucket to aggregated data
   */
  aggregateByTime(
    events: TelemetryEvent[],
    bucketSizeMs: number
  ): Map<number, AggregatedEventData> {
    const aggregated = new Map<number, AggregatedEventData>();

    events.forEach((event) => {
      const bucket = Math.floor(event.timestamp.getTime() / bucketSizeMs);
      const existing = aggregated.get(bucket);
      if (existing) {
        this.updateAggregatedData(existing, event);
      } else {
        aggregated.set(bucket, this.createAggregatedData(event));
      }
    });

    return aggregated;
  }

  /**
   * Aggregate events by persona and action combination
   * @param events - Array of telemetry events
   * @returns Map of persona:action key to aggregated data
   */
  aggregateByPersonaAndAction(
    events: TelemetryEvent[]
  ): Map<string, AggregatedEventData> {
    const aggregated = new Map<string, AggregatedEventData>();

    events.forEach((event) => {
      const key = `${event.personaId}:${event.action}`;
      const existing = aggregated.get(key);
      if (existing) {
        this.updateAggregatedData(existing, event);
      } else {
        const data = this.createAggregatedData(event);
        data.personaId = event.personaId;
        data.action = event.action;
        aggregated.set(key, data);
      }
    });

    return aggregated;
  }

  /**
   * Create initial aggregated data from an event
   * @param event - Telemetry event
   * @returns Initial aggregated data
   */
  private createAggregatedData(event: TelemetryEvent): AggregatedEventData {
    return {
      personaId: event.personaId,
      count: 1,
      avgFrustration: event.emotionalState['frustration'] ?? 0,
      avgDelight: event.emotionalState['delight'] ?? 0,
      avgConfidence: event.emotionalState['confidence'] ?? 0,
      avgConfusion: event.emotionalState['confusion'] ?? 0,
      timestamps: [event.timestamp],
    };
  }

  /**
   * Update aggregated data with a new event
   * @param aggregated - Existing aggregated data
   * @param event - New event to add
   */
  private updateAggregatedData(
    aggregated: AggregatedEventData,
    event: TelemetryEvent
  ): void {
    const newCount = aggregated.count + 1;

    // Update running averages
    aggregated.avgFrustration =
      (aggregated.avgFrustration * aggregated.count +
        (event.emotionalState['frustration'] ?? 0)) /
      newCount;
    aggregated.avgDelight =
      (aggregated.avgDelight * aggregated.count +
        (event.emotionalState['delight'] ?? 0)) /
      newCount;
    aggregated.avgConfidence =
      (aggregated.avgConfidence * aggregated.count +
        (event.emotionalState['confidence'] ?? 0)) /
      newCount;
    aggregated.avgConfusion =
      (aggregated.avgConfusion * aggregated.count +
        (event.emotionalState['confusion'] ?? 0)) /
      newCount;

    aggregated.count = newCount;
    aggregated.timestamps.push(event.timestamp);
  }
}
