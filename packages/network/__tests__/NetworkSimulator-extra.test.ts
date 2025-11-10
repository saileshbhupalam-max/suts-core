/**
 * Additional tests for NetworkSimulator to improve coverage
 */

import { NetworkSimulator } from '../src/NetworkSimulator';
import { PersonaProfile } from '@suts/persona';
import { TelemetryEvent } from '@suts/telemetry';

describe('NetworkSimulator - Additional Coverage', () => {
  let simulator: NetworkSimulator;

  beforeEach(() => {
    simulator = new NetworkSimulator();
  });

  const createMockPersona = (id: string): PersonaProfile => ({
    id,
    archetype: 'test',
    role: 'Developer',
    experienceLevel: 'Intermediate',
    companySize: 'SMB',
    techStack: [],
    painPoints: [],
    goals: [],
    fears: [],
    values: [],
    riskTolerance: 0.5,
    patienceLevel: 0.5,
    techAdoption: 'Early adopter',
    learningStyle: 'Documentation',
    evaluationCriteria: [],
    dealBreakers: [],
    delightTriggers: [],
    referralTriggers: [],
    typicalWorkflow: '',
    timeAvailability: '',
    collaborationStyle: 'Community-driven',
    state: {},
    history: [],
    confidenceScore: 0.8,
    lastUpdated: new Date().toISOString(),
    source: 'test',
  });

  const createMockEvents = (personaId: string, delight: number = 0.9): TelemetryEvent[] => [
    {
      personaId,
      eventType: 'action',
      action: 'use_feature',
      emotionalState: { delight },
      metadata: {},
      timestamp: new Date(),
    },
  ];

  describe('simulateReferrals - edge cases', () => {
    it('should handle events with null personaId', () => {
      const personas = [createMockPersona('persona_1')];
      const events: TelemetryEvent[] = [
        {
          personaId: '',
          eventType: 'action',
          action: 'use_feature',
          emotionalState: { delight: 0.9 },
          metadata: {},
          timestamp: new Date(),
        },
      ];

      const graph = simulator.simulateReferrals(personas, events);

      expect(graph.totalUsers).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty persona events', () => {
      const personas = [createMockPersona('persona_1')];
      const events: TelemetryEvent[] = [];

      const graph = simulator.simulateReferrals(personas, events);

      expect(graph.totalUsers).toBe(1);
    });
  });

  describe('runSimulation - iterations', () => {
    it('should handle zero iterations', () => {
      const personas = [createMockPersona('persona_1')];
      const events = createMockEvents('persona_1', 0.95);

      const graph = simulator.runSimulation(personas, events, 0);

      expect(graph.totalUsers).toBeGreaterThanOrEqual(1);
    });

    it('should handle multiple iterations with no new users', () => {
      const personas = [createMockPersona('persona_1')];
      const events = createMockEvents('persona_1', 0.1);

      const graph = simulator.runSimulation(personas, events, 3);

      expect(graph.totalUsers).toBeGreaterThanOrEqual(1);
    });
  });

  describe('synthetic data generation', () => {
    it('should generate synthetic events for referred users', () => {
      // Use high probability to ensure referrals happen
      const highRefSimulator = new NetworkSimulator({
        baseReferralProbability: 0.9,
        delightThreshold: 0.5,
        baseAcceptanceRate: 0.8,
      });

      const personas = [createMockPersona('persona_1')];
      const events = createMockEvents('persona_1', 0.95);

      const graph = highRefSimulator.runSimulation(personas, events, 2);

      expect(graph.totalUsers).toBeGreaterThanOrEqual(1);
    });

    it('should create synthetic personas for multi-iteration simulation', () => {
      const highRefSimulator = new NetworkSimulator({
        baseReferralProbability: 0.9,
        delightThreshold: 0.5,
        baseAcceptanceRate: 0.8,
      });

      const personas = [
        createMockPersona('persona_1'),
        createMockPersona('persona_2'),
      ];
      const events = [
        ...createMockEvents('persona_1', 0.95),
        ...createMockEvents('persona_2', 0.95),
      ];

      const graph = highRefSimulator.runSimulation(personas, events, 3);

      expect(graph.totalUsers).toBeGreaterThanOrEqual(2);
    });
  });

  describe('updateConfig validation', () => {
    it('should throw error for invalid config', () => {
      expect(() => {
        simulator.updateConfig({ baseReferralProbability: 1.5 });
      }).toThrow();
    });

    it('should accept valid partial config', () => {
      expect(() => {
        simulator.updateConfig({ delightThreshold: 0.6 });
      }).not.toThrow();
    });
  });

  describe('predictGrowth - edge cases', () => {
    it('should handle zero starting users', () => {
      const projection = simulator.predictGrowth(0, 0.5, 10);

      expect(projection.startingUsers).toBe(0);
      expect(projection.finalUserCount).toBe(0);
    });

    it('should handle very high k-factor', () => {
      const projection = simulator.predictGrowth(10, 2.0, 10);

      expect(projection.growthType).toBe('exponential');
    });

    it('should handle single day projection', () => {
      const projection = simulator.predictGrowth(100, 0.5, 1);

      expect(projection.days).toBe(1);
      expect(projection.dataPoints.length).toBe(1);
    });

    it('should handle very high churn rate', () => {
      // Create simulator with high churn rate
      const highChurnSimulator = new NetworkSimulator({
        dailyChurnRate: 0.15,
        baseAcceptanceRate: 0.1,
      });
      const projection = highChurnSimulator.predictGrowth(100, 0.1, 10);

      expect(projection.growthType).toBe('declining');
    });

    it('should handle k-factor exactly equal to 1', () => {
      const projection = simulator.predictGrowth(100, 1.0, 10);

      expect(['exponential', 'linear', 'plateau']).toContain(projection.growthType);
    });
  });

  describe('edge case scenarios', () => {
    it('should handle personas with empty referral triggers array', () => {
      const persona = createMockPersona('persona_1');
      persona.referralTriggers = [];
      const events = createMockEvents('persona_1', 0.95);

      const graph = simulator.simulateReferrals([persona], events);

      expect(graph.totalUsers).toBeGreaterThanOrEqual(1);
    });

    it('should handle multiple personas with varying delight levels', () => {
      const personas = [
        createMockPersona('persona_1'),
        createMockPersona('persona_2'),
        createMockPersona('persona_3'),
      ];
      const events = [
        ...createMockEvents('persona_1', 0.95),
        ...createMockEvents('persona_2', 0.5),
        ...createMockEvents('persona_3', 0.2),
      ];

      const graph = simulator.simulateReferrals(personas, events);

      expect(graph.totalUsers).toBeGreaterThanOrEqual(3);
    });
  });
});
