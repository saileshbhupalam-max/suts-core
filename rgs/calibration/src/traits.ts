/**
 * RGS Calibration - Trait Extraction
 *
 * Extracts PersonaTrait data from RGS Insights.
 */

import { Insight } from '@rgs/core';

/**
 * Trait category - specifies the type of trait
 */
export type TraitCategory = 'demographic' | 'psychographic' | 'behavioral' | 'linguistic';

/**
 * PersonaTrait represents a single trait extracted from RGS insights
 */
export interface PersonaTrait {
  /**
   * Category of the trait
   */
  readonly category: TraitCategory;

  /**
   * Name/identifier of the trait
   */
  readonly name: string;

  /**
   * Value of the trait
   */
  readonly value: string | string[] | number;

  /**
   * Confidence score for this trait (0-1)
   */
  readonly confidence: number;

  /**
   * Source of this trait (e.g., 'reddit', 'twitter', 'rgs-insight')
   */
  readonly source: string;
}

/**
 * Custom error for trait extraction failures
 */
export class TraitExtractionError extends Error {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'TraitExtractionError';
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/**
 * Validates that a confidence score is in the correct range (0-1)
 */
function validateConfidence(confidence: number): boolean {
  return confidence >= 0 && confidence <= 1 && !isNaN(confidence);
}

/**
 * Extracts PersonaTrait objects from RGS Insights
 *
 * @param insights - Array of RGS insights to extract traits from
 * @returns Array of extracted PersonaTrait objects
 * @throws TraitExtractionError if extraction fails
 */
export function extractTraits(insights: Insight[]): PersonaTrait[] {
  if (insights.length === 0) {
    return [];
  }

  const traits: PersonaTrait[] = [];

  try {
    for (const insight of insights) {
      // Validate insight confidence
      if (!validateConfidence(insight.confidence)) {
        throw new TraitExtractionError(
          `Invalid insight confidence: ${insight.confidence}`,
        );
      }

      // Extract psychographic traits from pain points
      if (insight.painPoints !== undefined && insight.painPoints !== null) {
        for (const painPoint of insight.painPoints) {
          traits.push({
            category: 'psychographic',
            name: 'painPoint',
            value: painPoint,
            confidence: insight.confidence,
            source: 'rgs-insight',
          });
        }
      }

      // Extract psychographic traits from desires
      if (insight.desires !== undefined && insight.desires !== null) {
        for (const desire of insight.desires) {
          traits.push({
            category: 'psychographic',
            name: 'desire',
            value: desire,
            confidence: insight.confidence,
            source: 'rgs-insight',
          });
        }
      }

      // Extract behavioral traits from sentiment
      if (insight.sentiment !== undefined && insight.sentiment !== null) {
        traits.push({
          category: 'behavioral',
          name: 'sentimentTendency',
          value: insight.sentiment.overall >= 0 ? 'positive' : 'negative',
          confidence: insight.confidence,
          source: 'rgs-insight',
        });
      }

      // Extract linguistic traits from language patterns
      if (insight.language !== undefined && insight.language !== null) {
        if (insight.language.tone !== undefined && insight.language.tone !== null) {
          traits.push({
            category: 'linguistic',
            name: 'tone',
            value: insight.language.tone,
            confidence: insight.confidence,
            source: 'rgs-insight',
          });
        }

        if (insight.language.commonPhrases !== undefined && insight.language.commonPhrases !== null) {
          traits.push({
            category: 'linguistic',
            name: 'commonPhrases',
            value: insight.language.commonPhrases,
            confidence: insight.confidence,
            source: 'rgs-insight',
          });
        }
      }

      // Extract psychographic traits from themes
      if (insight.themes !== undefined && insight.themes !== null) {
        for (const theme of insight.themes) {
          traits.push({
            category: 'psychographic',
            name: 'theme',
            value: theme.name,
            confidence: theme.confidence,
            source: 'rgs-insight',
          });
        }
      }
    }

    return traits;
  } catch (error) {
    if (error instanceof TraitExtractionError) {
      throw error;
    }
    throw new TraitExtractionError(
      'Failed to extract traits from insights',
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Filters traits by category
 *
 * @param traits - Array of PersonaTrait to filter
 * @param category - Category to filter by
 * @returns Filtered array of PersonaTrait
 */
export function filterTraitsByCategory(
  traits: PersonaTrait[],
  category: TraitCategory,
): PersonaTrait[] {
  return traits.filter((trait) => trait.category === category);
}

/**
 * Filters traits by minimum confidence threshold
 *
 * @param traits - Array of PersonaTrait to filter
 * @param minConfidence - Minimum confidence threshold (0-1)
 * @returns Filtered array of PersonaTrait
 * @throws TraitExtractionError if minConfidence is invalid
 */
export function filterTraitsByConfidence(
  traits: PersonaTrait[],
  minConfidence: number,
): PersonaTrait[] {
  if (!validateConfidence(minConfidence)) {
    throw new TraitExtractionError(
      `Invalid minimum confidence: ${minConfidence}. Must be between 0 and 1.`,
    );
  }

  return traits.filter((trait) => trait.confidence >= minConfidence);
}

/**
 * Groups traits by name
 *
 * @param traits - Array of PersonaTrait to group
 * @returns Map of trait name to array of traits with that name
 */
export function groupTraitsByName(traits: PersonaTrait[]): Map<string, PersonaTrait[]> {
  const grouped = new Map<string, PersonaTrait[]>();

  for (const trait of traits) {
    const existing = grouped.get(trait.name);
    if (existing !== undefined) {
      existing.push(trait);
    } else {
      grouped.set(trait.name, [trait]);
    }
  }

  return grouped;
}
