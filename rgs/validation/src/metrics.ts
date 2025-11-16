/**
 * Metrics Calculator for RGS Validation Framework
 * Calculates accuracy of SUTS predictions vs actual behavior
 */

import type {
  SUTSResult,
  ActualData,
  MetricsError,
} from './types';

/**
 * Calculate overall accuracy of SUTS predictions
 * @param predicted - SUTS test results
 * @param actual - Actual behavior data
 * @returns Accuracy percentage (0-100)
 */
export function calculateAccuracy(predicted: SUTSResult, actual: ActualData): number {
  if (predicted === null || predicted === undefined) {
    throw createMetricsError('Predicted data cannot be null or undefined', 'INVALID_PREDICTED');
  }
  if (actual === null || actual === undefined) {
    throw createMetricsError('Actual data cannot be null or undefined', 'INVALID_ACTUAL');
  }

  const breakdown = calculateAccuracyBreakdown(predicted, actual);

  // Weighted average across categories
  const weights = {
    positioning: 0.4,
    retention: 0.35,
    viral: 0.25,
  };

  const overall =
    breakdown.positioning * weights.positioning +
    breakdown.retention * weights.retention +
    breakdown.viral * weights.viral;

  return Number(overall.toFixed(2));
}

/**
 * Calculate accuracy breakdown by category
 * @param predicted - SUTS test results
 * @param actual - Actual behavior data
 * @returns Accuracy for each category (0-100)
 */
export function calculateAccuracyBreakdown(
  predicted: SUTSResult,
  actual: ActualData
): { positioning: number; retention: number; viral: number } {
  const positioningAccuracy = calculatePositioningAccuracy(
    predicted.predictions.positioning,
    actual.positioning
  );
  const retentionAccuracy = calculateRetentionAccuracy(
    predicted.predictions.retention,
    actual.retention
  );
  const viralAccuracy = calculateViralAccuracy(
    predicted.predictions.viral,
    actual.viral
  );

  return {
    positioning: positioningAccuracy,
    retention: retentionAccuracy,
    viral: viralAccuracy,
  };
}

/**
 * Calculate positioning accuracy
 * Compares predicted vs actual user responses to positioning
 */
function calculatePositioningAccuracy(
  predicted: Array<{
    personaId: string;
    predictedResponse: string;
    confidence: number;
    reasoning: string;
  }>,
  actual: Array<{
    personaId: string;
    actualResponse: string;
    wasAccurate: boolean;
  }>
): number {
  if (predicted.length === 0) {
    return 0;
  }

  // Create map for faster lookup
  const actualMap = new Map(
    actual.map((item) => [item.personaId, item])
  );

  let correctPredictions = 0;
  let totalPredictions = 0;

  for (const pred of predicted) {
    const act = actualMap.get(pred.personaId);
    if (act !== undefined && act !== null) {
      totalPredictions++;
      // Use similarity check for responses
      if (responseSimilarity(pred.predictedResponse, act.actualResponse) > 0.7) {
        correctPredictions++;
      }
    }
  }

  if (totalPredictions === 0) {
    return 0;
  }

  return Number(((correctPredictions / totalPredictions) * 100).toFixed(2));
}

/**
 * Calculate retention accuracy
 * Compares predicted vs actual retention rates
 */
function calculateRetentionAccuracy(
  predicted: Array<{
    personaId: string;
    predictedRetention: number;
    timeframe: string;
    reasoning: string;
  }>,
  actual: Array<{
    personaId: string;
    actualRetention: number;
    timeframe: string;
  }>
): number {
  if (predicted.length === 0) {
    return 0;
  }

  const actualMap = new Map(
    actual.map((item) => [item.personaId, item])
  );

  let totalError = 0;
  let count = 0;

  for (const pred of predicted) {
    const act = actualMap.get(pred.personaId);
    if (act !== undefined && act !== null && pred.timeframe === act.timeframe) {
      const error = Math.abs(pred.predictedRetention - act.actualRetention);
      totalError += error;
      count++;
    }
  }

  if (count === 0) {
    return 0;
  }

  // Convert error to accuracy: lower error = higher accuracy
  const averageError = totalError / count;
  const accuracy = Math.max(0, (1 - averageError) * 100);

  return Number(accuracy.toFixed(2));
}

/**
 * Calculate viral coefficient accuracy
 * Compares predicted vs actual viral coefficients
 */
function calculateViralAccuracy(
  predicted: Array<{
    personaId: string;
    predictedViralCoefficient: number;
    channels: string[];
    reasoning: string;
  }>,
  actual: Array<{
    personaId: string;
    actualViralCoefficient: number;
    channels: string[];
  }>
): number {
  if (predicted.length === 0) {
    return 0;
  }

  const actualMap = new Map(
    actual.map((item) => [item.personaId, item])
  );

  let totalError = 0;
  let count = 0;

  for (const pred of predicted) {
    const act = actualMap.get(pred.personaId);
    if (act !== undefined && act !== null) {
      // Normalize error by expected value to handle different scales
      const expectedValue = Math.max(act.actualViralCoefficient, 0.1);
      const error = Math.abs(pred.predictedViralCoefficient - act.actualViralCoefficient) / expectedValue;
      totalError += Math.min(error, 1); // Cap error at 100%
      count++;
    }
  }

  if (count === 0) {
    return 0;
  }

  const averageError = totalError / count;
  const accuracy = Math.max(0, (1 - averageError) * 100);

  return Number(accuracy.toFixed(2));
}

/**
 * Calculate statistical confidence of results
 * Uses simplified confidence interval calculation
 * @param sampleSize - Number of test samples
 * @param accuracy - Measured accuracy (0-1)
 * @returns Confidence level (0-1)
 */
export function calculateConfidence(sampleSize: number, accuracy: number): number {
  if (sampleSize <= 0) {
    throw createMetricsError('Sample size must be positive', 'INVALID_SAMPLE_SIZE');
  }
  if (accuracy < 0 || accuracy > 1) {
    throw createMetricsError('Accuracy must be between 0 and 1', 'INVALID_ACCURACY');
  }

  // Simplified confidence calculation
  // Real implementation would use proper statistical methods
  const baseConfidence = 0.5;
  const sizeBonus = Math.min(sampleSize / 100, 0.4); // Max 0.4 bonus for sample size
  const accuracyPenalty = Math.abs(accuracy - 0.5) * 0.1; // Less confident at extremes

  const confidence = baseConfidence + sizeBonus - accuracyPenalty;

  return Number(Math.max(0, Math.min(1, confidence)).toFixed(3));
}

/**
 * Calculate improvement percentage
 * @param baseAccuracy - Baseline accuracy
 * @param groundedAccuracy - RGS-grounded accuracy
 * @returns Improvement in percentage points
 */
export function calculateImprovement(baseAccuracy: number, groundedAccuracy: number): number {
  if (baseAccuracy < 0 || baseAccuracy > 100) {
    throw createMetricsError('Base accuracy must be between 0 and 100', 'INVALID_BASE_ACCURACY');
  }
  if (groundedAccuracy < 0 || groundedAccuracy > 100) {
    throw createMetricsError('Grounded accuracy must be between 0 and 100', 'INVALID_GROUNDED_ACCURACY');
  }

  return Number((groundedAccuracy - baseAccuracy).toFixed(2));
}

/**
 * Calculate similarity between two response strings
 * Simple word overlap metric
 */
function responseSimilarity(response1: string, response2: string): number {
  if (response1 === response2) {
    return 1;
  }

  const words1 = new Set(
    response1
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  const words2 = new Set(
    response2
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Create a MetricsError with proper typing
 */
function createMetricsError(message: string, code: string): MetricsError {
  const error = new Error(message) as MetricsError & { code: string };
  error.name = 'MetricsError';
  error.code = code;
  return error;
}
