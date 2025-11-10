/**
 * Tests for core models and schemas
 */

import {
  EmotionalStateSchema,
  SimulationEventSchema,
  PersonaProfileSchema,
} from '../models';

describe('models', () => {
  describe('EmotionalStateSchema', () => {
    it('should validate valid emotional state', () => {
      const validState = {
        frustration: 0.5,
        confidence: 0.8,
        delight: 0.3,
        confusion: 0.2,
      };
      const result = EmotionalStateSchema.safeParse(validState);
      expect(result.success).toBe(true);
    });

    it('should reject emotional state with out of range values', () => {
      const invalidState = {
        frustration: 1.5,
        confidence: 0.8,
        delight: 0.3,
        confusion: 0.2,
      };
      const result = EmotionalStateSchema.safeParse(invalidState);
      expect(result.success).toBe(false);
    });

    it('should reject emotional state with missing fields', () => {
      const invalidState = {
        frustration: 0.5,
        confidence: 0.8,
      };
      const result = EmotionalStateSchema.safeParse(invalidState);
      expect(result.success).toBe(false);
    });
  });

  describe('SimulationEventSchema', () => {
    it('should validate valid simulation event', () => {
      const validEvent = {
        id: 'event-1',
        personaId: 'persona-1',
        timestamp: new Date(),
        eventType: 'action' as const,
        context: { foo: 'bar' },
        metadata: {},
      };
      const result = SimulationEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should validate event with optional fields', () => {
      const validEvent = {
        id: 'event-1',
        personaId: 'persona-1',
        timestamp: new Date(),
        eventType: 'decision' as const,
        action: 'test action',
        context: { foo: 'bar' },
        reasoning: 'test reasoning',
        emotionalState: {
          frustration: 0.5,
          confidence: 0.8,
          delight: 0.3,
          confusion: 0.2,
        },
        metadata: { key: 'value' },
      };
      const result = SimulationEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should reject invalid event type', () => {
      const invalidEvent = {
        id: 'event-1',
        personaId: 'persona-1',
        timestamp: new Date(),
        eventType: 'invalid',
        context: {},
        metadata: {},
      };
      const result = SimulationEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('PersonaProfileSchema', () => {
    const validPersona = {
      id: 'persona-1',
      archetype: 'Test Archetype',
      role: 'Test Role',
      experienceLevel: 'Expert' as const,
      companySize: 'Enterprise' as const,
      techStack: ['Tech1', 'Tech2', 'Tech3'],
      painPoints: ['Pain1', 'Pain2', 'Pain3'],
      goals: ['Goal1', 'Goal2', 'Goal3'],
      fears: ['Fear1', 'Fear2'],
      values: ['Value1', 'Value2'],
      riskTolerance: 0.5,
      patienceLevel: 0.7,
      techAdoption: 'Early majority' as const,
      learningStyle: 'Documentation' as const,
      evaluationCriteria: ['Criteria1', 'Criteria2', 'Criteria3'],
      dealBreakers: ['Breaker1', 'Breaker2'],
      delightTriggers: ['Delight1', 'Delight2'],
      referralTriggers: ['Referral1', 'Referral2'],
      typicalWorkflow: 'Test workflow',
      timeAvailability: '5 hours',
      collaborationStyle: 'Team' as const,
      state: {},
      history: [],
      confidenceScore: 0.85,
      lastUpdated: '2024-01-01T00:00:00Z',
      source: 'test',
    };

    it('should validate valid persona profile', () => {
      const result = PersonaProfileSchema.safeParse(validPersona);
      expect(result.success).toBe(true);
    });

    it('should reject persona with invalid experience level', () => {
      const invalidPersona = { ...validPersona, experienceLevel: 'Invalid' };
      const result = PersonaProfileSchema.safeParse(invalidPersona);
      expect(result.success).toBe(false);
    });

    it('should reject persona with invalid company size', () => {
      const invalidPersona = { ...validPersona, companySize: 'Invalid' };
      const result = PersonaProfileSchema.safeParse(invalidPersona);
      expect(result.success).toBe(false);
    });

    it('should reject persona with out of range risk tolerance', () => {
      const invalidPersona = { ...validPersona, riskTolerance: 1.5 };
      const result = PersonaProfileSchema.safeParse(invalidPersona);
      expect(result.success).toBe(false);
    });

    it('should reject persona with out of range patience level', () => {
      const invalidPersona = { ...validPersona, patienceLevel: -0.1 };
      const result = PersonaProfileSchema.safeParse(invalidPersona);
      expect(result.success).toBe(false);
    });

    it('should reject persona with out of range confidence score', () => {
      const invalidPersona = { ...validPersona, confidenceScore: 1.5 };
      const result = PersonaProfileSchema.safeParse(invalidPersona);
      expect(result.success).toBe(false);
    });

    it('should reject persona with invalid tech adoption', () => {
      const invalidPersona = { ...validPersona, techAdoption: 'Invalid' };
      const result = PersonaProfileSchema.safeParse(invalidPersona);
      expect(result.success).toBe(false);
    });

    it('should reject persona with invalid learning style', () => {
      const invalidPersona = { ...validPersona, learningStyle: 'Invalid' };
      const result = PersonaProfileSchema.safeParse(invalidPersona);
      expect(result.success).toBe(false);
    });

    it('should reject persona with invalid collaboration style', () => {
      const invalidPersona = { ...validPersona, collaborationStyle: 'Invalid' };
      const result = PersonaProfileSchema.safeParse(invalidPersona);
      expect(result.success).toBe(false);
    });

    it('should reject persona with missing required fields', () => {
      const invalidPersona = { ...validPersona };
      delete (invalidPersona as Partial<typeof validPersona>).id;
      const result = PersonaProfileSchema.safeParse(invalidPersona);
      expect(result.success).toBe(false);
    });

    it('should accept persona with all valid enum values', () => {
      const allEnums = {
        ...validPersona,
        experienceLevel: 'Novice' as const,
        companySize: 'Startup' as const,
        techAdoption: 'Laggard' as const,
        learningStyle: 'Trial-error' as const,
        collaborationStyle: 'Solo' as const,
      };
      const result = PersonaProfileSchema.safeParse(allEnums);
      expect(result.success).toBe(true);
    });
  });
});
