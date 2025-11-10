/**
 * Confidence scoring - calculates how confident we are in insights
 */

import { FrictionPoint, ValueMoment, ChurnDriver, AhaMoment } from '../models';
import { AnalysisConfig } from '../models/config';

/**
 * Calculates confidence scores for insights
 */
export class ConfidenceScorer {
  constructor(private readonly config: AnalysisConfig) {}

  /**
   * Scores confidence in friction point detection
   * @param friction - Friction point to score
   * @returns Confidence score (0-1)
   */
  scoreFriction(friction: FrictionPoint): number {
    // Confidence factors:
    // 1. Sample size (frequency)
    // 2. Number of affected users
    // 3. Consistency (high frustration + high abandonment)

    const frequencyScore = this.calculateFrequencyScore(friction.frequency);
    const userScore = this.calculateUserScore(friction.affectedUsers);
    const consistencyScore = this.calculateConsistencyScore(
      friction.avgFrustration,
      friction.abandonmentRate
    );

    return (frequencyScore * 0.4 + userScore * 0.3 + consistencyScore * 0.3);
  }

  /**
   * Scores confidence in value moment detection
   * @param value - Value moment to score
   * @returns Confidence score (0-1)
   */
  scoreValue(value: ValueMoment): number {
    // Confidence factors:
    // 1. Sample size (frequency)
    // 2. Number of affected users
    // 3. Consistency (high delight + high retention correlation)

    const frequencyScore = this.calculateFrequencyScore(value.frequency);
    const userScore = this.calculateUserScore(value.affectedUsers);
    const consistencyScore = this.calculateConsistencyScore(
      value.delightScore,
      value.retentionCorrelation
    );

    return (frequencyScore * 0.4 + userScore * 0.3 + consistencyScore * 0.3);
  }

  /**
   * Scores confidence in churn prediction
   * @param churn - Churn driver to score
   * @returns Confidence score (0-1)
   */
  scoreChurn(churn: ChurnDriver): number {
    // Confidence factors:
    // 1. Sample size (affected users)
    // 2. Churn probability magnitude
    // 3. Pattern consistency

    const userScore = this.calculateUserScore(churn.affectedUsers);
    const probabilityScore = churn.churnProbability;
    const patternScore = this.calculatePatternScore(churn.eventPattern.length);

    return (userScore * 0.4 + probabilityScore * 0.4 + patternScore * 0.2);
  }

  /**
   * Scores confidence in aha moment detection
   * @param ahaMoment - Aha moment to score
   * @returns Confidence score (0-1)
   */
  scoreAhaMoment(ahaMoment: AhaMoment): number {
    // Confidence factors:
    // 1. Number of users who reached it
    // 2. Retention impact magnitude
    // 3. Consistency (high reach = higher confidence)

    const userScore = this.calculateUserScore(ahaMoment.usersReached);
    const impactScore = ahaMoment.retentionImpact;
    const reachScore = ahaMoment.usersNotReached > 0
      ? ahaMoment.usersReached / (ahaMoment.usersReached + ahaMoment.usersNotReached)
      : 1;

    return (userScore * 0.4 + impactScore * 0.4 + reachScore * 0.2);
  }

  /**
   * Calculates confidence based on sample size
   */
  private calculateFrequencyScore(frequency: number): number {
    // More events = higher confidence
    // Use logarithmic scale to handle large numbers

    if (frequency < this.config.minSampleSize) {
      return 0.3;
    }

    const normalizedFrequency = Math.min(frequency / 100, 1);
    return 0.3 + normalizedFrequency * 0.7;
  }

  /**
   * Calculates confidence based on user count
   */
  private calculateUserScore(userCount: number): number {
    // More users = higher confidence

    if (userCount < 5) {
      return 0.2;
    } else if (userCount < 10) {
      return 0.4;
    } else if (userCount < 30) {
      return 0.6;
    } else if (userCount < 50) {
      return 0.8;
    } else {
      return 1.0;
    }
  }

  /**
   * Calculates confidence based on metric consistency
   */
  private calculateConsistencyScore(metric1: number, metric2: number): number {
    // If both metrics are high, confidence is high
    // If metrics are contradictory, confidence is low

    const avgMetric = (metric1 + metric2) / 2;
    const difference = Math.abs(metric1 - metric2);

    // High average and low difference = high consistency
    const consistencyScore = avgMetric * (1 - difference * 0.3);

    return Math.max(consistencyScore, 0);
  }

  /**
   * Calculates confidence based on pattern length
   */
  private calculatePatternScore(patternLength: number): number {
    // Longer patterns are more specific but may be less reliable
    // Shorter patterns are more general but more robust

    if (patternLength === 1) {
      return 0.8;
    } else if (patternLength === 2) {
      return 0.9;
    } else if (patternLength === 3) {
      return 1.0;
    } else {
      return 0.7; // Very long patterns may be overfitting
    }
  }

  /**
   * Adjusts confidence based on statistical significance
   * @param confidence - Initial confidence score
   * @param pValue - P-value from statistical test
   * @returns Adjusted confidence score
   */
  adjustForSignificance(confidence: number, pValue: number): number {
    if (pValue < this.config.significanceThreshold) {
      // Statistically significant - boost confidence
      return Math.min(confidence * 1.2, 1);
    } else if (pValue < 0.1) {
      // Marginally significant - slight boost
      return Math.min(confidence * 1.1, 1);
    } else {
      // Not significant - reduce confidence
      return confidence * 0.7;
    }
  }

  /**
   * Calculates overall confidence for a set of insights
   * @param confidenceScores - Array of confidence scores
   * @returns Overall confidence score
   */
  calculateOverallConfidence(confidenceScores: number[]): number {
    if (confidenceScores.length === 0) {
      return 0;
    }

    // Use weighted average, giving more weight to high confidence insights
    const sortedScores = confidenceScores.slice().sort((a, b) => b - a);

    let weightedSum = 0;
    let totalWeight = 0;

    for (let i = 0; i < sortedScores.length; i++) {
      const score = sortedScores[i];
      if (score !== undefined) {
        const weight = 1 / (i + 1); // Decreasing weight
        weightedSum += score * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Determines confidence level label
   * @param confidence - Confidence score (0-1)
   * @returns Confidence level label
   */
  getConfidenceLevel(confidence: number): 'very-high' | 'high' | 'medium' | 'low' | 'very-low' {
    if (confidence >= 0.9) {
      return 'very-high';
    } else if (confidence >= 0.7) {
      return 'high';
    } else if (confidence >= 0.5) {
      return 'medium';
    } else if (confidence >= 0.3) {
      return 'low';
    } else {
      return 'very-low';
    }
  }
}
