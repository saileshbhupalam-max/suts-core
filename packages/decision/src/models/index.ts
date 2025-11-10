/**
 * Data models for the decision system
 */

import { z } from 'zod';

/**
 * Analysis result from the analysis package
 */
export const AnalysisResultSchema = z.object({
  id: z.string(),
  type: z.enum(['retention', 'churn', 'growth', 'revenue', 'ux', 'performance']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  title: z.string(),
  description: z.string(),
  affectedUsers: z.number().min(0),
  potentialImpact: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.unknown()),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/**
 * Product change for impact prediction
 */
export const ProductChangeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['feature', 'fix', 'improvement', 'experiment']),
  estimatedEffort: z.number().min(0),
  targetMetrics: z.array(z.string()),
  expectedReach: z.number().min(0),
  metadata: z.record(z.unknown()).optional(),
});

export type ProductChange = z.infer<typeof ProductChangeSchema>;

/**
 * Simulation metrics for go/no-go decision
 */
export const SimulationMetricsSchema = z.object({
  retentionRate: z.number().min(0).max(1),
  churnRate: z.number().min(0).max(1),
  growthRate: z.number().min(-1).max(1),
  avgSessionDuration: z.number().min(0),
  userSatisfaction: z.number().min(0).max(1),
  conversionRate: z.number().min(0).max(1),
  revenuePerUser: z.number().min(0),
  npsScore: z.number().min(-100).max(100),
  confidenceLevel: z.number().min(0).max(1),
  sampleSize: z.number().int().min(0),
});

export type SimulationMetrics = z.infer<typeof SimulationMetricsSchema>;

/**
 * Prioritized insight with scoring
 */
export const PrioritizedInsightSchema = z.object({
  insight: AnalysisResultSchema,
  priorityScore: z.number().min(0),
  impactScore: z.number().min(0).max(1),
  effortScore: z.number().min(0),
  iceScore: z.number().min(0),
  riceScore: z.number().min(0),
  reach: z.number().min(0),
  ranking: z.number().int().min(1),
  reasoning: z.string(),
});

export type PrioritizedInsight = z.infer<typeof PrioritizedInsightSchema>;

/**
 * Experiment design for A/B testing
 */
export const ExperimentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  hypothesis: z.string(),
  targetMetric: z.string(),
  controlGroup: z.object({
    name: z.string(),
    size: z.number().min(0).max(1),
    description: z.string(),
  }),
  treatmentGroups: z.array(
    z.object({
      name: z.string(),
      size: z.number().min(0).max(1),
      description: z.string(),
      changes: z.array(z.string()),
    })
  ),
  minimumSampleSize: z.number().int().min(1),
  expectedDuration: z.number().min(0),
  successCriteria: z.array(z.string()),
  risks: z.array(z.string()),
  estimatedLift: z.number(),
});

export type Experiment = z.infer<typeof ExperimentSchema>;

/**
 * Impact prediction for a change
 */
export const ImpactPredictionSchema = z.object({
  changeId: z.string(),
  predictedRetentionChange: z.number().min(-1).max(1),
  predictedChurnChange: z.number().min(-1).max(1),
  predictedGrowthChange: z.number().min(-1).max(1),
  predictedRevenueChange: z.number(),
  confidenceLevel: z.number().min(0).max(1),
  affectedUserCount: z.number().int().min(0),
  timeToImpact: z.number().min(0),
  risks: z.array(
    z.object({
      type: z.string(),
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      probability: z.number().min(0).max(1),
      description: z.string(),
    })
  ),
  opportunities: z.array(
    z.object({
      type: z.string(),
      magnitude: z.number().min(0).max(1),
      probability: z.number().min(0).max(1),
      description: z.string(),
    })
  ),
});

export type ImpactPrediction = z.infer<typeof ImpactPredictionSchema>;

/**
 * Go/No-Go decision result
 */
export const GoNoGoResultSchema = z.object({
  decision: z.enum(['GO', 'NO_GO', 'CONDITIONAL']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  passedCriteria: z.array(z.string()),
  failedCriteria: z.array(z.string()),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
  thresholds: z.record(z.object({
    expected: z.number(),
    actual: z.number(),
    passed: z.boolean(),
  })),
});

export type GoNoGoResult = z.infer<typeof GoNoGoResultSchema>;

/**
 * Decision configuration
 */
export const DecisionConfigSchema = z.object({
  prioritization: z.object({
    impactWeight: z.number().min(0).max(1),
    confidenceWeight: z.number().min(0).max(1),
    effortWeight: z.number().min(0).max(1),
    reachWeight: z.number().min(0).max(1),
  }).optional(),
  thresholds: z.object({
    minRetentionRate: z.number().min(0).max(1),
    maxChurnRate: z.number().min(0).max(1),
    minConfidence: z.number().min(0).max(1),
    minSampleSize: z.number().int().min(1),
  }).optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
});

export type DecisionConfig = z.infer<typeof DecisionConfigSchema>;
