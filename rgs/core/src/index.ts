/**
 * RGS Core - Main Index
 *
 * Exports all core types, interfaces, schemas, and utilities.
 */

// Models
export {
  type SourceType,
  type SourceConfig,
  type SourceMetadata,
  isSourceType,
  validateSourceConfig,
} from './models/source';

export { type WebSignal, createWebSignal, isValidSentiment, isWebSignal } from './models/signal';

export {
  type Theme,
  type SentimentAnalysis,
  type LanguagePatterns,
  type Insight,
  createTheme,
  createSentimentAnalysis,
  createInsight,
  isValidConfidence,
} from './models/insight';

// Interfaces
export {
  type ScrapeConfig,
  type ScrapeResult,
  type IScraper,
  ScraperError,
  BaseScraper,
} from './interfaces/scraper';

// Schemas
export * from './schemas';
