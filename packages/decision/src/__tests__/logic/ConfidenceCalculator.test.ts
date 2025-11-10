/**
 * Tests for ConfidenceCalculator
 */

import { ConfidenceCalculator } from '../../logic/ConfidenceCalculator';
import { SimulationMetrics } from '../../models';

describe('ConfidenceCalculator', () => {
  let calculator: ConfidenceCalculator;

  beforeEach(() => {
    calculator = new ConfidenceCalculator();
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

  describe('calculate', () => {
    it('should return confidence between 0 and 1', () => {
      const metrics = createMetrics();
      const confidence = calculator.calculate(metrics);

      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('should increase with larger sample size', () => {
      const smallSample = createMetrics({ sampleSize: 100 });
      const largeSample = createMetrics({ sampleSize: 10000 });

      const smallConfidence = calculator.calculate(smallSample);
      const largeConfidence = calculator.calculate(largeSample);

      expect(largeConfidence).toBeGreaterThan(smallConfidence);
    });

    it('should penalize inconsistent metrics', () => {
      const consistent = createMetrics({
        retentionRate: 0.8,
        churnRate: 0.2,
        userSatisfaction: 0.8,
        npsScore: 50,
      });
      const inconsistent = createMetrics({
        retentionRate: 0.9,
        churnRate: 0.5,
        userSatisfaction: 0.9,
        npsScore: -50,
      });

      const consistentConf = calculator.calculate(consistent);
      const inconsistentConf = calculator.calculate(inconsistent);

      expect(consistentConf).toBeGreaterThan(inconsistentConf);
    });
  });

  describe('calculateConfidenceInterval', () => {
    it('should return valid interval', () => {
      const [lower, upper] = calculator.calculateConfidenceInterval(
        0.75,
        1000,
        0.95
      );

      expect(lower).toBeLessThanOrEqual(0.75);
      expect(upper).toBeGreaterThanOrEqual(0.75);
      expect(lower).toBeLessThan(upper);
    });

    it('should handle zero sample size', () => {
      const [lower, upper] = calculator.calculateConfidenceInterval(
        0.75,
        0,
        0.95
      );

      expect(lower).toBe(0.75);
      expect(upper).toBe(0.75);
    });
  });

  describe('calculateSignificance', () => {
    it('should return p-value between 0 and 1', () => {
      const pValue = calculator.calculateSignificance(0.5, 0.6, 1000);

      expect(pValue).toBeGreaterThanOrEqual(0);
      expect(pValue).toBeLessThanOrEqual(1);
    });

    it('should detect significant differences', () => {
      const significant = calculator.calculateSignificance(0.5, 0.7, 10000);
      const notSignificant = calculator.calculateSignificance(0.5, 0.51, 100);

      expect(significant).toBeLessThan(notSignificant);
    });
  });
});
