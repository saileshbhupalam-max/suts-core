/**
 * Estimates implementation effort for insights
 */

import { AnalysisResult } from '../models';

/**
 * Configuration for effort estimation
 */
export interface EffortEstimatorConfig {
  /**
   * Base effort by insight type
   */
  baseEffort?: Record<string, number>;
  /**
   * Complexity multiplier range
   */
  complexityMultiplier?: {
    min: number;
    max: number;
  };
}

/**
 * Estimates effort required to implement fixes
 */
export class EffortEstimator {
  private readonly config: Required<EffortEstimatorConfig>;

  /**
   * Create effort estimator
   * @param config - Configuration options
   */
  constructor(config: EffortEstimatorConfig = {}) {
    this.config = {
      baseEffort: config.baseEffort ?? {
        retention: 5,
        churn: 7,
        growth: 8,
        revenue: 10,
        ux: 3,
        performance: 4,
      },
      complexityMultiplier: config.complexityMultiplier ?? {
        min: 0.5,
        max: 2.0,
      },
    };
  }

  /**
   * Estimate effort in story points
   * @param insight - The insight to estimate
   * @returns Estimated effort (story points)
   */
  public estimate(insight: AnalysisResult): number {
    const baseEffort = this.getBaseEffort(insight.type);
    const complexityFactor = this.getComplexityFactor(insight);
    const severityAdjustment = this.getSeverityAdjustment(insight.severity);

    const effort = baseEffort * complexityFactor * severityAdjustment;

    return Math.max(1, Math.round(effort));
  }

  /**
   * Get base effort for insight type
   * @param type - Insight type
   * @returns Base effort value
   */
  private getBaseEffort(type: string): number {
    return this.config.baseEffort[type] ?? 5;
  }

  /**
   * Calculate complexity factor based on affected users and impact
   * @param insight - The insight
   * @returns Complexity multiplier
   */
  private getComplexityFactor(insight: AnalysisResult): number {
    const userComplexity = Math.min(1, insight.affectedUsers / 10000);
    const impactComplexity = insight.potentialImpact;

    const avgComplexity = (userComplexity + impactComplexity) / 2;

    const { min, max } = this.config.complexityMultiplier;
    return min + avgComplexity * (max - min);
  }

  /**
   * Get severity adjustment factor
   * @param severity - Severity level
   * @returns Adjustment multiplier
   */
  private getSeverityAdjustment(
    severity: 'critical' | 'high' | 'medium' | 'low'
  ): number {
    const adjustments: Record<string, number> = {
      critical: 1.5,
      high: 1.2,
      medium: 1.0,
      low: 0.8,
    };
    return adjustments[severity] ?? 1.0;
  }
}
