/**
 * Tests for persona package exports
 */

import * as personaExports from '../index';

describe('persona package exports', () => {
  it('should export PersonaGenerator', () => {
    expect(personaExports.PersonaGenerator).toBeDefined();
  });

  it('should export PersonaGenerationError', () => {
    expect(personaExports.PersonaGenerationError).toBeDefined();
  });

  it('should export validation functions', () => {
    expect(personaExports.validatePersona).toBeDefined();
    expect(personaExports.validatePersonas).toBeDefined();
    expect(personaExports.checkDuplicates).toBeDefined();
    expect(personaExports.calculateSimilarity).toBeDefined();
    expect(personaExports.analyzeDiversity).toBeDefined();
  });

  it('should export templates', () => {
    expect(personaExports.getPersonaGenerationPrompt).toBeDefined();
    expect(personaExports.personaGenerationTool).toBeDefined();
    expect(personaExports.getDiversityAnalysisPrompt).toBeDefined();
    expect(personaExports.diversityAnalysisTool).toBeDefined();
  });

  it('should export PersonaProfileSchema', () => {
    expect(personaExports.PersonaProfileSchema).toBeDefined();
  });

  it('should create PersonaGenerator instance', () => {
    const generator = new personaExports.PersonaGenerator('test-key');
    expect(generator).toBeInstanceOf(personaExports.PersonaGenerator);
  });

  it('should create PersonaGenerationError instance', () => {
    const error = new personaExports.PersonaGenerationError('test error');
    expect(error).toBeInstanceOf(personaExports.PersonaGenerationError);
    expect(error.message).toBe('test error');
  });
});
