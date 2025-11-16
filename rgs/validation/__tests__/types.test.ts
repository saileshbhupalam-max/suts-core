/**
 * Tests for validation framework types and schemas
 */

import {
  CalibratedPersonaSchema,
  SUTSResultSchema,
  ActualDataSchema,
  ValidationResultSchema,
  TestConfigSchema,
  ValidationError,
  SimulatorError,
  MetricsError,
  validateCalibratedPersona,
  safeValidateCalibratedPersona,
} from '../src/types';

describe('CalibratedPersonaSchema', () => {
  const validCalibratedPersona = {
    id: 'persona-1',
    archetype: 'Developer',
    role: 'Frontend Engineer',
    experienceLevel: 'Intermediate' as const,
    companySize: 'Startup' as const,
    techStack: ['React', 'TypeScript'],
    painPoints: ['Slow builds'],
    goals: ['Faster development'],
    fears: ['Technical debt'],
    values: ['Code quality'],
    riskTolerance: 0.7,
    patienceLevel: 0.6,
    techAdoption: 'Early adopter' as const,
    learningStyle: 'Documentation' as const,
    evaluationCriteria: ['Performance'],
    dealBreakers: ['No TypeScript support'],
    delightTriggers: ['Great DX'],
    referralTriggers: ['Solves pain points'],
    typicalWorkflow: 'Agile development',
    timeAvailability: '40 hours/week',
    collaborationStyle: 'Team' as const,
    state: {},
    history: [],
    confidenceScore: 0.8,
    lastUpdated: new Date().toISOString(),
    source: 'test',
    calibrationData: {
      signalCount: 100,
      sources: ['reddit', 'twitter'],
      sentimentScore: 0.5,
      themes: ['performance', 'dx'],
      groundingQuality: 0.85,
      lastCalibrated: new Date().toISOString(),
    },
  };

  it('should validate a valid CalibratedPersona', () => {
    const result = CalibratedPersonaSchema.safeParse(validCalibratedPersona);
    expect(result.success).toBe(true);
  });

  it('should reject CalibratedPersona without calibrationData', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { calibrationData, ...withoutCalibration } = validCalibratedPersona;
    const result = CalibratedPersonaSchema.safeParse(withoutCalibration);
    expect(result.success).toBe(false);
  });

  it('should reject invalid experienceLevel', () => {
    const invalid = { ...validCalibratedPersona, experienceLevel: 'Invalid' };
    const result = CalibratedPersonaSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid groundingQuality', () => {
    const invalid = {
      ...validCalibratedPersona,
      calibrationData: {
        ...validCalibratedPersona.calibrationData,
        groundingQuality: 1.5,
      },
    };
    const result = CalibratedPersonaSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('SUTSResultSchema', () => {
  const validSUTSResult = {
    testId: 'test-123',
    timestamp: new Date().toISOString(),
    predictions: {
      positioning: [
        {
          personaId: 'persona-1',
          predictedResponse: 'Interested',
          confidence: 0.8,
          reasoning: 'Based on profile',
        },
      ],
      retention: [
        {
          personaId: 'persona-1',
          predictedRetention: 0.75,
          timeframe: '30d',
          reasoning: 'High engagement',
        },
      ],
      viral: [
        {
          personaId: 'persona-1',
          predictedViralCoefficient: 1.2,
          channels: ['social'],
          reasoning: 'Active sharer',
        },
      ],
    },
    metadata: {
      personaCount: 1,
      testDuration: '1000ms',
      sutsVersion: '1.0.0',
    },
  };

  it('should validate a valid SUTSResult', () => {
    const result = SUTSResultSchema.safeParse(validSUTSResult);
    expect(result.success).toBe(true);
  });

  it('should reject SUTSResult with invalid confidence', () => {
    const invalid = {
      ...validSUTSResult,
      predictions: {
        ...validSUTSResult.predictions,
        positioning: [
          {
            ...validSUTSResult.predictions.positioning[0],
            confidence: 1.5,
          },
        ],
      },
    };
    const result = SUTSResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('ActualDataSchema', () => {
  const validActualData = {
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
        actualRetention: 0.8,
        timeframe: '30d',
      },
    ],
    viral: [
      {
        personaId: 'persona-1',
        actualViralCoefficient: 1.3,
        channels: ['social', 'email'],
      },
    ],
  };

  it('should validate valid ActualData', () => {
    const result = ActualDataSchema.safeParse(validActualData);
    expect(result.success).toBe(true);
  });

  it('should reject ActualData with invalid retention', () => {
    const invalid = {
      ...validActualData,
      retention: [
        {
          ...validActualData.retention[0],
          actualRetention: 1.5,
        },
      ],
    };
    const result = ActualDataSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('ValidationResultSchema', () => {
  const validValidationResult = {
    baseAccuracy: 85.5,
    groundedAccuracy: 92.3,
    improvement: 6.8,
    confidence: 0.95,
    breakdown: {
      positioning: { base: 84.0, grounded: 91.0 },
      retention: { base: 86.0, grounded: 93.0 },
      viral: { base: 87.0, grounded: 93.5 },
    },
    sampleSize: 50,
    testDuration: '5000ms',
    timestamp: new Date().toISOString(),
    metadata: {
      baseTestId: 'base-123',
      groundedTestId: 'grounded-456',
      validatorVersion: '1.0.0',
    },
  };

  it('should validate a valid ValidationResult', () => {
    const result = ValidationResultSchema.safeParse(validValidationResult);
    expect(result.success).toBe(true);
  });

  it('should reject ValidationResult with accuracy > 100', () => {
    const invalid = { ...validValidationResult, baseAccuracy: 105 };
    const result = ValidationResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject ValidationResult with negative sample size', () => {
    const invalid = { ...validValidationResult, sampleSize: -1 };
    const result = ValidationResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('TestConfigSchema', () => {
  it('should validate with defaults', () => {
    const result = TestConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sampleSize).toBe(50);
      expect(result.data.confidenceLevel).toBe(0.95);
      expect(result.data.timeout).toBe(300000);
    }
  });

  it('should validate custom config', () => {
    const config = {
      sampleSize: 100,
      confidenceLevel: 0.99,
      timeout: 600000,
      sutsVersion: '2.0.0',
      enableParallel: true,
      retryAttempts: 5,
    };
    const result = TestConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject negative sample size', () => {
    const result = TestConfigSchema.safeParse({ sampleSize: -10 });
    expect(result.success).toBe(false);
  });
});

describe('Custom Error Classes', () => {
  describe('ValidationError', () => {
    it('should create error with code and details', () => {
      const error = new ValidationError('Test error', 'TEST_CODE', { key: 'value' });
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ key: 'value' });
    });

    it('should create error without details', () => {
      const error = new ValidationError('Test error', 'TEST_CODE');
      expect(error.details).toBeUndefined();
    });
  });

  describe('SimulatorError', () => {
    it('should create error with code and details', () => {
      const error = new SimulatorError('Sim error', 'SIM_CODE', { data: 123 });
      expect(error.name).toBe('SimulatorError');
      expect(error.message).toBe('Sim error');
      expect(error.code).toBe('SIM_CODE');
      expect(error.details).toEqual({ data: 123 });
    });
  });

  describe('MetricsError', () => {
    it('should create error with code and details', () => {
      const error = new MetricsError('Metrics error', 'METRICS_CODE');
      expect(error.name).toBe('MetricsError');
      expect(error.message).toBe('Metrics error');
      expect(error.code).toBe('METRICS_CODE');
    });
  });
});

describe('Validation Functions', () => {
  const validCalibratedPersona = {
    id: 'persona-1',
    archetype: 'Developer',
    role: 'Frontend Engineer',
    experienceLevel: 'Intermediate' as const,
    companySize: 'Startup' as const,
    techStack: ['React'],
    painPoints: [],
    goals: [],
    fears: [],
    values: [],
    riskTolerance: 0.5,
    patienceLevel: 0.5,
    techAdoption: 'Early adopter' as const,
    learningStyle: 'Documentation' as const,
    evaluationCriteria: [],
    dealBreakers: [],
    delightTriggers: [],
    referralTriggers: [],
    typicalWorkflow: 'Agile',
    timeAvailability: '40h',
    collaborationStyle: 'Team' as const,
    state: {},
    history: [],
    confidenceScore: 0.8,
    lastUpdated: new Date().toISOString(),
    source: 'test',
    calibrationData: {
      signalCount: 10,
      sources: ['test'],
      sentimentScore: 0.5,
      themes: [],
      groundingQuality: 0.8,
      lastCalibrated: new Date().toISOString(),
    },
  };

  describe('validateCalibratedPersona', () => {
    it('should validate valid persona', () => {
      expect(() => validateCalibratedPersona(validCalibratedPersona)).not.toThrow();
    });

    it('should throw on invalid persona', () => {
      expect(() => validateCalibratedPersona({})).toThrow();
    });
  });

  describe('safeValidateCalibratedPersona', () => {
    it('should return success for valid persona', () => {
      const result = safeValidateCalibratedPersona(validCalibratedPersona);
      expect(result.success).toBe(true);
    });

    it('should return error for invalid persona', () => {
      const result = safeValidateCalibratedPersona({});
      expect(result.success).toBe(false);
    });
  });

  describe('validatePersonaProfile', () => {
    const { validatePersonaProfile } = require('../src/types');

    it('should validate valid persona', () => {
      const validPersona = { id: 'test', archetype: 'Developer' };
      expect(() => validatePersonaProfile(validPersona)).not.toThrow();
    });

    it('should throw on null persona', () => {
      expect(() => validatePersonaProfile(null)).toThrow('PersonaProfile cannot be null or undefined');
    });

    it('should throw on undefined persona', () => {
      expect(() => validatePersonaProfile(undefined)).toThrow('PersonaProfile cannot be null or undefined');
    });
  });
});
