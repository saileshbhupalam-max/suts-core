/**
 * AnalysisResult Data Model
 * Contains insights from simulation analysis: friction points, value moments, viral triggers
 */

import { z } from 'zod';

/**
 * Friction point schema
 */
export const FrictionPointSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  affectedUsers: z.number().int().min(0),
  averageFrustration: z.number().min(0).max(1),
  rootCause: z.string().min(1, 'Root cause is required'),
  impact: z.string().min(1, 'Impact is required'),
  recommendedFix: z.string().min(1, 'Recommended fix is required'),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  rationale: z.string().min(1, 'Rationale is required'),
  userReasoning: z.array(z.string()).default([]),
});

export type FrictionPoint = z.infer<typeof FrictionPointSchema>;

/**
 * Value moment schema
 */
export const ValueMomentSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  affectedUsers: z.number().int().min(0),
  averageDelight: z.number().min(0).max(1),
  insight: z.string().min(1, 'Insight is required'),
  recommendation: z.string().min(1, 'Recommendation is required'),
  viralPotential: z.enum(['Low', 'Medium', 'High']),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  userReasoning: z.array(z.string()).default([]),
});

export type ValueMoment = z.infer<typeof ValueMomentSchema>;

/**
 * Viral trigger schema
 */
export const ViralTriggerSchema = z.object({
  trigger: z.string().min(1, 'Trigger is required'),
  frequency: z.number().int().min(0),
  conversionRate: z.number().min(0).max(1),
  description: z.string().min(1, 'Description is required'),
  recommendation: z.string().min(1, 'Recommendation is required'),
  estimatedKFactor: z.number().min(0).optional(),
});

export type ViralTrigger = z.infer<typeof ViralTriggerSchema>;

/**
 * Retention analysis schema
 */
export const RetentionAnalysisSchema = z.object({
  retentionCurve: z.array(z.object({
    day: z.number().int().min(1),
    retentionRate: z.number().min(0).max(1),
    activeUsers: z.number().int().min(0),
  })),
  medianLtvDays: z.number().min(0),
  churnMoments: z.array(z.object({
    day: z.number().int().min(1),
    churnRate: z.number().min(0).max(1),
    reasons: z.array(z.string()),
  })).default([]),
});

export type RetentionAnalysis = z.infer<typeof RetentionAnalysisSchema>;

/**
 * Zod schema for AnalysisResult
 * Contains comprehensive analysis of simulation data
 */
export const AnalysisResultSchema = z.object({
  id: z.string().min(1, 'Analysis ID is required'),
  simulationId: z.string().min(1, 'Simulation ID is required'),
  analysisType: z.enum(['friction', 'value', 'retention', 'viral', 'comprehensive']),

  // Timestamp
  createdAt: z.string().datetime(),

  // Analysis Results
  frictionPoints: z.array(FrictionPointSchema).default([]),
  valueMoments: z.array(ValueMomentSchema).default([]),
  viralTriggers: z.array(ViralTriggerSchema).default([]),
  retentionAnalysis: RetentionAnalysisSchema.optional(),

  // Summary
  topInsights: z.array(z.string()).default([]),
  recommendedActions: z.array(z.object({
    action: z.string().min(1),
    priority: z.enum(['P0', 'P1', 'P2', 'P3']),
    estimatedImpact: z.string().min(1),
    effort: z.enum(['Low', 'Medium', 'High']),
  })).default([]),

  // Executive Summary
  executiveSummary: z.string().optional(),

  // Metadata
  metadata: z.record(z.unknown()).default({}),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/**
 * Validate and parse analysis result data
 * @param data - Raw analysis data to validate
 * @returns Validated AnalysisResult
 * @throws ZodError if validation fails
 */
export function validateAnalysisResult(data: unknown): AnalysisResult {
  return AnalysisResultSchema.parse(data);
}

/**
 * Safely validate analysis result data without throwing
 * @param data - Raw analysis data to validate
 * @returns Validation result with data or error
 */
export function safeValidateAnalysisResult(data: unknown): z.SafeParseReturnType<unknown, AnalysisResult> {
  return AnalysisResultSchema.safeParse(data);
}
