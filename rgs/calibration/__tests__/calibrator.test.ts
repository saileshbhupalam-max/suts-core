/**
 * Tests for RGS Calibration - Persona Calibrator
 */

import { PersonaProfile } from '@suts/core';
import { Insight, createInsight, createSentimentAnalysis, createTheme } from '@rgs/core';
import { PersonaCalibrator, createCalibrator, CalibrationError } from '../src/calibrator';

describe('PersonaCalibrator', () => {
  const basePersona: PersonaProfile = {
    id: 'test-persona-1',
    archetype: 'Developer',
    role: 'Senior Engineer',
    experienceLevel: 'Expert',
    companySize: 'Startup',
    techStack: ['TypeScript', 'React'],
    painPoints: ['slow build times'],
    goals: ['improve productivity'],
    fears: ['technical debt'],
    values: ['code quality'],
    riskTolerance: 0.7,
    patienceLevel: 0.5,
    techAdoption: 'Early adopter',
    learningStyle: 'Documentation',
    evaluationCriteria: ['performance'],
    dealBreakers: ['poor documentation'],
    delightTriggers: ['good DX'],
    referralTriggers: ['solves real problems'],
    typicalWorkflow: 'agile',
    timeAvailability: '40h/week',
    collaborationStyle: 'Team',
    state: {},
    history: [],
    confidenceScore: 0.6,
    lastUpdated: new Date().toISOString(),
    source: 'base-generator',
  };

  const insights: Insight[] = [
    createInsight({
      themes: [createTheme({ name: 'performance', confidence: 0.9, frequency: 10, keywords: ['fast', 'slow'] })],
      sentiment: createSentimentAnalysis({
        overall: 0.3,
        distribution: { positive: 0.4, neutral: 0.3, negative: 0.3 },
        positiveSignals: ['good'],
        negativeSignals: ['bad'],
      }),
      painPoints: ['performance issues', 'memory leaks'],
      desires: ['better tooling', 'faster builds'],
      language: {
        tone: 'technical',
        commonPhrases: ['need to optimize', 'looking for solution'],
        frequentTerms: { performance: 10, optimization: 5 },
        emotionalIndicators: ['frustrated'],
      },
      confidence: 0.85,
    }),
  ];

  describe('constructor', () => {
    it('should create calibrator with default config', () => {
      const calibrator = new PersonaCalibrator();
      const config = calibrator.getConfig();

      expect(config.minConfidence).toBe(0.5);
      expect(config.conflictStrategy).toBe('rgs-priority');
      expect(config.deduplicate).toBe(true);
    });

    it('should create calibrator with custom config', () => {
      const calibrator = new PersonaCalibrator({
        minConfidence: 0.7,
        conflictStrategy: 'highest-confidence',
        deduplicate: false,
      });

      const config = calibrator.getConfig();
      expect(config.minConfidence).toBe(0.7);
      expect(config.conflictStrategy).toBe('highest-confidence');
      expect(config.deduplicate).toBe(false);
    });

    it('should throw error for invalid minConfidence > 1', () => {
      expect(() => new PersonaCalibrator({ minConfidence: 1.5 })).toThrow(CalibrationError);
    });

    it('should throw error for invalid minConfidence < 0', () => {
      expect(() => new PersonaCalibrator({ minConfidence: -0.1 })).toThrow(CalibrationError);
    });
  });

  describe('calibrate', () => {
    it('should calibrate persona with insights', () => {
      const calibrator = new PersonaCalibrator();
      const calibrated = calibrator.calibrate(basePersona, insights, 100);

      expect(calibrated).toBeDefined();
      expect(calibrated.id).toBe(basePersona.id);
      expect(calibrated.groundedTraits.length).toBeGreaterThan(0);
      expect(calibrated.signalCount).toBe(100);
      expect(calibrated.sources.length).toBeGreaterThan(0);
      expect(calibrated.confidence).toBeGreaterThan(0);
      expect(calibrated.confidence).toBeLessThanOrEqual(1);
    });

    it('should include grounded traits in calibrated persona', () => {
      const calibrator = new PersonaCalibrator();
      const calibrated = calibrator.calibrate(basePersona, insights, 100);

      // Should have pain points from insights
      expect(calibrated.groundedTraits.some((t) => t.name === 'painPoint')).toBe(true);

      // Should have desires from insights
      expect(calibrated.groundedTraits.some((t) => t.name === 'desire')).toBe(true);

      // Should have linguistic traits
      expect(calibrated.groundedTraits.some((t) => t.name === 'tone')).toBe(true);
    });

    it('should filter traits by minimum confidence', () => {
      const calibrator = new PersonaCalibrator({ minConfidence: 0.9 });
      const calibrated = calibrator.calibrate(basePersona, insights, 100);

      // All grounded traits should have confidence >= 0.9
      expect(calibrated.groundedTraits.every((t) => t.confidence >= 0.9)).toBe(true);
    });

    it('should throw error for empty insights', () => {
      const calibrator = new PersonaCalibrator();

      expect(() => calibrator.calibrate(basePersona, [], 0)).toThrow(CalibrationError);
    });

    it('should throw error for negative signal count', () => {
      const calibrator = new PersonaCalibrator();

      expect(() => calibrator.calibrate(basePersona, insights, -1)).toThrow(CalibrationError);
    });

    it('should throw error when no traits meet confidence threshold', () => {
      const calibrator = new PersonaCalibrator({ minConfidence: 0.99 });

      expect(() => calibrator.calibrate(basePersona, insights, 100)).toThrow(CalibrationError);
    });

    it('should deduplicate traits when configured', () => {
      const calibrator = new PersonaCalibrator({ deduplicate: true });
      const calibrated = calibrator.calibrate(basePersona, insights, 100);

      // Check for duplicates
      const traitKeys = calibrated.groundedTraits.map((t) =>
        JSON.stringify({ category: t.category, name: t.name, value: t.value, source: t.source }),
      );
      const uniqueKeys = new Set(traitKeys);

      expect(traitKeys.length).toBe(uniqueKeys.size);
    });

    it('should extract sources from insights', () => {
      const calibrator = new PersonaCalibrator();
      const calibrated = calibrator.calibrate(basePersona, insights, 100);

      expect(calibrated.sources).toContain('rgs-insight');
    });

    it('should handle low confidence base persona', () => {
      const lowConfidencePersona = { ...basePersona, confidenceScore: 0.2 };
      const calibrator = new PersonaCalibrator();
      const calibrated = calibrator.calibrate(lowConfidencePersona, insights, 100);

      // Calibrated confidence should be higher due to RGS data
      expect(calibrated.confidence).toBeGreaterThan(lowConfidencePersona.confidenceScore);
    });
  });

  describe('extractTraits', () => {
    it('should extract traits from insights', () => {
      const calibrator = new PersonaCalibrator();
      const traits = calibrator.extractTraits(insights);

      expect(traits.length).toBeGreaterThan(0);
      expect(traits.some((t) => t.category === 'psychographic')).toBe(true);
      expect(traits.some((t) => t.category === 'linguistic')).toBe(true);
    });

    it('should return empty array for empty insights', () => {
      const calibrator = new PersonaCalibrator();
      const traits = calibrator.extractTraits([]);

      expect(traits).toEqual([]);
    });
  });

  describe('mergeTraits', () => {
    it('should merge base and grounded traits', () => {
      const calibrator = new PersonaCalibrator();
      const baseTraits = [
        { category: 'psychographic' as const, name: 'painPoint', value: 'base-pain', confidence: 0.6, source: 'base' },
      ];
      const groundedTraits = [
        {
          category: 'psychographic' as const,
          name: 'painPoint',
          value: 'rgs-pain',
          confidence: 0.9,
          source: 'rgs-insight',
        },
      ];

      const merged = calibrator.mergeTraits(baseTraits, groundedTraits);

      expect(merged.length).toBeGreaterThan(0);
      // With default rgs-priority, should prefer RGS trait
      const painTrait = merged.find((t) => t.name === 'painPoint');
      expect(painTrait?.source).toBe('rgs-insight');
    });

    it('should use configured conflict strategy', () => {
      const calibrator = new PersonaCalibrator({ conflictStrategy: 'base-priority' });
      const baseTraits = [
        { category: 'psychographic' as const, name: 'test', value: 'base-value', confidence: 0.6, source: 'base' },
      ];
      const groundedTraits = [
        { category: 'psychographic' as const, name: 'test', value: 'rgs-value', confidence: 0.9, source: 'rgs-insight' },
      ];

      const merged = calibrator.mergeTraits(baseTraits, groundedTraits);

      const testTrait = merged.find((t) => t.name === 'test');
      expect(testTrait?.source).toBe('base'); // base-priority
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const calibrator = new PersonaCalibrator({
        minConfidence: 0.8,
        conflictStrategy: 'highest-confidence',
      });

      const config = calibrator.getConfig();

      expect(config.minConfidence).toBe(0.8);
      expect(config.conflictStrategy).toBe('highest-confidence');
      expect(config.deduplicate).toBe(true); // default
    });

    it('should return a copy of config', () => {
      const calibrator = new PersonaCalibrator();
      const config1 = calibrator.getConfig();
      const config2 = calibrator.getConfig();

      expect(config1).not.toBe(config2); // Different objects
      expect(config1).toEqual(config2); // But equal values
    });
  });
});

describe('createCalibrator', () => {
  it('should create calibrator with default config', () => {
    const calibrator = createCalibrator();
    const config = calibrator.getConfig();

    expect(config.minConfidence).toBe(0.5);
    expect(config.conflictStrategy).toBe('rgs-priority');
  });

  it('should create calibrator with custom config', () => {
    const calibrator = createCalibrator({
      minConfidence: 0.7,
      conflictStrategy: 'base-priority',
    });

    const config = calibrator.getConfig();
    expect(config.minConfidence).toBe(0.7);
    expect(config.conflictStrategy).toBe('base-priority');
  });
});
