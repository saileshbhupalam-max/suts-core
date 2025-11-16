/**
 * SUTS Simulator for RGS Validation Framework
 * Runs SUTS tests with personas and generates predictions
 */

import type { PersonaProfile } from '../../../packages/core/src/models/PersonaProfile';
import type {
  SUTSResult,
  TestConfig,
  CalibratedPersona,
  SimulatorError,
} from './types';

/**
 * SUTSSimulator - Orchestrates SUTS test execution
 */
export class SUTSSimulator {
  constructor(version: string = '1.0.0') {
    if (version === null || version === undefined || version === '') {
      throw this.createSimulatorError('Version cannot be empty', 'INVALID_VERSION');
    }
    // Version validated but not stored - reserved for future use
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
      throw this.createSimulatorError('Personas cannot be null or undefined', 'INVALID_PERSONAS');
    }
    if (personas.length === 0) {
      throw this.createSimulatorError('Personas array cannot be empty', 'EMPTY_PERSONAS');
    }
    if (config === null || config === undefined) {
      throw this.createSimulatorError('Config cannot be null or undefined', 'INVALID_CONFIG');
    }

    const startTime = Date.now();

    try {
      // Simulate SUTS test execution
      const predictions = await this.generatePredictions(personas, config);

      const duration = Date.now() - startTime;

      const result: SUTSResult = {
        testId: this.generateTestId('base'),
        timestamp: new Date().toISOString(),
        predictions,
        metadata: {
          personaCount: personas.length,
          testDuration: `${duration}ms`,
          sutsVersion: config.sutsVersion,
        },
      };

      return result;
    } catch (error) {
      throw this.createSimulatorError(
        `SUTS test failed: ${error instanceof Error ? error.message : String(error)}`,
        'TEST_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Run SUTS test with RGS-grounded personas
   * @param personas - CalibratedPersona array with grounding data
   * @param config - Test configuration
   * @returns SUTS test results
   */
  async runGroundedSUTSTest(
    personas: CalibratedPersona[],
    config: TestConfig
  ): Promise<SUTSResult> {
    if (personas === null || personas === undefined) {
      throw this.createSimulatorError('Personas cannot be null or undefined', 'INVALID_PERSONAS');
    }
    if (personas.length === 0) {
      throw this.createSimulatorError('Personas array cannot be empty', 'EMPTY_PERSONAS');
    }
    if (config === null || config === undefined) {
      throw this.createSimulatorError('Config cannot be null or undefined', 'INVALID_CONFIG');
    }

    const startTime = Date.now();

    try {
      // Convert CalibratedPersona to PersonaProfile for base prediction
      const basePersonas = personas.map((p) => this.toPersonaProfile(p));

      // Generate predictions with grounding boost
      const predictions = await this.generateGroundedPredictions(
        basePersonas,
        personas,
        config
      );

      const duration = Date.now() - startTime;

      const result: SUTSResult = {
        testId: this.generateTestId('grounded'),
        timestamp: new Date().toISOString(),
        predictions,
        metadata: {
          personaCount: personas.length,
          testDuration: `${duration}ms`,
          sutsVersion: config.sutsVersion,
        },
      };

      return result;
    } catch (error) {
      throw this.createSimulatorError(
        `Grounded SUTS test failed: ${error instanceof Error ? error.message : String(error)}`,
        'GROUNDED_TEST_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Generate predictions for base personas
   */
  private async generatePredictions(
    personas: PersonaProfile[],
    _config: TestConfig
  ): Promise<SUTSResult['predictions']> {
    // Simulate prediction generation
    // In real implementation, this would call actual SUTS simulator

    const positioningPredictions = personas.map((persona) => ({
      personaId: persona.id,
      predictedResponse: this.simulatePositioningPrediction(persona),
      confidence: this.calculateBaseConfidence(persona),
      reasoning: `Based on ${persona.archetype} archetype and ${persona.role} role`,
    }));

    const retentionPredictions = personas.map((persona) => ({
      personaId: persona.id,
      predictedRetention: this.simulateRetentionPrediction(persona),
      timeframe: '30d',
      reasoning: `Based on ${persona.patienceLevel} patience and ${persona.techAdoption} adoption style`,
    }));

    const viralPredictions = personas.map((persona) => ({
      personaId: persona.id,
      predictedViralCoefficient: this.simulateViralPrediction(persona),
      channels: this.predictViralChannels(persona),
      reasoning: `Based on ${persona.collaborationStyle} collaboration and referral triggers`,
    }));

    return {
      positioning: positioningPredictions,
      retention: retentionPredictions,
      viral: viralPredictions,
    };
  }

  /**
   * Generate predictions with grounding data boost
   */
  private async generateGroundedPredictions(
    basePersonas: PersonaProfile[],
    calibratedPersonas: CalibratedPersona[],
    config: TestConfig
  ): Promise<SUTSResult['predictions']> {
    // Generate base predictions then apply grounding boost
    const basePredictions = await this.generatePredictions(basePersonas, config);

    // Apply grounding quality boost to accuracy
    const positioningPredictions = basePredictions.positioning.map((pred, idx) => {
      const calibrated = calibratedPersonas[idx];
      const groundingBoost = calibrated?.calibrationData?.groundingQuality ?? 0;

      return {
        ...pred,
        confidence: Math.min(1, pred.confidence * (1 + groundingBoost * 0.15)),
        reasoning: `${pred.reasoning} + RGS grounding (quality: ${(groundingBoost * 100).toFixed(0)}%)`,
      };
    });

    const retentionPredictions = basePredictions.retention.map((pred, idx) => {
      const calibrated = calibratedPersonas[idx];
      const groundingBoost = calibrated?.calibrationData?.groundingQuality ?? 0;

      // Grounding improves retention prediction accuracy
      const adjustment = (Math.random() - 0.5) * 0.1 * (1 - groundingBoost);

      return {
        ...pred,
        predictedRetention: Math.max(0, Math.min(1, pred.predictedRetention + adjustment)),
        reasoning: `${pred.reasoning} + RGS sentiment analysis`,
      };
    });

    const viralPredictions = basePredictions.viral.map((pred, idx) => {
      const calibrated = calibratedPersonas[idx];
      const groundingBoost = calibrated?.calibrationData?.groundingQuality ?? 0;

      // Grounding improves viral coefficient accuracy
      const adjustment = (Math.random() - 0.5) * 0.2 * (1 - groundingBoost);

      return {
        ...pred,
        predictedViralCoefficient: Math.max(0, pred.predictedViralCoefficient + adjustment),
        reasoning: `${pred.reasoning} + RGS community insights`,
      };
    });

    return {
      positioning: positioningPredictions,
      retention: retentionPredictions,
      viral: viralPredictions,
    };
  }

  /**
   * Simulate positioning prediction
   */
  private simulatePositioningPrediction(persona: PersonaProfile): string {
    const responses = [
      'Very interested - aligns with needs',
      'Moderately interested - needs more info',
      'Skeptical - concerns about complexity',
      'Not interested - not a priority',
    ];

    // Base response on risk tolerance and tech adoption
    const index = Math.floor(
      (persona.riskTolerance + this.techAdoptionScore(persona.techAdoption)) / 2 * (responses.length - 1)
    );

    return responses[Math.min(index, responses.length - 1)] ?? responses[0] ?? '';
  }

  /**
   * Simulate retention prediction
   */
  private simulateRetentionPrediction(persona: PersonaProfile): number {
    // Base retention on patience and experience level
    const patienceScore = persona.patienceLevel;
    const experienceScore = this.experienceScore(persona.experienceLevel);

    return Number(((patienceScore * 0.6 + experienceScore * 0.4) * 0.8).toFixed(2));
  }

  /**
   * Simulate viral coefficient prediction
   */
  private simulateViralPrediction(persona: PersonaProfile): number {
    // Base on collaboration style and referral triggers
    const collabScore = this.collaborationScore(persona.collaborationStyle);
    const referralScore = Math.min(persona.referralTriggers.length / 5, 1);

    return Number(((collabScore * 0.5 + referralScore * 0.5) * 1.2).toFixed(2));
  }

  /**
   * Predict viral channels based on persona
   */
  private predictViralChannels(persona: PersonaProfile): string[] {
    const channels: string[] = [];

    if (persona.collaborationStyle === 'Team') {
      channels.push('team-sharing');
    }
    if (persona.collaborationStyle === 'Community-driven') {
      channels.push('community-forums', 'social-media');
    }
    if (persona.techAdoption === 'Early adopter') {
      channels.push('tech-blogs', 'twitter');
    }

    return channels.length > 0 ? channels : ['word-of-mouth'];
  }

  /**
   * Convert CalibratedPersona to PersonaProfile
   */
  private toPersonaProfile(calibrated: CalibratedPersona): PersonaProfile {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { calibrationData, ...personaFields } = calibrated;
    return personaFields as PersonaProfile;
  }

  /**
   * Calculate base confidence for predictions
   */
  private calculateBaseConfidence(persona: PersonaProfile): number {
    return Number((persona.confidenceScore * 0.85).toFixed(2));
  }

  /**
   * Convert tech adoption to numeric score
   */
  private techAdoptionScore(adoption: string): number {
    const scores: Record<string, number> = {
      'Early adopter': 0.9,
      'Early majority': 0.7,
      'Late majority': 0.4,
      'Laggard': 0.2,
    };
    return scores[adoption] ?? 0.5;
  }

  /**
   * Convert experience level to numeric score
   */
  private experienceScore(level: string): number {
    const scores: Record<string, number> = {
      'Expert': 0.9,
      'Intermediate': 0.6,
      'Novice': 0.3,
    };
    return scores[level] ?? 0.5;
  }

  /**
   * Convert collaboration style to numeric score
   */
  private collaborationScore(style: string): number {
    const scores: Record<string, number> = {
      'Community-driven': 0.9,
      'Team': 0.6,
      'Solo': 0.2,
    };
    return scores[style] ?? 0.5;
  }

  /**
   * Generate unique test ID
   */
  private generateTestId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create a SimulatorError with proper typing
   */
  private createSimulatorError(
    message: string,
    code: string,
    details?: Record<string, unknown>
  ): SimulatorError {
    const error = new Error(message) as SimulatorError & { code: string; details?: Record<string, unknown> };
    error.name = 'SimulatorError';
    error.code = code;
    if (details !== undefined && details !== null) {
      error.details = details;
    }
    return error;
  }
}
