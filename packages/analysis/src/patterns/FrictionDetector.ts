/**
 * Friction detection - identifies high frustration and abandonment patterns
 */

import { TelemetryEvent } from '@suts/telemetry';
import { FrictionPoint } from '../models';
import { AnalysisConfig } from '../models/config';

/**
 * Detects friction points from telemetry events
 */
export class FrictionDetector {
  constructor(private readonly config: AnalysisConfig) {}

  /**
   * Detects friction points from events
   * @param events - Telemetry events to analyze
   * @returns Array of detected friction points
   */
  detect(events: TelemetryEvent[]): FrictionPoint[] {
    if (events.length === 0) {
      return [];
    }

    // Group events by action and event type
    const groupedEvents = this.groupEvents(events);

    const frictionPoints: FrictionPoint[] = [];

    for (const [key, eventGroup] of groupedEvents.entries()) {
      const parts = key.split('::');
      const action = parts[0];
      const eventType = parts[1];

      if (action === undefined || eventType === undefined) {
        continue;
      }

      // Calculate metrics
      const avgFrustration = this.calculateAverageFrustration(eventGroup);
      const abandonmentRate = this.calculateAbandonmentRate(eventGroup, events);
      const avgTimeSpent = this.calculateAverageTimeSpent(eventGroup);
      const affectedUsers = this.countUniqueUsers(eventGroup);
      const frequency = eventGroup.length;

      // Check if this qualifies as a friction point
      if (
        avgFrustration >= this.config.minFrustrationLevel &&
        frequency >= this.config.minFrictionFrequency
      ) {
        const severity = this.calculateSeverity(avgFrustration, abandonmentRate);
        const confidence = this.calculateConfidence(frequency, affectedUsers);
        const priority = this.calculatePriority(severity, frequency, affectedUsers);

        frictionPoints.push({
          location: {
            action,
            eventType,
          },
          severity,
          frequency,
          affectedUsers,
          avgFrustration,
          avgTimeSpent,
          abandonmentRate,
          priority,
          confidence,
          description: this.generateDescription(action, eventType, avgFrustration, abandonmentRate),
          suggestedFixes: this.generateSuggestedFixes(action, avgFrustration, abandonmentRate),
        });
      }
    }

    // Sort by priority descending
    return frictionPoints.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Groups events by action and event type
   */
  private groupEvents(events: TelemetryEvent[]): Map<string, TelemetryEvent[]> {
    const grouped = new Map<string, TelemetryEvent[]>();

    for (const event of events) {
      const key = `${event.action}::${event.eventType}`;
      const existing = grouped.get(key);
      if (existing !== undefined) {
        existing.push(event);
      } else {
        grouped.set(key, [event]);
      }
    }

    return grouped;
  }

  /**
   * Calculates average frustration level
   */
  private calculateAverageFrustration(events: TelemetryEvent[]): number {
    if (events.length === 0) {
      return 0;
    }

    const totalFrustration = events.reduce((sum, event) => {
      return sum + (event.emotionalState['frustration'] ?? 0);
    }, 0);

    return totalFrustration / events.length;
  }

  /**
   * Calculates abandonment rate
   */
  private calculateAbandonmentRate(events: TelemetryEvent[], allEvents: TelemetryEvent[]): number {
    if (events.length === 0) {
      return 0;
    }

    const userIds = new Set(events.map((e) => e.personaId));
    let abandonments = 0;

    for (const userId of userIds) {
      const userEvents = allEvents.filter((e) => e.personaId === userId);
      const lastEvent = userEvents[userEvents.length - 1];

      // Check if user abandoned after this friction point
      if (lastEvent !== undefined) {
        const frictionEvent = events.find((e) => e.personaId === userId);
        if (frictionEvent !== undefined && frictionEvent.timestamp >= lastEvent.timestamp) {
          abandonments++;
        }
      }
    }

    return abandonments / userIds.size;
  }

  /**
   * Calculates average time spent
   */
  private calculateAverageTimeSpent(events: TelemetryEvent[]): number {
    if (events.length === 0) {
      return 0;
    }

    // Group by user and calculate time between events
    const userTimes: number[] = [];

    const userEvents = new Map<string, TelemetryEvent[]>();
    for (const event of events) {
      const existing = userEvents.get(event.personaId);
      if (existing !== undefined) {
        existing.push(event);
      } else {
        userEvents.set(event.personaId, [event]);
      }
    }

    for (const [, userEventList] of userEvents) {
      if (userEventList.length >= 2) {
        userEventList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const lastEvent = userEventList[userEventList.length - 1];
        const firstEvent = userEventList[0];
        if (lastEvent !== undefined && firstEvent !== undefined) {
          const timeDiff = lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
          userTimes.push(timeDiff);
        }
      }
    }

    if (userTimes.length === 0) {
      return 0;
    }

    return userTimes.reduce((sum, time) => sum + time, 0) / userTimes.length;
  }

  /**
   * Counts unique users
   */
  private countUniqueUsers(events: TelemetryEvent[]): number {
    return new Set(events.map((e) => e.personaId)).size;
  }

  /**
   * Calculates severity score
   */
  private calculateSeverity(frustration: number, abandonmentRate: number): number {
    return (frustration * 0.6 + abandonmentRate * 0.4);
  }

  /**
   * Calculates confidence score
   */
  private calculateConfidence(frequency: number, affectedUsers: number): number {
    // More events and users = higher confidence
    const frequencyScore = Math.min(frequency / 100, 1);
    const userScore = Math.min(affectedUsers / 50, 1);
    return (frequencyScore * 0.5 + userScore * 0.5);
  }

  /**
   * Calculates priority score
   */
  private calculatePriority(severity: number, frequency: number, affectedUsers: number): number {
    const normalizedFrequency = Math.min(frequency / 100, 1);
    const normalizedUsers = Math.min(affectedUsers / 50, 1);
    return (severity * 0.5 + normalizedFrequency * 0.25 + normalizedUsers * 0.25);
  }

  /**
   * Generates description
   */
  private generateDescription(
    action: string,
    eventType: string,
    frustration: number,
    abandonmentRate: number
  ): string {
    return `High friction detected in ${action} (${eventType}): ${(frustration * 100).toFixed(1)}% avg frustration, ${(abandonmentRate * 100).toFixed(1)}% abandonment rate`;
  }

  /**
   * Generates suggested fixes
   */
  private generateSuggestedFixes(
    action: string,
    frustration: number,
    abandonmentRate: number
  ): string[] {
    const fixes: string[] = [];

    if (frustration > 0.8) {
      fixes.push(`Simplify ${action} workflow to reduce complexity`);
      fixes.push('Add inline help or tooltips');
    }

    if (abandonmentRate > 0.5) {
      fixes.push('Add progress indicators');
      fixes.push('Provide escape routes or undo options');
    }

    fixes.push(`Review ${action} UX and conduct user testing`);

    return fixes;
  }
}
