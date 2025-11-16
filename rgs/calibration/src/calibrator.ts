/**
 * RGS Calibration - Persona Calibrator
 *
 * Main orchestration logic for calibrating SUTS personas with real web signals from RGS.
 */

import { PersonaProfile } from '@suts/core';
import { Insight } from '@rgs/core';
import { extractTraits, PersonaTrait, filterTraitsByConfidence } from './traits';
import { mergeTraits, ConflictResolutionStrategy } from './merger';
import { createCalibratedPersona, CalibratedPersona, extractUniqueSources } from './profiles';

/**
 * Configuration options for PersonaCalibrator
 */
export interface CalibratorConfig {
  /**
   * Minimum confidence threshold for including traits (0-1)
   * Default: 0.5
   */
  readonly minConfidence?: number;

  /**
   * Conflict resolution strategy when base and grounded traits conflict
   * Default: 'rgs-priority'
   */
  readonly conflictStrategy?: ConflictResolutionStrategy;

  /**
   * Whether to deduplicate traits after merging
   * Default: true
   */
  readonly deduplicate?: boolean;
}

/**
 * Custom error for calibration failures
 */
export class CalibrationError extends Error {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'CalibrationError';
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/**
 * PersonaCalibrator - Calibrates personas with RGS insights
 */
export class PersonaCalibrator {
  private readonly config: Required<CalibratorConfig>;

  /**
   * Creates a new PersonaCalibrator instance
   *
   * @param config - Configuration options
   */
  constructor(config?: CalibratorConfig) {
    this.config = {
      minConfidence: config?.minConfidence ?? 0.5,
      conflictStrategy: config?.conflictStrategy ?? 'rgs-priority',
      deduplicate: config?.deduplicate ?? true,
    };

    // Validate configuration
    if (this.config.minConfidence < 0 || this.config.minConfidence > 1) {
      throw new CalibrationError(
        `Invalid minConfidence: ${this.config.minConfidence}. Must be between 0 and 1.`,
      );
    }
  }

  /**
   * Calibrates a base persona with RGS insights
   *
   * @param basePersona - The base PersonaProfile to calibrate
   * @param insights - Array of RGS insights to use for calibration
   * @param signalCount - Number of signals the insights were derived from
   * @returns CalibratedPersona with grounded traits
   * @throws CalibrationError if calibration fails
   */
  public calibrate(
    basePersona: PersonaProfile,
    insights: Insight[],
    signalCount: number,
  ): CalibratedPersona {
    try {
      // Validate inputs
      if (insights.length === 0) {
        throw new CalibrationError('At least one insight is required for calibration');
      }

      if (signalCount < 0) {
        throw new CalibrationError('Signal count must be non-negative');
      }

      // Step 1: Extract traits from insights
      const groundedTraits = this.extractTraits(insights);

      // Step 2: Filter by confidence threshold
      const filteredTraits = filterTraitsByConfidence(groundedTraits, this.config.minConfidence);

      if (filteredTraits.length === 0) {
        throw new CalibrationError(
          `No traits met the minimum confidence threshold of ${this.config.minConfidence}`,
        );
      }

      // Step 3: Extract unique sources
      const sources = extractUniqueSources(filteredTraits);

      // Step 4: Create calibrated persona
      const calibratedPersona = createCalibratedPersona(
        basePersona,
        filteredTraits,
        signalCount,
        sources,
      );

      return calibratedPersona;
    } catch (error) {
      if (error instanceof CalibrationError) {
        throw error;
      }
      throw new CalibrationError(
        'Calibration failed',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Extracts traits from RGS insights
   *
   * @param insights - Array of RGS insights
   * @returns Array of PersonaTrait
   */
  public extractTraits(insights: Insight[]): PersonaTrait[] {
    return extractTraits(insights);
  }

  /**
   * Merges base traits with grounded traits, resolving conflicts
   *
   * @param baseTraits - Traits from base persona
   * @param groundedTraits - Traits from RGS insights
   * @returns Merged array of PersonaTrait
   */
  public mergeTraits(baseTraits: PersonaTrait[], groundedTraits: PersonaTrait[]): PersonaTrait[] {
    return mergeTraits(baseTraits, groundedTraits, this.config.conflictStrategy);
  }

  /**
   * Gets the current calibrator configuration
   *
   * @returns Current CalibratorConfig
   */
  public getConfig(): Required<CalibratorConfig> {
    return { ...this.config };
  }
}

/**
 * Factory function to create a PersonaCalibrator with default config
 *
 * @param config - Optional configuration
 * @returns New PersonaCalibrator instance
 */
export function createCalibrator(config?: CalibratorConfig): PersonaCalibrator {
  return new PersonaCalibrator(config);
}
