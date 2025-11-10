/**
 * Tests for SimulationEngine
 */

import { SimulationEngine } from '../engine';
import type { PersonaProfile } from '@suts/core';

describe('SimulationEngine', () => {
  const testPersona: PersonaProfile = {
    id: 'persona-1',
    archetype: 'Test',
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

  it('should create instance', () => {
    const engine = new SimulationEngine('test-api-key');
    expect(engine).toBeInstanceOf(SimulationEngine);
  });

  it('should create instance with custom model', () => {
    const engine = new SimulationEngine('test-api-key', 'claude-opus-4-20250514');
    expect(engine).toBeInstanceOf(SimulationEngine);
  });

  it('should return empty array from simulateUserJourney', async () => {
    const engine = new SimulationEngine('test-api-key');
    const productState = {
      features: {},
      uiElements: {},
      data: {},
      version: '1.0.0',
    };
    const result = await engine.simulateUserJourney(testPersona, productState, 1, 1.0);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});
