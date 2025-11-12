/**
 * RGS Analysis - Theme Extraction
 *
 * @packageDocumentation
 */

// Types
export {
  type ThemeCategory,
  type ExtractedTheme,
  type RawThemeExtraction,
  type KeywordCluster,
  type DetectedPattern,
  type ThemeExtractionConfig,
  DEFAULT_EXTRACTION_CONFIG,
  isThemeCategory,
  isValidSentiment,
  isValidConfidence,
  isRawThemeExtraction,
  isExtractedTheme,
} from './types';

// Clusterer
export {
  type ClustererConfig,
  DEFAULT_CLUSTERER_CONFIG,
  KeywordClusterer,
} from './clusterer';

// Pattern Detector
export {
  type PatternDetectorConfig,
  DEFAULT_PATTERN_CONFIG,
  PatternDetector,
  createPatternDetector,
} from './patterns';

// Theme Extractor
export { ThemeExtractor, createThemeExtractor } from './extractor';
