/**
 * Tests for PersonaGenerator
 */

import Anthropic from '@anthropic-ai/sdk';
import type { PersonaProfile } from '@suts/core';
import { PersonaGenerator, PersonaGenerationError } from '../PersonaGenerator';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk');

const MockedAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

describe('PersonaGenerator', () => {
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

  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate = jest.fn();
    MockedAnthropic.prototype.messages = {
      create: mockCreate,
    } as never;
  });

  describe('constructor', () => {
    it('should create instance with valid API key', () => {
      const generator = new PersonaGenerator('test-api-key');
      expect(generator).toBeInstanceOf(PersonaGenerator);
    });

    it('should throw error with empty API key', () => {
      expect(() => new PersonaGenerator('')).toThrow(PersonaGenerationError);
      expect(() => new PersonaGenerator('   ')).toThrow(PersonaGenerationError);
    });

    it('should use default model if not specified', () => {
      const generator = new PersonaGenerator('test-api-key');
      expect(generator).toBeInstanceOf(PersonaGenerator);
    });

    it('should accept custom model', () => {
      const generator = new PersonaGenerator('test-api-key', 'claude-opus-4-20250514');
      expect(generator).toBeInstanceOf(PersonaGenerator);
    });

    it('should accept custom configuration', () => {
      const generator = new PersonaGenerator('test-api-key', 'claude-sonnet-4-20250514', {
        temperature: 0.5,
        topP: 0.8,
      });
      const config = generator.getConfig();
      expect(config.temperature).toBe(0.5);
      expect(config.topP).toBe(0.8);
    });
  });

  describe('generateFromAnalysis', () => {
    it('should generate personas successfully', async () => {
      const persona2 = {
        ...validPersona,
        id: 'persona-2',
        archetype: 'Scrappy Startup Developer',
        experienceLevel: 'Intermediate',
        companySize: 'Startup',
        techStack: ['Node.js', 'React', 'MongoDB'],
        painPoints: ['Limited resources', 'Fast iteration'],
        goals: ['Ship features quickly', 'Learn new technologies'],
        fears: ['Running out of money', 'Competition'],
        values: ['Speed', 'Innovation'],
        riskTolerance: 0.8,
        patienceLevel: 0.3,
        techAdoption: 'Early adopter',
        learningStyle: 'Trial-error',
        collaborationStyle: 'Solo',
      };

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'generate_personas',
            input: {
              personas: [validPersona, persona2],
            },
          },
        ],
      });

      const generator = new PersonaGenerator('test-api-key');
      const result = await generator.generateFromAnalysis(
        ['Analysis document 1', 'Analysis document 2'],
        2
      );

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('persona-1');
      expect(result[1]?.id).toBe('persona-2');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should throw error with empty docs array', async () => {
      const generator = new PersonaGenerator('test-api-key');
      await expect(generator.generateFromAnalysis([], 10)).rejects.toThrow(
        PersonaGenerationError
      );
    });

    it('should throw error with invalid count', async () => {
      const generator = new PersonaGenerator('test-api-key');
      await expect(
        generator.generateFromAnalysis(['Analysis'], 0)
      ).rejects.toThrow(PersonaGenerationError);
      await expect(
        generator.generateFromAnalysis(['Analysis'], 101)
      ).rejects.toThrow(PersonaGenerationError);
    });

    it('should throw error when API returns no tool use', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'No tool use' }],
      });

      const generator = new PersonaGenerator('test-api-key');
      await expect(generator.generateFromAnalysis(['Analysis'], 1)).rejects.toThrow(
        'No tool use found'
      );
    });

    it('should throw error when API returns no personas', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'generate_personas',
            input: { personas: [] },
          },
        ],
      });

      const generator = new PersonaGenerator('test-api-key');
      await expect(generator.generateFromAnalysis(['Analysis'], 1)).rejects.toThrow(
        'No personas returned'
      );
    });

    it('should throw error when count mismatch', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'generate_personas',
            input: { personas: [validPersona] },
          },
        ],
      });

      const generator = new PersonaGenerator('test-api-key');
      await expect(generator.generateFromAnalysis(['Analysis'], 2)).rejects.toThrow(
        'Expected 2 personas, got 1'
      );
    });

    it('should throw error when personas fail validation', async () => {
      const invalidPersona = { ...validPersona };
      delete (invalidPersona as Partial<PersonaProfile>).id;

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'generate_personas',
            input: { personas: [invalidPersona] },
          },
        ],
      });

      const generator = new PersonaGenerator('test-api-key');
      await expect(generator.generateFromAnalysis(['Analysis'], 1)).rejects.toThrow(
        'failed validation'
      );
    });

    it('should throw error when duplicate IDs found', async () => {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'generate_personas',
            input: { personas: [validPersona, validPersona] },
          },
        ],
      });

      const generator = new PersonaGenerator('test-api-key');
      await expect(generator.generateFromAnalysis(['Analysis'], 2)).rejects.toThrow(
        'Duplicate persona IDs'
      );
    });

    it('should throw error when diversity too low', async () => {
      const persona2 = { ...validPersona, id: 'persona-2' };

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'generate_personas',
            input: { personas: [validPersona, persona2] },
          },
        ],
      });

      const generator = new PersonaGenerator('test-api-key');
      await expect(generator.generateFromAnalysis(['Analysis'], 2)).rejects.toThrow(
        'too similar'
      );
    });

    it('should generate 10 diverse personas', async () => {
      const personas = Array.from({ length: 10 }, (_, i) => ({
        ...validPersona,
        id: `persona-${i + 1}`,
        archetype: `Archetype ${i + 1}`,
        role: `Role ${i + 1}`,
        experienceLevel: ['Novice', 'Intermediate', 'Expert'][i % 3] as PersonaProfile['experienceLevel'],
        companySize: ['Startup', 'SMB', 'Enterprise'][i % 3] as PersonaProfile['companySize'],
        techAdoption: ['Early adopter', 'Early majority', 'Late majority', 'Laggard'][i % 4] as PersonaProfile['techAdoption'],
        learningStyle: ['Trial-error', 'Documentation', 'Video', 'Peer learning'][i % 4] as PersonaProfile['learningStyle'],
        collaborationStyle: ['Solo', 'Team', 'Community-driven'][i % 3] as PersonaProfile['collaborationStyle'],
        techStack: [`Tech${i}A`, `Tech${i}B`, `Tech${i}C`, `Tech${i}D`],
        painPoints: [`Pain${i}A`, `Pain${i}B`, `Pain${i}C`],
        goals: [`Goal${i}A`, `Goal${i}B`, `Goal${i}C`],
        fears: [`Fear${i}A`, `Fear${i}B`],
        values: [`Value${i}A`, `Value${i}B`],
        evaluationCriteria: [`Criteria${i}A`, `Criteria${i}B`, `Criteria${i}C`],
        dealBreakers: [`Breaker${i}A`, `Breaker${i}B`],
        delightTriggers: [`Delight${i}A`, `Delight${i}B`],
        referralTriggers: [`Referral${i}A`, `Referral${i}B`],
        riskTolerance: (i * 0.11) % 1,
        patienceLevel: ((i * 0.13) % 1),
      }));

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'generate_personas',
            input: { personas },
          },
        ],
      });

      const generator = new PersonaGenerator('test-api-key');
      const result = await generator.generateFromAnalysis(['Analysis'], 10);
      expect(result).toHaveLength(10);
    });

    it('should generate 30 diverse personas', async () => {
      const personas = Array.from({ length: 30 }, (_, i) => ({
        ...validPersona,
        id: `persona-${i + 1}`,
        archetype: `Archetype ${i + 1}`,
        role: `Role ${i + 1}`,
        experienceLevel: ['Novice', 'Intermediate', 'Expert'][i % 3] as PersonaProfile['experienceLevel'],
        companySize: ['Startup', 'SMB', 'Enterprise'][i % 3] as PersonaProfile['companySize'],
        techAdoption: ['Early adopter', 'Early majority', 'Late majority', 'Laggard'][i % 4] as PersonaProfile['techAdoption'],
        learningStyle: ['Trial-error', 'Documentation', 'Video', 'Peer learning'][i % 4] as PersonaProfile['learningStyle'],
        collaborationStyle: ['Solo', 'Team', 'Community-driven'][i % 3] as PersonaProfile['collaborationStyle'],
        techStack: [`Tech${i}A`, `Tech${i}B`, `Tech${i}C`, `Tech${i}D`],
        painPoints: [`Pain${i}A`, `Pain${i}B`, `Pain${i}C`],
        goals: [`Goal${i}A`, `Goal${i}B`, `Goal${i}C`],
        fears: [`Fear${i}A`, `Fear${i}B`],
        values: [`Value${i}A`, `Value${i}B`],
        evaluationCriteria: [`Criteria${i}A`, `Criteria${i}B`, `Criteria${i}C`],
        dealBreakers: [`Breaker${i}A`, `Breaker${i}B`],
        delightTriggers: [`Delight${i}A`, `Delight${i}B`],
        referralTriggers: [`Referral${i}A`, `Referral${i}B`],
        riskTolerance: (i * 0.033) % 1,
        patienceLevel: ((i * 0.037) % 1),
      }));

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'generate_personas',
            input: { personas },
          },
        ],
      });

      const generator = new PersonaGenerator('test-api-key');
      const result = await generator.generateFromAnalysis(['Analysis'], 30);
      expect(result).toHaveLength(30);
    });

    it('should generate 100 diverse personas', async () => {
      const personas = Array.from({ length: 100 }, (_, i) => ({
        ...validPersona,
        id: `persona-${i + 1}`,
        archetype: `Archetype ${i + 1}`,
        role: `Role ${i + 1}`,
        experienceLevel: ['Novice', 'Intermediate', 'Expert'][i % 3] as PersonaProfile['experienceLevel'],
        companySize: ['Startup', 'SMB', 'Enterprise'][i % 3] as PersonaProfile['companySize'],
        techAdoption: ['Early adopter', 'Early majority', 'Late majority', 'Laggard'][i % 4] as PersonaProfile['techAdoption'],
        learningStyle: ['Trial-error', 'Documentation', 'Video', 'Peer learning'][i % 4] as PersonaProfile['learningStyle'],
        collaborationStyle: ['Solo', 'Team', 'Community-driven'][i % 3] as PersonaProfile['collaborationStyle'],
        techStack: [`Tech${i}A`, `Tech${i}B`, `Tech${i}C`, `Tech${i}D`],
        painPoints: [`Pain${i}A`, `Pain${i}B`, `Pain${i}C`],
        goals: [`Goal${i}A`, `Goal${i}B`, `Goal${i}C`],
        fears: [`Fear${i}A`, `Fear${i}B`],
        values: [`Value${i}A`, `Value${i}B`],
        evaluationCriteria: [`Criteria${i}A`, `Criteria${i}B`, `Criteria${i}C`],
        dealBreakers: [`Breaker${i}A`, `Breaker${i}B`],
        delightTriggers: [`Delight${i}A`, `Delight${i}B`],
        referralTriggers: [`Referral${i}A`, `Referral${i}B`],
        riskTolerance: (i * 0.01) % 1,
        patienceLevel: ((i * 0.013) % 1),
      }));

      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'tool_use',
            name: 'generate_personas',
            input: { personas },
          },
        ],
      });

      const generator = new PersonaGenerator('test-api-key');
      const result = await generator.generateFromAnalysis(['Analysis'], 100);
      expect(result).toHaveLength(100);
    });
  });

  describe('retry logic', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry on network errors', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce({
          content: [
            {
              type: 'tool_use',
              name: 'generate_personas',
              input: { personas: [validPersona] },
            },
          ],
        });

      const generator = new PersonaGenerator('test-api-key', 'claude-sonnet-4-20250514', {
        retryDelay: 100,
      });

      const promise = generator.generateFromAnalysis(['Analysis'], 1);

      // Fast-forward through retries
      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(200);

      const result = await promise;
      expect(result).toHaveLength(1);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should retry on rate limit errors', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce({
          content: [
            {
              type: 'tool_use',
              name: 'generate_personas',
              input: { personas: [validPersona] },
            },
          ],
        });

      const generator = new PersonaGenerator('test-api-key', 'claude-sonnet-4-20250514', {
        retryDelay: 100,
      });

      const promise = generator.generateFromAnalysis(['Analysis'], 1);
      await jest.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result).toHaveLength(1);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should retry on 500 errors', async () => {
      const error500 = new Error('Internal Server Error');
      (error500 as { status?: number }).status = 500;

      mockCreate
        .mockRejectedValueOnce(error500)
        .mockResolvedValueOnce({
          content: [
            {
              type: 'tool_use',
              name: 'generate_personas',
              input: { personas: [validPersona] },
            },
          ],
        });

      const generator = new PersonaGenerator('test-api-key', 'claude-sonnet-4-20250514', {
        retryDelay: 100,
      });

      const promise = generator.generateFromAnalysis(['Analysis'], 1);
      await jest.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result).toHaveLength(1);
    });

    it('should use exponential backoff', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          content: [
            {
              type: 'tool_use',
              name: 'generate_personas',
              input: { personas: [validPersona] },
            },
          ],
        });

      const generator = new PersonaGenerator('test-api-key', 'claude-sonnet-4-20250514', {
        retryDelay: 1000,
      });

      const promise = generator.generateFromAnalysis(['Analysis'], 1);

      await jest.advanceTimersByTimeAsync(1000); // First retry after 1s
      await jest.advanceTimersByTimeAsync(2000); // Second retry after 2s

      const result = await promise;
      expect(result).toHaveLength(1);
    });

    it('should not retry on non-retryable errors', async () => {
      mockCreate.mockRejectedValue(new Error('Invalid API key'));

      const generator = new PersonaGenerator('test-api-key');
      await expect(generator.generateFromAnalysis(['Analysis'], 1)).rejects.toThrow(
        'Non-retryable error'
      );
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      jest.useRealTimers();

      mockCreate.mockRejectedValue(new Error('Network error'));

      const generator = new PersonaGenerator('test-api-key', 'claude-sonnet-4-20250514', {
        maxRetries: 2,
        retryDelay: 1,
      });

      await expect(generator.generateFromAnalysis(['Analysis'], 1)).rejects.toThrow(
        'Failed to generate personas after 2 attempts'
      );
      expect(mockCreate).toHaveBeenCalledTimes(2);

      jest.useFakeTimers();
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const generator = new PersonaGenerator('test-api-key', 'claude-sonnet-4-20250514', {
        temperature: 0.5,
        topP: 0.8,
      });
      const config = generator.getConfig();
      expect(config.temperature).toBe(0.5);
      expect(config.topP).toBe(0.8);
      expect(config.maxRetries).toBeDefined();
    });
  });
});
