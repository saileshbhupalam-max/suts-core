/**
 * Designs A/B test experiments for product changes
 */

import { AnalysisResult, Experiment } from '../models';

/**
 * Configuration for experiment design
 */
export interface ExperimentDesignerConfig {
  /**
   * Default control group size (0-1)
   */
  defaultControlSize?: number;
  /**
   * Minimum sample size per group
   */
  minSampleSize?: number;
  /**
   * Default experiment duration in days
   */
  defaultDuration?: number;
}

/**
 * Designs A/B test experiments
 */
export class ExperimentDesigner {
  private readonly config: Required<ExperimentDesignerConfig>;

  /**
   * Create experiment designer
   * @param config - Configuration options
   */
  constructor(config: ExperimentDesignerConfig = {}) {
    this.config = {
      defaultControlSize: config.defaultControlSize ?? 0.5,
      minSampleSize: config.minSampleSize ?? 1000,
      defaultDuration: config.defaultDuration ?? 14,
    };
  }

  /**
   * Design an A/B test experiment for an insight
   * @param insight - The insight to test
   * @returns Experiment design
   */
  public design(insight: AnalysisResult): Experiment {
    const experimentId = `exp-${insight.id}`;
    const hypothesis = this.generateHypothesis(insight);
    const targetMetric = this.selectTargetMetric(insight);
    const minimumSampleSize = this.calculateSampleSize(insight);
    const expectedDuration = this.estimateDuration(minimumSampleSize);

    return {
      id: experimentId,
      name: `Test: ${insight.title}`,
      description: `A/B test to validate ${insight.title}`,
      hypothesis,
      targetMetric,
      controlGroup: {
        name: 'Control',
        size: this.config.defaultControlSize,
        description: 'Current experience without changes',
      },
      treatmentGroups: [
        {
          name: 'Treatment',
          size: 1 - this.config.defaultControlSize,
          description: `Implementation of fix for: ${insight.title}`,
          changes: this.generateChanges(insight),
        },
      ],
      minimumSampleSize,
      expectedDuration,
      successCriteria: this.generateSuccessCriteria(insight),
      risks: this.identifyRisks(insight),
      estimatedLift: this.estimateLift(insight),
    };
  }

  /**
   * Generate hypothesis statement
   * @param insight - The insight
   * @returns Hypothesis statement
   */
  private generateHypothesis(insight: AnalysisResult): string {
    return `Addressing ${insight.title} will improve ${insight.type} metrics by reducing negative impact on ${insight.affectedUsers} users`;
  }

  /**
   * Select primary target metric
   * @param insight - The insight
   * @returns Target metric name
   */
  private selectTargetMetric(insight: AnalysisResult): string {
    const metricMap: Record<string, string> = {
      retention: 'Day 7 Retention Rate',
      churn: 'Monthly Churn Rate',
      growth: 'Weekly Active Users',
      revenue: 'Revenue Per User',
      ux: 'User Satisfaction Score',
      performance: 'Task Completion Rate',
    };
    return metricMap[insight.type] ?? 'Primary Success Metric';
  }

  /**
   * Calculate required sample size
   * @param insight - The insight
   * @returns Minimum sample size
   */
  private calculateSampleSize(insight: AnalysisResult): number {
    // Base sample size on expected effect size and confidence
    const effectSize = insight.potentialImpact;
    const confidence = insight.confidence;

    // Smaller effects need larger samples
    const baseSize = this.config.minSampleSize;
    const effectMultiplier = effectSize > 0 ? 1 / effectSize : 10;
    const confidenceMultiplier = confidence > 0 ? 1 / confidence : 2;

    const calculatedSize = baseSize * effectMultiplier * confidenceMultiplier;

    return Math.max(this.config.minSampleSize, Math.round(calculatedSize));
  }

  /**
   * Estimate experiment duration
   * @param sampleSize - Required sample size
   * @returns Duration in days
   */
  private estimateDuration(sampleSize: number): number {
    // Assume 1000 users per day conversion rate
    const usersPerDay = 1000;
    const days = Math.ceil(sampleSize / usersPerDay);

    return Math.max(this.config.defaultDuration, days);
  }

  /**
   * Generate success criteria
   * @param insight - The insight
   * @returns Array of success criteria
   */
  private generateSuccessCriteria(insight: AnalysisResult): string[] {
    const improvementPercent = Math.round(insight.potentialImpact * 20);
    return [
      `${improvementPercent}% improvement in target metric`,
      'Statistical significance (p < 0.05)',
      `Confidence level > ${Math.round(insight.confidence * 100)}%`,
      'No significant degradation in secondary metrics',
    ];
  }

  /**
   * Identify experiment risks
   * @param insight - The insight
   * @returns Array of risk descriptions
   */
  private identifyRisks(insight: AnalysisResult): string[] {
    const risks: string[] = [];

    if (insight.severity === 'critical') {
      risks.push('High-severity issue may impact user experience during test');
    }

    if (insight.affectedUsers > 10000) {
      risks.push('Large user base affected - consider phased rollout');
    }

    if (insight.confidence < 0.5) {
      risks.push('Low confidence in analysis - results may be uncertain');
    }

    return risks;
  }

  /**
   * Estimate expected lift
   * @param insight - The insight
   * @returns Estimated lift percentage
   */
  private estimateLift(insight: AnalysisResult): number {
    return insight.potentialImpact * insight.confidence * 0.2;
  }

  /**
   * Generate list of changes to implement
   * @param insight - The insight
   * @returns Array of change descriptions
   */
  private generateChanges(insight: AnalysisResult): string[] {
    return [
      `Implement fix for ${insight.title}`,
      'Monitor metrics during rollout',
      'Prepare rollback plan',
    ];
  }
}
