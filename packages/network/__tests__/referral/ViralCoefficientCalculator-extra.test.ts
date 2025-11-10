/**
 * Additional tests for ViralCoefficientCalculator to improve coverage
 */

import { ViralCoefficientCalculator } from '../../src/referral/ViralCoefficientCalculator';
import { createEmptyGraph, addNode, addEdge } from '../../src/models/ReferralGraph';

describe('ViralCoefficientCalculator - Additional Coverage', () => {
  let calculator: ViralCoefficientCalculator;

  beforeEach(() => {
    calculator = new ViralCoefficientCalculator();
  });

  describe('calculateMetrics - edge cases', () => {
    it('should handle graph with no invitations sent', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());

      const metrics = calculator.calculateMetrics(graph, 0);

      expect(metrics.conversionRate).toBe(0);
      expect(metrics.invitationsPerUser).toBe(0);
    });

    it('should handle graph with no active referrers', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', null, new Date());

      const metrics = calculator.calculateMetrics(graph);

      expect(metrics.activeReferrerRate).toBe(0);
    });

    it('should handle graph with churned users', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());

      // Manually mark as churned
      const node = graph.nodes.get('user_1');
      if (node !== null && node !== undefined) {
        const updatedNode = { ...node, churned: true };
        const nodes = new Map(graph.nodes);
        nodes.set('user_1', updatedNode);
        graph = { ...graph, nodes };
      }

      const metrics = calculator.calculateMetrics(graph);

      expect(metrics.churnRate).toBeGreaterThan(0);
    });

    it('should handle graph with no chains', () => {
      const graph = createEmptyGraph();

      const metrics = calculator.calculateMetrics(graph);

      expect(metrics.avgChainDepth).toBe(0);
      expect(metrics.maxChainDepth).toBe(0);
    });
  });

  describe('calculateGrowthRate - edge cases', () => {
    it('should return 0 for zero period days', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());

      const rate = calculator.calculateGrowthRate(graph, 0);

      expect(rate).toBe(0);
    });

    it('should return 0 for negative period days', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());

      const rate = calculator.calculateGrowthRate(graph, -10);

      expect(rate).toBe(0);
    });

    it('should handle graph with single user', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());

      const rate = calculator.calculateGrowthRate(graph, 30);

      expect(rate).toBe(0);
    });
  });

  describe('viral cycle time calculation', () => {
    it('should handle users with no referrals', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', null, new Date());

      const metrics = calculator.calculateMetrics(graph);

      expect(metrics.viralCycleTime).toBe(0);
    });

    it('should calculate cycle time with multiple referrals', () => {
      const now = new Date();
      const later1 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const later2 = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, now);
      graph = addNode(graph, 'user_2', 'user_1', later1);
      graph = addNode(graph, 'user_3', 'user_1', later2);
      graph = addEdge(graph, 'user_1', 'user_2', later1, 'email');
      graph = addEdge(graph, 'user_1', 'user_3', later2, 'email');

      const metrics = calculator.calculateMetrics(graph);

      expect(metrics.viralCycleTime).toBeGreaterThan(0);
    });
  });

  describe('network value calculation', () => {
    it('should calculate network value for single user', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());

      const metrics = calculator.calculateMetrics(graph);

      expect(metrics.networkValueMultiplier).toBe(1);
    });

    it('should increase network value with more users', () => {
      let graph = createEmptyGraph();
      for (let i = 0; i < 10; i++) {
        graph = addNode(graph, `user_${i}`, null, new Date());
      }

      const metrics = calculator.calculateMetrics(graph);

      expect(metrics.networkValueMultiplier).toBeGreaterThan(1);
    });
  });
});
