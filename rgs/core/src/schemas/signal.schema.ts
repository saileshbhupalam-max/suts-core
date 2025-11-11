/**
 * RGS Core - Signal Zod Schemas
 *
 * Zod validation schemas for web signal data.
 */

import { z } from 'zod';
import { SourceTypeSchema } from './source.schema';

/**
 * Schema for sentiment score (-1 to 1)
 */
export const SentimentSchema = z.number().min(-1).max(1);

/**
 * Schema for WebSignal
 */
export const WebSignalSchema = z.object({
  id: z.string().min(1),
  source: SourceTypeSchema,
  content: z.string().min(1),
  author: z.string().optional(),
  timestamp: z.date(),
  url: z.string().url(),
  sentiment: SentimentSchema.optional(),
  themes: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()),
});

/**
 * Type inference from schema
 */
export type WebSignalSchemaType = z.infer<typeof WebSignalSchema>;
