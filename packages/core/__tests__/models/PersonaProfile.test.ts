/**
 * Tests for PersonaProfile model
 */

import { describe, it, expect } from '@jest/globals';
import {
  PersonaProfileSchema,
  validatePersonaProfile,
  safeValidatePersonaProfile,
  type PersonaProfile,
} from '../../src/models/PersonaProfile';

describe('PersonaProfileSchema', () => {
  const validPersona: PersonaProfile = {
    id: 'persona-001',
    archetype: 'Skeptical Developer',
    role: 'Senior Software Engineer',
    experienceLevel: 'Expert',
    companySize: 'Enterprise',
    techStack: ['TypeScript', 'React', 'Node.js'],
    painPoints: ['Too many false positives', 'Slow performance'],
    goals: ['Improve code quality', 'Reduce bugs'],
    fears: ['Data privacy issues', 'Vendor lock-in'],
    values: ['Privacy', 'Performance', 'Simplicity'],
    riskTolerance: 0.3,
    patienceLevel: 0.7,
    techAdoption: 'Early majority',
    learningStyle: 'Documentation',
    evaluationCriteria: ['Performance', 'Security', 'Cost'],
    dealBreakers: ['No privacy controls', 'Vendor lock-in'],
    delightTriggers: ['Time saved', 'Bugs prevented'],
    referralTriggers: ['Significant time savings', 'Team productivity boost'],
    typicalWorkflow: 'Code review, testing, deployment',
    timeAvailability: '2-3 hours per week for new tools',
    collaborationStyle: 'Team',
    state: {},
    history: [],
    confidenceScore: 0.8,
    lastUpdated: '2025-01-10T12:00:00.000Z',
    source: 'stakeholder_analysis',
  };

  describe('valid persona', () => {
    it('should validate correct persona data', () => {
      const result = PersonaProfileSchema.safeParse(validPersona);
      expect(result.success).toBe(true);
    });

    it('should allow defaults for optional fields', () => {
      const minimalPersona = {
        ...validPersona,
        state: undefined,
        history: undefined,
        confidenceScore: undefined,
      };

      const result = PersonaProfileSchema.safeParse(minimalPersona);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.state).toEqual({});
        expect(result.data.history).toEqual([]);
        expect(result.data.confidenceScore).toBe(0.5);
      }
    });
  });

  describe('required fields', () => {
    it('should reject missing id', () => {
      const invalid = { ...validPersona, id: '' };
      const result = PersonaProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject missing archetype', () => {
      const invalid = { ...validPersona, archetype: '' };
      const result = PersonaProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject missing role', () => {
      const invalid = { ...validPersona, role: '' };
      const result = PersonaProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject empty tech stack', () => {
      const invalid = { ...validPersona, techStack: [] };
      const result = PersonaProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('enum validations', () => {
    it('should validate correct experience levels', () => {
      const levels: Array<'Novice' | 'Intermediate' | 'Expert'> = ['Novice', 'Intermediate', 'Expert'];
      for (const level of levels) {
        const persona = { ...validPersona, experienceLevel: level };
        const result = PersonaProfileSchema.safeParse(persona);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid experience level', () => {
      const invalid = { ...validPersona, experienceLevel: 'Master' };
      const result = PersonaProfileSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should validate correct company sizes', () => {
      const sizes: Array<'Startup' | 'SMB' | 'Enterprise'> = ['Startup', 'SMB', 'Enterprise'];
      for (const size of sizes) {
        const persona = { ...validPersona, companySize: size };
        const result = PersonaProfileSchema.safeParse(persona);
        expect(result.success).toBe(true);
      }
    });

    it('should validate tech adoption values', () => {
      const adoptions: Array<'Early adopter' | 'Early majority' | 'Late majority' | 'Laggard'> = [
        'Early adopter',
        'Early majority',
        'Late majority',
        'Laggard',
      ];
      for (const adoption of adoptions) {
        const persona = { ...validPersona, techAdoption: adoption };
        const result = PersonaProfileSchema.safeParse(persona);
        expect(result.success).toBe(true);
      }
    });

    it('should validate learning styles', () => {
      const styles: Array<'Trial-error' | 'Documentation' | 'Video' | 'Peer learning'> = [
        'Trial-error',
        'Documentation',
        'Video',
        'Peer learning',
      ];
      for (const style of styles) {
        const persona = { ...validPersona, learningStyle: style };
        const result = PersonaProfileSchema.safeParse(persona);
        expect(result.success).toBe(true);
      }
    });

    it('should validate collaboration styles', () => {
      const styles: Array<'Solo' | 'Team' | 'Community-driven'> = ['Solo', 'Team', 'Community-driven'];
      for (const style of styles) {
        const persona = { ...validPersona, collaborationStyle: style };
        const result = PersonaProfileSchema.safeParse(persona);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('numeric range validations', () => {
    it('should validate risk tolerance in range 0-1', () => {
      const values = [0, 0.5, 1];
      for (const value of values) {
        const persona = { ...validPersona, riskTolerance: value };
        const result = PersonaProfileSchema.safeParse(persona);
        expect(result.success).toBe(true);
      }
    });

    it('should reject risk tolerance out of range', () => {
      const values = [-0.1, 1.1, 2];
      for (const value of values) {
        const persona = { ...validPersona, riskTolerance: value };
        const result = PersonaProfileSchema.safeParse(persona);
        expect(result.success).toBe(false);
      }
    });

    it('should validate patience level in range 0-1', () => {
      const values = [0, 0.5, 1];
      for (const value of values) {
        const persona = { ...validPersona, patienceLevel: value };
        const result = PersonaProfileSchema.safeParse(persona);
        expect(result.success).toBe(true);
      }
    });

    it('should validate confidence score in range 0-1', () => {
      const values = [0, 0.5, 1];
      for (const value of values) {
        const persona = { ...validPersona, confidenceScore: value };
        const result = PersonaProfileSchema.safeParse(persona);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('datetime validations', () => {
    it('should validate ISO 8601 datetime strings', () => {
      const validDates = [
        '2025-01-10T12:00:00.000Z',
        '2025-01-10T12:00:00Z',
        '2025-01-10T12:00:00.123Z',
      ];

      for (const date of validDates) {
        const persona = { ...validPersona, lastUpdated: date };
        const result = PersonaProfileSchema.safeParse(persona);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid datetime strings', () => {
      const invalidDates = [
        '2025-01-10',
        '2025/01/10 12:00:00',
        'invalid-date',
        '',
      ];

      for (const date of invalidDates) {
        const persona = { ...validPersona, lastUpdated: date };
        const result = PersonaProfileSchema.safeParse(persona);
        expect(result.success).toBe(false);
      }
    });
  });
});

describe('validatePersonaProfile', () => {
  const validPersona: PersonaProfile = {
    id: 'persona-001',
    archetype: 'Skeptical Developer',
    role: 'Senior Software Engineer',
    experienceLevel: 'Expert',
    companySize: 'Enterprise',
    techStack: ['TypeScript'],
    painPoints: [],
    goals: [],
    fears: [],
    values: [],
    riskTolerance: 0.5,
    patienceLevel: 0.5,
    techAdoption: 'Early majority',
    learningStyle: 'Documentation',
    evaluationCriteria: [],
    dealBreakers: [],
    delightTriggers: [],
    referralTriggers: [],
    typicalWorkflow: 'Standard workflow',
    timeAvailability: 'Limited',
    collaborationStyle: 'Team',
    state: {},
    history: [],
    confidenceScore: 0.5,
    lastUpdated: '2025-01-10T12:00:00.000Z',
    source: 'test',
  };

  it('should return validated persona for valid data', () => {
    const result = validatePersonaProfile(validPersona);
    expect(result).toEqual(validPersona);
  });

  it('should throw error for invalid data', () => {
    const invalid = { ...validPersona, id: '' };
    expect(() => validatePersonaProfile(invalid)).toThrow();
  });
});

describe('safeValidatePersonaProfile', () => {
  const validPersona: PersonaProfile = {
    id: 'persona-001',
    archetype: 'Test',
    role: 'Developer',
    experienceLevel: 'Intermediate',
    companySize: 'Startup',
    techStack: ['JavaScript'],
    painPoints: [],
    goals: [],
    fears: [],
    values: [],
    riskTolerance: 0.5,
    patienceLevel: 0.5,
    techAdoption: 'Early adopter',
    learningStyle: 'Trial-error',
    evaluationCriteria: [],
    dealBreakers: [],
    delightTriggers: [],
    referralTriggers: [],
    typicalWorkflow: 'Agile',
    timeAvailability: 'Flexible',
    collaborationStyle: 'Solo',
    state: {},
    history: [],
    confidenceScore: 0.5,
    lastUpdated: '2025-01-10T12:00:00.000Z',
    source: 'test',
  };

  it('should return success for valid data', () => {
    const result = safeValidatePersonaProfile(validPersona);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validPersona);
    }
  });

  it('should return error for invalid data', () => {
    const invalid = { ...validPersona, id: '' };
    const result = safeValidatePersonaProfile(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
