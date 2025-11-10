/**
 * Tests for DecisionSystem
 */

import { DecisionSystem } from '../DecisionSystem';
import { AnalysisResult, ProductChange, SimulationMetrics } from '../models';

describe('DecisionSystem', () => {
  let system: DecisionSystem;

  beforeEach(() => {
    system = new DecisionSystem();
  });

  const createInsight = (overrides?: Partial<AnalysisResult>): AnalysisResult => ({
    id: 'test-1',
    type: 'retention',
    severity: 'high',
    title: 'Low retention',
    description: 'Users are not returning',
    affectedUsers: 5000,
    potentialImpact: 0.8,
    confidence: 0.9,
    metadata: {},
    ...overrides,
  });

  const createChange = (overrides?: Partial<ProductChange>): ProductChange => ({
    id: 'change-1',
    name: 'Improve onboarding',
    description: 'Better onboarding flow',
    type: 'improvement',
    estimatedEffort: 8,
    targetMetrics: ['retention', 'activation'],
    expectedReach: 10000,
    ...overrides,
  });

  const createMetrics = (
    overrides?: Partial<SimulationMetrics>
  ): SimulationMetrics => ({
    retentionRate: 0.75,
    churnRate: 0.25,
    growthRate: 0.1,
    avgSessionDuration: 300,
    userSatisfaction: 0.8,
    conversionRate: 0.15,
    revenuePerUser: 50,
    npsScore: 45,
    confidenceLevel: 0.9,
    sampleSize: 1000,
    ...overrides,
  });

  describe('prioritize', () => {
    it('should prioritize insights', () => {
      const insights = [
        createInsight({ id: '1', potentialImpact: 0.5, confidence: 0.6 }),
        createInsight({ id: '2', potentialImpact: 0.9, confidence: 0.9 }),
        createInsight({ id: '3', potentialImpact: 0.3, confidence: 0.5 }),
      ];

      const prioritized = system.prioritize(insights);

      expect(prioritized.length).toBe(3);
      expect(prioritized[0].ranking).toBe(1);
      expect(prioritized[1].ranking).toBe(2);
      expect(prioritized[2].ranking).toBe(3);
    });

    it('should calculate all scores', () => {
      const insights = [createInsight()];
      const prioritized = system.prioritize(insights);

      expect(prioritized[0]).toHaveProperty('priorityScore');
      expect(prioritized[0]).toHaveProperty('impactScore');
      expect(prioritized[0]).toHaveProperty('effortScore');
      expect(prioritized[0]).toHaveProperty('iceScore');
      expect(prioritized[0]).toHaveProperty('riceScore');
      expect(prioritized[0]).toHaveProperty('reach');
      expect(prioritized[0]).toHaveProperty('reasoning');
    });

    it('should rank higher impact higher', () => {
      const insights = [
        createInsight({ id: 'low', potentialImpact: 0.2 }),
        createInsight({ id: 'high', potentialImpact: 0.9 }),
      ];

      const prioritized = system.prioritize(insights);
      expect(prioritized[0].insight.id).toBe('high');
    });

    it('should handle empty array', () => {
      const prioritized = system.prioritize([]);
      expect(prioritized).toEqual([]);
    });
  });

  describe('recommendExperiments', () => {
    it('should recommend experiments', () => {
      const insights = [
        createInsight({ id: '1', potentialImpact: 0.8, confidence: 0.9 }),
        createInsight({ id: '2', potentialImpact: 0.7, confidence: 0.8 }),
      ];

      const experiments = system.recommendExperiments(insights);

      expect(Array.isArray(experiments)).toBe(true);
      experiments.forEach((exp) => {
        expect(exp).toHaveProperty('id');
        expect(exp).toHaveProperty('name');
        expect(exp).toHaveProperty('hypothesis');
        expect(exp).toHaveProperty('targetMetric');
        expect(exp).toHaveProperty('controlGroup');
        expect(exp).toHaveProperty('treatmentGroups');
        expect(exp).toHaveProperty('successCriteria');
      });
    });

    it('should limit to high-priority insights', () => {
      const insights = Array.from({ length: 10 }, (_, i) =>
        createInsight({ id: `insight-${i}` })
      );

      const experiments = system.recommendExperiments(insights);
      expect(experiments.length).toBeLessThanOrEqual(5);
    });
  });

  describe('predictImpact', () => {
    it('should predict impact of change', () => {
      const change = createChange();
      const prediction = system.predictImpact(change);

      expect(prediction).toHaveProperty('changeId');
      expect(prediction).toHaveProperty('predictedRetentionChange');
      expect(prediction).toHaveProperty('predictedChurnChange');
      expect(prediction).toHaveProperty('predictedGrowthChange');
      expect(prediction).toHaveProperty('predictedRevenueChange');
      expect(prediction).toHaveProperty('confidenceLevel');
      expect(prediction).toHaveProperty('affectedUserCount');
      expect(prediction).toHaveProperty('timeToImpact');
      expect(prediction).toHaveProperty('risks');
      expect(prediction).toHaveProperty('opportunities');
    });

    it('should use baseline metrics if provided', () => {
      const change = createChange();
      const baseline = { retention: 0.8, churn: 0.2, growth: 0.05 };

      const prediction = system.predictImpact(change, baseline);
      expect(prediction.confidenceLevel).toBeGreaterThan(0);
    });

    it('should identify opportunities', () => {
      const change = createChange({
        type: 'feature',
        estimatedEffort: 10,
        expectedReach: 50000,
      });

      const prediction = system.predictImpact(change);
      expect(Array.isArray(prediction.opportunities)).toBe(true);
    });

    it('should assess risks', () => {
      const change = createChange({
        estimatedEffort: 30,
        expectedReach: 100000,
      });

      const prediction = system.predictImpact(change);
      expect(Array.isArray(prediction.risks)).toBe(true);
    });
  });

  describe('goNoGoDecision', () => {
    it('should make GO/NO-GO decision', () => {
      const metrics = createMetrics();
      const decision = system.goNoGoDecision(metrics);

      expect(decision).toHaveProperty('decision');
      expect(['GO', 'NO_GO', 'CONDITIONAL']).toContain(decision.decision);
      expect(decision).toHaveProperty('confidence');
      expect(decision).toHaveProperty('reasoning');
      expect(decision).toHaveProperty('passedCriteria');
      expect(decision).toHaveProperty('failedCriteria');
    });

    it('should return GO for good metrics', () => {
      const metrics = createMetrics({
        retentionRate: 0.9,
        churnRate: 0.1,
        confidenceLevel: 0.95,
        sampleSize: 5000,
      });

      const decision = system.goNoGoDecision(metrics);
      expect(decision.decision).toBe('GO');
    });

    it('should return NO_GO for bad metrics', () => {
      const metrics = createMetrics({
        retentionRate: 0.3,
        churnRate: 0.7,
      });

      const decision = system.goNoGoDecision(metrics);
      expect(decision.decision).toBe('NO_GO');
    });
  });

  describe('configuration', () => {
    it('should accept custom configuration', () => {
      const customSystem = new DecisionSystem({
        prioritization: {
          impactWeight: 0.5,
          confidenceWeight: 0.3,
          effortWeight: 0.2,
          reachWeight: 0.1,
        },
        thresholds: {
          minRetentionRate: 0.8,
          maxChurnRate: 0.2,
          minConfidence: 0.9,
          minSampleSize: 500,
        },
        riskTolerance: 'low',
      });

      const insights = [createInsight()];
      const prioritized = customSystem.prioritize(insights);
      expect(prioritized.length).toBe(1);
    });
  });
});
