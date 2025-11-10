/**
 * Tests for validation utilities
 */

import { type PersonaProfile } from '@suts/core';
import {
  validatePersona,
  validatePersonas,
  checkDuplicates,
  calculateSimilarity,
  analyzeDiversity,
  calculateConfidenceScore,
} from '../validation';

describe('validation', () => {
  const validPersona: PersonaProfile = {
    id: 'persona-1',
    archetype: 'Cautious Enterprise Architect',
    role: 'Senior Solutions Architect',
    experienceLevel: 'Expert',
    companySize: 'Enterprise',
    techStack: ['Java', 'Spring', 'AWS', 'Kubernetes'],
    painPoints: [
      'Legacy system integration',
      'Compliance requirements',
      'Vendor lock-in concerns',
    ],
    goals: ['Modernize infrastructure', 'Reduce operational costs', 'Improve scalability'],
    fears: ['Security breaches', 'Downtime', 'Budget overruns'],
    values: ['Reliability', 'Security', 'Best practices'],
    riskTolerance: 0.3,
    patienceLevel: 0.8,
    techAdoption: 'Late majority',
    learningStyle: 'Documentation',
    evaluationCriteria: ['Security track record', 'Enterprise support', 'Scalability'],
    dealBreakers: ['No enterprise support', 'Unclear pricing'],
    delightTriggers: ['Excellent documentation', 'Responsive support'],
    referralTriggers: ['Proven ROI', 'Easy migration'],
    typicalWorkflow: 'Reviews vendor proposals, conducts POCs, presents to leadership',
    timeAvailability: '5-10 hours per week for evaluation',
    collaborationStyle: 'Team',
    state: {},
    history: [],
    confidenceScore: 0.85,
    lastUpdated: '2024-01-01T00:00:00Z',
    source: 'llm-generated',
  };

  describe('validatePersona', () => {
    it('should validate a valid persona', () => {
      const result = validatePersona(validPersona);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject persona with missing required fields', () => {
      const invalid = { ...validPersona };
      delete (invalid as Partial<PersonaProfile>).id;
      const result = validatePersona(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject persona with invalid enum value', () => {
      const invalid = { ...validPersona, experienceLevel: 'Invalid' };
      const result = validatePersona(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject persona with out-of-range numeric values', () => {
      const invalid = { ...validPersona, riskTolerance: 1.5 };
      const result = validatePersona(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about low confidence score', () => {
      const lowConfidence = { ...validPersona, confidenceScore: 0.4 };
      const result = validatePersona(lowConfidence);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Low confidence');
    });

    it('should warn about array length issues', () => {
      const shortTechStack = { ...validPersona, techStack: ['Java'] };
      const result = validatePersona(shortTechStack);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('techStack');
    });

    it('should reject persona with empty string fields', () => {
      const emptyRole = { ...validPersona, role: '' };
      const result = validatePersona(emptyRole);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle non-object input', () => {
      const result = validatePersona(null);
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePersonas', () => {
    it('should validate multiple personas', () => {
      const persona2 = { ...validPersona, id: 'persona-2' };
      const results = validatePersonas([validPersona, persona2]);
      expect(results.size).toBe(2);
      expect(results.get('persona-1')?.valid).toBe(true);
      expect(results.get('persona-2')?.valid).toBe(true);
    });

    it('should handle personas without IDs', () => {
      const noId = { ...validPersona };
      delete (noId as Partial<PersonaProfile>).id;
      const results = validatePersonas([noId]);
      expect(results.size).toBe(1);
      expect(results.has('persona-0')).toBe(true);
    });
  });

  describe('checkDuplicates', () => {
    it('should detect duplicate IDs', () => {
      const persona2 = { ...validPersona };
      const duplicates = checkDuplicates([validPersona, persona2]);
      expect(duplicates).toContain('persona-1');
    });

    it('should return empty array for unique IDs', () => {
      const persona2 = { ...validPersona, id: 'persona-2' };
      const duplicates = checkDuplicates([validPersona, persona2]);
      expect(duplicates).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const duplicates = checkDuplicates([]);
      expect(duplicates).toHaveLength(0);
    });
  });

  describe('calculateSimilarity', () => {
    it('should calculate similarity between identical personas', () => {
      const { similarity } = calculateSimilarity(validPersona, validPersona);
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('should calculate similarity between different personas', () => {
      const persona2: PersonaProfile = {
        ...validPersona,
        id: 'persona-2',
        archetype: 'Scrappy Startup Developer',
        role: 'Full Stack Developer',
        experienceLevel: 'Intermediate',
        companySize: 'Startup',
        techStack: ['Node.js', 'React', 'MongoDB', 'AWS'],
        painPoints: ['Limited resources', 'Fast iteration', 'Technical debt'],
        goals: ['Ship features quickly', 'Learn new technologies', 'Build MVP'],
        riskTolerance: 0.8,
        techAdoption: 'Early adopter',
        learningStyle: 'Trial-error',
        collaborationStyle: 'Solo',
      };
      const { similarity, reasons } = calculateSimilarity(validPersona, persona2);
      expect(similarity).toBeLessThan(0.5);
      expect(reasons).toBeDefined();
    });

    it('should identify reasons for similarity', () => {
      const persona2 = {
        ...validPersona,
        id: 'persona-2',
        painPoints: validPersona.painPoints,
      };
      const { reasons } = calculateSimilarity(validPersona, persona2);
      expect(reasons.length).toBeGreaterThan(0);
    });

    it('should handle personas with empty arrays', () => {
      const persona1 = { ...validPersona, techStack: [] };
      const persona2 = { ...validPersona, id: 'persona-2', techStack: [] };
      const { similarity } = calculateSimilarity(persona1, persona2);
      expect(similarity).toBeGreaterThan(0);
    });
  });

  describe('analyzeDiversity', () => {
    it('should return high diversity for single persona', () => {
      const result = analyzeDiversity([validPersona]);
      expect(result.diversityScore).toBe(1);
      expect(result.meetsTarget).toBe(true);
    });

    it('should detect low diversity in similar personas', () => {
      const persona2 = { ...validPersona, id: 'persona-2' };
      const result = analyzeDiversity([validPersona, persona2]);
      expect(result.diversityScore).toBeLessThan(0.5);
      expect(result.meetsTarget).toBe(false);
      expect(result.similarPairs.length).toBeGreaterThan(0);
    });

    it('should detect high diversity in different personas', () => {
      const persona2: PersonaProfile = {
        ...validPersona,
        id: 'persona-2',
        archetype: 'Scrappy Startup Developer',
        experienceLevel: 'Novice',
        companySize: 'Startup',
        techStack: ['Node.js', 'React', 'MongoDB'],
        painPoints: ['Limited budget', 'Fast iteration'],
        goals: ['Ship quickly', 'Learn fast'],
        fears: ['Running out of money', 'Competition'],
        values: ['Speed', 'Innovation'],
        riskTolerance: 0.9,
        patienceLevel: 0.2,
        techAdoption: 'Early adopter',
        learningStyle: 'Trial-error',
        collaborationStyle: 'Solo',
      };
      const result = analyzeDiversity([validPersona, persona2]);
      expect(result.diversityScore).toBeGreaterThan(0.5);
    });

    it('should handle empty array', () => {
      const result = analyzeDiversity([]);
      expect(result.diversityScore).toBe(1);
      expect(result.meetsTarget).toBe(true);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should increase confidence when role is mentioned', () => {
      const analysis = 'We interviewed Senior Solutions Architects at enterprises';
      const score = calculateConfidenceScore(analysis, validPersona);
      expect(score).toBeGreaterThan(0.5);
    });

    it('should increase confidence when pain points are mentioned', () => {
      const analysis = 'Users struggle with legacy system integration and compliance requirements';
      const score = calculateConfidenceScore(analysis, validPersona);
      expect(score).toBeGreaterThan(0.5);
    });

    it('should increase confidence when goals are mentioned', () => {
      const analysis = 'Companies want to modernize infrastructure and reduce operational costs';
      const score = calculateConfidenceScore(analysis, validPersona);
      expect(score).toBeGreaterThan(0.5);
    });

    it('should increase confidence when tech stack is mentioned', () => {
      const analysis = 'Most use Java, Spring, AWS, and Kubernetes';
      const score = calculateConfidenceScore(analysis, validPersona);
      expect(score).toBeGreaterThan(0.5);
    });

    it('should have base confidence for unrelated analysis', () => {
      const analysis = 'Completely unrelated content';
      const score = calculateConfidenceScore(analysis, validPersona);
      expect(score).toBe(0.5);
    });

    it('should cap confidence at 1.0', () => {
      const analysis = `
        Senior Solutions Architects at enterprises struggle with
        legacy system integration, compliance requirements, and vendor lock-in.
        They want to modernize infrastructure, reduce operational costs, and improve scalability.
        Most use Java, Spring, AWS, and Kubernetes.
      `;
      const score = calculateConfidenceScore(analysis, validPersona);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });
});
