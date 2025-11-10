/**
 * Scores the potential impact of insights
 */

import { AnalysisResult } from '../models';

/**
 * Calculates impact score for an analysis result
 * Considers severity, affected users, and potential impact
 * @param insight - Analysis result to score
 * @returns Impact score between 0 and 1
 */
export class ImpactScorer {
  /**
   * Calculate impact score
   * @param insight - The insight to score
   * @returns Normalized impact score (0-1)
   */
  public score(insight: AnalysisResult): number {
    const severityWeight = this.getSeverityWeight(insight.severity);
    const userImpact = this.normalizeUserImpact(insight.affectedUsers);
    const potentialImpact = insight.potentialImpact;

    // Weighted average: severity 40%, user impact 30%, potential impact 30%
    const score = severityWeight * 0.4 + userImpact * 0.3 + potentialImpact * 0.3;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Get weight for severity level
   * @param severity - Severity level
   * @returns Weight between 0 and 1
   */
  private getSeverityWeight(
    severity: 'critical' | 'high' | 'medium' | 'low'
  ): number {
    const weights: Record<string, number> = {
      critical: 1.0,
      high: 0.75,
      medium: 0.5,
      low: 0.25,
    };
    return weights[severity] ?? 0.5;
  }

  /**
   * Normalize user impact to 0-1 scale
   * Uses logarithmic scale for large numbers
   * @param affectedUsers - Number of affected users
   * @returns Normalized score (0-1)
   */
  private normalizeUserImpact(affectedUsers: number): number {
    if (affectedUsers <= 0) {
      return 0;
    }

    // Use logarithmic scale: log10(users + 1) / log10(1000001)
    // This maps 0 -> 0, 10 -> ~0.17, 100 -> ~0.33, 1000 -> ~0.5, 10000 -> ~0.67, 100000 -> ~0.83, 1000000 -> 1
    const maxUsers = 1000000;
    const normalized = Math.log10(affectedUsers + 1) / Math.log10(maxUsers + 1);
    return Math.min(1, normalized);
  }
}
