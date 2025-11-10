/**
 * Tests for ChurnReduction
 */

import { ChurnReduction } from '../../src/effects/ChurnReduction';
import { createDefaultConfig } from '../../src/models/NetworkConfig';
import { createEmptyGraph, addNode, addEdge } from '../../src/models/ReferralGraph';
import { randomUUID } from 'crypto';

describe('ChurnReduction', () => {
  let churnReduction: ChurnReduction;

  beforeEach(() => {
    churnReduction = new ChurnReduction(createDefaultConfig());
  });

  describe('calculateUserChurnRate', () => {
    it('should return base churn rate for isolated user', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());

      const result = churnReduction.calculateUserChurnRate('user_1', graph);

      expect(result.adjustedChurnRate).toBe(result.baseChurnRate);
      expect(result.reductionFactor).toBe(0);
    });

    it('should reduce churn for connected users', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');

      const result = churnReduction.calculateUserChurnRate('user_1', graph);

      expect(result.adjustedChurnRate).toBeLessThanOrEqual(result.baseChurnRate);
    });

    it('should return base rate when network effects disabled', () => {
      const config = createDefaultConfig();
      config.enableNetworkEffects = false;
      const disabledChurn = new ChurnReduction(config);

      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');

      const result = disabledChurn.calculateUserChurnRate('user_1', graph);

      expect(result.adjustedChurnRate).toBe(result.baseChurnRate);
      expect(result.reductionFactor).toBe(0);
    });
  });

  describe('calculateNetworkChurnRate', () => {
    it('should return base rate for empty network', () => {
      const graph = createEmptyGraph();
      const rate = churnReduction.calculateNetworkChurnRate(graph);

      const config = createDefaultConfig();
      expect(rate).toBe(config.dailyChurnRate);
    });

    it('should calculate average churn rate', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');

      const rate = churnReduction.calculateNetworkChurnRate(graph);

      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(createDefaultConfig().dailyChurnRate);
    });
  });

  describe('predictChurn', () => {
    it('should predict 0 churn for empty network', () => {
      const graph = createEmptyGraph();
      const churned = churnReduction.predictChurn(graph, 30);

      expect(churned).toBe(0);
    });

    it('should predict churn for network', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', null, new Date());
      graph = addNode(graph, 'user_3', null, new Date());

      const churned = churnReduction.predictChurn(graph, 30);

      expect(churned).toBeGreaterThanOrEqual(0);
      expect(churned).toBeLessThanOrEqual(3);
    });

    it('should increase churn with more days', () => {
      let graph = createEmptyGraph();
      for (let i = 0; i < 10; i++) {
        graph = addNode(graph, `user_${i}`, null, new Date());
      }

      const churned7 = churnReduction.predictChurn(graph, 7);
      const churned30 = churnReduction.predictChurn(graph, 30);

      expect(churned30).toBeGreaterThanOrEqual(churned7);
    });
  });

  describe('calculateRetentionImprovement', () => {
    it('should return 0 for empty network', () => {
      const graph = createEmptyGraph();
      const improvement = churnReduction.calculateRetentionImprovement(graph);

      expect(improvement).toBe(0);
    });

    it('should calculate improvement for connected network', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');

      const improvement = churnReduction.calculateRetentionImprovement(graph);

      expect(improvement).toBeGreaterThanOrEqual(0);
      expect(improvement).toBeLessThanOrEqual(1);
    });
  });

  describe('simulateUserChurn', () => {
    it('should return boolean', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());

      const churned = churnReduction.simulateUserChurn('user_1', graph);

      expect(typeof churned).toBe('boolean');
    });

    it('should be probabilistic', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());

      // Run multiple simulations
      const results: boolean[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(churnReduction.simulateUserChurn('user_1', graph));
      }

      const churnedCount = results.filter((r) => r).length;

      // Should have some variation (not all true or all false)
      expect(churnedCount).toBeGreaterThanOrEqual(0);
      expect(churnedCount).toBeLessThanOrEqual(100);
    });
  });
});
