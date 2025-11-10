/**
 * Value detection - identifies high delight and retention patterns
 */

import { TelemetryEvent } from '@suts/telemetry';
import { ValueMoment } from '../models';
import { AnalysisConfig } from '../models/config';

/**
 * Detects value moments from telemetry events
 */
export class ValueDetector {
  constructor(private readonly config: AnalysisConfig) {}

  /**
   * Detects value moments from events
   * @param events - Telemetry events to analyze
   * @returns Array of detected value moments
   */
  detect(events: TelemetryEvent[]): ValueMoment[] {
    if (events.length === 0) {
      return [];
    }

    // Group events by action and event type
    const groupedEvents = this.groupEvents(events);

    const valueMoments: ValueMoment[] = [];

    for (const [key, eventGroup] of groupedEvents.entries()) {
      const parts = key.split('::');
      const action = parts[0];
      const eventType = parts[1];

      if (action === undefined || eventType === undefined) {
        continue;
      }

      // Calculate metrics
      const delightScore = this.calculateDelightScore(eventGroup);
      const frequency = eventGroup.length;
      const affectedUsers = this.countUniqueUsers(eventGroup);
      const retentionCorrelation = this.calculateRetentionCorrelation(eventGroup, events);
      const avgEngagementTime = this.calculateAverageEngagementTime(eventGroup);

      // Check if this qualifies as a value moment
      if (delightScore >= this.config.minDelightLevel) {
        const confidence = this.calculateConfidence(frequency, affectedUsers);
        const priority = this.calculatePriority(delightScore, retentionCorrelation, affectedUsers);

        valueMoments.push({
          action,
          eventType,
          delightScore,
          frequency,
          affectedUsers,
          retentionCorrelation,
          avgEngagementTime,
          priority,
          confidence,
          description: this.generateDescription(action, eventType, delightScore, retentionCorrelation),
          amplificationSuggestions: this.generateAmplificationSuggestions(action, delightScore),
        });
      }
    }

    // Sort by priority descending
    return valueMoments.sort((a, b) => b.priority - a.priority);
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
   * Calculates delight score combining delight and confidence
   */
  private calculateDelightScore(events: TelemetryEvent[]): number {
    if (events.length === 0) {
      return 0;
    }

    const totalDelight = events.reduce((sum, event) => {
      return sum + (event.emotionalState["delight"] ?? 0);
    }, 0);

    const avgDelight = totalDelight / events.length;

    // Factor in confidence (low confusion = higher value)
    const avgConfusion = events.reduce((sum, event) => {
      return sum + (event.emotionalState["confusion"] ?? 0);
    }, 0) / events.length;

    return avgDelight * (1 - avgConfusion * 0.3);
  }

  /**
   * Counts unique users
   */
  private countUniqueUsers(events: TelemetryEvent[]): number {
    return new Set(events.map((e) => e.personaId)).size;
  }

  /**
   * Calculates retention correlation
   */
  private calculateRetentionCorrelation(events: TelemetryEvent[], allEvents: TelemetryEvent[]): number {
    if (events.length === 0) {
      return 0;
    }

    const userIds = new Set(events.map((e) => e.personaId));
    let retainedUsers = 0;

    for (const userId of userIds) {
      const userEvents = allEvents
        .filter((e) => e.personaId === userId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (userEvents.length > 0) {
        const firstValueEvent = events.find((e) => e.personaId === userId);
        if (firstValueEvent !== undefined) {
          // Check if user had events after this value moment
          const eventsAfter = userEvents.filter(
            (e) => e.timestamp.getTime() > firstValueEvent.timestamp.getTime()
          );
          if (eventsAfter.length > 0) {
            retainedUsers++;
          }
        }
      }
    }

    return retainedUsers / userIds.size;
  }

  /**
   * Calculates average engagement time
   */
  private calculateAverageEngagementTime(events: TelemetryEvent[]): number {
    if (events.length === 0) {
      return 0;
    }

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
   * Calculates confidence score
   */
  private calculateConfidence(frequency: number, affectedUsers: number): number {
    const frequencyScore = Math.min(frequency / 100, 1);
    const userScore = Math.min(affectedUsers / 50, 1);
    return (frequencyScore * 0.5 + userScore * 0.5);
  }

  /**
   * Calculates priority score
   */
  private calculatePriority(
    delightScore: number,
    retentionCorrelation: number,
    affectedUsers: number
  ): number {
    const normalizedUsers = Math.min(affectedUsers / 50, 1);
    return (delightScore * 0.4 + retentionCorrelation * 0.4 + normalizedUsers * 0.2);
  }

  /**
   * Generates description
   */
  private generateDescription(
    action: string,
    eventType: string,
    delightScore: number,
    retentionCorrelation: number
  ): string {
    return `Value moment in ${action} (${eventType}): ${(delightScore * 100).toFixed(1)}% delight score, ${(retentionCorrelation * 100).toFixed(1)}% retention correlation`;
  }

  /**
   * Generates amplification suggestions
   */
  private generateAmplificationSuggestions(action: string, delightScore: number): string[] {
    const suggestions: string[] = [];

    if (delightScore > 0.8) {
      suggestions.push(`Make ${action} more discoverable to new users`);
      suggestions.push('Add onboarding flows that guide users to this feature');
      suggestions.push('Highlight this feature in marketing materials');
    }

    suggestions.push(`Analyze why users love ${action} and apply learnings elsewhere`);
    suggestions.push('Create tutorials or demos showcasing this feature');

    return suggestions;
  }
}
