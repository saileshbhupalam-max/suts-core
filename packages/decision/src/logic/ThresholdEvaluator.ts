/**
 * Evaluates metrics against thresholds
 */

import { SimulationMetrics } from '../models';

/**
 * Threshold configuration
 */
export interface ThresholdConfig {
  minRetentionRate?: number;
  maxChurnRate?: number;
  minGrowthRate?: number;
  minUserSatisfaction?: number;
  minConversionRate?: number;
  minNpsScore?: number;
  minConfidenceLevel?: number;
  minSampleSize?: number;
}

/**
 * Threshold evaluation result
 */
export interface ThresholdResult {
  metric: string;
  expected: number;
  actual: number;
  passed: boolean;
  deviation: number;
}

/**
 * Evaluates metrics against thresholds
 */
export class ThresholdEvaluator {
  private readonly config: Required<ThresholdConfig>;

  /**
   * Create threshold evaluator
   * @param config - Threshold configuration
   */
  constructor(config: ThresholdConfig = {}) {
    this.config = {
      minRetentionRate: config.minRetentionRate ?? 0.7,
      maxChurnRate: config.maxChurnRate ?? 0.3,
      minGrowthRate: config.minGrowthRate ?? 0.0,
      minUserSatisfaction: config.minUserSatisfaction ?? 0.7,
      minConversionRate: config.minConversionRate ?? 0.1,
      minNpsScore: config.minNpsScore ?? 0,
      minConfidenceLevel: config.minConfidenceLevel ?? 0.8,
      minSampleSize: config.minSampleSize ?? 100,
    };
  }

  /**
   * Evaluate all metrics against thresholds
   * @param metrics - Simulation metrics
   * @returns Array of threshold results
   */
  public evaluate(metrics: SimulationMetrics): ThresholdResult[] {
    return [
      this.evaluateMetric(
        'retentionRate',
        metrics.retentionRate,
        this.config.minRetentionRate,
        'min'
      ),
      this.evaluateMetric(
        'churnRate',
        metrics.churnRate,
        this.config.maxChurnRate,
        'max'
      ),
      this.evaluateMetric(
        'growthRate',
        metrics.growthRate,
        this.config.minGrowthRate,
        'min'
      ),
      this.evaluateMetric(
        'userSatisfaction',
        metrics.userSatisfaction,
        this.config.minUserSatisfaction,
        'min'
      ),
      this.evaluateMetric(
        'conversionRate',
        metrics.conversionRate,
        this.config.minConversionRate,
        'min'
      ),
      this.evaluateMetric(
        'npsScore',
        metrics.npsScore,
        this.config.minNpsScore,
        'min'
      ),
      this.evaluateMetric(
        'confidenceLevel',
        metrics.confidenceLevel,
        this.config.minConfidenceLevel,
        'min'
      ),
      this.evaluateMetric(
        'sampleSize',
        metrics.sampleSize,
        this.config.minSampleSize,
        'min'
      ),
    ];
  }

  /**
   * Check if all critical thresholds pass
   * @param metrics - Simulation metrics
   * @returns True if all critical thresholds pass
   */
  public passesAllCritical(metrics: SimulationMetrics): boolean {
    return (
      metrics.retentionRate >= this.config.minRetentionRate &&
      metrics.churnRate <= this.config.maxChurnRate &&
      metrics.confidenceLevel >= this.config.minConfidenceLevel &&
      metrics.sampleSize >= this.config.minSampleSize
    );
  }

  /**
   * Evaluate a single metric
   * @param name - Metric name
   * @param actual - Actual value
   * @param threshold - Threshold value
   * @param type - Threshold type (min or max)
   * @returns Threshold result
   */
  private evaluateMetric(
    name: string,
    actual: number,
    threshold: number,
    type: 'min' | 'max'
  ): ThresholdResult {
    const passed =
      type === 'min' ? actual >= threshold : actual <= threshold;
    const deviation = type === 'min' ? actual - threshold : threshold - actual;

    return {
      metric: name,
      expected: threshold,
      actual,
      passed,
      deviation,
    };
  }

  /**
   * Get failed thresholds
   * @param metrics - Simulation metrics
   * @returns Array of failed threshold names
   */
  public getFailedThresholds(metrics: SimulationMetrics): string[] {
    return this.evaluate(metrics)
      .filter((result) => !result.passed)
      .map((result) => result.metric);
  }

  /**
   * Get passed thresholds
   * @param metrics - Simulation metrics
   * @returns Array of passed threshold names
   */
  public getPassedThresholds(metrics: SimulationMetrics): string[] {
    return this.evaluate(metrics)
      .filter((result) => result.passed)
      .map((result) => result.metric);
  }
}
