/**
 * Validation utilities for persona generation
 * Validates personas against schema and checks for diversity
 */

import { PersonaProfileSchema, type PersonaProfile } from '@suts/core';
import { ZodError } from 'zod';

/**
 * Validation result for a single persona
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Diversity analysis result
 */
export interface DiversityResult {
  diversityScore: number;
  averageSimilarity: number;
  similarPairs: Array<{
    personaId1: string;
    personaId2: string;
    similarity: number;
    reasons: string[];
  }>;
  meetsTarget: boolean;
}

/**
 * Validate a persona against the schema
 * @param persona - Persona to validate
 * @returns Validation result
 */
export function validatePersona(persona: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    PersonaProfileSchema.parse(persona);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      errors.push(...error.errors.map((e: { path: Array<string | number>; message: string }) => `${e.path.join('.')}: ${e.message}`));
    } else {
      errors.push('Unknown validation error');
    }
    return { valid: false, errors, warnings };
  }

  // Additional validation checks
  const p = persona as PersonaProfile;

  // Check confidence score
  if (p.confidenceScore < 0.5) {
    warnings.push(`Low confidence score: ${p.confidenceScore}`);
  }

  // Check array lengths
  if (p.techStack.length < 3 || p.techStack.length > 8) {
    warnings.push(`techStack should have 3-8 items, has ${p.techStack.length}`);
  }
  if (p.painPoints.length < 3 || p.painPoints.length > 6) {
    warnings.push(`painPoints should have 3-6 items, has ${p.painPoints.length}`);
  }
  if (p.goals.length < 3 || p.goals.length > 5) {
    warnings.push(`goals should have 3-5 items, has ${p.goals.length}`);
  }

  // Check for empty strings
  const stringFields = [
    'archetype', 'role', 'typicalWorkflow', 'timeAvailability'
  ] as const;
  for (const field of stringFields) {
    if (p[field].length === 0 || p[field].trim().length === 0) {
      errors.push(`${field} cannot be empty`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate multiple personas
 * @param personas - Array of personas to validate
 * @returns Map of persona IDs to validation results
 */
export function validatePersonas(
  personas: unknown[]
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();

  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    const id = typeof persona === 'object' && persona !== null && 'id' in persona
      ? String(persona.id)
      : `persona-${i}`;
    results.set(id, validatePersona(persona));
  }

  return results;
}

/**
 * Check for duplicate personas (by ID)
 * @param personas - Array of personas
 * @returns Array of duplicate IDs
 */
export function checkDuplicates(personas: PersonaProfile[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const persona of personas) {
    if (seen.has(persona.id)) {
      duplicates.push(persona.id);
    }
    seen.add(persona.id);
  }

  return duplicates;
}

/**
 * Calculate Jaccard similarity between two arrays
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns Similarity score (0-1)
 */
function jaccardSimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) {
    return 1;
  }
  if (arr1.length === 0 || arr2.length === 0) {
    return 0;
  }

  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Calculate similarity between two personas
 * @param p1 - First persona
 * @param p2 - Second persona
 * @returns Similarity score (0-1) and reasons for similarity
 */
export function calculateSimilarity(
  p1: PersonaProfile,
  p2: PersonaProfile
): { similarity: number; reasons: string[] } {
  let totalSimilarity = 0;
  const reasons: string[] = [];

  // Categorical fields (10% each if match)
  const categoricalFields: Array<keyof PersonaProfile> = [
    'experienceLevel',
    'companySize',
    'techAdoption',
    'learningStyle',
    'collaborationStyle',
  ];

  for (const field of categoricalFields) {
    if (p1[field] === p2[field]) {
      totalSimilarity += 0.1;
      reasons.push(`Same ${String(field)}: ${String(p1[field])}`);
    }
  }

  // Numerical fields
  const riskDiff = Math.abs(p1.riskTolerance - p2.riskTolerance);
  const patienceDiff = Math.abs(p1.patienceLevel - p2.patienceLevel);

  const riskSimilarity = 1 - riskDiff;
  const patienceSimilarity = 1 - patienceDiff;

  totalSimilarity += (riskSimilarity * 0.05);
  totalSimilarity += (patienceSimilarity * 0.05);

  if (riskDiff < 0.2) {
    reasons.push(`Similar risk tolerance: ${p1.riskTolerance.toFixed(2)} vs ${p2.riskTolerance.toFixed(2)}`);
  }

  // Array fields with weights
  const arrayFields: Array<{ field: keyof PersonaProfile; weight: number }> = [
    { field: 'painPoints', weight: 0.15 },
    { field: 'goals', weight: 0.15 },
    { field: 'techStack', weight: 0.10 },
    { field: 'values', weight: 0.10 },
    { field: 'fears', weight: 0.05 },
    { field: 'evaluationCriteria', weight: 0.05 },
    { field: 'dealBreakers', weight: 0.05 },
    { field: 'delightTriggers', weight: 0.05 },
  ];

  for (const { field, weight } of arrayFields) {
    const arr1 = p1[field] as string[];
    const arr2 = p2[field] as string[];
    const jaccard = jaccardSimilarity(arr1, arr2);
    totalSimilarity += jaccard * weight;

    if (jaccard > 0.4) {
      reasons.push(`Overlapping ${String(field)}: ${(jaccard * 100).toFixed(0)}% similar`);
    }
  }

  return {
    similarity: Math.min(totalSimilarity, 1),
    reasons: reasons.slice(0, 5), // Keep top 5 reasons
  };
}

/**
 * Analyze diversity of persona set
 * @param personas - Array of personas
 * @returns Diversity analysis result
 */
export function analyzeDiversity(personas: PersonaProfile[]): DiversityResult {
  if (personas.length < 2) {
    return {
      diversityScore: 1,
      averageSimilarity: 0,
      similarPairs: [],
      meetsTarget: true,
    };
  }

  const similarities: number[] = [];
  const similarPairs: DiversityResult['similarPairs'] = [];

  // Calculate pairwise similarities
  for (let i = 0; i < personas.length; i++) {
    for (let j = i + 1; j < personas.length; j++) {
      const persona1 = personas[i];
      const persona2 = personas[j];
      if (persona1 === undefined || persona2 === undefined) {
        continue;
      }
      const { similarity, reasons } = calculateSimilarity(persona1, persona2);
      similarities.push(similarity);

      // Flag pairs with >35% similarity as too similar
      if (similarity > 0.35) {
        similarPairs.push({
          personaId1: persona1.id,
          personaId2: persona2.id,
          similarity,
          reasons,
        });
      }
    }
  }

  const averageSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
  const diversityScore = 1 - averageSimilarity;

  return {
    diversityScore,
    averageSimilarity,
    similarPairs,
    meetsTarget: diversityScore > 0.70, // Target: >70% diversity (<30% similarity)
  };
}

/**
 * Calculate confidence score based on analysis quality
 * @param analysisText - Stakeholder analysis text
 * @param persona - Generated persona
 * @returns Confidence score (0-1)
 */
export function calculateConfidenceScore(
  analysisText: string,
  persona: PersonaProfile
): number {
  let confidence = 0.5; // Base confidence

  // Check if key persona elements appear in analysis
  const analysisLower = analysisText.toLowerCase();

  // Role mentioned
  if (analysisLower.includes(persona.role.toLowerCase())) {
    confidence += 0.1;
  }

  // Pain points grounded in analysis
  const painPointMatches = persona.painPoints.filter((pp: string) =>
    analysisLower.includes(pp.toLowerCase().split(' ').slice(0, 3).join(' '))
  );
  confidence += Math.min(painPointMatches.length * 0.05, 0.15);

  // Goals grounded in analysis
  const goalMatches = persona.goals.filter((g: string) =>
    analysisLower.includes(g.toLowerCase().split(' ').slice(0, 3).join(' '))
  );
  confidence += Math.min(goalMatches.length * 0.05, 0.15);

  // Tech stack mentioned
  const techMatches = persona.techStack.filter((tech: string) =>
    analysisLower.includes(tech.toLowerCase())
  );
  confidence += Math.min(techMatches.length * 0.02, 0.10);

  return Math.min(confidence, 1.0);
}
