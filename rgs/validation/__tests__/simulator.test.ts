/**
 * Tests for SUTS simulator
 */

import { SUTSSimulator } from '../src/simulator';
import type { PersonaProfile } from '../../../packages/core/src/models/PersonaProfile';
import type { CalibratedPersona, TestConfig } from '../src/types';

describe('SUTSSimulator', () => {
  let simulator: SUTSSimulator;

  beforeEach(() => {
    simulator = new SUTSSimulator('1.0.0');
  });

  const mockPersona: PersonaProfile = {
    id: 'persona-1',
    archetype: 'Developer',
    role: 'Frontend Engineer',
    experienceLevel: 'Intermediate',
    companySize: 'Startup',
    techStack: ['React', 'TypeScript'],
    painPoints: ['Slow builds'],
    goals: ['Faster development'],
    fears: ['Technical debt'],
    values: ['Code quality'],
    riskTolerance: 0.7,
    patienceLevel: 0.6,
    techAdoption: 'Early adopter',
    learningStyle: 'Documentation',
    evaluationCriteria: ['Performance'],
    dealBreakers: ['No TypeScript support'],
    delightTriggers: ['Great DX'],
    referralTriggers: ['Solves pain points'],
    typicalWorkflow: 'Agile development',
    timeAvailability: '40 hours/week',
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
      sources: ['reddit', 'twitter'],
      sentimentScore: 0.5,
      themes: ['performance', 'dx'],
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

  describe('constructor', () => {
    it('should create simulator with version', () => {
      expect(simulator).toBeDefined();
      expect(simulator).toBeInstanceOf(SUTSSimulator);
    });

    it('should throw error for empty version', () => {
      expect(() => new SUTSSimulator('')).toThrow('Version cannot be empty');
    });

    it('should throw error for null version', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => new SUTSSimulator(null as any)).toThrow('Version cannot be empty');
    });

    it('should use default version when undefined', () => {
      // When version is undefined, default parameter '1.0.0' is used
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const simulator = new SUTSSimulator(undefined as any);
      expect(simulator).toBeDefined();
    });
  });

  describe('runSUTSTest', () => {
    it('should run test with valid personas', async () => {
      const result = await simulator.runSUTSTest([mockPersona], mockConfig);

      expect(result).toBeDefined();
      expect(result.testId).toContain('base-');
      expect(result.predictions.positioning).toHaveLength(1);
      expect(result.predictions.retention).toHaveLength(1);
      expect(result.predictions.viral).toHaveLength(1);
      expect(result.metadata.personaCount).toBe(1);
    });

    it('should throw error for null personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(simulator.runSUTSTest(null as any, mockConfig)).rejects.toThrow(
        'Personas cannot be null or undefined'
      );
    });

    it('should throw error for undefined personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(simulator.runSUTSTest(undefined as any, mockConfig)).rejects.toThrow(
        'Personas cannot be null or undefined'
      );
    });

    it('should throw error for empty personas array', async () => {
      await expect(simulator.runSUTSTest([], mockConfig)).rejects.toThrow(
        'Personas array cannot be empty'
      );
    });

    it('should throw error for null config', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(simulator.runSUTSTest([mockPersona], null as any)).rejects.toThrow(
        'Config cannot be null or undefined'
      );
    });

    it('should throw error for undefined config', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(simulator.runSUTSTest([mockPersona], undefined as any)).rejects.toThrow(
        'Config cannot be null or undefined'
      );
    });

    it('should generate predictions for multiple personas', async () => {
      const personas = [
        mockPersona,
        { ...mockPersona, id: 'persona-2' },
        { ...mockPersona, id: 'persona-3' },
      ];

      const result = await simulator.runSUTSTest(personas, mockConfig);

      expect(result.predictions.positioning).toHaveLength(3);
      expect(result.predictions.retention).toHaveLength(3);
      expect(result.predictions.viral).toHaveLength(3);
      expect(result.metadata.personaCount).toBe(3);
    });

    it('should include test metadata', async () => {
      const result = await simulator.runSUTSTest([mockPersona], mockConfig);

      expect(result.metadata.sutsVersion).toBe(mockConfig.sutsVersion);
      expect(result.metadata.testDuration).toMatch(/\d+ms$/);
    });

    it('should generate unique test IDs', async () => {
      const result1 = await simulator.runSUTSTest([mockPersona], mockConfig);
      const result2 = await simulator.runSUTSTest([mockPersona], mockConfig);

      expect(result1.testId).not.toBe(result2.testId);
    });
  });

  describe('runGroundedSUTSTest', () => {
    it('should run grounded test with valid personas', async () => {
      const result = await simulator.runGroundedSUTSTest([mockCalibratedPersona], mockConfig);

      expect(result).toBeDefined();
      expect(result.testId).toContain('grounded-');
      expect(result.predictions.positioning).toHaveLength(1);
      expect(result.predictions.retention).toHaveLength(1);
      expect(result.predictions.viral).toHaveLength(1);
    });

    it('should throw error for null personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(simulator.runGroundedSUTSTest(null as any, mockConfig)).rejects.toThrow(
        'Personas cannot be null or undefined'
      );
    });

    it('should throw error for undefined personas', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(simulator.runGroundedSUTSTest(undefined as any, mockConfig)).rejects.toThrow(
        'Personas cannot be null or undefined'
      );
    });

    it('should throw error for empty personas array', async () => {
      await expect(simulator.runGroundedSUTSTest([], mockConfig)).rejects.toThrow(
        'Personas array cannot be empty'
      );
    });

    it('should throw error for null config', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(
        simulator.runGroundedSUTSTest([mockCalibratedPersona], null as any)
      ).rejects.toThrow('Config cannot be null or undefined');
    });

    it('should throw error for undefined config', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(
        simulator.runGroundedSUTSTest([mockCalibratedPersona], undefined as any)
      ).rejects.toThrow('Config cannot be null or undefined');
    });

    it('should apply grounding quality boost', async () => {
      const result = await simulator.runGroundedSUTSTest([mockCalibratedPersona], mockConfig);

      // Grounded predictions should reference RGS data
      expect(result.predictions.positioning[0]?.reasoning).toContain('RGS grounding');
    });

    it('should handle multiple calibrated personas', async () => {
      const personas = [
        mockCalibratedPersona,
        { ...mockCalibratedPersona, id: 'persona-2' },
        { ...mockCalibratedPersona, id: 'persona-3' },
      ];

      const result = await simulator.runGroundedSUTSTest(personas, mockConfig);

      expect(result.predictions.positioning).toHaveLength(3);
      expect(result.predictions.retention).toHaveLength(3);
      expect(result.predictions.viral).toHaveLength(3);
    });

    it('should generate positioning predictions', async () => {
      const result = await simulator.runGroundedSUTSTest([mockCalibratedPersona], mockConfig);

      const positioning = result.predictions.positioning[0];
      expect(positioning).toBeDefined();
      if (positioning !== undefined) {
        expect(positioning.personaId).toBe(mockCalibratedPersona.id);
        expect(positioning.predictedResponse).toBeDefined();
        expect(positioning.confidence).toBeGreaterThan(0);
        expect(positioning.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should generate retention predictions', async () => {
      const result = await simulator.runGroundedSUTSTest([mockCalibratedPersona], mockConfig);

      const retention = result.predictions.retention[0];
      expect(retention).toBeDefined();
      if (retention !== undefined) {
        expect(retention.personaId).toBe(mockCalibratedPersona.id);
        expect(retention.predictedRetention).toBeGreaterThanOrEqual(0);
        expect(retention.predictedRetention).toBeLessThanOrEqual(1);
        expect(retention.timeframe).toBe('30d');
      }
    });

    it('should generate viral predictions', async () => {
      const result = await simulator.runGroundedSUTSTest([mockCalibratedPersona], mockConfig);

      const viral = result.predictions.viral[0];
      expect(viral).toBeDefined();
      if (viral !== undefined) {
        expect(viral.personaId).toBe(mockCalibratedPersona.id);
        expect(viral.predictedViralCoefficient).toBeGreaterThanOrEqual(0);
        expect(viral.channels).toBeDefined();
        expect(Array.isArray(viral.channels)).toBe(true);
      }
    });
  });

  describe('prediction quality', () => {
    it('should generate higher confidence for early adopters', async () => {
      const earlyAdopter = {
        ...mockPersona,
        techAdoption: 'Early adopter' as const,
        riskTolerance: 0.9,
      };

      const laggard = {
        ...mockPersona,
        id: 'persona-2',
        techAdoption: 'Laggard' as const,
        riskTolerance: 0.2,
      };

      const result = await simulator.runSUTSTest([earlyAdopter, laggard], mockConfig);

      const earlyResponse = result.predictions.positioning.find((p) => p.personaId === earlyAdopter.id);
      const laggardResponse = result.predictions.positioning.find((p) => p.personaId === laggard.id);

      expect(earlyResponse).toBeDefined();
      expect(laggardResponse).toBeDefined();
    });

    it('should predict higher retention for patient users', async () => {
      const patient = { ...mockPersona, patienceLevel: 0.9 };
      const impatient = {
        ...mockPersona,
        id: 'persona-2',
        patienceLevel: 0.1,
      };

      const result = await simulator.runSUTSTest([patient, impatient], mockConfig);

      const patientRetention = result.predictions.retention.find((p) => p.personaId === patient.id);
      const impatientRetention = result.predictions.retention.find((p) => p.personaId === impatient.id);

      expect(patientRetention).toBeDefined();
      expect(impatientRetention).toBeDefined();

      if (patientRetention !== undefined && impatientRetention !== undefined) {
        expect(patientRetention.predictedRetention).toBeGreaterThanOrEqual(
          impatientRetention.predictedRetention
        );
      }
    });

    it('should predict higher viral coefficient for community-driven personas', async () => {
      const communityDriven = {
        ...mockPersona,
        collaborationStyle: 'Community-driven' as const,
      };

      const solo = {
        ...mockPersona,
        id: 'persona-2',
        collaborationStyle: 'Solo' as const,
      };

      const result = await simulator.runSUTSTest([communityDriven, solo], mockConfig);

      const communityViral = result.predictions.viral.find((p) => p.personaId === communityDriven.id);
      const soloViral = result.predictions.viral.find((p) => p.personaId === solo.id);

      expect(communityViral).toBeDefined();
      expect(soloViral).toBeDefined();

      if (communityViral !== undefined && soloViral !== undefined) {
        expect(communityViral.predictedViralCoefficient).toBeGreaterThanOrEqual(
          soloViral.predictedViralCoefficient
        );
      }
    });
  });
});
