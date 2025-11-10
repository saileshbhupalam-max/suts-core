/**
 * TelemetryEvent Data Model
 * Represents individual events tracked during simulation (actions, emotions, decisions)
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

export type EmotionalState = z.infer<typeof EmotionalStateSchema>;

/**
 * Event type enumeration
 */
export const EventTypeSchema = z.enum([
  'action',
  'observation',
  'decision',
  'emotion',
  'error',
  'milestone',
]);

export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * Zod schema for TelemetryEvent
 * Captures every action, emotion, and decision during simulation
 */
export const TelemetryEventSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
  personaId: z.string().min(1, 'Persona ID is required'),
  simulationId: z.string().min(1, 'Simulation ID is required'),
  sessionNumber: z.number().int().min(1),

  // Timing
  timestamp: z.string().datetime(),
  elapsedTimeMs: z.number().int().min(0).optional(),

  // Event Details
  eventType: EventTypeSchema,
  action: z.string().optional(),
  context: z.record(z.unknown()).default({}),
  reasoning: z.string().optional(),
  emotionalState: EmotionalStateSchema.optional(),

  // Product State
  productVersion: z.string().optional(),
  featureUsed: z.string().optional(),

  // Metadata
  metadata: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

/**
 * Validate and parse telemetry event data
 * @param data - Raw event data to validate
 * @returns Validated TelemetryEvent
 * @throws ZodError if validation fails
 */
export function validateTelemetryEvent(data: unknown): TelemetryEvent {
  return TelemetryEventSchema.parse(data);
}

/**
 * Safely validate telemetry event data without throwing
 * @param data - Raw event data to validate
 * @returns Validation result with data or error
 */
export function safeValidateTelemetryEvent(data: unknown): z.SafeParseReturnType<unknown, TelemetryEvent> {
  return TelemetryEventSchema.safeParse(data);
}
