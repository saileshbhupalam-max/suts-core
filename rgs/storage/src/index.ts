/**
 * RGS Storage Module
 * Provides file-based storage and in-memory caching for web signals and insights
 */

// Interfaces and types
export {
  IStorage,
  WebSignal,
  WebSignalSchema,
  Insight,
  InsightSchema,
  SignalFilter,
  StorageError,
} from './interfaces/storage';

// Storage implementations
export { FileSystemStorage } from './filesystem';
export { InMemoryCache } from './cache';

// Configuration
export {
  ConfigLoader,
  loadConfig,
  validateConfig,
  RGSConfig,
  RGSConfigSchema,
  SourceConfig,
  SourceConfigSchema,
} from './config';
