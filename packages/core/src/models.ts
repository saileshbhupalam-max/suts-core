/**
 * Core data models for SUTS
 */

import { z } from 'zod';

/**
 * Emotional state schema
 */
export const EmotionalStateSchema = z.object({
  frustration: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  delight: z.number().min(0).max(1),
  confusion: z.number().min(0).max(1),
});

/**
 * Simulation event schema
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

export type SimulationEvent = z.infer<typeof SimulationEventSchema>;
