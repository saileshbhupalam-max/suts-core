/**
 * Tests for data models and schemas
 */

import {
  AnalysisResultSchema,
  ProductChangeSchema,
  SimulationMetricsSchema,
  DecisionConfigSchema,
} from '../../models';

describe('Data Models', () => {
  describe('AnalysisResultSchema', () => {
    it('should validate correct analysis result', () => {
      const result = {
        id: 'test-1',
        type: 'retention' as const,
        severity: 'high' as const,
        title: 'Test Issue',
        description: 'Test description',
        affectedUsers: 1000,
        potentialImpact: 0.8,
        confidence: 0.9,
        metadata: { source: 'test' },
      };

      expect(() => AnalysisResultSchema.parse(result)).not.toThrow();
    });

    it('should reject invalid type', () => {
      const result = {
        id: 'test-1',
        type: 'invalid',
        severity: 'high',
        title: 'Test',
        description: 'Test',
        affectedUsers: 100,
        potentialImpact: 0.5,
        confidence: 0.5,
        metadata: {},
      };

      expect(() => AnalysisResultSchema.parse(result)).toThrow();
    });

    it('should reject out-of-range values', () => {
      const result = {
        id: 'test-1',
        type: 'retention',
        severity: 'high',
        title: 'Test',
        description: 'Test',
        affectedUsers: -10,
        potentialImpact: 1.5,
        confidence: 0.5,
        metadata: {},
      };

      expect(() => AnalysisResultSchema.parse(result)).toThrow();
    });
  });

  describe('ProductChangeSchema', () => {
    it('should validate correct product change', () => {
      const change = {
        id: 'change-1',
        name: 'New Feature',
        description: 'Add new feature',
        type: 'feature' as const,
        estimatedEffort: 5,
        targetMetrics: ['retention', 'engagement'],
        expectedReach: 1000,
        metadata: {},
      };

      expect(() => ProductChangeSchema.parse(change)).not.toThrow();
    });

    it('should allow optional metadata', () => {
      const change = {
        id: 'change-1',
        name: 'Fix',
        description: 'Bug fix',
        type: 'fix' as const,
        estimatedEffort: 2,
        targetMetrics: ['quality'],
        expectedReach: 500,
      };

      expect(() => ProductChangeSchema.parse(change)).not.toThrow();
    });
  });

  describe('SimulationMetricsSchema', () => {
    it('should validate correct metrics', () => {
      const metrics = {
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
      };

      expect(() => SimulationMetricsSchema.parse(metrics)).not.toThrow();
    });

    it('should reject invalid rate values', () => {
      const metrics = {
        retentionRate: 1.5,
        churnRate: 0.25,
        growthRate: 0.1,
        avgSessionDuration: 300,
        userSatisfaction: 0.8,
        conversionRate: 0.15,
        revenuePerUser: 50,
        npsScore: 45,
        confidenceLevel: 0.9,
        sampleSize: 1000,
      };

      expect(() => SimulationMetricsSchema.parse(metrics)).toThrow();
    });
  });

  describe('DecisionConfigSchema', () => {
    it('should accept empty configuration', () => {
      const config = DecisionConfigSchema.parse({});

      expect(config.riskTolerance).toBeUndefined();
    });

    it('should accept custom configuration', () => {
      const config = {
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
        riskTolerance: 'high' as const,
      };

      expect(() => DecisionConfigSchema.parse(config)).not.toThrow();
    });
  });
});
