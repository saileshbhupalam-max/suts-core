/**
 * Tests for RGS Calibration - Calibrated Persona Profiles
 */

import { PersonaProfile } from '@suts/core';
import { PersonaTrait } from '../src/traits';
import {
  createCalibratedPersona,
  validateCalibratedPersona,
  extractUniqueSources,
  ProfileGenerationError,
} from '../src/profiles';

describe('createCalibratedPersona', () => {
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

  const groundedTraits: PersonaTrait[] = [
    { category: 'psychographic', name: 'painPoint', value: 'performance issues', confidence: 0.9, source: 'rgs-insight' },
    { category: 'linguistic', name: 'tone', value: 'technical', confidence: 0.85, source: 'rgs-insight' },
  ];

  it('should create a valid CalibratedPersona', () => {
    const calibrated = createCalibratedPersona(basePersona, groundedTraits, 50, ['reddit', 'twitter']);

    expect(calibrated.id).toBe(basePersona.id);
    expect(calibrated.groundedTraits).toEqual(groundedTraits);
    expect(calibrated.signalCount).toBe(50);
    expect(calibrated.sources).toContain('reddit');
    expect(calibrated.sources).toContain('twitter');
    expect(calibrated.calibratedAt).toBeInstanceOf(Date);
    expect(calibrated.confidence).toBeGreaterThan(0);
    expect(calibrated.confidence).toBeLessThanOrEqual(1);
  });

  it('should calculate weighted confidence (40% base, 60% grounded)', () => {
    // Base confidence: 0.6
    // Grounded average: (0.9 + 0.85) / 2 = 0.875
    // Expected: 0.6 * 0.4 + 0.875 * 0.6 = 0.24 + 0.525 = 0.765
    const calibrated = createCalibratedPersona(basePersona, groundedTraits, 50, ['reddit']);

    expect(calibrated.confidence).toBeCloseTo(0.765, 2);
  });

  it('should merge grounded pain points with base pain points', () => {
    const calibrated = createCalibratedPersona(basePersona, groundedTraits, 50, ['reddit']);

    // Should include both base and grounded pain points
    expect(calibrated.painPoints).toContain('slow build times'); // base
    expect(calibrated.painPoints).toContain('performance issues'); // grounded
  });

  it('should deduplicate sources', () => {
    const calibrated = createCalibratedPersona(
      basePersona,
      groundedTraits,
      50,
      ['reddit', 'reddit', 'twitter', 'twitter'],
    );

    expect(calibrated.sources).toHaveLength(2);
    expect(new Set(calibrated.sources).size).toBe(2);
  });

  it('should throw error for negative signal count', () => {
    expect(() => createCalibratedPersona(basePersona, groundedTraits, -1, ['reddit'])).toThrow(
      ProfileGenerationError,
    );
  });

  it('should throw error for empty sources', () => {
    expect(() => createCalibratedPersona(basePersona, groundedTraits, 50, [])).toThrow(
      ProfileGenerationError,
    );
  });

  it('should use base confidence when no grounded traits', () => {
    const calibrated = createCalibratedPersona(basePersona, [], 0, ['base']);

    expect(calibrated.confidence).toBe(basePersona.confidenceScore);
  });

  it('should merge grounded desires with base goals', () => {
    const traitsWithDesires: PersonaTrait[] = [
      { category: 'psychographic', name: 'desire', value: 'better tooling', confidence: 0.9, source: 'rgs-insight' },
    ];

    const calibrated = createCalibratedPersona(basePersona, traitsWithDesires, 10, ['reddit']);

    expect(calibrated.goals).toContain('improve productivity'); // base
    expect(calibrated.goals).toContain('better tooling'); // grounded
  });

  it('should update lastUpdated timestamp', () => {
    const originalTimestamp = basePersona.lastUpdated;
    const calibrated = createCalibratedPersona(basePersona, groundedTraits, 50, ['reddit']);

    expect(calibrated.lastUpdated).not.toBe(originalTimestamp);
  });
});

describe('validateCalibratedPersona', () => {
  const validPersona = {
    id: 'test-1',
    archetype: 'Developer',
    role: 'Engineer',
    experienceLevel: 'Expert' as const,
    companySize: 'Startup' as const,
    techStack: ['TypeScript'],
    painPoints: ['bugs'],
    goals: ['quality'],
    fears: ['tech debt'],
    values: ['excellence'],
    riskTolerance: 0.7,
    patienceLevel: 0.5,
    techAdoption: 'Early adopter' as const,
    learningStyle: 'Documentation' as const,
    evaluationCriteria: ['speed'],
    dealBreakers: ['slow'],
    delightTriggers: ['fast'],
    referralTriggers: ['works'],
    typicalWorkflow: 'agile',
    timeAvailability: '40h',
    collaborationStyle: 'Team' as const,
    state: {},
    history: [],
    confidenceScore: 0.6,
    lastUpdated: new Date().toISOString(),
    source: 'test',
    groundedTraits: [
      { category: 'psychographic' as const, name: 'test', value: 'val', confidence: 0.8, source: 'rgs' },
    ],
    confidence: 0.75,
    signalCount: 50,
    sources: ['reddit'],
    calibratedAt: new Date(),
  };

  it('should validate a valid CalibratedPersona', () => {
    expect(validateCalibratedPersona(validPersona)).toBe(true);
  });

  it('should throw error for invalid persona', () => {
    const invalidPersona = {
      ...validPersona,
      confidence: 1.5, // Invalid confidence > 1
    };

    expect(() => validateCalibratedPersona(invalidPersona)).toThrow(ProfileGenerationError);
  });
});

describe('extractUniqueSources', () => {
  it('should extract unique sources from traits', () => {
    const traits: PersonaTrait[] = [
      { category: 'psychographic', name: 'test1', value: 'val', confidence: 0.8, source: 'reddit' },
      { category: 'psychographic', name: 'test2', value: 'val', confidence: 0.9, source: 'twitter' },
      { category: 'psychographic', name: 'test3', value: 'val', confidence: 0.7, source: 'reddit' },
    ];

    const sources = extractUniqueSources(traits);

    expect(sources).toHaveLength(2);
    expect(sources).toContain('reddit');
    expect(sources).toContain('twitter');
  });

  it('should handle empty traits array', () => {
    const sources = extractUniqueSources([]);
    expect(sources).toEqual([]);
  });

  it('should handle single trait', () => {
    const traits: PersonaTrait[] = [
      { category: 'psychographic', name: 'test', value: 'val', confidence: 0.8, source: 'github' },
    ];

    const sources = extractUniqueSources(traits);
    expect(sources).toEqual(['github']);
  });

  it('should handle all traits from same source', () => {
    const traits: PersonaTrait[] = [
      { category: 'psychographic', name: 'test1', value: 'val', confidence: 0.8, source: 'reddit' },
      { category: 'psychographic', name: 'test2', value: 'val', confidence: 0.9, source: 'reddit' },
    ];

    const sources = extractUniqueSources(traits);
    expect(sources).toEqual(['reddit']);
  });
});
