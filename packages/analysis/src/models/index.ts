/**
 * Data models for analysis results
 */

import { z } from 'zod';

/**
 * Schema for friction point location
 */
export const FrictionLocationSchema = z.object({
  action: z.string(),
  eventType: z.string(),
  context: z.record(z.unknown()).optional(),
});

/**
 * Schema for a friction point
 */
export const FrictionPointSchema = z.object({
  location: FrictionLocationSchema,
  severity: z.number().min(0).max(1),
  frequency: z.number().min(0),
  affectedUsers: z.number().min(0),
  avgFrustration: z.number().min(0).max(1),
  avgTimeSpent: z.number().min(0),
  abandonmentRate: z.number().min(0).max(1),
  priority: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  suggestedFixes: z.array(z.string()).optional(),
});

/**
 * Friction point type
 */
export type FrictionPoint = z.infer<typeof FrictionPointSchema>;

/**
 * Schema for a value moment
 */
export const ValueMomentSchema = z.object({
  action: z.string(),
  eventType: z.string(),
  context: z.record(z.unknown()).optional(),
  delightScore: z.number().min(0).max(1),
  frequency: z.number().min(0),
  affectedUsers: z.number().min(0),
  retentionCorrelation: z.number().min(-1).max(1),
  avgEngagementTime: z.number().min(0),
  priority: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  amplificationSuggestions: z.array(z.string()).optional(),
});

/**
 * Value moment type
 */
export type ValueMoment = z.infer<typeof ValueMomentSchema>;

/**
 * Schema for a churn driver
 */
export const ChurnDriverSchema = z.object({
  trigger: z.string(),
  eventPattern: z.array(z.string()),
  churnProbability: z.number().min(0).max(1),
  timeToChurn: z.number().min(0),
  affectedUsers: z.number().min(0),
  preventable: z.boolean(),
  priority: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  interventions: z.array(z.string()).optional(),
});

/**
 * Churn driver type
 */
export type ChurnDriver = z.infer<typeof ChurnDriverSchema>;

/**
 * Schema for funnel step
 */
export const FunnelStepSchema = z.object({
  step: z.string(),
  entered: z.number().min(0),
  completed: z.number().min(0),
  abandoned: z.number().min(0),
  conversionRate: z.number().min(0).max(1),
  avgTimeSpent: z.number().min(0),
  dropoffRate: z.number().min(0).max(1),
});

/**
 * Funnel step type
 */
export type FunnelStep = z.infer<typeof FunnelStepSchema>;

/**
 * Schema for funnel analysis
 */
export const FunnelAnalysisSchema = z.object({
  steps: z.array(FunnelStepSchema),
  overallConversion: z.number().min(0).max(1),
  totalUsers: z.number().min(0),
  completedUsers: z.number().min(0),
  biggestDropoff: z.object({
    step: z.string(),
    rate: z.number().min(0).max(1),
  }).optional(),
  recommendations: z.array(z.string()).optional(),
});

/**
 * Funnel analysis type
 */
export type FunnelAnalysis = z.infer<typeof FunnelAnalysisSchema>;

/**
 * Schema for aha moment
 */
export const AhaMomentSchema = z.object({
  action: z.string(),
  eventType: z.string(),
  timeToAha: z.number().min(0),
  retentionImpact: z.number().min(0).max(1),
  usersReached: z.number().min(0),
  usersNotReached: z.number().min(0),
  confidence: z.number().min(0).max(1),
  description: z.string(),
});

/**
 * Aha moment type
 */
export type AhaMoment = z.infer<typeof AhaMomentSchema>;

/**
 * Schema for correlation result
 */
export const CorrelationResultSchema = z.object({
  action: z.string(),
  metric: z.string(),
  correlation: z.number().min(-1).max(1),
  pValue: z.number().min(0).max(1),
  sampleSize: z.number().min(0),
  significant: z.boolean(),
});

/**
 * Correlation result type
 */
export type CorrelationResult = z.infer<typeof CorrelationResultSchema>;

/**
 * Schema for cohort
 */
export const CohortSchema = z.object({
  id: z.string(),
  name: z.string(),
  userIds: z.array(z.string()),
  criteria: z.record(z.unknown()),
  metrics: z.record(z.number()),
});

/**
 * Cohort type
 */
export type Cohort = z.infer<typeof CohortSchema>;

/**
 * Schema for cohort comparison
 */
export const CohortComparisonSchema = z.object({
  cohortA: CohortSchema,
  cohortB: CohortSchema,
  metricDifferences: z.record(z.object({
    cohortAValue: z.number(),
    cohortBValue: z.number(),
    difference: z.number(),
    percentChange: z.number(),
    significant: z.boolean(),
  })),
});

/**
 * Cohort comparison type
 */
export type CohortComparison = z.infer<typeof CohortComparisonSchema>;

/**
 * Schema for time series data point
 */
export const TimeSeriesDataPointSchema = z.object({
  timestamp: z.date(),
  value: z.number(),
});

/**
 * Time series data point type
 */
export type TimeSeriesDataPoint = z.infer<typeof TimeSeriesDataPointSchema>;

/**
 * Schema for time series analysis
 */
export const TimeSeriesAnalysisSchema = z.object({
  metric: z.string(),
  data: z.array(TimeSeriesDataPointSchema),
  trend: z.enum(['increasing', 'decreasing', 'stable', 'volatile']),
  changeRate: z.number(),
  anomalies: z.array(z.object({
    timestamp: z.date(),
    value: z.number(),
    expectedValue: z.number(),
    deviation: z.number(),
  })).optional(),
});

/**
 * Time series analysis type
 */
export type TimeSeriesAnalysis = z.infer<typeof TimeSeriesAnalysisSchema>;

/**
 * Schema for survival analysis
 */
export const SurvivalAnalysisSchema = z.object({
  timePoints: z.array(z.number()),
  survivalRates: z.array(z.number().min(0).max(1)),
  medianSurvivalTime: z.number().min(0).optional(),
  churnRate: z.number().min(0).max(1),
  halfLife: z.number().min(0).optional(),
});

/**
 * Survival analysis type
 */
export type SurvivalAnalysis = z.infer<typeof SurvivalAnalysisSchema>;

/**
 * Schema for insight
 */
export const InsightSchema = z.object({
  type: z.enum(['friction', 'value', 'churn', 'opportunity']),
  title: z.string(),
  description: z.string(),
  impact: z.number().min(0).max(1),
  effort: z.number().min(0).max(1),
  priority: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  data: z.unknown(),
  recommendations: z.array(z.string()),
});

/**
 * Insight type
 */
export type Insight = z.infer<typeof InsightSchema>;
