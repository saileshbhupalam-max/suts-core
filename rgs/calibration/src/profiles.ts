/**
 * RGS Calibration - Calibrated Persona Profiles
 *
 * Generates CalibratedPersona objects by combining base personas with RGS-grounded traits.
 */

import { PersonaProfile } from '@suts/core';
import { z } from 'zod';
import { PersonaTrait } from './traits';
import { calculateAverageConfidence } from './merger';

/**
 * CalibratedPersona extends PersonaProfile with grounding metadata
 */
export interface CalibratedPersona extends PersonaProfile {
  /**
   * Traits extracted from RGS insights
   */
  readonly groundedTraits: PersonaTrait[];

  /**
   * Overall confidence in the calibration (0-1)
   */
  readonly confidence: number;

  /**
   * Number of signals used for calibration
   */
  readonly signalCount: number;

  /**
   * Sources of the signals (e.g., 'reddit', 'twitter', 'github')
   */
  readonly sources: string[];

  /**
   * Timestamp when calibration was performed
   */
  readonly calibratedAt: Date;
}

/**
 * Zod schema for CalibratedPersona validation
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

  // Calibration-specific fields
  groundedTraits: z.array(
    z.object({
      category: z.enum(['demographic', 'psychographic', 'behavioral', 'linguistic']),
      name: z.string(),
      value: z.union([z.string(), z.array(z.string()), z.number()]),
      confidence: z.number().min(0).max(1),
      source: z.string(),
    }),
  ),
  confidence: z.number().min(0).max(1),
  signalCount: z.number().min(0),
  sources: z.array(z.string()),
  calibratedAt: z.date(),
});

/**
 * Custom error for profile generation failures
 */
export class ProfileGenerationError extends Error {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ProfileGenerationError';
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/**
 * Creates a CalibratedPersona from a base persona and grounded traits
 *
 * @param basePersona - The base PersonaProfile to calibrate
 * @param groundedTraits - Traits extracted from RGS insights
 * @param signalCount - Number of signals used for calibration
 * @param sources - Array of source identifiers
 * @returns CalibratedPersona object
 * @throws ProfileGenerationError if generation fails
 */
export function createCalibratedPersona(
  basePersona: PersonaProfile,
  groundedTraits: PersonaTrait[],
  signalCount: number,
  sources: string[],
): CalibratedPersona {
  try {
    // Validate inputs
    if (signalCount < 0) {
      throw new ProfileGenerationError('Signal count must be non-negative');
    }

    if (sources.length === 0) {
      throw new ProfileGenerationError('At least one source is required');
    }

    // Calculate overall confidence
    const confidence = calculateOverallConfidence(basePersona, groundedTraits);

    // Apply grounded traits to enhance the base persona
    const enhancedPersona = applyGroundedTraits(basePersona, groundedTraits);

    // Build the calibrated persona
    const calibratedPersona: CalibratedPersona = {
      ...enhancedPersona,
      groundedTraits,
      confidence,
      signalCount,
      sources: [...new Set(sources)], // Deduplicate sources
      calibratedAt: new Date(),
    };

    return calibratedPersona;
  } catch (error) {
    if (error instanceof ProfileGenerationError) {
      throw error;
    }
    throw new ProfileGenerationError(
      'Failed to create calibrated persona',
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Calculates overall confidence for a calibrated persona
 *
 * @param basePersona - Base PersonaProfile
 * @param groundedTraits - Grounded traits from RGS
 * @returns Overall confidence score (0-1)
 */
function calculateOverallConfidence(
  basePersona: PersonaProfile,
  groundedTraits: PersonaTrait[],
): number {
  if (groundedTraits.length === 0) {
    // No grounding data - return base confidence
    return basePersona.confidenceScore;
  }

  // Calculate average confidence from grounded traits
  const groundedConfidence = calculateAverageConfidence(groundedTraits);

  // Weighted average: 40% base, 60% grounded (RGS data has more weight)
  const overallConfidence = basePersona.confidenceScore * 0.4 + groundedConfidence * 0.6;

  return Math.min(1, Math.max(0, overallConfidence)); // Clamp to [0, 1]
}

/**
 * Applies grounded traits to enhance the base persona
 *
 * @param basePersona - Base PersonaProfile
 * @param groundedTraits - Grounded traits to apply
 * @returns Enhanced PersonaProfile
 */
function applyGroundedTraits(
  basePersona: PersonaProfile,
  groundedTraits: PersonaTrait[],
): PersonaProfile {
  // Create a copy of the base persona
  const enhanced: PersonaProfile = {
    ...basePersona,
    lastUpdated: new Date().toISOString(),
  };

  // Extract pain points from grounded traits
  const groundedPainPoints = groundedTraits
    .filter((t) => t.name === 'painPoint' && typeof t.value === 'string')
    .map((t) => t.value as string);

  if (groundedPainPoints.length > 0) {
    // Merge with existing pain points, deduplicating
    enhanced.painPoints = [...new Set([...enhanced.painPoints, ...groundedPainPoints])];
  }

  // Extract desires (goals) from grounded traits
  const groundedDesires = groundedTraits
    .filter((t) => t.name === 'desire' && typeof t.value === 'string')
    .map((t) => t.value as string);

  if (groundedDesires.length > 0) {
    // Merge with existing goals, deduplicating
    enhanced.goals = [...new Set([...enhanced.goals, ...groundedDesires])];
  }

  return enhanced;
}

/**
 * Validates a CalibratedPersona object
 *
 * @param persona - CalibratedPersona to validate
 * @returns True if valid
 * @throws ProfileGenerationError if validation fails
 */
export function validateCalibratedPersona(persona: CalibratedPersona): boolean {
  try {
    CalibratedPersonaSchema.parse({
      ...persona,
      calibratedAt: persona.calibratedAt,
    });
    return true;
  } catch (error) {
    throw new ProfileGenerationError(
      'Calibrated persona validation failed',
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Extracts unique sources from an array of traits
 *
 * @param traits - Array of PersonaTrait
 * @returns Array of unique source identifiers
 */
export function extractUniqueSources(traits: PersonaTrait[]): string[] {
  const sources = new Set<string>();
  for (const trait of traits) {
    sources.add(trait.source);
  }
  return Array.from(sources);
}
