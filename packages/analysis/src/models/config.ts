/**
 * Configuration for analysis engine
 */

import { z } from 'zod';

/**
 * Schema for analysis configuration
 */
export const AnalysisConfigSchema = z.object({
  /**
   * Minimum frequency threshold for friction detection
   */
  minFrictionFrequency: z.number().min(0).default(5),

  /**
   * Minimum frustration level to consider as friction
   */
  minFrustrationLevel: z.number().min(0).max(1).default(0.6),

  /**
   * Minimum delight level to consider as value moment
   */
  minDelightLevel: z.number().min(0).max(1).default(0.7),

  /**
   * Minimum confidence score for insights
   */
  minConfidence: z.number().min(0).max(1).default(0.5),

  /**
   * Time window for pattern detection (in milliseconds)
   */
  patternTimeWindow: z.number().min(0).default(3600000), // 1 hour

  /**
   * Minimum sample size for statistical significance
   */
  minSampleSize: z.number().min(1).default(30),

  /**
   * P-value threshold for significance testing
   */
  significanceThreshold: z.number().min(0).max(1).default(0.05),

  /**
   * Enable performance optimizations
   */
  enableOptimizations: z.boolean().default(true),

  /**
   * Maximum events to process in memory
   */
  maxEventsInMemory: z.number().min(1).default(100000),
});

/**
 * Analysis configuration type
 */
export type AnalysisConfig = z.infer<typeof AnalysisConfigSchema>;

/**
 * Default analysis configuration
 */
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  minFrictionFrequency: 5,
  minFrustrationLevel: 0.6,
  minDelightLevel: 0.7,
  minConfidence: 0.5,
  patternTimeWindow: 3600000,
  minSampleSize: 30,
  significanceThreshold: 0.05,
  enableOptimizations: true,
  maxEventsInMemory: 100000,
};
