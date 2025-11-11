/**
 * RGS Core - Schemas Index
 *
 * Exports all Zod validation schemas.
 */

// Source schemas
export {
  SourceTypeSchema,
  SourceConfigSchema,
  SourceMetadataSchema,
  type SourceTypeSchemaType,
  type SourceConfigSchemaType,
  type SourceMetadataSchemaType,
} from './source.schema';

// Signal schemas
export { SentimentSchema, WebSignalSchema, type WebSignalSchemaType } from './signal.schema';

// Insight schemas
export {
  ConfidenceSchema,
  ThemeSchema,
  SentimentAnalysisSchema,
  LanguagePatternsSchema,
  InsightSchema,
  type ThemeSchemaType,
  type SentimentAnalysisSchemaType,
  type LanguagePatternsSchemaType,
  type InsightSchemaType,
} from './insight.schema';

// Scraper schemas
export {
  ScrapeConfigSchema,
  ScrapeResultSchema,
  ScrapeResultMetadataSchema,
  type ScrapeConfigSchemaType,
  type ScrapeResultSchemaType,
  type ScrapeResultMetadataSchemaType,
} from './scraper.schema';
