/**
 * RGS Analysis - Pattern Detection
 *
 * Detects common patterns in text signals using regex.
 */

import { WebSignal } from '@rgs/core';
import { DetectedPattern } from './types';

/**
 * Pattern definition
 */
interface PatternDefinition {
  readonly type: DetectedPattern['type'];
  readonly regex: RegExp;
  readonly name: string;
}

/**
 * Common patterns to detect
 */
const PATTERN_DEFINITIONS: readonly PatternDefinition[] = [
  // Workflow patterns
  { type: 'workflow', regex: /I use\s+[\w\s]+\s+for\s+[\w\s]+/gi, name: 'usage' },
  { type: 'workflow', regex: /my workflow is\s+[\w\s]+/gi, name: 'workflow_description' },
  { type: 'workflow', regex: /I usually\s+[\w\s]+/gi, name: 'usual_practice' },
  { type: 'workflow', regex: /typically\s+[\w\s]+/gi, name: 'typical_behavior' },
  { type: 'workflow', regex: /I start by\s+[\w\s]+/gi, name: 'workflow_start' },

  // Comparison patterns
  { type: 'comparison', regex: /better than\s+[\w\s]+/gi, name: 'better_than' },
  { type: 'comparison', regex: /compared to\s+[\w\s]+/gi, name: 'comparison' },
  { type: 'comparison', regex: /vs\.?\s+[\w\s]+/gi, name: 'versus' },
  { type: 'comparison', regex: /similar to\s+[\w\s]+/gi, name: 'similarity' },
  { type: 'comparison', regex: /unlike\s+[\w\s]+/gi, name: 'unlike' },
  { type: 'comparison', regex: /instead of\s+[\w\s]+/gi, name: 'alternative' },

  // Frustration patterns
  { type: 'frustration', regex: /annoying that\s+[\w\s]+/gi, name: 'annoying' },
  { type: 'frustration', regex: /frustrated with\s+[\w\s]+/gi, name: 'frustrated' },
  { type: 'frustration', regex: /hate that\s+[\w\s]+/gi, name: 'hate' },
  { type: 'frustration', regex: /can't stand\s+[\w\s]+/gi, name: 'cant_stand' },
  { type: 'frustration', regex: /drives me crazy\s+[\w\s]+/gi, name: 'crazy' },
  { type: 'frustration', regex: /why does\s+[\w\s]+/gi, name: 'why_question' },
  { type: 'frustration', regex: /doesn't work\s+[\w\s]*/gi, name: 'not_working' },

  // Request patterns
  { type: 'request', regex: /would love\s+[\w\s]+/gi, name: 'would_love' },
  { type: 'request', regex: /please add\s+[\w\s]+/gi, name: 'please_add' },
  { type: 'request', regex: /wish\s+[\w\s]+\s+would\s+[\w\s]+/gi, name: 'wish' },
  { type: 'request', regex: /missing\s+[\w\s]+/gi, name: 'missing' },
  { type: 'request', regex: /need\s+[\w\s]+/gi, name: 'need' },
  { type: 'request', regex: /want\s+[\w\s]+/gi, name: 'want' },
  { type: 'request', regex: /should have\s+[\w\s]+/gi, name: 'should_have' },
  { type: 'request', regex: /would be nice\s+[\w\s]+/gi, name: 'would_be_nice' },
];

/**
 * Pattern detection configuration
 */
export interface PatternDetectorConfig {
  /**
   * Minimum frequency to include pattern
   */
  readonly minFrequency: number;

  /**
   * Maximum examples per pattern
   */
  readonly maxExamples: number;

  /**
   * Maximum length of example text
   */
  readonly maxExampleLength: number;
}

/**
 * Default pattern detector configuration
 */
export const DEFAULT_PATTERN_CONFIG: PatternDetectorConfig = {
  minFrequency: 2,
  maxExamples: 3,
  maxExampleLength: 150,
};

/**
 * Pattern detector
 */
export class PatternDetector {
  constructor(private readonly config: PatternDetectorConfig = DEFAULT_PATTERN_CONFIG) {}

  /**
   * Detect patterns in signals
   */
  detect(signals: readonly WebSignal[]): DetectedPattern[] {
    const patternMatches = new Map<
      string,
      { type: DetectedPattern['type']; matches: string[] }
    >();

    // Scan all signals for patterns
    for (const signal of signals) {
      const content = signal.content;

      for (const definition of PATTERN_DEFINITIONS) {
        const matches = this.findMatches(content, definition.regex);

        if (matches.length > 0) {
          const key = `${definition.type}:${definition.name}`;
          const existing = patternMatches.get(key);

          if (existing !== undefined) {
            existing.matches.push(...matches);
          } else {
            patternMatches.set(key, {
              type: definition.type,
              matches: matches,
            });
          }
        }
      }
    }

    // Convert to DetectedPattern array
    const patterns: DetectedPattern[] = [];

    for (const [key, data] of patternMatches) {
      const frequency = data.matches.length;

      // Filter by minimum frequency
      if (frequency >= this.config.minFrequency) {
        const patternName = key.split(':')[1];
        if (patternName === undefined) {
continue;
}

        const pattern: DetectedPattern = {
          type: data.type,
          pattern: patternName,
          frequency,
          examples: this.selectExamples(data.matches),
        };
        patterns.push(pattern);
      }
    }

    // Sort by frequency (descending)
    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Find all matches for a pattern in text
   */
  private findMatches(text: string, regex: RegExp): string[] {
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    // Reset regex state
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0].trim();
      if (matchText.length > 0) {
        matches.push(matchText);
      }
    }

    return matches;
  }

  /**
   * Select representative examples from matches
   */
  private selectExamples(matches: readonly string[]): readonly string[] {
    // Remove duplicates
    const unique = Array.from(new Set(matches));

    // Sort by length (prefer longer, more descriptive examples)
    const sorted = unique.sort((a, b) => b.length - a.length);

    // Take top examples
    const selected = sorted.slice(0, this.config.maxExamples);

    // Truncate if needed
    return selected.map((example) => this.truncateExample(example));
  }

  /**
   * Truncate example to maximum length
   */
  private truncateExample(example: string): string {
    if (example.length <= this.config.maxExampleLength) {
      return example;
    }

    return example.slice(0, this.config.maxExampleLength - 3) + '...';
  }

  /**
   * Get patterns by type
   */
  getPatternsByType(
    patterns: readonly DetectedPattern[],
    type: DetectedPattern['type'],
  ): DetectedPattern[] {
    return patterns.filter((p) => p.type === type);
  }

  /**
   * Get most frequent patterns
   */
  getTopPatterns(patterns: readonly DetectedPattern[], count: number): DetectedPattern[] {
    return [...patterns].sort((a, b) => b.frequency - a.frequency).slice(0, count);
  }

  /**
   * Get pattern summary statistics
   */
  getPatternStats(patterns: readonly DetectedPattern[]): {
    totalPatterns: number;
    totalOccurrences: number;
    byType: Record<DetectedPattern['type'], number>;
  } {
    const byType: Record<DetectedPattern['type'], number> = {
      workflow: 0,
      comparison: 0,
      frustration: 0,
      request: 0,
    };

    let totalOccurrences = 0;

    for (const pattern of patterns) {
      byType[pattern.type]++;
      totalOccurrences += pattern.frequency;
    }

    return {
      totalPatterns: patterns.length,
      totalOccurrences,
      byType,
    };
  }
}

/**
 * Create a pattern detector with default configuration
 */
export function createPatternDetector(
  config?: Partial<PatternDetectorConfig>,
): PatternDetector {
  const fullConfig = {
    ...DEFAULT_PATTERN_CONFIG,
    ...config,
  };
  return new PatternDetector(fullConfig);
}
