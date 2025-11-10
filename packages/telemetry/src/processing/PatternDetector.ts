/**
 * Pattern detector for identifying friction and value patterns in telemetry
 */

import type { TelemetryEvent, Pattern } from '../types';

/**
 * Detects friction and value patterns in telemetry events
 */
export class PatternDetector {
  /**
   * Detect friction patterns (high frustration, low delight)
   * @param events - Array of telemetry events
   * @param frustrationThreshold - Minimum frustration level to be considered friction (default: 0.6)
   * @param minOccurrences - Minimum number of occurrences to be considered a pattern (default: 3)
   * @returns Array of detected friction patterns
   */
  detectFrictionPatterns(
    events: TelemetryEvent[],
    frustrationThreshold: number = 0.6,
    minOccurrences: number = 3
  ): Pattern[] {
    const patterns = new Map<
      string,
      {
        personaId: string;
        action: string;
        occurrences: number;
        totalFrustration: number;
        totalDelight: number;
        totalConfidence: number;
        totalConfusion: number;
        timestamps: Date[];
      }
    >();

    // Group events by persona and action
    events.forEach((event) => {
      const frustration = event.emotionalState['frustration'] ?? 0;
      if (frustration < frustrationThreshold) {
        return;
      }

      const key = `${event.personaId}:${event.action}`;
      const existing = patterns.get(key);

      if (existing !== undefined) {
        existing.occurrences++;
        existing.totalFrustration += frustration;
        existing.totalDelight += event.emotionalState['delight'] ?? 0;
        existing.totalConfidence += event.emotionalState['confidence'] ?? 0;
        existing.totalConfusion += event.emotionalState['confusion'] ?? 0;
        existing.timestamps.push(event.timestamp);
      } else {
        patterns.set(key, {
          personaId: event.personaId,
          action: event.action,
          occurrences: 1,
          totalFrustration: frustration,
          totalDelight: event.emotionalState['delight'] ?? 0,
          totalConfidence: event.emotionalState['confidence'] ?? 0,
          totalConfusion: event.emotionalState['confusion'] ?? 0,
          timestamps: [event.timestamp],
        });
      }
    });

    // Convert to Pattern objects
    const frictionPatterns: Pattern[] = [];
    patterns.forEach((data) => {
      if (data.occurrences >= minOccurrences) {
        frictionPatterns.push({
          type: 'friction',
          personaId: data.personaId,
          action: data.action,
          confidence: data.totalFrustration / data.occurrences,
          occurrences: data.occurrences,
          avgEmotionalState: {
            frustration: data.totalFrustration / data.occurrences,
            delight: data.totalDelight / data.occurrences,
            confidence: data.totalConfidence / data.occurrences,
            confusion: data.totalConfusion / data.occurrences,
          },
          timestamps: data.timestamps,
        });
      }
    });

    return frictionPatterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect value patterns (high delight, low frustration)
   * @param events - Array of telemetry events
   * @param delightThreshold - Minimum delight level to be considered value (default: 0.7)
   * @param minOccurrences - Minimum number of occurrences to be considered a pattern (default: 3)
   * @returns Array of detected value patterns
   */
  detectValuePatterns(
    events: TelemetryEvent[],
    delightThreshold: number = 0.7,
    minOccurrences: number = 3
  ): Pattern[] {
    const patterns = new Map<
      string,
      {
        personaId: string;
        action: string;
        occurrences: number;
        totalFrustration: number;
        totalDelight: number;
        totalConfidence: number;
        totalConfusion: number;
        timestamps: Date[];
      }
    >();

    // Group events by persona and action
    events.forEach((event) => {
      const delight = event.emotionalState['delight'] ?? 0;
      if (delight < delightThreshold) {
        return;
      }

      const key = `${event.personaId}:${event.action}`;
      const existing = patterns.get(key);

      if (existing !== undefined) {
        existing.occurrences++;
        existing.totalFrustration += event.emotionalState['frustration'] ?? 0;
        existing.totalDelight += delight;
        existing.totalConfidence += event.emotionalState['confidence'] ?? 0;
        existing.totalConfusion += event.emotionalState['confusion'] ?? 0;
        existing.timestamps.push(event.timestamp);
      } else {
        patterns.set(key, {
          personaId: event.personaId,
          action: event.action,
          occurrences: 1,
          totalFrustration: event.emotionalState['frustration'] ?? 0,
          totalDelight: delight,
          totalConfidence: event.emotionalState['confidence'] ?? 0,
          totalConfusion: event.emotionalState['confusion'] ?? 0,
          timestamps: [event.timestamp],
        });
      }
    });

    // Convert to Pattern objects
    const valuePatterns: Pattern[] = [];
    patterns.forEach((data) => {
      if (data.occurrences >= minOccurrences) {
        valuePatterns.push({
          type: 'value',
          personaId: data.personaId,
          action: data.action,
          confidence: data.totalDelight / data.occurrences,
          occurrences: data.occurrences,
          avgEmotionalState: {
            frustration: data.totalFrustration / data.occurrences,
            delight: data.totalDelight / data.occurrences,
            confidence: data.totalConfidence / data.occurrences,
            confusion: data.totalConfusion / data.occurrences,
          },
          timestamps: data.timestamps,
        });
      }
    });

    return valuePatterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect all patterns (both friction and value)
   * @param events - Array of telemetry events
   * @returns Object containing friction and value patterns
   */
  detectAllPatterns(events: TelemetryEvent[]): {
    friction: Pattern[];
    value: Pattern[];
  } {
    return {
      friction: this.detectFrictionPatterns(events),
      value: this.detectValuePatterns(events),
    };
  }

  /**
   * Find recurring action sequences that lead to friction
   * @param events - Array of telemetry events
   * @param sequenceLength - Length of sequence to detect (default: 3)
   * @returns Array of action sequences with high friction
   */
  detectFrictionSequences(
    events: TelemetryEvent[],
    sequenceLength: number = 3
  ): Array<{ sequence: string[]; avgFrustration: number; count: number }> {
    const personaEvents = new Map<string, TelemetryEvent[]>();

    // Group events by persona and sort by timestamp
    events.forEach((event) => {
      const existing = personaEvents.get(event.personaId) ?? [];
      existing.push(event);
      personaEvents.set(event.personaId, existing);
    });

    // Sort each persona's events by timestamp
    personaEvents.forEach((events) => {
      events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });

    // Find sequences
    const sequences = new Map<
      string,
      { totalFrustration: number; count: number }
    >();

    personaEvents.forEach((events) => {
      for (let i = 0; i <= events.length - sequenceLength; i++) {
        const sequence = events
          .slice(i, i + sequenceLength)
          .map((e) => e.action);
        const key = sequence.join('->');

        const lastEvent = events[i + sequenceLength - 1];
        const frustration = lastEvent?.emotionalState['frustration'] ?? 0;

        const existing = sequences.get(key);
        if (existing !== undefined) {
          existing.totalFrustration += frustration;
          existing.count++;
        } else {
          sequences.set(key, {
            totalFrustration: frustration,
            count: 1,
          });
        }
      }
    });

    // Convert to result format
    const result: Array<{
      sequence: string[];
      avgFrustration: number;
      count: number;
    }> = [];

    sequences.forEach((data, key) => {
      const avgFrustration = data.totalFrustration / data.count;
      if (avgFrustration > 0.5 && data.count >= 2) {
        result.push({
          sequence: key.split('->'),
          avgFrustration,
          count: data.count,
        });
      }
    });

    return result.sort((a, b) => b.avgFrustration - a.avgFrustration);
  }
}
