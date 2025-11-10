/**
 * RICE scoring framework: Reach x Impact x Confidence / Effort
 */

import { AnalysisResult } from '../models';
import { ImpactScorer } from './ImpactScorer';
import { EffortEstimator } from './EffortEstimator';

/**
 * Implements RICE (Reach, Impact, Confidence, Effort) scoring
 * Score = (Reach * Impact * Confidence) / Effort
 */
export class RICEScorer {
  private readonly impactScorer: ImpactScorer;
  private readonly effortEstimator: EffortEstimator;

  /**
   * Create RICE scorer
   * @param impactScorer - Impact scorer instance
   * @param effortEstimator - Effort estimator instance
   */
  constructor(
    impactScorer: ImpactScorer = new ImpactScorer(),
    effortEstimator: EffortEstimator = new EffortEstimator()
  ) {
    this.impactScorer = impactScorer;
    this.effortEstimator = effortEstimator;
  }

  /**
   * Calculate RICE score
   * @param insight - The insight to score
   * @param reach - Number of users reached (defaults to affectedUsers)
   * @returns RICE score
   */
  public score(insight: AnalysisResult, reach?: number): number {
    const reachValue = reach ?? insight.affectedUsers;
    const impact = this.impactScorer.score(insight);
    const confidence = insight.confidence;
    const effort = this.effortEstimator.estimate(insight);

    // Avoid division by zero
    if (effort === 0) {
      return 0;
    }

    // RICE = (Reach * Impact * Confidence) / Effort
    const riceScore = (reachValue * impact * confidence) / effort;

    return Math.max(0, riceScore);
  }

  /**
   * Calculate individual components
   * @param insight - The insight to analyze
   * @param reach - Number of users reached
   * @returns RICE components
   */
  public getComponents(
    insight: AnalysisResult,
    reach?: number
  ): {
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
  } {
    return {
      reach: reach ?? insight.affectedUsers,
      impact: this.impactScorer.score(insight),
      confidence: insight.confidence,
      effort: this.effortEstimator.estimate(insight),
    };
  }
}
