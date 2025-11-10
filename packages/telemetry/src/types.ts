/**
 * Telemetry-related types
 */

/**
 * Telemetry event
 */
export interface TelemetryEvent {
  personaId: string;
  eventType: string;
  action: string;
  emotionalState: Record<string, number>;
  metadata: Record<string, unknown>;
  timestamp: Date;
}
