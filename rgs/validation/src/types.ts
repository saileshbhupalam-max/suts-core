/**
 * Type definitions for the RGS Validation Framework
 * Defines interfaces for A/B testing SUTS accuracy improvements
 */

import { z } from 'zod';
import type { PersonaProfile } from '../../../packages/core/src/models/PersonaProfile';

/**
 * CalibratedPersona - PersonaProfile enhanced with RGS grounding data
 */
export const CalibratedPersonaSchema = z.object({
  // Base PersonaProfile fields
  id: z.string().min(1),
  archetype: z.string().min(1),
  role: z.string().min(1),
  experienceLevel: z.enum(['Novice', 'Intermediate', 'Expert']),
  companySize: z.enum(['Startup', 'SMB', 'Enterprise']),
  techStack: z.array(z.string()).min(1),
  painPoints: z.array(z.string()),
  goals: z.array(z.string()),
  fears: z.array(z.string()),
  values: z.array(z.string()),
  riskTolerance: z.number().min(0).max(1),
  patienceLevel: z.number().min(0).max(1),
  techAdoption: z.enum(['Early adopter', 'Early majority', 'Late majority', 'Laggard']),
  learningStyle: z.enum(['Trial-error', 'Documentation', 'Video', 'Peer learning']),
  evaluationCriteria: z.array(z.string()),
  dealBreakers: z.array(z.string()),
  delightTriggers: z.array(z.string()),
  referralTriggers: z.array(z.string()),
  typicalWorkflow: z.string().min(1),
  timeAvailability: z.string().min(1),
  collaborationStyle: z.enum(['Solo', 'Team', 'Community-driven']),
  state: z.record(z.unknown()).default({}),
  history: z.array(z.record(z.unknown())).default([]),
  confidenceScore: z.number().min(0).max(1).default(0.5),
  lastUpdated: z.string().datetime(),
  source: z.string().min(1),

  // RGS Calibration Extensions
  calibrationData: z.object({
    signalCount: z.number().min(0),
    sources: z.array(z.string()),
    sentimentScore: z.number().min(-1).max(1),
    themes: z.array(z.string()),
    groundingQuality: z.number().min(0).max(1),
    lastCalibrated: z.string().datetime(),
  }),
});

export type CalibratedPersona = z.infer<typeof CalibratedPersonaSchema>;

/**
 * SUTS Test Result - Output from running SUTS simulation
 */
export const SUTSResultSchema = z.object({
  testId: z.string().min(1),
  timestamp: z.string().datetime(),
  predictions: z.object({
    positioning: z.object({
      personaId: z.string(),
      predictedResponse: z.string(),
      confidence: z.number().min(0).max(1),
      reasoning: z.string(),
    }).array(),
    retention: z.object({
      personaId: z.string(),
      predictedRetention: z.number().min(0).max(1),
      timeframe: z.string(),
      reasoning: z.string(),
    }).array(),
    viral: z.object({
      personaId: z.string(),
      predictedViralCoefficient: z.number().min(0),
      channels: z.array(z.string()),
      reasoning: z.string(),
    }).array(),
  }),
  metadata: z.object({
    personaCount: z.number().min(0),
    testDuration: z.string(),
    sutsVersion: z.string(),
  }),
});

export type SUTSResult = z.infer<typeof SUTSResultSchema>;

/**
 * Actual behavior data for validation comparison
 */
export const ActualDataSchema = z.object({
  positioning: z.object({
    personaId: z.string(),
    actualResponse: z.string(),
    wasAccurate: z.boolean(),
  }).array(),
  retention: z.object({
    personaId: z.string(),
    actualRetention: z.number().min(0).max(1),
    timeframe: z.string(),
  }).array(),
  viral: z.object({
    personaId: z.string(),
    actualViralCoefficient: z.number().min(0),
    channels: z.array(z.string()),
  }).array(),
});

export type ActualData = z.infer<typeof ActualDataSchema>;

/**
 * Breakdown of accuracy by category
 */
export const AccuracyBreakdownSchema = z.object({
  positioning: z.object({
    base: z.number().min(0).max(100),
    grounded: z.number().min(0).max(100),
  }),
  retention: z.object({
    base: z.number().min(0).max(100),
    grounded: z.number().min(0).max(100),
  }),
  viral: z.object({
    base: z.number().min(0).max(100),
    grounded: z.number().min(0).max(100),
  }),
});

export type AccuracyBreakdown = z.infer<typeof AccuracyBreakdownSchema>;

/**
 * Validation Result - Complete A/B test outcome
 */
export const ValidationResultSchema = z.object({
  baseAccuracy: z.number().min(0).max(100),
  groundedAccuracy: z.number().min(0).max(100),
  improvement: z.number(),
  confidence: z.number().min(0).max(1),
  breakdown: AccuracyBreakdownSchema,
  sampleSize: z.number().min(1),
  testDuration: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.object({
    baseTestId: z.string(),
    groundedTestId: z.string(),
    validatorVersion: z.string(),
  }),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * Test Configuration
 */
export const TestConfigSchema = z.object({
  sampleSize: z.number().min(1).default(50),
  confidenceLevel: z.number().min(0).max(1).default(0.95),
  timeout: z.number().min(1000).default(300000), // 5 minutes default
  sutsVersion: z.string().default('1.0.0'),
  enableParallel: z.boolean().default(false),
  retryAttempts: z.number().min(0).default(3),
});

export type TestConfig = z.infer<typeof TestConfigSchema>;

/**
 * Validation errors
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SimulatorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SimulatorError';
  }
}

export class MetricsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MetricsError';
  }
}

/**
 * Validate PersonaProfile against schema
 */
export function validatePersonaProfile(data: unknown): PersonaProfile {
  // Simplified validation - in real implementation would use full schema
  if (data === null || data === undefined) {
    throw new ValidationError('PersonaProfile cannot be null or undefined', 'INVALID_PERSONA');
  }
  return data as PersonaProfile;
}

/**
 * Validate CalibratedPersona against schema
 */
export function validateCalibratedPersona(data: unknown): CalibratedPersona {
  return CalibratedPersonaSchema.parse(data);
}

/**
 * Safely validate CalibratedPersona without throwing
 */
export function safeValidateCalibratedPersona(
  data: unknown
): z.SafeParseReturnType<unknown, CalibratedPersona> {
  return CalibratedPersonaSchema.safeParse(data);
}
