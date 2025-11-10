/**
 * Tests for NetworkSimulator
 */

import { NetworkSimulator } from '../src/NetworkSimulator';
import { PersonaProfile } from '@suts/persona';
import { TelemetryEvent } from '@suts/telemetry';

describe('NetworkSimulator', () => {
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

  describe('constructor', () => {
    it('should create simulator with default config', () => {
      const sim = new NetworkSimulator();
      const config = sim.getConfig();

      expect(config.baseReferralProbability).toBeDefined();
      expect(config.delightThreshold).toBeDefined();
    });

    it('should create simulator with custom config', () => {
      const sim = new NetworkSimulator({
        baseReferralProbability: 0.5,
        delightThreshold: 0.8,
      });
      const config = sim.getConfig();

      expect(config.baseReferralProbability).toBe(0.5);
      expect(config.delightThreshold).toBe(0.8);
    });
  });

  describe('simulateReferrals', () => {
    it('should simulate referrals from personas', () => {
      const personas = [createMockPersona('persona_1')];
      const events = createMockEvents('persona_1', 0.95);

      const graph = simulator.simulateReferrals(personas, events);

      expect(graph.totalUsers).toBeGreaterThanOrEqual(1);
    });

    it('should handle multiple personas', () => {
      const personas = [
        createMockPersona('persona_1'),
        createMockPersona('persona_2'),
      ];
      const events = [
        ...createMockEvents('persona_1', 0.95),
        ...createMockEvents('persona_2', 0.95),
      ];

      const graph = simulator.simulateReferrals(personas, events);

      expect(graph.totalUsers).toBeGreaterThanOrEqual(2);
    });

    it('should not generate referrals for low delight', () => {
      const personas = [createMockPersona('persona_1')];
      const events = createMockEvents('persona_1', 0.1);

      const graph = simulator.simulateReferrals(personas, events);

      expect(graph.totalUsers).toBe(1);
      expect(graph.totalReferrals).toBe(0);
    });

    it('should handle personas without events', () => {
      const personas = [createMockPersona('persona_1')];
      const events: TelemetryEvent[] = [];

      const graph = simulator.simulateReferrals(personas, events);

      expect(graph.totalUsers).toBe(1);
      expect(graph.totalReferrals).toBe(0);
    });
  });

  describe('calculateViralCoefficient', () => {
    it('should calculate k-factor from graph', () => {
      const personas = [createMockPersona('persona_1')];
      const events = createMockEvents('persona_1', 0.95);

      const graph = simulator.simulateReferrals(personas, events);
      const kFactor = simulator.calculateViralCoefficient(graph);

      expect(kFactor).toBeGreaterThanOrEqual(0);
    });
  });

  describe('predictGrowth', () => {
    it('should predict growth', () => {
      const projection = simulator.predictGrowth(100, 0.5, 30);

      expect(projection.startingUsers).toBe(100);
      expect(projection.kFactor).toBe(0.5);
      expect(projection.days).toBe(30);
      expect(projection.dataPoints.length).toBe(30);
    });

    it('should classify growth type correctly', () => {
      const exponential = simulator.predictGrowth(100, 1.5, 10);
      const linear = simulator.predictGrowth(100, 0.5, 10);

      expect(exponential.growthType).toBe('exponential');
      expect(['linear', 'plateau']).toContain(linear.growthType);
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate comprehensive metrics', () => {
      const personas = [createMockPersona('persona_1')];
      const events = createMockEvents('persona_1', 0.95);

      const graph = simulator.simulateReferrals(personas, events);
      const metrics = simulator.calculateMetrics(graph);

      expect(metrics.kFactor).toBeGreaterThanOrEqual(0);
      expect(metrics.totalUsers).toBeGreaterThanOrEqual(1);
      expect(metrics.calculatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getSocialProofEngine', () => {
    it('should return social proof engine', () => {
      const engine = simulator.getSocialProofEngine();

      expect(engine).toBeDefined();
      expect(engine).toHaveProperty('calculateConversionRate');
    });
  });

  describe('getNetworkValueCalculator', () => {
    it('should return network value calculator', () => {
      const calculator = simulator.getNetworkValueCalculator();

      expect(calculator).toBeDefined();
      expect(calculator).toHaveProperty('calculateValue');
    });
  });

  describe('getChurnReduction', () => {
    it('should return churn reduction calculator', () => {
      const churn = simulator.getChurnReduction();

      expect(churn).toBeDefined();
      expect(churn).toHaveProperty('calculateUserChurnRate');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      simulator.updateConfig({ baseReferralProbability: 0.8 });
      const config = simulator.getConfig();

      expect(config.baseReferralProbability).toBe(0.8);
    });

    it('should recreate components with new config', () => {
      const oldEngine = simulator.getSocialProofEngine();
      simulator.updateConfig({ socialProofMultiplier: 2.0 });
      const newEngine = simulator.getSocialProofEngine();

      // Should be different instances
      expect(newEngine).not.toBe(oldEngine);
    });
  });

  describe('runSimulation', () => {
    it('should run complete simulation', () => {
      const personas = [createMockPersona('persona_1')];
      const events = createMockEvents('persona_1', 0.95);

      const graph = simulator.runSimulation(personas, events, 1);

      expect(graph.totalUsers).toBeGreaterThanOrEqual(1);
    });

    it('should handle multiple iterations', () => {
      const personas = [createMockPersona('persona_1')];
      const events = createMockEvents('persona_1', 0.95);

      const graph = simulator.runSimulation(personas, events, 2);

      expect(graph.totalUsers).toBeGreaterThanOrEqual(1);
    });
  });

  describe('performance', () => {
    it('should handle 1000 personas efficiently', () => {
      const personas: PersonaProfile[] = [];
      const events: TelemetryEvent[] = [];

      for (let i = 0; i < 1000; i++) {
        personas.push(createMockPersona(`persona_${i}`));
        events.push(...createMockEvents(`persona_${i}`, 0.95));
      }

      const start = Date.now();
      const graph = simulator.simulateReferrals(personas, events);
      const elapsed = Date.now() - start;

      expect(graph.totalUsers).toBeGreaterThanOrEqual(1000);
      expect(elapsed).toBeLessThan(5000); // Should complete in < 5 seconds
    });
  });
});
