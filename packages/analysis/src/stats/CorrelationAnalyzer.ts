/**
 * Correlation analysis - identifies which actions correlate with retention/churn
 */

import { TelemetryEvent } from '@suts/telemetry';
import { CorrelationResult } from '../models';
import { AnalysisConfig } from '../models/config';

/**
 * Analyzes correlations between actions and metrics
 */
export class CorrelationAnalyzer {
  constructor(private readonly config: AnalysisConfig) {}

  /**
   * Analyzes correlations for retention
   * @param events - Telemetry events to analyze
   * @returns Array of correlation results
   */
  analyzeRetentionCorrelations(events: TelemetryEvent[]): CorrelationResult[] {
    if (events.length < this.config.minSampleSize) {
      return [];
    }

    // Group events by action
    const actionGroups = this.groupEventsByAction(events);

    const results: CorrelationResult[] = [];

    for (const [action, actionEvents] of actionGroups) {
      const userIds = new Set(actionEvents.map((e) => e.personaId));
      const allUserIds = new Set(events.map((e) => e.personaId));

      // Calculate retention for users who performed this action
      const retentionWithAction = this.calculateRetentionRate(
        Array.from(userIds),
        events
      );

      // Calculate retention for users who did not perform this action
      const usersWithoutAction = Array.from(allUserIds).filter(
        (id) => !userIds.has(id)
      );
      const retentionWithoutAction = this.calculateRetentionRate(
        usersWithoutAction,
        events
      );

      // Calculate correlation
      const correlation = retentionWithAction - retentionWithoutAction;

      // Perform statistical significance test
      const pValue = this.calculatePValue(
        retentionWithAction,
        retentionWithoutAction,
        userIds.size,
        usersWithoutAction.length
      );

      results.push({
        action,
        metric: 'retention',
        correlation,
        pValue,
        sampleSize: actionEvents.length,
        significant: pValue < this.config.significanceThreshold,
      });
    }

    // Sort by absolute correlation descending
    return results.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  /**
   * Analyzes correlations for churn
   * @param events - Telemetry events to analyze
   * @returns Array of correlation results
   */
  analyzeChurnCorrelations(events: TelemetryEvent[]): CorrelationResult[] {
    if (events.length < this.config.minSampleSize) {
      return [];
    }

    // Group events by action
    const actionGroups = this.groupEventsByAction(events);

    const results: CorrelationResult[] = [];

    for (const [action, actionEvents] of actionGroups) {
      const userIds = new Set(actionEvents.map((e) => e.personaId));
      const allUserIds = new Set(events.map((e) => e.personaId));

      // Calculate churn for users who performed this action
      const churnWithAction = this.calculateChurnRate(Array.from(userIds), events);

      // Calculate churn for users who did not perform this action
      const usersWithoutAction = Array.from(allUserIds).filter(
        (id) => !userIds.has(id)
      );
      const churnWithoutAction = this.calculateChurnRate(usersWithoutAction, events);

      // Calculate correlation
      const correlation = churnWithAction - churnWithoutAction;

      // Perform statistical significance test
      const pValue = this.calculatePValue(
        churnWithAction,
        churnWithoutAction,
        userIds.size,
        usersWithoutAction.length
      );

      results.push({
        action,
        metric: 'churn',
        correlation,
        pValue,
        sampleSize: actionEvents.length,
        significant: pValue < this.config.significanceThreshold,
      });
    }

    // Sort by absolute correlation descending
    return results.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  /**
   * Groups events by action
   */
  private groupEventsByAction(events: TelemetryEvent[]): Map<string, TelemetryEvent[]> {
    const grouped = new Map<string, TelemetryEvent[]>();

    for (const event of events) {
      const existing = grouped.get(event.action);
      if (existing !== undefined) {
        existing.push(event);
      } else {
        grouped.set(event.action, [event]);
      }
    }

    return grouped;
  }

  /**
   * Calculates retention rate for a set of users
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
   * Calculates churn rate for a set of users
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
   * Calculates p-value for statistical significance
   * Uses a simplified two-proportion z-test
   */
  private calculatePValue(
    proportion1: number,
    proportion2: number,
    n1: number,
    n2: number
  ): number {
    if (n1 === 0 || n2 === 0) {
      return 1;
    }

    // Pooled proportion
    const pooledProportion = (proportion1 * n1 + proportion2 * n2) / (n1 + n2);

    // Standard error
    const standardError = Math.sqrt(
      pooledProportion * (1 - pooledProportion) * (1 / n1 + 1 / n2)
    );

    if (standardError === 0) {
      return 1;
    }

    // Z-score
    const z = Math.abs(proportion1 - proportion2) / standardError;

    // Approximate p-value from z-score (two-tailed test)
    // Using a simplified approximation
    const pValue = 2 * (1 - this.normalCDF(z));

    return Math.min(Math.max(pValue, 0), 1);
  }

  /**
   * Cumulative distribution function for standard normal distribution
   * Using an approximation
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const p =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x > 0 ? 1 - p : p;
  }
}
