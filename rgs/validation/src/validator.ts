/**
 * SUTSValidator - A/B Test Orchestrator for RGS Validation Framework
 * Coordinates testing of base vs RGS-grounded personas
 */

import type { PersonaProfile } from '../../../packages/core/src/models/PersonaProfile';
import type {
  CalibratedPersona,
  ValidationResult,
  TestConfig,
  ActualData,
  SUTSResult,
  AccuracyBreakdown,
} from './types';
import { SUTSSimulator } from './simulator';
import {
  calculateAccuracy,
  calculateAccuracyBreakdown,
  calculateConfidence,
  calculateImprovement,
} from './metrics';

/**
 * SUTSValidator - Main validation orchestrator
 */
export class SUTSValidator {
  private readonly simulator: SUTSSimulator;
  private readonly version: string = '1.0.0';

  constructor(simulator?: SUTSSimulator) {
    this.simulator = simulator ?? new SUTSSimulator(this.version);
  }

  /**
   * Run complete A/B validation test
   * @param basePersonas - Base PersonaProfile array
   * @param groundedPersonas - RGS-calibrated persona array
   * @param actualData - Actual behavior data for comparison
   * @param config - Test configuration
   * @returns Complete validation results
   */
  async validate(
    basePersonas: PersonaProfile[],
    groundedPersonas: CalibratedPersona[],
    actualData: ActualData,
    config: TestConfig
  ): Promise<ValidationResult> {
    // Validate inputs
    this.validateInputs(basePersonas, groundedPersonas, actualData, config);

    const startTime = Date.now();

    try {
      // Run base SUTS test
      const baseResult = await this.runSUTSTest(basePersonas, config);

      // Run grounded SUTS test
      const groundedResult = await this.runGroundedSUTSTest(groundedPersonas, config);

      // Calculate accuracies
      const baseAccuracy = this.calculateAccuracy(baseResult, actualData);
      const groundedAccuracy = this.calculateAccuracy(groundedResult, actualData);

      // Calculate improvement
      const improvement = calculateImprovement(baseAccuracy, groundedAccuracy);

      // Calculate confidence
      const confidence = calculateConfidence(
        basePersonas.length,
        groundedAccuracy / 100
      );

      // Calculate breakdown
      const breakdown = this.calculateBreakdown(baseResult, groundedResult, actualData);

      const duration = Date.now() - startTime;

      const result: ValidationResult = {
        baseAccuracy,
        groundedAccuracy,
        improvement,
        confidence,
        breakdown,
        sampleSize: basePersonas.length,
        testDuration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        metadata: {
          baseTestId: baseResult.testId,
          groundedTestId: groundedResult.testId,
          validatorVersion: this.version,
        },
      };

      return result;
    } catch (error) {
      throw new Error(
        `Validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Run SUTS test with base personas
   * @param personas - Base PersonaProfile array
   * @param config - Test configuration
   * @returns SUTS test results
   */
  async runSUTSTest(
    personas: PersonaProfile[],
    config: TestConfig
  ): Promise<SUTSResult> {
    if (personas === null || personas === undefined) {
      throw new Error('Personas cannot be null or undefined');
    }
    if (personas.length === 0) {
      throw new Error('Personas array cannot be empty');
    }

    return await this.simulator.runSUTSTest(personas, config);
  }

  /**
   * Run SUTS test with grounded personas
   * @param personas - CalibratedPersona array
   * @param config - Test configuration
   * @returns SUTS test results
   */
  async runGroundedSUTSTest(
    personas: CalibratedPersona[],
    config: TestConfig
  ): Promise<SUTSResult> {
    if (personas === null || personas === undefined) {
      throw new Error('Personas cannot be null or undefined');
    }
    if (personas.length === 0) {
      throw new Error('Personas array cannot be empty');
    }

    return await this.simulator.runGroundedSUTSTest(personas, config);
  }

  /**
   * Calculate accuracy of predictions vs actual
   * @param predicted - SUTS test results
   * @param actual - Actual behavior data
   * @returns Overall accuracy percentage
   */
  calculateAccuracy(predicted: SUTSResult, actual: ActualData): number {
    if (predicted === null || predicted === undefined) {
      throw new Error('Predicted data cannot be null or undefined');
    }
    if (actual === null || actual === undefined) {
      throw new Error('Actual data cannot be null or undefined');
    }

    return calculateAccuracy(predicted, actual);
  }

  /**
   * Calculate accuracy breakdown by category
   */
  private calculateBreakdown(
    baseResult: SUTSResult,
    groundedResult: SUTSResult,
    actualData: ActualData
  ): AccuracyBreakdown {
    const baseBreakdown = calculateAccuracyBreakdown(baseResult, actualData);
    const groundedBreakdown = calculateAccuracyBreakdown(groundedResult, actualData);

    return {
      positioning: {
        base: baseBreakdown.positioning,
        grounded: groundedBreakdown.positioning,
      },
      retention: {
        base: baseBreakdown.retention,
        grounded: groundedBreakdown.retention,
      },
      viral: {
        base: baseBreakdown.viral,
        grounded: groundedBreakdown.viral,
      },
    };
  }

  /**
   * Validate all inputs before running tests
   */
  private validateInputs(
    basePersonas: PersonaProfile[],
    groundedPersonas: CalibratedPersona[],
    actualData: ActualData,
    config: TestConfig
  ): void {
    if (basePersonas === null || basePersonas === undefined) {
      throw new Error('Base personas cannot be null or undefined');
    }
    if (groundedPersonas === null || groundedPersonas === undefined) {
      throw new Error('Grounded personas cannot be null or undefined');
    }
    if (actualData === null || actualData === undefined) {
      throw new Error('Actual data cannot be null or undefined');
    }
    if (config === null || config === undefined) {
      throw new Error('Config cannot be null or undefined');
    }

    if (basePersonas.length === 0) {
      throw new Error('Base personas array cannot be empty');
    }
    if (groundedPersonas.length === 0) {
      throw new Error('Grounded personas array cannot be empty');
    }

    if (basePersonas.length !== groundedPersonas.length) {
      throw new Error(
        `Persona count mismatch: base=${basePersonas.length}, grounded=${groundedPersonas.length}`
      );
    }

    // Validate persona IDs match
    const baseIds = new Set(basePersonas.map((p) => p.id));
    const groundedIds = new Set(groundedPersonas.map((p) => p.id));

    for (const id of baseIds) {
      if (!groundedIds.has(id)) {
        throw new Error(`Persona ID mismatch: ${id} exists in base but not in grounded`);
      }
    }
  }
}
