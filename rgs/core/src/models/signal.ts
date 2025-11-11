/**
 * RGS Core - WebSignal Data Model
 *
 * Represents a single unit of web data scraped from various sources.
 */

import { SourceType, isSourceType } from './source';

/**
 * WebSignal represents a single data point scraped from a web source
 */
export interface WebSignal {
  /**
   * Unique identifier for the signal
   */
  readonly id: string;

  /**
   * Type of source this signal was scraped from
   */
  readonly source: SourceType;

  /**
   * Main content of the signal (text, post body, comment, etc.)
   */
  readonly content: string;

  /**
   * Author/creator of the content (optional, may not be available)
   */
  readonly author?: string;

  /**
   * Timestamp when the content was created/posted
   */
  readonly timestamp: Date;

  /**
   * URL to the original source
   */
  readonly url: string;

  /**
   * Sentiment score ranging from -1 (negative) to 1 (positive)
   * Optional, may be computed later
   */
  readonly sentiment?: number;

  /**
   * Extracted themes/topics from the content
   * Optional, may be computed later
   */
  readonly themes?: string[];

  /**
   * Additional source-specific metadata
   */
  readonly metadata: Record<string, unknown>;
}

/**
 * Helper to create a WebSignal with proper defaults
 */
export function createWebSignal(params: {
  id: string;
  source: SourceType;
  content: string;
  timestamp: Date;
  url: string;
  metadata: Record<string, unknown>;
  author?: string;
  sentiment?: number;
  themes?: string[];
}): WebSignal {
  const signal: WebSignal = {
    id: params.id,
    source: params.source,
    content: params.content,
    timestamp: params.timestamp,
    url: params.url,
    metadata: params.metadata,
  };

  // Add optional properties only if defined
  if (params.author !== undefined) {
    (signal as { author?: string }).author = params.author;
  }
  if (params.sentiment !== undefined) {
    (signal as { sentiment?: number }).sentiment = params.sentiment;
  }
  if (params.themes !== undefined) {
    (signal as { themes?: string[] }).themes = params.themes;
  }

  return signal;
}

/**
 * Validates that a sentiment score is in the correct range
 */
export function isValidSentiment(sentiment: number): boolean {
  return sentiment >= -1 && sentiment <= 1;
}

/**
 * Type guard to check if an object is a valid WebSignal
 */
export function isWebSignal(obj: unknown): obj is WebSignal {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const signal = obj as Record<string, unknown>;

  // Check required fields
  if (typeof signal['id'] !== 'string' || signal['id'].length === 0) {
    return false;
  }

  if (typeof signal['source'] !== 'string' || !isSourceType(signal['source'])) {
    return false;
  }

  if (typeof signal['content'] !== 'string' || signal['content'].length === 0) {
    return false;
  }

  if (!(signal['timestamp'] instanceof Date)) {
    return false;
  }

  if (typeof signal['url'] !== 'string' || signal['url'].length === 0) {
    return false;
  }

  if (typeof signal['metadata'] !== 'object' || signal['metadata'] === null) {
    return false;
  }

  // Check optional fields
  if (signal['author'] !== undefined && typeof signal['author'] !== 'string') {
    return false;
  }

  if (signal['sentiment'] !== undefined) {
    if (typeof signal['sentiment'] !== 'number' || !isValidSentiment(signal['sentiment'])) {
      return false;
    }
  }

  if (signal['themes'] !== undefined) {
    if (!Array.isArray(signal['themes'])) {
      return false;
    }
    if (!signal['themes'].every((theme) => typeof theme === 'string')) {
      return false;
    }
  }

  return true;
}
