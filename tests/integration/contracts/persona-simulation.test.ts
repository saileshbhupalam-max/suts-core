/**
 * Contract Test: Persona Generator -> Simulation Engine
 * Validates that PersonaGenerator output is compatible with SimulationEngine input
 */

import { describe, it, expect } from '@jest/globals';
import { PersonaProfileSchema, type PersonaProfile } from '../../../packages/core/src/models/index';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { loadFixture } from '../helpers/test-utils';

describe('Contract: Persona Generator -> Simulation Engine', () => {
  it('should validate fixture personas match PersonaProfile schema', () => {
    const personas = loadFixture<PersonaProfile[]>('personas.json');

    personas.forEach((persona) => {
      const result = PersonaProfileSchema.safeParse(persona);
      expect(result.success).toBe(true);
    });
  });

  it('should validate all required PersonaProfile fields are present', () => {
    const personas = loadFixture<PersonaProfile[]>('personas.json');

    personas.forEach((persona) => {
      // Required string fields
      expect(persona.id).toBeDefined();
      expect(typeof persona.id).toBe('string');
      expect(persona.id.length).toBeGreaterThan(0);

      expect(persona.archetype).toBeDefined();
      expect(typeof persona.archetype).toBe('string');

      expect(persona.role).toBeDefined();
      expect(typeof persona.role).toBe('string');

      // Required enum fields
      expect(persona.experienceLevel).toBeDefined();
      expect(['Novice', 'Intermediate', 'Expert']).toContain(persona.experienceLevel);

      expect(persona.companySize).toBeDefined();
      expect(['Startup', 'SMB', 'Enterprise']).toContain(persona.companySize);

      // Required array fields
      expect(persona.techStack).toBeDefined();
      expect(Array.isArray(persona.techStack)).toBe(true);
      expect(persona.techStack.length).toBeGreaterThan(0);

      expect(persona.painPoints).toBeDefined();
      expect(Array.isArray(persona.painPoints)).toBe(true);

      expect(persona.goals).toBeDefined();
      expect(Array.isArray(persona.goals)).toBe(true);

      // Required numeric fields
      expect(persona.riskTolerance).toBeDefined();
      expect(typeof persona.riskTolerance).toBe('number');
      expect(persona.riskTolerance).toBeGreaterThanOrEqual(0);
      expect(persona.riskTolerance).toBeLessThanOrEqual(1);

      expect(persona.patienceLevel).toBeDefined();
      expect(typeof persona.patienceLevel).toBe('number');
      expect(persona.patienceLevel).toBeGreaterThanOrEqual(0);
      expect(persona.patienceLevel).toBeLessThanOrEqual(1);

      // Required metadata
      expect(persona.lastUpdated).toBeDefined();
      expect(() => new Date(persona.lastUpdated)).not.toThrow();

      expect(persona.source).toBeDefined();
      expect(typeof persona.source).toBe('string');
    });
  });

  it('should work with SimulationEngine without errors', async () => {
    const personas = loadFixture<PersonaProfile[]>('personas.json');
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

    // Should not throw
    await expect(
      engine.run(personas, productState, 1)
    ).resolves.not.toThrow();
  });

  it('should produce valid simulation state with fixture personas', async () => {
    const personas = loadFixture<PersonaProfile[]>('personas.json');
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 5,
    });

    const state = await engine.run(personas, productState, 1);

    // Verify state structure
    expect(state).toBeDefined();
    expect(state.personas).toBeDefined();
    expect(state.personas.length).toBe(personas.length);
    expect(state.events).toBeDefined();
    expect(Array.isArray(state.events)).toBe(true);
  });
});
