/**
 * RGS CLI - Validation Utilities
 *
 * Zod schemas for validating CLI options.
 */

import { z } from 'zod';

/**
 * Schema for scrape command options
 */
export const scrapeOptionsSchema = z.object({
  sources: z.array(z.string()).min(1, 'At least one source must be specified'),
  subreddits: z.array(z.string()).optional(),
  limit: z.number().int().positive().optional(),
  output: z.string().min(1, 'Output path is required'),
});

export type ScrapeOptions = z.infer<typeof scrapeOptionsSchema>;

/**
 * Schema for analyze command options
 */
export const analyzeOptionsSchema = z.object({
  input: z.string().min(1, 'Input path is required'),
  output: z.string().min(1, 'Output path is required'),
  skipSentiment: z.boolean().optional(),
  skipThemes: z.boolean().optional(),
});

export type AnalyzeOptions = z.infer<typeof analyzeOptionsSchema>;

/**
 * Schema for run command options
 */
export const runOptionsSchema = z.object({
  config: z.string().min(1, 'Config path is required'),
  output: z.string().min(1, 'Output path is required'),
});

export type RunOptions = z.infer<typeof runOptionsSchema>;

/**
 * Validate options with a Zod schema
 */
export function validateOptions<T>(schema: z.ZodSchema<T>, options: unknown): T {
  try {
    return schema.parse(options);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(`Invalid options:\n${messages}`);
    }
    throw error;
  }
}
