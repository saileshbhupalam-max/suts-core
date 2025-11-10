/**
 * Calculates statistical confidence for decisions
 */

import { SimulationMetrics } from '../models';

/**
 * Calculates confidence levels
 */
export class ConfidenceCalculator {
  /**
   * Calculate overall decision confidence
   * @param metrics - Simulation metrics
   * @param sampleSizeWeight - Weight for sample size factor (0-1)
   * @returns Confidence level (0-1)
   */
  public calculate(
    metrics: SimulationMetrics,
    sampleSizeWeight: number = 0.4
  ): number {
    const sampleSizeFactor = this.calculateSampleSizeFactor(
      metrics.sampleSize
    );
    const metricConfidence = metrics.confidenceLevel;
    const consistencyFactor = this.calculateConsistencyFactor(metrics);

    // Weighted average
    const confidence =
      sampleSizeFactor * sampleSizeWeight +
      metricConfidence * (1 - sampleSizeWeight) * 0.6 +
      consistencyFactor * (1 - sampleSizeWeight) * 0.4;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate confidence factor based on sample size
   * @param sampleSize - Number of samples
   * @returns Sample size factor (0-1)
   */
  private calculateSampleSizeFactor(sampleSize: number): number {
    // Confidence increases with sample size, with diminishing returns
    // Using logarithmic scale
    if (sampleSize <= 0) {
      return 0;
    }

    // 100 samples = 0.5, 1000 = 0.75, 10000 = 0.9, 100000+ = 0.95
    const normalized = Math.log10(sampleSize + 1) / Math.log10(100001);
    return Math.min(0.95, normalized);
  }

  /**
   * Calculate consistency factor from metrics
   * Checks if metrics are internally consistent
   * @param metrics - Simulation metrics
   * @returns Consistency factor (0-1)
   */
  private calculateConsistencyFactor(metrics: SimulationMetrics): number {
    let consistencyScore = 1.0;

    // Check retention/churn consistency
    const expectedChurn = 1 - metrics.retentionRate;
    const churnDeviation = Math.abs(metrics.churnRate - expectedChurn);
    if (churnDeviation > 0.1) {
      consistencyScore -= 0.2;
    }

    // Check satisfaction/NPS consistency
    // High satisfaction should correlate with positive NPS
    if (metrics.userSatisfaction > 0.7 && metrics.npsScore < 0) {
      consistencyScore -= 0.15;
    }
    if (metrics.userSatisfaction < 0.5 && metrics.npsScore > 50) {
      consistencyScore -= 0.15;
    }

    // Check growth/retention consistency
    // Negative growth with high retention is suspicious
    if (metrics.growthRate < -0.1 && metrics.retentionRate > 0.8) {
      consistencyScore -= 0.1;
    }

    return Math.max(0, consistencyScore);
  }

  /**
   * Calculate confidence interval for a metric
   * @param value - Metric value
   * @param sampleSize - Sample size
   * @param confidenceLevel - Desired confidence level (e.g., 0.95)
   * @returns Confidence interval [lower, upper]
   */
  public calculateConfidenceInterval(
    value: number,
    sampleSize: number,
    confidenceLevel: number = 0.95
  ): [number, number] {
    if (sampleSize <= 0) {
      return [value, value];
    }

    // Simplified confidence interval using normal approximation
    // z-score for 95% confidence ≈ 1.96
    const zScore = this.getZScore(confidenceLevel);
    const standardError = Math.sqrt((value * (1 - value)) / sampleSize);
    const margin = zScore * standardError;

    return [
      Math.max(0, value - margin),
      Math.min(1, value + margin),
    ];
  }

  /**
   * Get z-score for confidence level
   * @param confidenceLevel - Confidence level (0-1)
   * @returns Z-score
   */
  private getZScore(confidenceLevel: number): number {
    // Simplified mapping of common confidence levels to z-scores
    if (confidenceLevel >= 0.99) {
      return 2.576;
    }
    if (confidenceLevel >= 0.95) {
      return 1.96;
    }
    if (confidenceLevel >= 0.90) {
      return 1.645;
    }
    if (confidenceLevel >= 0.80) {
      return 1.282;
    }
    return 1.0;
  }

  /**
   * Calculate statistical significance
   * @param baseline - Baseline metric value
   * @param treatment - Treatment metric value
   * @param sampleSize - Sample size
   * @returns P-value (0-1)
   */
  public calculateSignificance(
    baseline: number,
    treatment: number,
    sampleSize: number
  ): number {
    if (sampleSize <= 0) {
      return 1;
    }

    const diff = Math.abs(treatment - baseline);
    const pooledStdDev = Math.sqrt(
      (baseline * (1 - baseline) + treatment * (1 - treatment)) / 2
    );
    const standardError = pooledStdDev / Math.sqrt(sampleSize);

    if (standardError === 0) {
      return diff === 0 ? 1 : 0;
    }

    const zScore = diff / standardError;

    // Approximate p-value from z-score
    return this.zScoreToPValue(zScore);
  }

  /**
   * Convert z-score to p-value (two-tailed)
   * @param zScore - Z-score
   * @returns P-value
   */
  private zScoreToPValue(zScore: number): number {
    // Simplified approximation
    if (zScore > 3.5) {
      return 0.001;
    }
    if (zScore > 2.576) {
      return 0.01;
    }
    if (zScore > 1.96) {
      return 0.05;
    }
    if (zScore > 1.645) {
      return 0.1;
    }
    return 0.5;
  }
}
