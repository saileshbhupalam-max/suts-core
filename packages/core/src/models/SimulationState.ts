/**
 * SimulationState Data Model
 * Represents the current state of a simulation including users, events, and metrics
 */

import { z } from 'zod';

/**
 * Zod schema for SimulationState
 * Tracks the complete state of an ongoing or completed simulation
 */
export const SimulationStateSchema = z.object({
  id: z.string().min(1, 'Simulation ID is required'),
  configId: z.string().min(1, 'Config ID is required'),
  status: z.enum(['pending', 'running', 'paused', 'completed', 'failed']),

  // Timing
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  lastUpdateTime: z.string().datetime(),

  // Progress
  currentSession: z.number().int().min(0),
  totalSessions: z.number().int().min(1),
  completedSessions: z.number().int().min(0),

  // Participants
  activePersonaIds: z.array(z.string()),
  churnedPersonaIds: z.array(z.string()).default([]),
  totalPersonas: z.number().int().min(1),

  // Metrics
  metrics: z.object({
    totalEvents: z.number().int().min(0).default(0),
    totalActions: z.number().int().min(0).default(0),
    averageFrustration: z.number().min(0).max(1).default(0.5),
    averageDelight: z.number().min(0).max(1).default(0.5),
    averageConfidence: z.number().min(0).max(1).default(0.5),
    averageConfusion: z.number().min(0).max(1).default(0.5),
    retentionRate: z.number().min(0).max(1).default(1),
    referralCount: z.number().int().min(0).default(0),
  }),

  // Runtime State
  errors: z.array(z.object({
    timestamp: z.string().datetime(),
    personaId: z.string().optional(),
    error: z.string(),
    stack: z.string().optional(),
  })).default([]),

  metadata: z.record(z.unknown()).default({}),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type SimulationState = z.infer<typeof SimulationStateSchema>;

/**
 * Validate and parse simulation state data
 * @param data - Raw simulation state to validate
 * @returns Validated SimulationState
 * @throws ZodError if validation fails
 */
export function validateSimulationState(data: unknown): SimulationState {
  return SimulationStateSchema.parse(data);
}

/**
 * Safely validate simulation state data without throwing
 * @param data - Raw simulation state to validate
 * @returns Validation result with data or error
 */
export function safeValidateSimulationState(data: unknown): z.SafeParseReturnType<unknown, SimulationState> {
  return SimulationStateSchema.safeParse(data);
}
