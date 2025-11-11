/**
 * RGS Core - Scraper Zod Schemas
 *
 * Zod validation schemas for scraper configurations.
 */

import { z } from 'zod';
import { SourceConfigSchema } from './source.schema';
import { WebSignalSchema } from './signal.schema';

/**
 * Schema for ScrapeConfig
 */
export const ScrapeConfigSchema = SourceConfigSchema.extend({
  rateLimit: z.number().positive().optional(),
  maxRetries: z.number().nonnegative().optional(),
  timeout: z.number().positive().optional(),
  includeMetadata: z.boolean().optional(),
});

/**
 * Schema for ScrapeResult metadata
 */
export const ScrapeResultMetadataSchema = z.object({
  startTime: z.date(),
  endTime: z.date(),
  durationMs: z.number().nonnegative(),
});

/**
 * Schema for ScrapeResult
 */
export const ScrapeResultSchema = z.object({
  signals: z.array(WebSignalSchema),
  count: z.number().nonnegative(),
  errors: z.array(z.instanceof(Error)),
  success: z.boolean(),
  metadata: ScrapeResultMetadataSchema,
});

/**
 * Type inference from schemas
 */
export type ScrapeConfigSchemaType = z.infer<typeof ScrapeConfigSchema>;
export type ScrapeResultSchemaType = z.infer<typeof ScrapeResultSchema>;
export type ScrapeResultMetadataSchemaType = z.infer<typeof ScrapeResultMetadataSchema>;
