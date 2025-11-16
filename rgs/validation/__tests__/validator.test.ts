/**
 * Tests for SUTSValidator
 */

import { SUTSValidator } from '../src/validator';
import type { PersonaProfile } from '../../../packages/core/src/models/PersonaProfile';
import type { CalibratedPersona, TestConfig, ActualData } from '../src/types';

describe('SUTSValidator', () => {
  let validator: SUTSValidator;

  beforeEach(() => {
    validator = new SUTSValidator();
  });

  const mockPersona: PersonaProfile = {
    id: 'persona-1',
    archetype: 'Developer',
    role: 'Frontend Engineer',
    experienceLevel: 'Intermediate',
    companySize: 'Startup',
    techStack: ['React'],
    painPoints: [],
    goals: [],
    fears: [],
    values: [],
    riskTolerance: 0.7,
    patienceLevel: 0.6,
    techAdoption: 'Early adopter',
    learningStyle: 'Documentation',
    evaluationCriteria: [],
    dealBreakers: [],
    delightTriggers: [],
    referralTriggers: [],
    typicalWorkflow: 'Agile',
    timeAvailability: '40h',
    collaborationStyle: 'Team',
    state: {},
    history: [],
    confidenceScore: 0.8,
    lastUpdated: new Date().toISOString(),
    source: 'test',
  };

  const mockCalibratedPersona: CalibratedPersona = {
    ...mockPersona,
    calibrationData: {
      signalCount: 100,
      sources: ['reddit'],
      sentimentScore: 0.5,
      themes: ['performance'],
      groundingQuality: 0.85,
      lastCalibrated: new Date().toISOString(),
    },
  };

  const mockConfig: TestConfig = {
    sampleSize: 50,
    confidenceLevel: 0.95,
    timeout: 300000,
    sutsVersion: '1.0.0',
    enableParallel: false,
    retryAttempts: 3,
  };

  const mockActualData: ActualData = {
    positioning: [
      {
        personaId: 'persona-1',
        actualResponse: 'Very interested',
        wasAccurate: true,
      },
    ],
    retention: [
      {
        personaId: 'persona-1',
        actualRetention: 0.85,
        timeframe: '30d',
      },
    ],
    viral: [
      {
        personaId: 'persona-1',
        actualViralCoefficient: 1.3,
        channels: ['social'],
      },
    ],
  };

  describe('constructor', () => {
    it('should create validator instance', () => {
      expect(validator).toBeDefined();
      expect(validator).toBeInstanceOf(SUTSValidator);
    });

    it('should accept custom simulator', () => {
      const customValidator = new SUTSValidator();
      expect(customValidator).toBeDefined();
    });
  });

  describe('validate', () => {
    it('should run complete validation', async () => {
      const result = await validator.validate(
        [mockPersona],
        [mockCalibratedPersona],
        mockActualData,
        mockConfig
      );

      expect(result).toBeDefined();
      expect(result.baseAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.baseAccuracy).toBeLessThanOrEqual(100);
      expect(result.groundedAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.groundedAccuracy).toBeLessThanOrEqual(100);
      expect(result.improvement).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.sampleSize).toBe(1);
    });

    it('should throw error for null base personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(
        validator.validate(null as any, [mockCalibratedPersona], mockActualData, mockConfig)
      ).rejects.toThrow('Base personas cannot be null or undefined');
    });

    it('should throw error for undefined base personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(
        validator.validate(undefined as any, [mockCalibratedPersona], mockActualData, mockConfig)
      ).rejects.toThrow('Base personas cannot be null or undefined');
    });

    it('should throw error for null grounded personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(
        validator.validate([mockPersona], null as any, mockActualData, mockConfig)
      ).rejects.toThrow('Grounded personas cannot be null or undefined');
    });

    it('should throw error for undefined grounded personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(
        validator.validate([mockPersona], undefined as any, mockActualData, mockConfig)
      ).rejects.toThrow('Grounded personas cannot be null or undefined');
    });

    it('should throw error for null actual data', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(
        validator.validate([mockPersona], [mockCalibratedPersona], null as any, mockConfig)
      ).rejects.toThrow('Actual data cannot be null or undefined');
    });

    it('should throw error for undefined actual data', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(
        validator.validate([mockPersona], [mockCalibratedPersona], undefined as any, mockConfig)
      ).rejects.toThrow('Actual data cannot be null or undefined');
    });

    it('should throw error for null config', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(
        validator.validate([mockPersona], [mockCalibratedPersona], mockActualData, null as any)
      ).rejects.toThrow('Config cannot be null or undefined');
    });

    it('should throw error for undefined config', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(
        validator.validate([mockPersona], [mockCalibratedPersona], mockActualData, undefined as any)
      ).rejects.toThrow('Config cannot be null or undefined');
    });

    it('should throw error for empty base personas', async () => {
      await expect(
        validator.validate([], [mockCalibratedPersona], mockActualData, mockConfig)
      ).rejects.toThrow('Base personas array cannot be empty');
    });

    it('should throw error for empty grounded personas', async () => {
      await expect(
        validator.validate([mockPersona], [], mockActualData, mockConfig)
      ).rejects.toThrow('Grounded personas array cannot be empty');
    });

    it('should throw error for mismatched persona counts', async () => {
      const twoPersonas = [mockPersona, { ...mockPersona, id: 'persona-2' }];

      await expect(
        validator.validate(twoPersonas, [mockCalibratedPersona], mockActualData, mockConfig)
      ).rejects.toThrow('Persona count mismatch');
    });

    it('should throw error for mismatched persona IDs', async () => {
      const differentPersona = { ...mockCalibratedPersona, id: 'persona-99' };

      await expect(
        validator.validate([mockPersona], [differentPersona], mockActualData, mockConfig)
      ).rejects.toThrow('Persona ID mismatch');
    });

    it('should include breakdown in results', async () => {
      const result = await validator.validate(
        [mockPersona],
        [mockCalibratedPersona],
        mockActualData,
        mockConfig
      );

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.positioning).toBeDefined();
      expect(result.breakdown.retention).toBeDefined();
      expect(result.breakdown.viral).toBeDefined();

      expect(result.breakdown.positioning.base).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.positioning.grounded).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.retention.base).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.retention.grounded).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.viral.base).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.viral.grounded).toBeGreaterThanOrEqual(0);
    });

    it('should include metadata in results', async () => {
      const result = await validator.validate(
        [mockPersona],
        [mockCalibratedPersona],
        mockActualData,
        mockConfig
      );

      expect(result.metadata).toBeDefined();
      expect(result.metadata.baseTestId).toBeDefined();
      expect(result.metadata.groundedTestId).toBeDefined();
      expect(result.metadata.validatorVersion).toBe('1.0.0');
    });

    it('should handle multiple personas', async () => {
      const personas = [
        mockPersona,
        { ...mockPersona, id: 'persona-2' },
        { ...mockPersona, id: 'persona-3' },
      ];

      const calibratedPersonas = [
        mockCalibratedPersona,
        { ...mockCalibratedPersona, id: 'persona-2' },
        { ...mockCalibratedPersona, id: 'persona-3' },
      ];

      const actualData: ActualData = {
        positioning: personas.map((p) => ({
          personaId: p.id,
          actualResponse: 'test',
          wasAccurate: true,
        })),
        retention: personas.map((p) => ({
          personaId: p.id,
          actualRetention: 0.8,
          timeframe: '30d',
        })),
        viral: personas.map((p) => ({
          personaId: p.id,
          actualViralCoefficient: 1.2,
          channels: [],
        })),
      };

      const result = await validator.validate(personas, calibratedPersonas, actualData, mockConfig);

      expect(result.sampleSize).toBe(3);
    });
  });

  describe('runSUTSTest', () => {
    it('should run base SUTS test', async () => {
      const result = await validator.runSUTSTest([mockPersona], mockConfig);

      expect(result).toBeDefined();
      expect(result.testId).toContain('base-');
      expect(result.predictions.positioning).toHaveLength(1);
    });

    it('should throw error for null personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(validator.runSUTSTest(null as any, mockConfig)).rejects.toThrow(
        'Personas cannot be null or undefined'
      );
    });

    it('should throw error for undefined personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(validator.runSUTSTest(undefined as any, mockConfig)).rejects.toThrow(
        'Personas cannot be null or undefined'
      );
    });

    it('should throw error for empty personas', async () => {
      await expect(validator.runSUTSTest([], mockConfig)).rejects.toThrow(
        'Personas array cannot be empty'
      );
    });
  });

  describe('runGroundedSUTSTest', () => {
    it('should run grounded SUTS test', async () => {
      const result = await validator.runGroundedSUTSTest([mockCalibratedPersona], mockConfig);

      expect(result).toBeDefined();
      expect(result.testId).toContain('grounded-');
      expect(result.predictions.positioning).toHaveLength(1);
    });

    it('should throw error for null personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(validator.runGroundedSUTSTest(null as any, mockConfig)).rejects.toThrow(
        'Personas cannot be null or undefined'
      );
    });

    it('should throw error for undefined personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(validator.runGroundedSUTSTest(undefined as any, mockConfig)).rejects.toThrow(
        'Personas cannot be null or undefined'
      );
    });

    it('should throw error for empty personas', async () => {
      await expect(validator.runGroundedSUTSTest([], mockConfig)).rejects.toThrow(
        'Personas array cannot be empty'
      );
    });
  });

  describe('calculateAccuracy', () => {
    it('should calculate accuracy from results', async () => {
      const sutsResult = await validator.runSUTSTest([mockPersona], mockConfig);
      const accuracy = validator.calculateAccuracy(sutsResult, mockActualData);

      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(100);
    });

    it('should throw error for null predicted', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => validator.calculateAccuracy(null as any, mockActualData)).toThrow(
        'Predicted data cannot be null or undefined'
      );
    });

    it('should throw error for undefined predicted', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => validator.calculateAccuracy(undefined as any, mockActualData)).toThrow(
        'Predicted data cannot be null or undefined'
      );
    });

    it('should throw error for null actual', async () => {
      const sutsResult = await validator.runSUTSTest([mockPersona], mockConfig);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => validator.calculateAccuracy(sutsResult, null as any)).toThrow(
        'Actual data cannot be null or undefined'
      );
    });

    it('should throw error for undefined actual', async () => {
      const sutsResult = await validator.runSUTSTest([mockPersona], mockConfig);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => validator.calculateAccuracy(sutsResult, undefined as any)).toThrow(
        'Actual data cannot be null or undefined'
      );
    });
  });
});
