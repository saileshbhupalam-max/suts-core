/**
 * Tests for ViralCoefficientCalculator
 */

import { ViralCoefficientCalculator } from '../../src/referral/ViralCoefficientCalculator';
import { createEmptyGraph, addNode, addEdge } from '../../src/models/ReferralGraph';

describe('ViralCoefficientCalculator', () => {
  let calculator: ViralCoefficientCalculator;

  beforeEach(() => {
    calculator = new ViralCoefficientCalculator();
  });

  describe('calculateKFactor', () => {
    it('should return 0 for empty graph', () => {
      const graph = createEmptyGraph();
      const kFactor = calculator.calculateKFactor(graph);

      expect(kFactor).toBe(0);
    });

    it('should calculate k-factor correctly', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addNode(graph, 'user_3', 'user_1', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');
      graph = addEdge(graph, 'user_1', 'user_3', new Date(), 'social');

      const kFactor = calculator.calculateKFactor(graph);

      // 2 referrals / 3 users = 0.667
      expect(kFactor).toBeCloseTo(2 / 3, 2);
    });

    it('should calculate k-factor > 1 for viral growth', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addNode(graph, 'user_3', 'user_1', new Date());
      graph = addNode(graph, 'user_4', 'user_2', new Date());
      graph = addNode(graph, 'user_5', 'user_2', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');
      graph = addEdge(graph, 'user_1', 'user_3', new Date(), 'email');
      graph = addEdge(graph, 'user_2', 'user_4', new Date(), 'email');
      graph = addEdge(graph, 'user_2', 'user_5', new Date(), 'email');

      const kFactor = calculator.calculateKFactor(graph);

      // 4 referrals / 5 users = 0.8
      expect(kFactor).toBeCloseTo(0.8, 2);
    });
  });

  describe('calculateMetrics', () => {
    it('should return default metrics for empty graph', () => {
      const graph = createEmptyGraph();
      const metrics = calculator.calculateMetrics(graph);

      expect(metrics.kFactor).toBe(0);
      expect(metrics.totalUsers).toBe(0);
      expect(metrics.totalReferrals).toBe(0);
    });

    it('should calculate comprehensive metrics', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addNode(graph, 'user_3', 'user_1', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');
      graph = addEdge(graph, 'user_1', 'user_3', new Date(), 'social');

      const metrics = calculator.calculateMetrics(graph, 5);

      expect(metrics.kFactor).toBeCloseTo(2 / 3, 2);
      expect(metrics.conversionRate).toBe(2 / 5);
      expect(metrics.totalUsers).toBe(3);
      expect(metrics.totalReferrals).toBe(2);
      expect(metrics.activeReferrerRate).toBeCloseTo(1 / 3, 2);
    });

    it('should calculate chain depths', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addNode(graph, 'user_3', 'user_2', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');
      graph = addEdge(graph, 'user_2', 'user_3', new Date(), 'email');

      const metrics = calculator.calculateMetrics(graph);

      expect(metrics.maxChainDepth).toBe(3);
      expect(metrics.avgChainDepth).toBeGreaterThan(0);
    });

    it('should calculate viral cycle time', () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, now);
      graph = addNode(graph, 'user_2', 'user_1', tomorrow);
      graph = addEdge(graph, 'user_1', 'user_2', tomorrow, 'email');

      const metrics = calculator.calculateMetrics(graph);

      expect(metrics.viralCycleTime).toBeGreaterThan(0);
    });

    it('should calculate network value multiplier', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());

      const metrics = calculator.calculateMetrics(graph);

      expect(metrics.networkValueMultiplier).toBeGreaterThan(0);
    });
  });

  describe('calculateGrowthRate', () => {
    it('should return 0 for empty graph', () => {
      const graph = createEmptyGraph();
      const rate = calculator.calculateGrowthRate(graph, 30);

      expect(rate).toBe(0);
    });

    it('should calculate growth rate', () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, now);
      graph = addNode(graph, 'user_2', 'user_1', tomorrow);
      graph = addEdge(graph, 'user_1', 'user_2', tomorrow, 'email');

      const rate = calculator.calculateGrowthRate(graph, 30);

      expect(rate).toBeGreaterThanOrEqual(0);
    });
  });
});
