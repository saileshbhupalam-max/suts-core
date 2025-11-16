/**
 * RGS Calibration - Trait Merger
 *
 * Merges base persona traits with grounded traits from RGS insights.
 * Handles conflict resolution with RGS data taking priority.
 */

import { PersonaTrait } from './traits';

/**
 * Custom error for trait merging failures
 */
export class TraitMergeError extends Error {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'TraitMergeError';
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/**
 * Conflict resolution strategy
 */
export type ConflictResolutionStrategy = 'rgs-priority' | 'base-priority' | 'highest-confidence';

/**
 * Merges base traits with grounded traits
 *
 * @param baseTraits - Traits from the base persona
 * @param groundedTraits - Traits extracted from RGS insights
 * @param strategy - Conflict resolution strategy (default: 'rgs-priority')
 * @returns Merged array of PersonaTrait
 */
export function mergeTraits(
  baseTraits: PersonaTrait[],
  groundedTraits: PersonaTrait[],
  strategy: ConflictResolutionStrategy = 'rgs-priority',
): PersonaTrait[] {
  // Group traits by category and name for conflict detection
  const traitMap = new Map<string, PersonaTrait[]>();

  // Add base traits to the map
  for (const trait of baseTraits) {
    const key = `${trait.category}:${trait.name}`;
    const existing = traitMap.get(key);
    if (existing !== undefined) {
      existing.push(trait);
    } else {
      traitMap.set(key, [trait]);
    }
  }

  // Add grounded traits to the map
  for (const trait of groundedTraits) {
    const key = `${trait.category}:${trait.name}`;
    const existing = traitMap.get(key);
    if (existing !== undefined) {
      existing.push(trait);
    } else {
      traitMap.set(key, [trait]);
    }
  }

  // Resolve conflicts and build final trait list
  const mergedTraits: PersonaTrait[] = [];

  for (const [, traits] of traitMap) {
    if (traits.length === 1) {
      // No conflict - add the single trait
      const trait = traits[0];
      if (trait !== undefined) {
        mergedTraits.push(trait);
      }
    } else {
      // Conflict detected - resolve using strategy
      const resolved = resolveConflict(traits, strategy);
      mergedTraits.push(resolved);
    }
  }

  return mergedTraits;
}

/**
 * Resolves conflicts between multiple traits with the same category and name
 *
 * @param traits - Array of conflicting traits
 * @param strategy - Resolution strategy
 * @returns Single resolved PersonaTrait
 * @throws TraitMergeError if resolution fails
 */
export function resolveConflict(
  traits: PersonaTrait[],
  strategy: ConflictResolutionStrategy,
): PersonaTrait {
  if (traits.length === 0) {
    throw new TraitMergeError('Cannot resolve conflict with empty traits array');
  }

  if (traits.length === 1) {
    const trait = traits[0];
    if (trait === undefined) {
      throw new TraitMergeError('Cannot resolve conflict with undefined trait');
    }
    return trait;
  }

  switch (strategy) {
    case 'rgs-priority': {
      // Prioritize traits from RGS insights
      const rgsTrait = traits.find((t) => t.source === 'rgs-insight');
      if (rgsTrait !== undefined) {
        return rgsTrait;
      }
      // Fall back to highest confidence if no RGS trait found
      return getHighestConfidenceTrait(traits);
    }

    case 'base-priority': {
      // Prioritize traits from base persona
      const baseTrait = traits.find((t) => t.source !== 'rgs-insight');
      if (baseTrait !== undefined) {
        return baseTrait;
      }
      // Fall back to highest confidence if no base trait found
      return getHighestConfidenceTrait(traits);
    }

    case 'highest-confidence': {
      return getHighestConfidenceTrait(traits);
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = strategy;
      throw new TraitMergeError(`Unknown conflict resolution strategy: ${_exhaustiveCheck as string}`);
    }
  }
}

/**
 * Gets the trait with the highest confidence from an array of traits
 *
 * @param traits - Array of traits to compare
 * @returns Trait with highest confidence
 * @throws TraitMergeError if traits array is empty
 */
function getHighestConfidenceTrait(traits: PersonaTrait[]): PersonaTrait {
  if (traits.length === 0) {
    throw new TraitMergeError('Cannot get highest confidence from empty traits array');
  }

  const firstTrait = traits[0];
  if (firstTrait === undefined) {
    throw new TraitMergeError('Cannot get highest confidence from undefined trait');
  }

  let highest = firstTrait;
  for (let i = 1; i < traits.length; i++) {
    const current = traits[i];
    if (current !== undefined && current.confidence > highest.confidence) {
      highest = current;
    }
  }

  return highest;
}

/**
 * Deduplicates traits by removing exact duplicates
 *
 * @param traits - Array of traits to deduplicate
 * @returns Deduplicated array of traits
 */
export function deduplicateTraits(traits: PersonaTrait[]): PersonaTrait[] {
  const seen = new Set<string>();
  const deduplicated: PersonaTrait[] = [];

  for (const trait of traits) {
    // Create a unique key based on all trait properties
    const key = JSON.stringify({
      category: trait.category,
      name: trait.name,
      value: trait.value,
      source: trait.source,
    });

    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(trait);
    }
  }

  return deduplicated;
}

/**
 * Calculates average confidence across a set of traits
 *
 * @param traits - Array of traits
 * @returns Average confidence score (0-1)
 * @throws TraitMergeError if traits array is empty
 */
export function calculateAverageConfidence(traits: PersonaTrait[]): number {
  if (traits.length === 0) {
    throw new TraitMergeError('Cannot calculate average confidence from empty traits array');
  }

  let sum = 0;
  for (const trait of traits) {
    sum += trait.confidence;
  }

  return sum / traits.length;
}

/**
 * Validates that all traits have valid confidence scores
 *
 * @param traits - Array of traits to validate
 * @returns True if all traits are valid
 * @throws TraitMergeError if any trait has invalid confidence
 */
export function validateTraits(traits: PersonaTrait[]): boolean {
  for (const trait of traits) {
    if (trait.confidence < 0 || trait.confidence > 1 || isNaN(trait.confidence)) {
      throw new TraitMergeError(
        `Invalid confidence score for trait ${trait.name}: ${trait.confidence}`,
      );
    }
  }

  return true;
}
