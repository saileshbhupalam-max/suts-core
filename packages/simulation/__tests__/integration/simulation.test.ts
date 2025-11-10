/**
 * Integration tests for full simulation flow
 */

import { SimulationEngine } from '../../src/engine';
import { PersonaState } from '../../src/state/StateTransitions';
import type { PersonaProfile } from '@suts/persona';
import type { ProductState } from '../../src/types';

describe('Simulation Integration', () => {
  let personas: PersonaProfile[];
  let product: ProductState;

  beforeEach(() => {
    personas = [
      {
        id: 'expert-1',
        archetype: 'Expert Developer',
        role: 'Senior Engineer',
        experienceLevel: 'Expert',
        companySize: 'Enterprise',
        techStack: ['Node.js', 'TypeScript', 'Docker'],
        painPoints: ['Complex setup'],
        goals: ['Quick deployment'],
        fears: ['Vendor lock-in'],
        values: ['Flexibility'],
        riskTolerance: 0.7,
        patienceLevel: 0.8,
        techAdoption: 'Early adopter',
        learningStyle: 'Trial-error',
        evaluationCriteria: ['Performance', 'Scalability'],
        dealBreakers: ['Poor documentation'],
        delightTriggers: ['Fast setup', 'Great DX'],
        referralTriggers: ['Excellent performance'],
        typicalWorkflow: 'CI/CD',
        timeAvailability: '4 hours/day',
        collaborationStyle: 'Team',
        state: {},
        history: [],
        confidenceScore: 0.9,
        lastUpdated: '2024-01-01',
        source: 'test',
      },
      {
        id: 'novice-1',
        archetype: 'Novice Developer',
        role: 'Junior Engineer',
        experienceLevel: 'Novice',
        companySize: 'Startup',
        techStack: ['JavaScript'],
        painPoints: ['Lack of knowledge'],
        goals: ['Learn quickly'],
        fears: ['Making mistakes'],
        values: ['Support'],
        riskTolerance: 0.3,
        patienceLevel: 0.4,
        techAdoption: 'Late majority',
        learningStyle: 'Documentation',
        evaluationCriteria: ['Ease of use'],
        dealBreakers: ['No documentation'],
        delightTriggers: ['Clear guides'],
        referralTriggers: ['Easy setup'],
        typicalWorkflow: 'Manual',
        timeAvailability: '1 hour/day',
        collaborationStyle: 'Solo',
        state: {},
        history: [],
        confidenceScore: 0.3,
        lastUpdated: '2024-01-01',
        source: 'test',
      },
    ];

    product = {
      features: {
        quickstart: true,
        documentation: true,
        cli: true,
        api: false,
      },
      uiElements: {},
      data: {},
      version: '1.0.0',
    };
  });

  it('should complete full simulation successfully', async () => {
    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 3,
    });

    const result = await engine.run(personas, product, 7);

    expect(result).toBeDefined();
    expect(result.personas.length).toBe(2);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.metadata.totalDays).toBe(7);
  });

  it('should transition personas through states', async () => {
    const engine = new SimulationEngine({
      seed: 12345,
      maxActionsPerDay: 5,
    });

    const result = await engine.run(personas, product, 7);

    // All personas should start as NEW and transition
    for (const persona of result.personas) {
      expect(persona.finalState).toBeDefined();
      expect(Object.values(PersonaState)).toContain(persona.finalState);
    }
  });

  it('should generate events for all personas', async () => {
    const engine = new SimulationEngine({
      seed: 12345,
      maxActionsPerDay: 3,
    });

    const result = await engine.run(personas, product, 5);

    // Check events exist for all personas
    const personaIds = new Set(result.events.map((e) => e.personaId));
    expect(personaIds.size).toBe(2);
    expect(personaIds.has('expert-1')).toBe(true);
    expect(personaIds.has('novice-1')).toBe(true);
  });

  it('should track emotional states over time', async () => {
    const engine = new SimulationEngine({
      seed: 12345,
      maxActionsPerDay: 4,
    });

    const result = await engine.run(personas, product, 5);

    for (const persona of result.personas) {
      expect(persona.frustrationLevel).toBeGreaterThanOrEqual(0);
      expect(persona.frustrationLevel).toBeLessThanOrEqual(1);
      expect(persona.delightLevel).toBeGreaterThanOrEqual(0);
      expect(persona.delightLevel).toBeLessThanOrEqual(1);
      expect(persona.confidenceLevel).toBeGreaterThanOrEqual(0);
      expect(persona.confidenceLevel).toBeLessThanOrEqual(1);
      expect(persona.confusionLevel).toBeGreaterThanOrEqual(0);
      expect(persona.confusionLevel).toBeLessThanOrEqual(1);
    }
  });

  it('should be deterministic with same seed', async () => {
    const engine1 = new SimulationEngine({ seed: 99999 });
    const engine2 = new SimulationEngine({ seed: 99999 });

    const result1 = await engine1.run(personas, product, 5);
    const result2 = await engine2.run(personas, product, 5);

    expect(result1.events.length).toBe(result2.events.length);

    for (let i = 0; i < result1.personas.length; i++) {
      expect(result1.personas[i]!.finalState).toBe(result2.personas[i]!.finalState);
      expect(result1.personas[i]!.totalActions).toBe(result2.personas[i]!.totalActions);
    }
  });

  it('should handle large simulation (performance test)', async () => {
    const manyPersonas: PersonaProfile[] = [];
    for (let i = 0; i < 100; i++) {
      manyPersonas.push({
        ...personas[0]!,
        id: `persona-${i}`,
      });
    }

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 20,
      maxActionsPerDay: 3,
    });

    const startTime = Date.now();
    const result = await engine.run(manyPersonas, product, 7);
    const endTime = Date.now();

    const duration = endTime - startTime;

    expect(result.personas.length).toBe(100);
    expect(duration).toBeLessThan(60000); // Should complete in less than 60 seconds
  }, 70000);

  it('should handle edge case of single day simulation', async () => {
    const engine = new SimulationEngine({ seed: 12345 });

    const result = await engine.run(personas, product, 1);

    expect(result.metadata.totalDays).toBe(1);
    expect(result.personas.length).toBe(2);
  });

  it('should track progress correctly', async () => {
    const engine = new SimulationEngine({ seed: 12345 });
    const progressSteps: number[] = [];

    await engine.run(personas, product, 5, (progress) => {
      progressSteps.push(progress.currentDay);
      expect(progress.totalDays).toBe(5);
      expect(progress.totalPersonas).toBe(2);
    });

    expect(progressSteps).toEqual([1, 2, 3, 4, 5]);
  });

  it('should generate different event types', async () => {
    const engine = new SimulationEngine({
      seed: 12345,
      maxActionsPerDay: 5,
    });

    const result = await engine.run(personas, product, 5);

    const eventTypes = new Set(result.events.map((e) => e.eventType));

    expect(eventTypes.has('action')).toBe(true);
    // May also have observation, decision, emotion depending on simulation
  });

  it('should maintain persona state consistency', async () => {
    const engine = new SimulationEngine({ seed: 12345 });

    const result = await engine.run(personas, product, 5);

    for (const personaSnapshot of result.personas) {
      const personaEvents = result.events.filter(
        (e) => e.personaId === personaSnapshot.personaId
      );

      // Persona should have events matching their ID
      expect(personaEvents.length).toBeGreaterThan(0);
      expect(personaEvents.length).toBe(personaSnapshot.events.length);
    }
  });
});
