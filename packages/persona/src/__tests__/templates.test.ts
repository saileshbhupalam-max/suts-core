/**
 * Tests for prompt templates
 */

import {
  getPersonaGenerationPrompt,
  personaGenerationTool,
} from '../templates/persona-generation';
import {
  getDiversityAnalysisPrompt,
  diversityAnalysisTool,
} from '../templates/diversity-analysis';

describe('templates', () => {
  describe('persona-generation', () => {
    it('should generate prompt with count', () => {
      const prompt = getPersonaGenerationPrompt(10);
      expect(prompt).toContain('10');
      expect(prompt).toContain('persona');
      expect(prompt.toLowerCase()).toContain('divers');
    });

    it('should include all required fields in prompt', () => {
      const prompt = getPersonaGenerationPrompt(5);
      expect(prompt).toContain('id');
      expect(prompt).toContain('archetype');
      expect(prompt).toContain('role');
      expect(prompt).toContain('experienceLevel');
      expect(prompt).toContain('companySize');
      expect(prompt).toContain('techStack');
      expect(prompt).toContain('painPoints');
      expect(prompt).toContain('goals');
      expect(prompt).toContain('fears');
      expect(prompt).toContain('values');
      expect(prompt).toContain('riskTolerance');
      expect(prompt).toContain('patienceLevel');
      expect(prompt).toContain('techAdoption');
      expect(prompt).toContain('learningStyle');
    });

    it('should include diversity requirements', () => {
      const prompt = getPersonaGenerationPrompt(5);
      expect(prompt).toContain('diverse');
      expect(prompt).toContain('30%');
    });

    it('should have valid tool definition', () => {
      expect(personaGenerationTool.name).toBe('generate_personas');
      expect(personaGenerationTool.description).toBeTruthy();
      expect(personaGenerationTool.input_schema).toBeDefined();
      expect(personaGenerationTool.input_schema.properties.personas).toBeDefined();
    });

    it('should have all required fields in tool schema', () => {
      const personaSchema = personaGenerationTool.input_schema.properties.personas.items;
      const required = personaSchema.required;

      expect(required).toContain('id');
      expect(required).toContain('archetype');
      expect(required).toContain('role');
      expect(required).toContain('experienceLevel');
      expect(required).toContain('companySize');
      expect(required).toContain('techStack');
      expect(required).toContain('painPoints');
      expect(required).toContain('goals');
      expect(required).toContain('confidenceScore');
      expect(required).toContain('source');
    });

    it('should have correct enum values', () => {
      const properties = personaGenerationTool.input_schema.properties.personas.items.properties;

      expect(properties.experienceLevel.enum).toEqual(['Novice', 'Intermediate', 'Expert']);
      expect(properties.companySize.enum).toEqual(['Startup', 'SMB', 'Enterprise']);
      expect(properties.techAdoption.enum).toEqual([
        'Early adopter',
        'Early majority',
        'Late majority',
        'Laggard',
      ]);
      expect(properties.learningStyle.enum).toEqual([
        'Trial-error',
        'Documentation',
        'Video',
        'Peer learning',
      ]);
      expect(properties.collaborationStyle.enum).toEqual([
        'Solo',
        'Team',
        'Community-driven',
      ]);
    });
  });

  describe('diversity-analysis', () => {
    it('should generate diversity analysis prompt', () => {
      const prompt = getDiversityAnalysisPrompt();
      expect(prompt).toContain('diversity');
      expect(prompt).toContain('similarity');
      expect(prompt).toContain('persona');
    });

    it('should include analysis criteria', () => {
      const prompt = getDiversityAnalysisPrompt();
      expect(prompt).toContain('Demographics');
      expect(prompt).toContain('Behavioral');
      expect(prompt).toContain('Psychographics');
    });

    it('should include target diversity score', () => {
      const prompt = getDiversityAnalysisPrompt();
      expect(prompt).toContain('0.70');
      expect(prompt).toContain('30%');
    });

    it('should have valid tool definition', () => {
      expect(diversityAnalysisTool.name).toBe('analyze_diversity');
      expect(diversityAnalysisTool.description).toBeTruthy();
      expect(diversityAnalysisTool.input_schema).toBeDefined();
    });

    it('should have all required fields in tool schema', () => {
      const required = diversityAnalysisTool.input_schema.required;

      expect(required).toContain('diversityScore');
      expect(required).toContain('averageSimilarity');
      expect(required).toContain('similarPairs');
      expect(required).toContain('recommendations');
      expect(required).toContain('meetsTarget');
    });

    it('should have correct numeric constraints', () => {
      const properties = diversityAnalysisTool.input_schema.properties;

      expect(properties.diversityScore.minimum).toBe(0);
      expect(properties.diversityScore.maximum).toBe(1);
      expect(properties.averageSimilarity.minimum).toBe(0);
      expect(properties.averageSimilarity.maximum).toBe(1);
    });

    it('should define similarPairs structure', () => {
      const similarPairsSchema = diversityAnalysisTool.input_schema.properties.similarPairs;

      expect(similarPairsSchema.type).toBe('array');
      expect(similarPairsSchema.items.properties.personaId1).toBeDefined();
      expect(similarPairsSchema.items.properties.personaId2).toBeDefined();
      expect(similarPairsSchema.items.properties.similarity).toBeDefined();
      expect(similarPairsSchema.items.properties.reasons).toBeDefined();
    });
  });
});
