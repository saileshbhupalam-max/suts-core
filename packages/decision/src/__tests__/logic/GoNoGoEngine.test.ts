/**
 * Tests for GoNoGoEngine
 */

import { GoNoGoEngine } from '../../logic/GoNoGoEngine';
import { SimulationMetrics } from '../../models';

describe('GoNoGoEngine', () => {
  let engine: GoNoGoEngine;

  beforeEach(() => {
    engine = new GoNoGoEngine();
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

  describe('decide', () => {
    it('should return complete decision result', () => {
      const metrics = createMetrics();
      const result = engine.decide(metrics);

      expect(result).toHaveProperty('decision');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('passedCriteria');
      expect(result).toHaveProperty('failedCriteria');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('thresholds');
    });

    it('should return GO for excellent metrics', () => {
      const metrics = createMetrics({
        retentionRate: 0.9,
        churnRate: 0.1,
        growthRate: 0.2,
        confidenceLevel: 0.95,
        sampleSize: 5000,
      });

      const result = engine.decide(metrics);
      expect(result.decision).toBe('GO');
    });

    it('should return NO_GO for critical failures', () => {
      const metrics = createMetrics({
        retentionRate: 0.3,
        churnRate: 0.7,
      });

      const result = engine.decide(metrics);
      expect(result.decision).toBe('NO_GO');
    });

    it('should return CONDITIONAL for low confidence', () => {
      const metrics = createMetrics({
        confidenceLevel: 0.3,
      });

      const result = engine.decide(metrics);
      expect(result.decision).toBe('CONDITIONAL');
    });

    it('should return NO_GO for low sample size', () => {
      const metrics = createMetrics({
        sampleSize: 10,
      });

      const result = engine.decide(metrics);
      expect(result.decision).toBe('NO_GO');
    });

    it('should return CONDITIONAL for borderline metrics', () => {
      const metrics = createMetrics({
        retentionRate: 0.72,
        churnRate: 0.28,
        confidenceLevel: 0.65,
      });

      const result = engine.decide(metrics);
      expect(result.decision).toBe('CONDITIONAL');
    });

    it('should include threshold details', () => {
      const metrics = createMetrics();
      const result = engine.decide(metrics);

      expect(result.thresholds).toHaveProperty('retentionRate');
      expect(result.thresholds['retentionRate']).toHaveProperty('expected');
      expect(result.thresholds['retentionRate']).toHaveProperty('actual');
      expect(result.thresholds['retentionRate']).toHaveProperty('passed');
    });

    it('should provide recommendations', () => {
      const metrics = createMetrics();
      const result = engine.decide(metrics);

      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate warnings for concerning metrics', () => {
      const metrics = createMetrics({
        sampleSize: 50,
        confidenceLevel: 0.5,
        churnRate: 0.35,
      });

      const result = engine.decide(metrics);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
