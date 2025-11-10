/**
 * Configuration schema definitions using Zod
 */

import { z } from 'zod';

/**
 * Simulation configuration schema
 */
export const SimulationConfigSchema = z.object({
  personas: z.number().int().positive().default(100),
  days: z.number().int().positive().default(7),
  product: z.string().min(1),
});

/**
 * Persona generation configuration schema
 */
export const PersonaConfigSchema = z.object({
  analysisFiles: z.array(z.string()).optional(),
  diversity: z.number().min(0).max(1).default(0.8),
});

/**
 * Output configuration schema
 */
export const OutputConfigSchema = z.object({
  directory: z.string().default('./suts-output'),
  format: z.enum(['json', 'csv', 'html']).default('json'),
  generateReport: z.boolean().default(true),
});

/**
 * Threshold configuration schema
 */
export const ThresholdConfigSchema = z.object({
  positioning: z.number().min(0).max(1).default(0.6),
  retention: z.number().min(0).max(1).default(0.8),
  viral: z.number().min(0).max(1).default(0.25),
});

/**
 * Complete simulation configuration schema
 */
export const SutsConfigSchema = z.object({
  simulation: SimulationConfigSchema,
  personas: PersonaConfigSchema.optional(),
  output: OutputConfigSchema.optional(),
  thresholds: ThresholdConfigSchema.optional(),
});

/**
 * Type inference for configuration
 */
export type SutsConfig = z.infer<typeof SutsConfigSchema>;
export type SimulationConfig = z.infer<typeof SimulationConfigSchema>;
export type PersonaConfig = z.infer<typeof PersonaConfigSchema>;
export type OutputConfig = z.infer<typeof OutputConfigSchema>;
export type ThresholdConfig = z.infer<typeof ThresholdConfigSchema>;
