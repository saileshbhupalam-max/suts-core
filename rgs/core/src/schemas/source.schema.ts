/**
 * RGS Core - Source Zod Schemas
 *
 * Zod validation schemas for source types and configurations.
 */

import { z } from 'zod';

/**
 * Schema for SourceType
 */
export const SourceTypeSchema = z.enum(['reddit', 'twitter', 'github', 'hackernews']);

/**
 * Schema for SourceConfig
 */
export const SourceConfigSchema = z.object({
  type: SourceTypeSchema,
  params: z.record(z.string()),
  maxItems: z.number().positive().optional(),
  timeRangeHours: z.number().positive().optional(),
});

/**
 * Schema for SourceMetadata
 */
export const SourceMetadataSchema = z.object({
  source: SourceTypeSchema,
  rawData: z.record(z.unknown()),
});

/**
 * Type inference from schemas
 */
export type SourceTypeSchemaType = z.infer<typeof SourceTypeSchema>;
export type SourceConfigSchemaType = z.infer<typeof SourceConfigSchema>;
export type SourceMetadataSchemaType = z.infer<typeof SourceMetadataSchema>;
