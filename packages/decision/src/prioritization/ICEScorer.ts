/**
 * ICE scoring framework: Impact x Confidence / Effort
 */

import { AnalysisResult } from '../models';
import { ImpactScorer } from './ImpactScorer';
import { EffortEstimator } from './EffortEstimator';

/**
 * Implements ICE (Impact, Confidence, Effort) scoring
 * Score = (Impact * Confidence) / Effort
 */
export class ICEScorer {
  private readonly impactScorer: ImpactScorer;
  private readonly effortEstimator: EffortEstimator;

  /**
   * Create ICE scorer
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
   * Calculate ICE score
   * @param insight - The insight to score
   * @returns ICE score
   */
  public score(insight: AnalysisResult): number {
    const impact = this.impactScorer.score(insight);
    const confidence = insight.confidence;
    const effort = this.effortEstimator.estimate(insight);

    // Avoid division by zero
    if (effort === 0) {
      return 0;
    }

    // ICE = (Impact * Confidence) / Effort
    // Multiply by 10 to get more readable scores
    const iceScore = ((impact * confidence) / effort) * 10;

    return Math.max(0, iceScore);
  }

  /**
   * Calculate individual components
   * @param insight - The insight to analyze
   * @returns ICE components
   */
  public getComponents(insight: AnalysisResult): {
    impact: number;
    confidence: number;
    effort: number;
  } {
    return {
      impact: this.impactScorer.score(insight),
      confidence: insight.confidence,
      effort: this.effortEstimator.estimate(insight),
    };
  }
}
