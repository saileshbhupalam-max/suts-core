/**
 * GO/NO-GO decision engine
 */

import { SimulationMetrics, GoNoGoResult, DecisionConfig } from '../models';
import { ThresholdEvaluator } from './ThresholdEvaluator';
import { ConfidenceCalculator } from './ConfidenceCalculator';
import { DecisionTree } from './DecisionTree';

/**
 * GO/NO-GO decision framework
 */
export class GoNoGoEngine {
  private readonly thresholdEvaluator: ThresholdEvaluator;
  private readonly confidenceCalculator: ConfidenceCalculator;
  private readonly decisionTree: DecisionTree;

  /**
   * Create GO/NO-GO engine
   * @param config - Decision configuration
   */
  constructor(config: DecisionConfig = {}) {
    this.thresholdEvaluator = new ThresholdEvaluator(config.thresholds);
    this.confidenceCalculator = new ConfidenceCalculator();
    this.decisionTree = new DecisionTree();
  }

  /**
   * Make GO/NO-GO decision
   * @param metrics - Simulation metrics
   * @returns GO/NO-GO result
   */
  public decide(metrics: SimulationMetrics): GoNoGoResult {
    // Evaluate thresholds
    const thresholdResults = this.thresholdEvaluator.evaluate(metrics);
    const passedThresholds = thresholdResults
      .filter((r) => r.passed)
      .map((r) => r.metric);
    const failedThresholds = thresholdResults
      .filter((r) => !r.passed)
      .map((r) => r.metric);

    // Calculate confidence
    const confidence = this.confidenceCalculator.calculate(metrics);

    // Evaluate decision tree
    const decisionTree = this.decisionTree.evaluate(metrics);

    // Make decision
    const decision = this.makeDecision(
      metrics,
      failedThresholds,
      confidence,
      decisionTree.score
    );

    // Generate warnings and recommendations
    const warnings = this.generateWarnings(
      metrics,
      failedThresholds,
      confidence
    );
    const recommendations = this.generateRecommendations(
      decision,
      failedThresholds,
      warnings
    );

    // Build threshold details
    const thresholds: GoNoGoResult['thresholds'] = {};
    for (const result of thresholdResults) {
      thresholds[result.metric] = {
        expected: result.expected,
        actual: result.actual,
        passed: result.passed,
      };
    }

    return {
      decision,
      confidence,
      reasoning: this.generateReasoning(
        decision,
        passedThresholds,
        failedThresholds,
        confidence,
        decisionTree.score
      ),
      passedCriteria: passedThresholds,
      failedCriteria: failedThresholds,
      warnings,
      recommendations,
      thresholds,
    };
  }

  /**
   * Make the GO/NO-GO decision
   * @param metrics - Simulation metrics
   * @param failedThresholds - Failed threshold names
   * @param confidence - Confidence level
   * @param treeScore - Decision tree score
   * @returns Decision
   */
  private makeDecision(
    metrics: SimulationMetrics,
    failedThresholds: string[],
    confidence: number,
    treeScore: number
  ): 'GO' | 'NO_GO' | 'CONDITIONAL' {
    // NO_GO conditions
    if (failedThresholds.includes('retentionRate')) {
      return 'NO_GO';
    }
    if (failedThresholds.includes('churnRate')) {
      return 'NO_GO';
    }
    if (confidence < 0.5) {
      return 'NO_GO';
    }
    if (metrics.sampleSize < 50) {
      return 'NO_GO';
    }

    // CONDITIONAL conditions
    if (failedThresholds.length > 2) {
      return 'CONDITIONAL';
    }
    if (confidence < 0.7) {
      return 'CONDITIONAL';
    }
    if (treeScore < 0.7) {
      return 'CONDITIONAL';
    }

    // GO conditions
    if (
      failedThresholds.length === 0 &&
      confidence >= 0.8 &&
      treeScore >= 0.7
    ) {
      return 'GO';
    }

    // Default to CONDITIONAL
    return 'CONDITIONAL';
  }

  /**
   * Generate decision reasoning
   * @param decision - The decision
   * @param passedThresholds - Passed thresholds
   * @param failedThresholds - Failed thresholds
   * @param confidence - Confidence level
   * @param treeScore - Decision tree score
   * @returns Reasoning text
   */
  private generateReasoning(
    decision: 'GO' | 'NO_GO' | 'CONDITIONAL',
    passedThresholds: string[],
    failedThresholds: string[],
    confidence: number,
    treeScore: number
  ): string {
    const parts: string[] = [];

    parts.push(`Decision: ${decision}`);
    parts.push(
      `Confidence: ${(confidence * 100).toFixed(1)}%, Tree Score: ${(treeScore * 100).toFixed(1)}%`
    );
    parts.push(
      `Passed: ${passedThresholds.length}, Failed: ${failedThresholds.length}`
    );

    if (decision === 'GO') {
      parts.push(
        'All critical metrics meet thresholds. Proceed with implementation.'
      );
    } else if (decision === 'NO_GO') {
      parts.push(
        `Critical issues: ${failedThresholds.join(', ')}. Do not proceed.`
      );
    } else {
      parts.push(
        'Some concerns identified. Proceed with caution and monitoring.'
      );
    }

    return parts.join(' ');
  }

  /**
   * Generate warnings
   * @param metrics - Simulation metrics
   * @param failedThresholds - Failed thresholds
   * @param confidence - Confidence level
   * @returns Array of warnings
   */
  private generateWarnings(
    metrics: SimulationMetrics,
    failedThresholds: string[],
    confidence: number
  ): string[] {
    const warnings: string[] = [];

    if (metrics.sampleSize < 100) {
      warnings.push('Low sample size may reduce reliability');
    }

    if (confidence < 0.7) {
      warnings.push('Low confidence in metrics');
    }

    if (failedThresholds.includes('userSatisfaction')) {
      warnings.push('User satisfaction below target');
    }

    if (metrics.churnRate > 0.25) {
      warnings.push('Elevated churn rate detected');
    }

    if (metrics.growthRate < 0) {
      warnings.push('Negative growth trend');
    }

    return warnings;
  }

  /**
   * Generate recommendations
   * @param decision - The decision
   * @param failedThresholds - Failed thresholds
   * @param warnings - Warnings
   * @returns Array of recommendations
   */
  private generateRecommendations(
    decision: 'GO' | 'NO_GO' | 'CONDITIONAL',
    failedThresholds: string[],
    warnings: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (decision === 'NO_GO') {
      recommendations.push('Address critical issues before proceeding');
      recommendations.push('Gather more data and re-evaluate');
    }

    if (decision === 'CONDITIONAL') {
      recommendations.push('Proceed with enhanced monitoring');
      recommendations.push('Prepare rollback plan');
    }

    if (decision === 'GO') {
      recommendations.push('Proceed as planned');
      recommendations.push('Continue monitoring key metrics');
    }

    if (failedThresholds.length > 0) {
      recommendations.push(
        `Focus on improving: ${failedThresholds.join(', ')}`
      );
    }

    if (warnings.length > 2) {
      recommendations.push('Consider phased rollout approach');
    }

    return recommendations;
  }
}
