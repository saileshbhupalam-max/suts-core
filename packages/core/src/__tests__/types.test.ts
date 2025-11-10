/**
 * Tests for core types
 */

import type {
  EmotionalState,
  SimulationConfig,
  IPersonaGenerator,
} from '../types';
import { ActionType } from '../types';
import type { PersonaProfile } from '../models';

describe('types', () => {
  describe('ActionType', () => {
    it('should have all expected action types', () => {
      expect(ActionType.INSTALL).toBe('install');
      expect(ActionType.CONFIGURE).toBe('configure');
      expect(ActionType.USE_FEATURE).toBe('use_feature');
      expect(ActionType.READ_DOCS).toBe('read_docs');
      expect(ActionType.SEEK_HELP).toBe('seek_help');
      expect(ActionType.CUSTOMIZE).toBe('customize');
      expect(ActionType.SHARE).toBe('share');
      expect(ActionType.UNINSTALL).toBe('uninstall');
    });
  });

  describe('EmotionalState', () => {
    it('should accept valid emotional state', () => {
      const state: EmotionalState = {
        frustration: 0.5,
        confidence: 0.8,
        delight: 0.3,
        confusion: 0.2,
      };
      expect(state.frustration).toBe(0.5);
      expect(state.confidence).toBe(0.8);
      expect(state.delight).toBe(0.3);
      expect(state.confusion).toBe(0.2);
    });
  });

  describe('SimulationConfig', () => {
    it('should accept valid simulation config', () => {
      const config: SimulationConfig = {
        id: 'sim-1',
        name: 'Test Simulation',
        description: 'Test description',
        personaIds: ['persona-1', 'persona-2'],
        numPersonas: 2,
        productVersion: '1.0.0',
        featuresEnabled: { feature1: true },
        numSessions: 10,
        timeCompression: 1.0,
        maxParallel: 5,
        createdAt: new Date(),
        createdBy: 'test-user',
      };
      expect(config.id).toBe('sim-1');
      expect(config.numPersonas).toBe(2);
    });

    it('should accept config with optional calibration data', () => {
      const config: SimulationConfig = {
        id: 'sim-1',
        name: 'Test Simulation',
        description: 'Test description',
        personaIds: ['persona-1'],
        numPersonas: 1,
        productVersion: '1.0.0',
        featuresEnabled: {},
        numSessions: 10,
        timeCompression: 1.0,
        maxParallel: 5,
        calibrationData: { key: 'value' },
        createdAt: new Date(),
        createdBy: 'test-user',
      };
      expect(config.calibrationData).toEqual({ key: 'value' });
    });
  });

  describe('IPersonaGenerator', () => {
    it('should define generator interface', () => {
      const mockGenerator: IPersonaGenerator = {
        generateFromAnalysis: (_docs: string[], _count: number): Promise<PersonaProfile[]> => {
          return Promise.resolve([]);
        },
      };
      const generateMethod = mockGenerator.generateFromAnalysis.bind(mockGenerator);
      expect(generateMethod).toBeDefined();
    });

    it('should accept valid implementation', async () => {
      const testPersona: PersonaProfile = {
        id: 'test-1',
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

      const mockGenerator: IPersonaGenerator = {
        generateFromAnalysis: (_docs: string[], _count: number): Promise<PersonaProfile[]> => {
          return Promise.resolve([testPersona]);
        },
      };

      const result = await mockGenerator.generateFromAnalysis(['doc'], 1);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('test-1');
    });
  });
});
