/**
 * Tests for persona types exports
 */

import { PersonaProfileSchema } from '../types';
import type { PersonaProfile } from '../types';

describe('persona types', () => {
  it('should export PersonaProfileSchema', () => {
    expect(PersonaProfileSchema).toBeDefined();
    const parseMethod = PersonaProfileSchema.parse.bind(PersonaProfileSchema);
    expect(parseMethod).toBeDefined();
  });

  it('should parse valid persona profile', () => {
    const validPersona: PersonaProfile = {
      id: 'test-1',
      archetype: 'Test Archetype',
      role: 'Test Role',
      experienceLevel: 'Expert',
      companySize: 'Enterprise',
      techStack: ['Tech1', 'Tech2', 'Tech3'],
      painPoints: ['Pain1', 'Pain2', 'Pain3'],
      goals: ['Goal1', 'Goal2', 'Goal3'],
      fears: ['Fear1', 'Fear2'],
      values: ['Value1', 'Value2'],
      riskTolerance: 0.5,
      patienceLevel: 0.7,
      techAdoption: 'Early majority',
      learningStyle: 'Documentation',
      evaluationCriteria: ['Criteria1', 'Criteria2', 'Criteria3'],
      dealBreakers: ['Breaker1', 'Breaker2'],
      delightTriggers: ['Delight1', 'Delight2'],
      referralTriggers: ['Referral1', 'Referral2'],
      typicalWorkflow: 'Test workflow',
      timeAvailability: '5 hours',
      collaborationStyle: 'Team',
      state: {},
      history: [],
      confidenceScore: 0.85,
      lastUpdated: '2024-01-01T00:00:00Z',
      source: 'test',
    };

    const result = PersonaProfileSchema.safeParse(validPersona);
    expect(result.success).toBe(true);
  });

  it('should have PersonaProfile type', () => {
    const persona: PersonaProfile = {
      id: 'test-1',
      archetype: 'Test',
      role: 'Role',
      experienceLevel: 'Expert',
      companySize: 'Enterprise',
      techStack: ['Tech1', 'Tech2', 'Tech3'],
      painPoints: ['Pain1', 'Pain2', 'Pain3'],
      goals: ['Goal1', 'Goal2', 'Goal3'],
      fears: ['Fear1', 'Fear2'],
      values: ['Value1', 'Value2'],
      riskTolerance: 0.5,
      patienceLevel: 0.7,
      techAdoption: 'Early majority',
      learningStyle: 'Documentation',
      evaluationCriteria: ['Criteria1', 'Criteria2', 'Criteria3'],
      dealBreakers: ['Breaker1', 'Breaker2'],
      delightTriggers: ['Delight1', 'Delight2'],
      referralTriggers: ['Referral1', 'Referral2'],
      typicalWorkflow: 'Test workflow',
      timeAvailability: '5 hours',
      collaborationStyle: 'Team',
      state: {},
      history: [],
      confidenceScore: 0.85,
      lastUpdated: '2024-01-01T00:00:00Z',
      source: 'test',
    };
    expect(persona.id).toBe('test-1');
  });
});
