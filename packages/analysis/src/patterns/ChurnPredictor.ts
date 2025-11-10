/**
 * Churn prediction - identifies early warning signals for churn
 */

import { TelemetryEvent } from '@suts/telemetry';
import { ChurnDriver } from '../models';
import { AnalysisConfig } from '../models/config';

/**
 * Predicts churn drivers from telemetry events
 */
export class ChurnPredictor {
  constructor(private readonly config: AnalysisConfig) {}

  /**
   * Predicts churn drivers from events
   * @param events - Telemetry events to analyze
   * @returns Array of detected churn drivers
   */
  predict(events: TelemetryEvent[]): ChurnDriver[] {
    if (events.length === 0) {
      return [];
    }

    // Identify churned users (users who stopped activity)
    const churnedUsers = this.identifyChurnedUsers(events);

    if (churnedUsers.size === 0) {
      return [];
    }

    // Identify patterns before churn
    const churnPatterns = this.identifyChurnPatterns(events, churnedUsers);

    return churnPatterns.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Identifies churned users
   */
  private identifyChurnedUsers(events: TelemetryEvent[]): Set<string> {
    const churned = new Set<string>();

    // Group events by user
    const userEvents = new Map<string, TelemetryEvent[]>();
    for (const event of events) {
      const existing = userEvents.get(event.personaId);
      if (existing !== undefined) {
        existing.push(event);
      } else {
        userEvents.set(event.personaId, [event]);
      }
    }

    // Find users with uninstall or high frustration ending
    for (const [userId, userEventList] of userEvents) {
      userEventList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const lastEvent = userEventList[userEventList.length - 1];

      if (lastEvent !== undefined) {
        // Churned if last action was uninstall or ended with high frustration
        if (
          lastEvent.action === 'uninstall' ||
          (lastEvent.emotionalState["frustration"] ?? 0) > 0.8
        ) {
          churned.add(userId);
        }
      }
    }

    return churned;
  }

  /**
   * Identifies patterns leading to churn
   */
  private identifyChurnPatterns(
    events: TelemetryEvent[],
    churnedUsers: Set<string>
  ): ChurnDriver[] {
    // Group events by action sequence patterns
    const patternMap = new Map<string, {
      events: TelemetryEvent[];
      churnedCount: number;
      totalCount: number;
    }>();

    // Analyze patterns for churned users
    for (const userId of churnedUsers) {
      const userEvents = events
        .filter((e) => e.personaId === userId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Look at last N events before churn
      const preChurnEvents = userEvents.slice(-5);

      for (let i = 0; i < preChurnEvents.length; i++) {
        const event = preChurnEvents[i];
        if (event !== undefined) {
          const key = `${event.action}::${event.eventType}`;

          const existing = patternMap.get(key);
          if (existing !== undefined) {
            existing.events.push(event);
            existing.churnedCount++;
            existing.totalCount++;
          } else {
            patternMap.set(key, {
              events: [event],
              churnedCount: 1,
              totalCount: 1,
            });
          }
        }
      }
    }

    // Also count non-churned users
    const nonChurnedUsers = new Set(
      events.map((e) => e.personaId).filter((id) => !churnedUsers.has(id))
    );

    for (const userId of nonChurnedUsers) {
      const userEvents = events
        .filter((e) => e.personaId === userId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      for (const event of userEvents) {
        const key = `${event.action}::${event.eventType}`;

        const existing = patternMap.get(key);
        if (existing !== undefined) {
          existing.totalCount++;
        }
      }
    }

    // Generate churn drivers
    const churnDrivers: ChurnDriver[] = [];

    for (const [key, pattern] of patternMap) {
      const parts = key.split('::');
      const action = parts[0];
      const eventType = parts[1];

      if (action === undefined || eventType === undefined) {
        continue;
      }

      const churnProbability = pattern.churnedCount / pattern.totalCount;

      // Only include if significantly correlated with churn
      if (churnProbability > 0.3 && pattern.churnedCount >= 3) {
        const timeToChurn = this.calculateAverageTimeToChurn(pattern.events, events);
        const preventable = this.isPreventable(action, pattern.events);
        const confidence = this.calculateConfidence(pattern.churnedCount, pattern.totalCount);
        const priority = this.calculatePriority(churnProbability, pattern.churnedCount, preventable);

        churnDrivers.push({
          trigger: action,
          eventPattern: [eventType],
          churnProbability,
          timeToChurn,
          affectedUsers: pattern.churnedCount,
          preventable,
          priority,
          confidence,
          description: this.generateDescription(action, eventType, churnProbability, timeToChurn),
          interventions: this.generateInterventions(action, preventable, pattern.events),
        });
      }
    }

    return churnDrivers;
  }

  /**
   * Calculates average time to churn
   */
  private calculateAverageTimeToChurn(
    patternEvents: TelemetryEvent[],
    allEvents: TelemetryEvent[]
  ): number {
    const times: number[] = [];

    for (const event of patternEvents) {
      const userEvents = allEvents
        .filter((e) => e.personaId === event.personaId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const eventIndex = userEvents.findIndex(
        (e) => e.timestamp.getTime() === event.timestamp.getTime()
      );

      if (eventIndex !== -1 && eventIndex < userEvents.length - 1) {
        const lastEvent = userEvents[userEvents.length - 1];
        if (lastEvent !== undefined) {
          const timeToChurn = lastEvent.timestamp.getTime() - event.timestamp.getTime();
          times.push(timeToChurn);
        }
      }
    }

    if (times.length === 0) {
      return 0;
    }

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  /**
   * Determines if churn is preventable
   */
  private isPreventable(action: string, events: TelemetryEvent[]): boolean {
    // Churn from bugs, confusion, or frustration is preventable
    const avgFrustration = events.reduce((sum, e) => {
      return sum + (e.emotionalState["frustration"] ?? 0);
    }, 0) / events.length;

    const avgConfusion = events.reduce((sum, e) => {
      return sum + (e.emotionalState["confusion"] ?? 0);
    }, 0) / events.length;

    return (
      avgFrustration > 0.6 ||
      avgConfusion > 0.6 ||
      action.includes('error') ||
      action.includes('fail')
    );
  }

  /**
   * Calculates confidence score
   */
  private calculateConfidence(churnedCount: number, totalCount: number): number {
    const sampleScore = Math.min(totalCount / this.config.minSampleSize, 1);
    const ratioScore = Math.min(churnedCount / 10, 1);
    return (sampleScore * 0.6 + ratioScore * 0.4);
  }

  /**
   * Calculates priority score
   */
  private calculatePriority(
    churnProbability: number,
    affectedUsers: number,
    preventable: boolean
  ): number {
    const normalizedUsers = Math.min(affectedUsers / 50, 1);
    const preventabilityBonus = preventable ? 0.2 : 0;
    return (churnProbability * 0.5 + normalizedUsers * 0.3 + preventabilityBonus);
  }

  /**
   * Generates description
   */
  private generateDescription(
    action: string,
    eventType: string,
    churnProbability: number,
    timeToChurn: number
  ): string {
    const timeInHours = timeToChurn / (1000 * 60 * 60);
    return `Churn risk in ${action} (${eventType}): ${(churnProbability * 100).toFixed(1)}% churn probability, avg ${timeInHours.toFixed(1)}h to churn`;
  }

  /**
   * Generates intervention suggestions
   */
  private generateInterventions(
    action: string,
    preventable: boolean,
    events: TelemetryEvent[]
  ): string[] {
    const interventions: string[] = [];

    if (preventable) {
      const avgFrustration = events.reduce((sum, e) => {
        return sum + (e.emotionalState["frustration"] ?? 0);
      }, 0) / events.length;

      if (avgFrustration > 0.7) {
        interventions.push('Show in-app help or tutorial when frustration detected');
        interventions.push('Offer live support or chat assistance');
      }

      interventions.push(`Improve ${action} to reduce friction`);
      interventions.push('Send re-engagement email with tips');
    }

    interventions.push('Monitor for this pattern and trigger proactive outreach');

    return interventions;
  }
}
