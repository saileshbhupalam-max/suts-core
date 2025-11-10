/**
 * Cohort analysis - compares different user groups
 */

import { TelemetryEvent } from '@suts/telemetry';
import { Cohort, CohortComparison } from '../models';
import { AnalysisConfig } from '../models/config';

/**
 * Analyzes and compares cohorts
 */
export class CohortAnalyzer {
  constructor(private readonly config: AnalysisConfig) {}

  /**
   * Creates cohorts based on criteria
   * @param events - Telemetry events to analyze
   * @param criteria - Cohort criteria
   * @returns Array of cohorts
   */
  createCohorts(
    events: TelemetryEvent[],
    criteria: Record<string, (event: TelemetryEvent) => boolean>
  ): Cohort[] {
    const cohorts: Cohort[] = [];

    for (const [name, criteriaFn] of Object.entries(criteria)) {
      const matchingEvents = events.filter(criteriaFn);
      const userIds = Array.from(new Set(matchingEvents.map((e) => e.personaId)));

      const metrics = this.calculateCohortMetrics(userIds, events);

      cohorts.push({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        userIds,
        criteria: { name },
        metrics,
      });
    }

    return cohorts;
  }

  /**
   * Compares two cohorts
   * @param cohortA - First cohort
   * @param cohortB - Second cohort
   * @param events - All telemetry events
   * @returns Cohort comparison
   */
  compareCohorts(
    cohortA: Cohort,
    cohortB: Cohort,
    _events: TelemetryEvent[]
  ): CohortComparison {
    const metricDifferences: Record<string, {
      cohortAValue: number;
      cohortBValue: number;
      difference: number;
      percentChange: number;
      significant: boolean;
    }> = {};

    // Compare all metrics
    const allMetricKeys = new Set([
      ...Object.keys(cohortA.metrics),
      ...Object.keys(cohortB.metrics),
    ]);

    for (const metricKey of allMetricKeys) {
      const cohortAValue = cohortA.metrics[metricKey] ?? 0;
      const cohortBValue = cohortB.metrics[metricKey] ?? 0;

      const difference = cohortAValue - cohortBValue;
      const percentChange =
        cohortBValue !== 0 ? (difference / cohortBValue) * 100 : 0;

      // Test for statistical significance
      const significant = this.isSignificantDifference(
        cohortAValue,
        cohortBValue,
        cohortA.userIds.length,
        cohortB.userIds.length
      );

      metricDifferences[metricKey] = {
        cohortAValue,
        cohortBValue,
        difference,
        percentChange,
        significant,
      };
    }

    return {
      cohortA,
      cohortB,
      metricDifferences,
    };
  }

  /**
   * Calculates metrics for a cohort
   */
  private calculateCohortMetrics(
    userIds: string[],
    events: TelemetryEvent[]
  ): Record<string, number> {
    if (userIds.length === 0) {
      return {};
    }

    const cohortEvents = events.filter((e) => userIds.includes(e.personaId));

    return {
      totalEvents: cohortEvents.length,
      avgEventsPerUser: cohortEvents.length / userIds.length,
      avgFrustration: this.calculateAverageMetric(cohortEvents, 'frustration'),
      avgDelight: this.calculateAverageMetric(cohortEvents, 'delight'),
      avgConfidence: this.calculateAverageMetric(cohortEvents, 'confidence'),
      avgConfusion: this.calculateAverageMetric(cohortEvents, 'confusion'),
      retentionRate: this.calculateRetentionRate(userIds, events),
      churnRate: this.calculateChurnRate(userIds, events),
      engagementScore: this.calculateEngagementScore(userIds, events),
    };
  }

  /**
   * Calculates average of an emotional state metric
   */
  private calculateAverageMetric(
    events: TelemetryEvent[],
    metric: 'frustration' | 'delight' | 'confidence' | 'confusion'
  ): number {
    if (events.length === 0) {
      return 0;
    }

    const total = events.reduce((sum, event) => {
      return sum + (event.emotionalState[metric] ?? 0);
    }, 0);

    return total / events.length;
  }

  /**
   * Calculates retention rate
   */
  private calculateRetentionRate(userIds: string[], events: TelemetryEvent[]): number {
    if (userIds.length === 0) {
      return 0;
    }

    let retainedCount = 0;

    for (const userId of userIds) {
      const userEvents = events
        .filter((e) => e.personaId === userId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Consider retained if user has events spanning more than 1 day
      if (userEvents.length > 1) {
        const firstEvent = userEvents[0];
        const lastEvent = userEvents[userEvents.length - 1];

        if (firstEvent !== undefined && lastEvent !== undefined) {
          const timeDiff = lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
          const oneDayInMs = 24 * 60 * 60 * 1000;

          if (timeDiff > oneDayInMs) {
            retainedCount++;
          }
        }
      }
    }

    return retainedCount / userIds.length;
  }

  /**
   * Calculates churn rate
   */
  private calculateChurnRate(userIds: string[], events: TelemetryEvent[]): number {
    if (userIds.length === 0) {
      return 0;
    }

    let churnedCount = 0;

    for (const userId of userIds) {
      const userEvents = events
        .filter((e) => e.personaId === userId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (userEvents.length > 0) {
        const lastEvent = userEvents[userEvents.length - 1];

        if (lastEvent !== undefined) {
          // Churned if last action was uninstall or ended with high frustration
          if (
            lastEvent.action === 'uninstall' ||
            (lastEvent.emotionalState["frustration"] ?? 0) > 0.8
          ) {
            churnedCount++;
          }
        }
      }
    }

    return churnedCount / userIds.length;
  }

  /**
   * Calculates engagement score
   */
  private calculateEngagementScore(userIds: string[], events: TelemetryEvent[]): number {
    if (userIds.length === 0) {
      return 0;
    }

    let totalScore = 0;

    for (const userId of userIds) {
      const userEvents = events.filter((e) => e.personaId === userId);

      // Engagement = number of events * average delight
      const avgDelight = this.calculateAverageMetric(userEvents, 'delight');
      const score = userEvents.length * avgDelight;

      totalScore += score;
    }

    return totalScore / userIds.length;
  }

  /**
   * Tests if difference is statistically significant
   */
  private isSignificantDifference(
    valueA: number,
    valueB: number,
    nA: number,
    nB: number
  ): boolean {
    if (nA < this.config.minSampleSize || nB < this.config.minSampleSize) {
      return false;
    }

    // Simplified t-test approximation
    const pooledStdDev = Math.sqrt((valueA * (1 - valueA)) / nA + (valueB * (1 - valueB)) / nB);

    if (pooledStdDev === 0) {
      return false;
    }

    const tStat = Math.abs(valueA - valueB) / pooledStdDev;

    // Rough threshold for significance (approximately 95% confidence)
    return tStat > 1.96;
  }
}
