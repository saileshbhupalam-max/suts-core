/**
 * Tests for EffortEstimator
 */

import { EffortEstimator } from '../../prioritization/EffortEstimator';
import { AnalysisResult } from '../../models';

describe('EffortEstimator', () => {
  let estimator: EffortEstimator;

  beforeEach(() => {
    estimator = new EffortEstimator();
  });

  const createInsight = (overrides?: Partial<AnalysisResult>): AnalysisResult => ({
    id: 'test-1',
    type: 'retention',
    severity: 'medium',
    title: 'Test',
    description: 'Test',
    affectedUsers: 1000,
    potentialImpact: 0.5,
    confidence: 0.7,
    metadata: {},
    ...overrides,
  });

  describe('estimate', () => {
    it('should return positive effort', () => {
      const insight = createInsight();
      const effort = estimator.estimate(insight);

      expect(effort).toBeGreaterThan(0);
    });

    it('should vary by insight type', () => {
      const uxInsight = createInsight({ type: 'ux' });
      const revenueInsight = createInsight({ type: 'revenue' });

      const uxEffort = estimator.estimate(uxInsight);
      const revenueEffort = estimator.estimate(revenueInsight);

      expect(uxEffort).not.toBe(revenueEffort);
    });

    it('should increase with affected users', () => {
      const lowUsers = createInsight({ affectedUsers: 100 });
      const highUsers = createInsight({ affectedUsers: 50000 });

      const lowEffort = estimator.estimate(lowUsers);
      const highEffort = estimator.estimate(highUsers);

      expect(highEffort).toBeGreaterThanOrEqual(lowEffort);
    });

    it('should increase with potential impact', () => {
      const lowImpact = createInsight({ potentialImpact: 0.1 });
      const highImpact = createInsight({ potentialImpact: 0.9 });

      const lowEffort = estimator.estimate(lowImpact);
      const highEffort = estimator.estimate(highImpact);

      expect(highEffort).toBeGreaterThanOrEqual(lowEffort);
    });

    it('should adjust for severity', () => {
      const lowSeverity = createInsight({ severity: 'low' });
      const criticalSeverity = createInsight({ severity: 'critical' });

      const lowEffort = estimator.estimate(lowSeverity);
      const criticalEffort = estimator.estimate(criticalSeverity);

      expect(criticalEffort).toBeGreaterThan(lowEffort);
    });

    it('should accept custom configuration', () => {
      const customEstimator = new EffortEstimator({
        baseEffort: { retention: 10 },
      });

      const insight = createInsight({ type: 'retention' });
      const effort = customEstimator.estimate(insight);

      expect(effort).toBeGreaterThan(0);
    });
  });
});
