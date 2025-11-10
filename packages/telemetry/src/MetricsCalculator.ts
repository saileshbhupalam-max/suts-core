/**
 * Metrics calculator for telemetry analytics
 */

import type { TelemetryEvent } from './types';

/**
 * Metrics calculator for retention, frustration, delight, and viral metrics
 */
export class MetricsCalculator {
  /**
   * Calculate retention rate for a specific cohort
   * @param events - Array of telemetry events
   * @param cohort - Cohort identifier
   * @param days - Number of days for retention calculation (default: 7)
   * @returns Retention rate as a percentage (0-100)
   */
  calculateRetention(
    events: TelemetryEvent[],
    cohort: string,
    days: number = 7
  ): number {
    const cohortEvents = events.filter((e) => e.cohort === cohort);
    if (cohortEvents.length === 0) {
      return 0;
    }

    // Get unique personas in the cohort
    const personas = new Set(cohortEvents.map((e) => e.personaId));
    const totalUsers = personas.size;

    if (totalUsers === 0) {
      return 0;
    }

    // Find earliest timestamp for each persona
    const personaStartTimes = new Map<string, Date>();
    cohortEvents.forEach((event) => {
      const currentStart = personaStartTimes.get(event.personaId);
      if (!currentStart || event.timestamp < currentStart) {
        personaStartTimes.set(event.personaId, event.timestamp);
      }
    });

    // Count personas that have activity on or after the retention day
    let retainedUsers = 0;
    const daysInMs = days * 24 * 60 * 60 * 1000;

    personas.forEach((personaId) => {
      const startTime = personaStartTimes.get(personaId);
      if (!startTime) {
        return;
      }

      const retentionThreshold = new Date(startTime.getTime() + daysInMs);
      const hasActivityAfterThreshold = cohortEvents.some(
        (e) => e.personaId === personaId && e.timestamp >= retentionThreshold
      );

      if (hasActivityAfterThreshold) {
        retainedUsers++;
      }
    });

    return (retainedUsers / totalUsers) * 100;
  }

  /**
   * Calculate Day-7 retention
   * @param events - Array of telemetry events
   * @param cohort - Cohort identifier
   * @returns Day-7 retention rate
   */
  calculateDay7Retention(events: TelemetryEvent[], cohort: string): number {
    return this.calculateRetention(events, cohort, 7);
  }

  /**
   * Calculate Day-14 retention
   * @param events - Array of telemetry events
   * @param cohort - Cohort identifier
   * @returns Day-14 retention rate
   */
  calculateDay14Retention(events: TelemetryEvent[], cohort: string): number {
    return this.calculateRetention(events, cohort, 14);
  }

  /**
   * Calculate Day-30 retention
   * @param events - Array of telemetry events
   * @param cohort - Cohort identifier
   * @returns Day-30 retention rate
   */
  calculateDay30Retention(events: TelemetryEvent[], cohort: string): number {
    return this.calculateRetention(events, cohort, 30);
  }

  /**
   * Calculate average frustration level for a persona
   * @param events - Array of telemetry events
   * @param personaId - Persona identifier
   * @returns Average frustration level (0-1)
   */
  calculateFrustration(events: TelemetryEvent[], personaId: string): number {
    const personaEvents = events.filter((e) => e.personaId === personaId);
    if (personaEvents.length === 0) {
      return 0;
    }

    const totalFrustration = personaEvents.reduce(
      (sum, event) => sum + (event.emotionalState['frustration'] ?? 0),
      0
    );

    return totalFrustration / personaEvents.length;
  }

  /**
   * Calculate average delight level for a persona
   * @param events - Array of telemetry events
   * @param personaId - Persona identifier
   * @returns Average delight level (0-1)
   */
  calculateDelight(events: TelemetryEvent[], personaId: string): number {
    const personaEvents = events.filter((e) => e.personaId === personaId);
    if (personaEvents.length === 0) {
      return 0;
    }

    const totalDelight = personaEvents.reduce(
      (sum, event) => sum + (event.emotionalState['delight'] ?? 0),
      0
    );

    return totalDelight / personaEvents.length;
  }

  /**
   * Calculate viral coefficient (k-factor)
   * Viral coefficient = (Number of invitations sent per user) x (Conversion rate of invitations)
   * Simplified: count share events and successful install events
   * @param events - Array of telemetry events
   * @returns Viral coefficient
   */
  calculateViralCoefficient(events: TelemetryEvent[]): number {
    // Count share events (users sharing the product)
    const shareEvents = events.filter((e) => e.action === 'share');
    const sharingUsers = new Set(shareEvents.map((e) => e.personaId));

    // Count install events (new users installing)
    const installEvents = events.filter((e) => e.action === 'install');
    const installingUsers = new Set(installEvents.map((e) => e.personaId));

    const totalUsers = new Set(events.map((e) => e.personaId)).size;

    if (totalUsers === 0 || sharingUsers.size === 0) {
      return 0;
    }

    // Average invitations per user
    const invitationsPerUser = shareEvents.length / totalUsers;

    // Conversion rate (new users / shares)
    const conversionRate =
      shareEvents.length > 0 ? installingUsers.size / shareEvents.length : 0;

    return invitationsPerUser * conversionRate;
  }

  /**
   * Detect friction points based on high frustration patterns
   * @param events - Array of telemetry events
   * @param threshold - Frustration threshold (default: 0.7)
   * @returns Array of actions with high frustration
   */
  detectFrictionPoints(
    events: TelemetryEvent[],
    threshold: number = 0.7
  ): Array<{ action: string; avgFrustration: number; count: number }> {
    const actionStats = new Map<
      string,
      { totalFrustration: number; count: number }
    >();

    events.forEach((event) => {
      const frustration = event.emotionalState['frustration'] ?? 0;
      const stats = actionStats.get(event.action) ?? {
        totalFrustration: 0,
        count: 0,
      };
      stats.totalFrustration += frustration;
      stats.count++;
      actionStats.set(event.action, stats);
    });

    const frictionPoints: Array<{
      action: string;
      avgFrustration: number;
      count: number;
    }> = [];

    actionStats.forEach((stats, action) => {
      const avgFrustration = stats.totalFrustration / stats.count;
      if (avgFrustration >= threshold) {
        frictionPoints.push({
          action,
          avgFrustration,
          count: stats.count,
        });
      }
    });

    return frictionPoints.sort((a, b) => b.avgFrustration - a.avgFrustration);
  }

  /**
   * Detect value moments based on high delight patterns
   * @param events - Array of telemetry events
   * @param threshold - Delight threshold (default: 0.7)
   * @returns Array of actions with high delight
   */
  detectValueMoments(
    events: TelemetryEvent[],
    threshold: number = 0.7
  ): Array<{ action: string; avgDelight: number; count: number }> {
    const actionStats = new Map<
      string,
      { totalDelight: number; count: number }
    >();

    events.forEach((event) => {
      const delight = event.emotionalState['delight'] ?? 0;
      const stats = actionStats.get(event.action) ?? {
        totalDelight: 0,
        count: 0,
      };
      stats.totalDelight += delight;
      stats.count++;
      actionStats.set(event.action, stats);
    });

    const valueMoments: Array<{
      action: string;
      avgDelight: number;
      count: number;
    }> = [];

    actionStats.forEach((stats, action) => {
      const avgDelight = stats.totalDelight / stats.count;
      if (avgDelight >= threshold) {
        valueMoments.push({
          action,
          avgDelight,
          count: stats.count,
        });
      }
    });

    return valueMoments.sort((a, b) => b.avgDelight - a.avgDelight);
  }

  /**
   * Calculate average emotional state metrics
   * @param events - Array of telemetry events
   * @returns Object with average emotional state values
   */
  calculateAverageEmotionalState(events: TelemetryEvent[]): {
    frustration: number;
    confidence: number;
    delight: number;
    confusion: number;
  } {
    if (events.length === 0) {
      return { frustration: 0, confidence: 0, delight: 0, confusion: 0 };
    }

    const totals = events.reduce(
      (acc, event) => ({
        frustration: acc.frustration + (event.emotionalState['frustration'] ?? 0),
        confidence: acc.confidence + (event.emotionalState['confidence'] ?? 0),
        delight: acc.delight + (event.emotionalState['delight'] ?? 0),
        confusion: acc.confusion + (event.emotionalState['confusion'] ?? 0),
      }),
      { frustration: 0, confidence: 0, delight: 0, confusion: 0 }
    );

    return {
      frustration: totals.frustration / events.length,
      confidence: totals.confidence / events.length,
      delight: totals.delight / events.length,
      confusion: totals.confusion / events.length,
    };
  }
}
