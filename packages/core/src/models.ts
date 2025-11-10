/**
 * Core data models for SUTS
 * @deprecated This file is kept for backwards compatibility. Use ./models/index.ts instead.
 */

import { z } from 'zod';

/**
 * Emotional state schema
 * @deprecated Use EmotionalStateSchema from ./models/TelemetryEvent.ts
 */
export const EmotionalStateSchema = z.object({
  frustration: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  delight: z.number().min(0).max(1),
  confusion: z.number().min(0).max(1),
});

/**
 * Simulation event schema
 * @deprecated Use TelemetryEventSchema from ./models/TelemetryEvent.ts
 */
export const SimulationEventSchema = z.object({
  id: z.string(),
  personaId: z.string(),
  timestamp: z.date(),
  eventType: z.enum(['action', 'observation', 'decision', 'emotion']),
  action: z.string().optional(),
  context: z.record(z.unknown()),
  reasoning: z.string().optional(),
  emotionalState: EmotionalStateSchema.optional(),
  metadata: z.record(z.unknown()),
});

/**
 * @deprecated Use TelemetryEvent from ./models/TelemetryEvent.ts
 */
export type SimulationEvent = z.infer<typeof SimulationEventSchema>;

/**
 * Persona profile schema
 */
export const PersonaProfileSchema = z.object({
  id: z.string(),
  archetype: z.string(),
  role: z.string(),
  experienceLevel: z.enum(['Novice', 'Intermediate', 'Expert']),
  companySize: z.enum(['Startup', 'SMB', 'Enterprise']),
  techStack: z.array(z.string()),
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
  typicalWorkflow: z.string(),
  timeAvailability: z.string(),
  collaborationStyle: z.enum(['Solo', 'Team', 'Community-driven']),
  state: z.record(z.unknown()),
  history: z.array(z.record(z.unknown())),
  confidenceScore: z.number().min(0).max(1),
  lastUpdated: z.string(),
  source: z.string(),
});

export type PersonaProfile = z.infer<typeof PersonaProfileSchema>;
