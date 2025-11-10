/**
 * PersonaProfile Data Model
 * Represents a user persona with demographics, psychological traits, and behavioral patterns
 */

import { z } from 'zod';

/**
 * Zod schema for PersonaProfile
 * Validates all persona data with runtime type checking
 */
export const PersonaProfileSchema = z.object({
  id: z.string().min(1, 'Persona ID is required'),
  archetype: z.string().min(1, 'Archetype is required'),

  // Demographics & Context
  role: z.string().min(1, 'Role is required'),
  experienceLevel: z.enum(['Novice', 'Intermediate', 'Expert']),
  companySize: z.enum(['Startup', 'SMB', 'Enterprise']),
  techStack: z.array(z.string()).min(1, 'At least one technology is required'),

  // Psychological Profile
  painPoints: z.array(z.string()),
  goals: z.array(z.string()),
  fears: z.array(z.string()),
  values: z.array(z.string()),

  // Behavioral Traits
  riskTolerance: z.number().min(0).max(1),
  patienceLevel: z.number().min(0).max(1),
  techAdoption: z.enum(['Early adopter', 'Early majority', 'Late majority', 'Laggard']),
  learningStyle: z.enum(['Trial-error', 'Documentation', 'Video', 'Peer learning']),

  // Decision-Making
  evaluationCriteria: z.array(z.string()),
  dealBreakers: z.array(z.string()),
  delightTriggers: z.array(z.string()),
  referralTriggers: z.array(z.string()),

  // Usage Patterns
  typicalWorkflow: z.string().min(1, 'Typical workflow is required'),
  timeAvailability: z.string().min(1, 'Time availability is required'),
  collaborationStyle: z.enum(['Solo', 'Team', 'Community-driven']),

  // Memory & State
  state: z.record(z.unknown()).default({}),
  history: z.array(z.record(z.unknown())).default([]),

  // Metadata
  confidenceScore: z.number().min(0).max(1).default(0.5),
  lastUpdated: z.string().datetime(),
  source: z.string().min(1, 'Source is required'),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type PersonaProfile = z.infer<typeof PersonaProfileSchema>;

/**
 * Validate and parse persona profile data
 * @param data - Raw persona data to validate
 * @returns Validated PersonaProfile
 * @throws ZodError if validation fails
 */
export function validatePersonaProfile(data: unknown): PersonaProfile {
  return PersonaProfileSchema.parse(data);
}

/**
 * Safely validate persona profile data without throwing
 * @param data - Raw persona data to validate
 * @returns Validation result with data or error
 */
export function safeValidatePersonaProfile(data: unknown): z.SafeParseReturnType<unknown, PersonaProfile> {
  return PersonaProfileSchema.safeParse(data);
}
