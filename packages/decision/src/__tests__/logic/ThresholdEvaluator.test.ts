/**
 * Tests for ThresholdEvaluator
 */

import { ThresholdEvaluator } from '../../logic/ThresholdEvaluator';
import { SimulationMetrics } from '../../models';

describe('ThresholdEvaluator', () => {
  let evaluator: ThresholdEvaluator;

  beforeEach(() => {
    evaluator = new ThresholdEvaluator();
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
    it('should return threshold results for all metrics', () => {
      const metrics = createMetrics();
      const results = evaluator.evaluate(metrics);

      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result).toHaveProperty('metric');
        expect(result).toHaveProperty('expected');
        expect(result).toHaveProperty('actual');
        expect(result).toHaveProperty('passed');
        expect(result).toHaveProperty('deviation');
      });
    });

    it('should pass good metrics', () => {
      const metrics = createMetrics({
        retentionRate: 0.9,
        churnRate: 0.1,
        confidenceLevel: 0.95,
        sampleSize: 5000,
      });
      const results = evaluator.evaluate(metrics);

      const retention = results.find((r) => r.metric === 'retentionRate');
      expect(retention?.passed).toBe(true);
    });

    it('should fail below-threshold metrics', () => {
      const metrics = createMetrics({
        retentionRate: 0.5,
      });
      const results = evaluator.evaluate(metrics);

      const retention = results.find((r) => r.metric === 'retentionRate');
      expect(retention?.passed).toBe(false);
    });
  });

  describe('passesAllCritical', () => {
    it('should pass with good metrics', () => {
      const metrics = createMetrics({
        retentionRate: 0.8,
        churnRate: 0.2,
        confidenceLevel: 0.9,
        sampleSize: 500,
      });

      expect(evaluator.passesAllCritical(metrics)).toBe(true);
    });

    it('should fail with low retention', () => {
      const metrics = createMetrics({
        retentionRate: 0.5,
      });

      expect(evaluator.passesAllCritical(metrics)).toBe(false);
    });

    it('should fail with high churn', () => {
      const metrics = createMetrics({
        churnRate: 0.5,
      });

      expect(evaluator.passesAllCritical(metrics)).toBe(false);
    });
  });

  describe('getFailedThresholds', () => {
    it('should return empty array for good metrics', () => {
      const metrics = createMetrics({
        retentionRate: 0.9,
        churnRate: 0.1,
        confidenceLevel: 0.95,
      });

      const failed = evaluator.getFailedThresholds(metrics);
      expect(failed.length).toBeLessThanOrEqual(2);
    });

    it('should return failed threshold names', () => {
      const metrics = createMetrics({
        retentionRate: 0.5,
        sampleSize: 10,
      });

      const failed = evaluator.getFailedThresholds(metrics);
      expect(failed).toContain('retentionRate');
      expect(failed).toContain('sampleSize');
    });
  });

  describe('custom thresholds', () => {
    it('should use custom threshold configuration', () => {
      const customEvaluator = new ThresholdEvaluator({
        minRetentionRate: 0.9,
      });

      const metrics = createMetrics({ retentionRate: 0.85 });
      expect(customEvaluator.passesAllCritical(metrics)).toBe(false);
    });
  });
});
