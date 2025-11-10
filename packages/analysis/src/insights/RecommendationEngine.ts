/**
 * Recommendation engine - suggests fixes for friction points
 */

import { FrictionPoint, ValueMoment, ChurnDriver } from '../models';

/**
 * Generates recommendations for improving product
 */
export class RecommendationEngine {
  constructor() {} // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
   * Generates recommendations from friction points
   * @param frictionPoints - Detected friction points
   * @returns Recommendations for addressing friction
   */
  recommendForFriction(frictionPoints: FrictionPoint[]): string[] {
    const recommendations: string[] = [];

    for (const friction of frictionPoints) {
      // Generate specific recommendations based on friction characteristics
      if (friction.severity > 0.8) {
        recommendations.push(
          `CRITICAL: ${friction.location.action} has severe friction (${(friction.severity * 100).toFixed(0)}%). Immediate investigation required.`
        );
      }

      if (friction.abandonmentRate > 0.5) {
        recommendations.push(
          `High abandonment in ${friction.location.action}: Add save/resume functionality or break into smaller steps.`
        );
      }

      if (friction.avgFrustration > 0.7) {
        recommendations.push(
          `Users highly frustrated with ${friction.location.action}: Consider simplifying workflow, adding help content, or improving error messages.`
        );
      }

      // Include suggested fixes from friction detection
      if (friction.suggestedFixes !== undefined && friction.suggestedFixes.length > 0) {
        recommendations.push(...friction.suggestedFixes);
      }
    }

    return this.deduplicateRecommendations(recommendations);
  }

  /**
   * Generates recommendations from value moments
   * @param valueMoments - Detected value moments
   * @returns Recommendations for amplifying value
   */
  recommendForValue(valueMoments: ValueMoment[]): string[] {
    const recommendations: string[] = [];

    for (const value of valueMoments) {
      if (value.delightScore > 0.8) {
        recommendations.push(
          `Users love ${value.action}! Make it more prominent in onboarding and marketing.`
        );
      }

      if (value.retentionCorrelation > 0.7) {
        recommendations.push(
          `${value.action} strongly correlates with retention. Guide new users to this feature early.`
        );
      }

      // Include amplification suggestions
      if (value.amplificationSuggestions !== undefined && value.amplificationSuggestions.length > 0) {
        recommendations.push(...value.amplificationSuggestions);
      }
    }

    return this.deduplicateRecommendations(recommendations);
  }

  /**
   * Generates recommendations from churn drivers
   * @param churnDrivers - Detected churn drivers
   * @returns Recommendations for preventing churn
   */
  recommendForChurn(churnDrivers: ChurnDriver[]): string[] {
    const recommendations: string[] = [];

    for (const churn of churnDrivers) {
      if (churn.churnProbability > 0.7) {
        recommendations.push(
          `URGENT: ${churn.trigger} has ${(churn.churnProbability * 100).toFixed(0)}% churn probability. Implement intervention immediately.`
        );
      }

      if (churn.preventable) {
        recommendations.push(
          `Churn from ${churn.trigger} is preventable. Set up automated alerts and proactive outreach.`
        );
      }

      if (churn.timeToChurn < 86400000) {
        // Less than 1 day
        recommendations.push(
          `Users churn quickly after ${churn.trigger} (< 1 day). Implement real-time intervention.`
        );
      }

      // Include intervention suggestions
      if (churn.interventions !== undefined && churn.interventions.length > 0) {
        recommendations.push(...churn.interventions);
      }
    }

    return this.deduplicateRecommendations(recommendations);
  }

  /**
   * Generates cross-cutting recommendations
   * @param frictionPoints - Friction points
   * @param valueMoments - Value moments
   * @param churnDrivers - Churn drivers
   * @returns Cross-cutting recommendations
   */
  generateCrossCuttingRecommendations(
    frictionPoints: FrictionPoint[],
    valueMoments: ValueMoment[],
    churnDrivers: ChurnDriver[]
  ): string[] {
    const recommendations: string[] = [];

    // Identify patterns across insights
    if (frictionPoints.length > 5) {
      recommendations.push(
        'Multiple friction points detected. Consider comprehensive UX audit.'
      );
    }

    if (valueMoments.length < 2 && frictionPoints.length > 3) {
      recommendations.push(
        'Low value moments compared to friction. Focus on building delightful experiences.'
      );
    }

    if (churnDrivers.filter((c) => c.preventable).length > 3) {
      recommendations.push(
        'Many preventable churn drivers. Implement proactive user health monitoring.'
      );
    }

    // Identify actions appearing in multiple categories
    const frictionActions = new Set(frictionPoints.map((f) => f.location.action));
    const churnActions = new Set(churnDrivers.map((c) => c.trigger));

    // Actions that are both friction and churn drivers
    for (const action of frictionActions) {
      if (churnActions.has(action)) {
        recommendations.push(
          `${action} is both a friction point and churn driver. High priority for improvement.`
        );
      }
    }

    // Value moments that are rare
    for (const value of valueMoments) {
      if (value.affectedUsers < 10) {
        recommendations.push(
          `Only ${value.affectedUsers} users experienced ${value.action}. Increase discoverability.`
        );
      }
    }

    return this.deduplicateRecommendations(recommendations);
  }

  /**
   * Deduplicates recommendations
   */
  private deduplicateRecommendations(recommendations: string[]): string[] {
    return Array.from(new Set(recommendations));
  }

  /**
   * Prioritizes recommendations by impact
   * @param recommendations - Recommendations to prioritize
   * @param frictionPoints - Related friction points
   * @param valueMoments - Related value moments
   * @param churnDrivers - Related churn drivers
   * @returns Prioritized recommendations
   */
  prioritizeRecommendations(
    recommendations: string[],
    _frictionPoints: FrictionPoint[],
    _valueMoments: ValueMoment[],
    _churnDrivers: ChurnDriver[]
  ): Array<{ recommendation: string; priority: 'critical' | 'high' | 'medium' | 'low' }> {
    const prioritized: Array<{ recommendation: string; priority: 'critical' | 'high' | 'medium' | 'low' }> = [];

    for (const recommendation of recommendations) {
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';

      // Critical: Urgent keywords
      if (recommendation.includes('CRITICAL') || recommendation.includes('URGENT')) {
        priority = 'critical';
      } else if (
        // High: Churn or severe friction
        recommendation.includes('churn') ||
        recommendation.includes('abandonment') ||
        recommendation.includes('severe')
      ) {
        priority = 'high';
      } else if (
        // Low: Amplification of existing value
        recommendation.includes('love') ||
        recommendation.includes('discoverability')
      ) {
        priority = 'low';
      }

      prioritized.push({ recommendation, priority });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return prioritized.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }
}
