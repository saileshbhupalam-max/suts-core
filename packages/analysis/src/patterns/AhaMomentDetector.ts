/**
 * Aha moment detection - identifies when users "get it"
 */

import { TelemetryEvent } from '@suts/telemetry';
import { AhaMoment } from '../models';
import { AnalysisConfig } from '../models/config';

/**
 * Detects aha moments from telemetry events
 */
export class AhaMomentDetector {
  constructor(private readonly config: AnalysisConfig) {}

  /**
   * Detects aha moments from events
   * @param events - Telemetry events to analyze
   * @returns Array of detected aha moments
   */
  detect(events: TelemetryEvent[]): AhaMoment[] {
    if (events.length === 0) {
      return [];
    }

    // Group events by action and event type
    const groupedEvents = this.groupEvents(events);

    const ahaMoments: AhaMoment[] = [];

    for (const [key, eventGroup] of groupedEvents.entries()) {
      const parts = key.split('::');
      const action = parts[0];
      const eventType = parts[1];

      if (action === undefined || eventType === undefined) {
        continue;
      }

      // Calculate metrics
      const retentionImpact = this.calculateRetentionImpact(eventGroup, events);
      const timeToAha = this.calculateAverageTimeToAha(eventGroup, events);
      const usersReached = this.countUsersReached(eventGroup);
      const usersNotReached = this.countUsersNotReached(eventGroup, events);

      // Check if this qualifies as an aha moment (high delight + retention impact)
      const avgDelight = this.calculateAverageDelight(eventGroup);
      if (avgDelight >= this.config.minDelightLevel && retentionImpact >= 0.7) {
        const confidence = this.calculateConfidence(eventGroup.length, usersReached);

        ahaMoments.push({
          action,
          eventType,
          timeToAha,
          retentionImpact,
          usersReached,
          usersNotReached,
          confidence,
          description: this.generateDescription(
            action,
            eventType,
            timeToAha,
            retentionImpact,
            usersReached
          ),
        });
      }
    }

    // Sort by retention impact descending
    return ahaMoments.sort((a, b) => b.retentionImpact - a.retentionImpact);
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
   * Calculates average delight
   */
  private calculateAverageDelight(events: TelemetryEvent[]): number {
    if (events.length === 0) {
      return 0;
    }

    const totalDelight = events.reduce((sum, event) => {
      return sum + (event.emotionalState["delight"] ?? 0);
    }, 0);

    return totalDelight / events.length;
  }

  /**
   * Calculates retention impact
   */
  private calculateRetentionImpact(events: TelemetryEvent[], allEvents: TelemetryEvent[]): number {
    if (events.length === 0) {
      return 0;
    }

    const userIds = new Set(events.map((e) => e.personaId));
    let retainedUsers = 0;

    for (const userId of userIds) {
      const userEvents = allEvents
        .filter((e) => e.personaId === userId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const ahaEvent = events.find((e) => e.personaId === userId);
      if (ahaEvent !== undefined) {
        // Check for continued activity after aha moment
        const eventsAfter = userEvents.filter(
          (e) => e.timestamp.getTime() > ahaEvent.timestamp.getTime()
        );

        // Consider retained if user has 3+ events after aha moment
        if (eventsAfter.length >= 3) {
          retainedUsers++;
        }
      }
    }

    return retainedUsers / userIds.size;
  }

  /**
   * Calculates average time to aha moment
   */
  private calculateAverageTimeToAha(
    events: TelemetryEvent[],
    allEvents: TelemetryEvent[]
  ): number {
    const times: number[] = [];

    const userIds = new Set(events.map((e) => e.personaId));

    for (const userId of userIds) {
      const userEvents = allEvents
        .filter((e) => e.personaId === userId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (userEvents.length > 0) {
        const firstEvent = userEvents[0];
        const ahaEvent = events.find((e) => e.personaId === userId);

        if (firstEvent !== undefined && ahaEvent !== undefined) {
          const timeToAha = ahaEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
          times.push(timeToAha);
        }
      }
    }

    if (times.length === 0) {
      return 0;
    }

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  /**
   * Counts users who reached this aha moment
   */
  private countUsersReached(events: TelemetryEvent[]): number {
    return new Set(events.map((e) => e.personaId)).size;
  }

  /**
   * Counts users who did not reach this aha moment
   */
  private countUsersNotReached(events: TelemetryEvent[], allEvents: TelemetryEvent[]): number {
    const allUserIds = new Set(allEvents.map((e) => e.personaId));
    const reachedUserIds = new Set(events.map((e) => e.personaId));

    return allUserIds.size - reachedUserIds.size;
  }

  /**
   * Calculates confidence score
   */
  private calculateConfidence(frequency: number, usersReached: number): number {
    const frequencyScore = Math.min(frequency / 50, 1);
    const userScore = Math.min(usersReached / 30, 1);
    return (frequencyScore * 0.5 + userScore * 0.5);
  }

  /**
   * Generates description
   */
  private generateDescription(
    action: string,
    eventType: string,
    timeToAha: number,
    retentionImpact: number,
    usersReached: number
  ): string {
    const timeInMinutes = timeToAha / (1000 * 60);
    return `Aha moment at ${action} (${eventType}): ${(retentionImpact * 100).toFixed(1)}% retention impact, reached by ${usersReached} users in avg ${timeInMinutes.toFixed(1)} minutes`;
  }
}
