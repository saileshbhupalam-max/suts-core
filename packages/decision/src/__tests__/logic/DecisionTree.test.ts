/**
 * Tests for DecisionTree
 */

import { DecisionTree } from '../../logic/DecisionTree';
import { SimulationMetrics } from '../../models';

describe('DecisionTree', () => {
  let tree: DecisionTree;

  beforeEach(() => {
    tree = new DecisionTree();
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

  describe('evaluate', () => {
    it('should return decision tree with root node', () => {
      const metrics = createMetrics();
      const result = tree.evaluate(metrics);

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('children');
      expect(result).toHaveProperty('reasoning');
    });

    it('should evaluate all criteria', () => {
      const metrics = createMetrics();
      const result = tree.evaluate(metrics);

      expect(result.children.length).toBeGreaterThan(0);
    });

    it('should pass for good metrics', () => {
      const metrics = createMetrics({
        retentionRate: 0.9,
        churnRate: 0.1,
        growthRate: 0.2,
        userSatisfaction: 0.9,
        confidenceLevel: 0.95,
      });

      const result = tree.evaluate(metrics);
      expect(result.passed).toBe(true);
    });

    it('should fail for poor metrics', () => {
      const metrics = createMetrics({
        retentionRate: 0.3,
        churnRate: 0.7,
        growthRate: -0.2,
        userSatisfaction: 0.3,
        confidenceLevel: 0.4,
      });

      const result = tree.evaluate(metrics);
      expect(result.passed).toBe(false);
    });
  });

  describe('getFailingCriteria', () => {
    it('should return failing criterion names', () => {
      const metrics = createMetrics({
        retentionRate: 0.3,
        churnRate: 0.7,
      });

      const result = tree.evaluate(metrics);
      const failing = tree.getFailingCriteria(result);

      expect(Array.isArray(failing)).toBe(true);
      expect(failing.length).toBeGreaterThan(0);
    });
  });

  describe('getPassingCriteria', () => {
    it('should return passing criterion names', () => {
      const metrics = createMetrics({
        retentionRate: 0.9,
        confidenceLevel: 0.95,
      });

      const result = tree.evaluate(metrics);
      const passing = tree.getPassingCriteria(result);

      expect(Array.isArray(passing)).toBe(true);
      expect(passing.length).toBeGreaterThan(0);
    });
  });

  describe('custom criteria', () => {
    it('should accept custom criteria', () => {
      const customTree = new DecisionTree([
        {
          name: 'Custom',
          weight: 1,
          evaluate: (metrics) => metrics.retentionRate,
        },
      ]);

      const metrics = createMetrics();
      const result = customTree.evaluate(metrics);

      expect(result.children.length).toBe(1);
      expect(result.children[0].name).toBe('Custom');
    });
  });
});
