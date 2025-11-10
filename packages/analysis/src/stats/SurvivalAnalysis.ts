/**
 * Survival analysis - calculates time-to-churn curves
 */

import { TelemetryEvent } from '@suts/telemetry';
import { SurvivalAnalysis } from '../models';

/**
 * Performs survival analysis on user cohorts
 */
export class SurvivalAnalyzer {
  constructor() {} // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
   * Performs survival analysis
   * @param events - Telemetry events to analyze
   * @param timeIntervalMs - Time interval for survival calculation (default: 1 day)
   * @returns Survival analysis results
   */
  analyze(events: TelemetryEvent[], timeIntervalMs: number = 86400000): SurvivalAnalysis {
    if (events.length === 0) {
      return {
        timePoints: [],
        survivalRates: [],
        churnRate: 0,
      };
    }

    // Get all unique users
    const userIds = Array.from(new Set(events.map((e) => e.personaId)));

    // Calculate survival data for each user
    const userSurvivalData = this.calculateUserSurvivalData(userIds, events);

    // Determine time points
    const maxTime = Math.max(...userSurvivalData.map((d) => d.survivalTime));
    const timePoints: number[] = [];
    for (let t = 0; t <= maxTime; t += timeIntervalMs) {
      timePoints.push(t);
    }

    // Calculate survival rates at each time point
    const survivalRates: number[] = [];
    for (const time of timePoints) {
      const survived = userSurvivalData.filter((d) => d.survivalTime >= time).length;
      survivalRates.push(survived / userIds.length);
    }

    // Calculate median survival time
    const medianSurvivalTime = this.calculateMedianSurvivalTime(userSurvivalData);

    // Calculate overall churn rate
    const churnedUsers = userSurvivalData.filter((d) => d.churned).length;
    const churnRate = churnedUsers / userIds.length;

    // Calculate half-life (time when 50% of users remain)
    const halfLife = this.calculateHalfLife(timePoints, survivalRates);

    return {
      timePoints,
      survivalRates,
      medianSurvivalTime,
      churnRate,
      halfLife,
    };
  }

  /**
   * Calculates survival data for each user
   */
  private calculateUserSurvivalData(
    userIds: string[],
    events: TelemetryEvent[]
  ): Array<{ userId: string; survivalTime: number; churned: boolean }> {
    const survivalData: Array<{ userId: string; survivalTime: number; churned: boolean }> = [];

    for (const userId of userIds) {
      const userEvents = events
        .filter((e) => e.personaId === userId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (userEvents.length > 0) {
        const firstEvent = userEvents[0];
        const lastEvent = userEvents[userEvents.length - 1];

        if (firstEvent !== undefined && lastEvent !== undefined) {
          const survivalTime = lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();

          // Determine if user churned
          const churned =
            lastEvent.action === 'uninstall' ||
            (lastEvent.emotionalState["frustration"] ?? 0) > 0.8;

          survivalData.push({
            userId,
            survivalTime,
            churned,
          });
        }
      }
    }

    return survivalData;
  }

  /**
   * Calculates median survival time
   */
  private calculateMedianSurvivalTime(
    survivalData: Array<{ userId: string; survivalTime: number; churned: boolean }>
  ): number | undefined {
    if (survivalData.length === 0) {
      return undefined;
    }

    const sortedTimes = survivalData
      .map((d) => d.survivalTime)
      .sort((a, b) => a - b);

    const midIndex = Math.floor(sortedTimes.length / 2);

    if (sortedTimes.length % 2 === 0) {
      const mid1 = sortedTimes[midIndex - 1];
      const mid2 = sortedTimes[midIndex];
      return mid1 !== undefined && mid2 !== undefined ? (mid1 + mid2) / 2 : undefined;
    } else {
      return sortedTimes[midIndex];
    }
  }

  /**
   * Calculates half-life (time when 50% of users remain)
   */
  private calculateHalfLife(timePoints: number[], survivalRates: number[]): number | undefined {
    for (let i = 0; i < survivalRates.length; i++) {
      const rate = survivalRates[i];
      if (rate !== undefined && rate <= 0.5) {
        return timePoints[i];
      }
    }

    return undefined;
  }

  /**
   * Compares survival between two cohorts
   * @param eventsA - Events for cohort A
   * @param eventsB - Events for cohort B
   * @param timeIntervalMs - Time interval for survival calculation
   * @returns Comparison of survival analyses
   */
  compareCohorts(
    eventsA: TelemetryEvent[],
    eventsB: TelemetryEvent[],
    timeIntervalMs: number = 86400000
  ): {
    cohortA: SurvivalAnalysis;
    cohortB: SurvivalAnalysis;
    hazardRatio: number;
  } {
    const cohortA = this.analyze(eventsA, timeIntervalMs);
    const cohortB = this.analyze(eventsB, timeIntervalMs);

    // Calculate hazard ratio (simple approximation)
    const hazardRatio =
      cohortB.churnRate !== 0 ? cohortA.churnRate / cohortB.churnRate : 0;

    return {
      cohortA,
      cohortB,
      hazardRatio,
    };
  }
}
