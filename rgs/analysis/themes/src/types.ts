/**
 * RGS Analysis - Theme Extraction Types
 *
 * Extended theme models for theme extraction and analysis.
 */

import { Theme as CoreTheme } from '@rgs/core';

/**
 * Theme category types
 */
export type ThemeCategory = 'pain' | 'desire' | 'feature' | 'workflow' | 'comparison';

/**
 * Extended theme with analysis metadata
 */
export interface ExtractedTheme extends CoreTheme {
  /**
   * Unique identifier for the theme
   */
  readonly id: string;

  /**
   * Category of the theme
   */
  readonly category: ThemeCategory;

  /**
   * Sentiment score for this theme (-1 to 1)
   */
  readonly sentiment: number;

  /**
   * Example quotes from signals
   */
  readonly examples: readonly string[];

  /**
   * Confidence score (0-1) - inherited from CoreTheme
   */
  readonly confidence: number;
}

/**
 * Raw theme extracted from Claude API
 */
export interface RawThemeExtraction {
  readonly theme: string;
  readonly keywords: readonly string[];
  readonly category: ThemeCategory;
  readonly examples: readonly string[];
}

/**
 * Keyword cluster for grouping similar keywords
 */
export interface KeywordCluster {
  /**
   * Representative keyword for the cluster
   */
  readonly representative: string;

  /**
   * All keywords in this cluster
   */
  readonly keywords: readonly string[];

  /**
   * Similarity score (0-1)
   */
  readonly similarity: number;
}

/**
 * Pattern detection result
 */
export interface DetectedPattern {
  /**
   * Type of pattern detected
   */
  readonly type: 'workflow' | 'comparison' | 'frustration' | 'request';

  /**
   * The pattern text or regex
   */
  readonly pattern: string;

  /**
   * Number of times this pattern appeared
   */
  readonly frequency: number;

  /**
   * Example matches
   */
  readonly examples: readonly string[];
}

/**
 * Theme extraction configuration
 */
export interface ThemeExtractionConfig {
  /**
   * Maximum number of signals to process per batch
   */
  readonly batchSize: number;

  /**
   * Minimum frequency threshold for themes
   */
  readonly minFrequency: number;

  /**
   * Minimum confidence threshold (0-1)
   */
  readonly minConfidence: number;

  /**
   * Whether to include low-confidence themes
   */
  readonly includeLowConfidence: boolean;

  /**
   * Maximum number of examples per theme
   */
  readonly maxExamples: number;
}

/**
 * Default configuration
 */
export const DEFAULT_EXTRACTION_CONFIG: ThemeExtractionConfig = {
  batchSize: 50,
  minFrequency: 2,
  minConfidence: 0.6,
  includeLowConfidence: false,
  maxExamples: 5,
};

/**
 * Validates theme category
 */
export function isThemeCategory(value: string): value is ThemeCategory {
  return ['pain', 'desire', 'feature', 'workflow', 'comparison'].includes(value);
}

/**
 * Validates sentiment score
 */
export function isValidSentiment(sentiment: number): boolean {
  return sentiment >= -1 && sentiment <= 1;
}

/**
 * Validates confidence score
 */
export function isValidConfidence(confidence: number): boolean {
  return confidence >= 0 && confidence <= 1;
}

/**
 * Type guard for RawThemeExtraction
 */
export function isRawThemeExtraction(obj: unknown): obj is RawThemeExtraction {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const raw = obj as Record<string, unknown>;

  if (typeof raw['theme'] !== 'string' || raw['theme'].length === 0) {
    return false;
  }

  if (!Array.isArray(raw['keywords']) || !raw['keywords'].every((k) => typeof k === 'string')) {
    return false;
  }

  if (typeof raw['category'] !== 'string' || !isThemeCategory(raw['category'])) {
    return false;
  }

  if (!Array.isArray(raw['examples']) || !raw['examples'].every((e) => typeof e === 'string')) {
    return false;
  }

  return true;
}

/**
 * Type guard for ExtractedTheme
 */
export function isExtractedTheme(obj: unknown): obj is ExtractedTheme {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const theme = obj as Record<string, unknown>;

  // Check required fields
  if (typeof theme['id'] !== 'string' || theme['id'].length === 0) {
    return false;
  }

  if (typeof theme['name'] !== 'string' || theme['name'].length === 0) {
    return false;
  }

  if (typeof theme['category'] !== 'string' || !isThemeCategory(theme['category'])) {
    return false;
  }

  if (!Array.isArray(theme['keywords']) || !theme['keywords'].every((k) => typeof k === 'string')) {
    return false;
  }

  if (typeof theme['frequency'] !== 'number' || theme['frequency'] < 0) {
    return false;
  }

  if (typeof theme['sentiment'] !== 'number' || !isValidSentiment(theme['sentiment'])) {
    return false;
  }

  if (typeof theme['confidence'] !== 'number' || !isValidConfidence(theme['confidence'])) {
    return false;
  }

  if (!Array.isArray(theme['examples']) || !theme['examples'].every((e) => typeof e === 'string')) {
    return false;
  }

  return true;
}
