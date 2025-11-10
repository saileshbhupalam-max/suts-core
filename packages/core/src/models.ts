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
