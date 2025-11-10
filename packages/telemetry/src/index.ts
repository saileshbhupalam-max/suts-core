/**
 * SUTS Telemetry Package
 * Event tracking and analytics
 */

export * from './types';
export * from './EventCollector';
export * from './MetricsCalculator';
export * from './storage';
export * from './processing';

// Re-export legacy collector for backwards compatibility
export { TelemetryCollector } from './collector';
