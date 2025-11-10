/**
 * Tests for RiskAssessor
 */

import { RiskAssessor } from '../../recommendation/RiskAssessor';
import { ProductChange, ImpactPrediction } from '../../models';

describe('RiskAssessor', () => {
  let assessor: RiskAssessor;

  beforeEach(() => {
    assessor = new RiskAssessor();
  });

  const createChange = (overrides?: Partial<ProductChange>): ProductChange => ({
    id: 'change-1',
    name: 'Test Change',
    description: 'Test description',
    type: 'feature',
    estimatedEffort: 10,
    targetMetrics: ['retention'],
    expectedReach: 5000,
    ...overrides,
  });

  const createPrediction = (
    overrides?: Partial<ImpactPrediction>
  ): ImpactPrediction => ({
    changeId: 'change-1',
    predictedRetentionChange: 0.05,
    predictedChurnChange: -0.03,
    predictedGrowthChange: 0.02,
    predictedRevenueChange: 1000,
    confidenceLevel: 0.8,
    affectedUserCount: 5000,
    timeToImpact: 14,
    risks: [],
    opportunities: [],
    ...overrides,
  });

  describe('assess', () => {
    it('should return complete risk assessment', () => {
      const change = createChange();
      const prediction = createPrediction();
      const assessment = assessor.assess(change, prediction);

      expect(assessment).toHaveProperty('overallRisk');
      expect(assessment).toHaveProperty('riskScore');
      expect(assessment).toHaveProperty('technicalRisks');
      expect(assessment).toHaveProperty('businessRisks');
      expect(assessment).toHaveProperty('userRisks');
      expect(assessment).toHaveProperty('recommendations');
    });

    it('should identify technical risks', () => {
      const highEffortChange = createChange({ estimatedEffort: 50 });
      const prediction = createPrediction();
      const assessment = assessor.assess(highEffortChange, prediction);

      expect(assessment.technicalRisks.length).toBeGreaterThan(0);
    });

    it('should identify business risks', () => {
      const change = createChange();
      const negativePrediction = createPrediction({
        predictedRevenueChange: -5000,
      });
      const assessment = assessor.assess(change, negativePrediction);

      expect(assessment.businessRisks.length).toBeGreaterThan(0);
    });

    it('should identify user risks', () => {
      const change = createChange({ expectedReach: 100000 });
      const prediction = createPrediction({
        predictedChurnChange: 0.1,
        affectedUserCount: 100000,
      });
      const assessment = assessor.assess(change, prediction);

      expect(assessment.userRisks.length).toBeGreaterThan(0);
    });

    it('should calculate risk score', () => {
      const change = createChange();
      const prediction = createPrediction();
      const assessment = assessor.assess(change, prediction);

      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.riskScore).toBeLessThanOrEqual(1);
    });

    it('should categorize overall risk', () => {
      const change = createChange();
      const prediction = createPrediction();
      const assessment = assessor.assess(change, prediction);

      expect(['low', 'medium', 'high', 'critical']).toContain(
        assessment.overallRisk
      );
    });

    it('should provide recommendations', () => {
      const change = createChange({ estimatedEffort: 50 });
      const prediction = createPrediction({
        predictedChurnChange: 0.1,
      });
      const assessment = assessor.assess(change, prediction);

      expect(Array.isArray(assessment.recommendations)).toBe(true);
      expect(assessment.recommendations.length).toBeGreaterThan(0);
    });

    it('should rate high-effort high-risk changes as critical', () => {
      const change = createChange({
        estimatedEffort: 50,
        expectedReach: 100000,
      });
      const prediction = createPrediction({
        predictedChurnChange: 0.15,
        predictedRevenueChange: -10000,
        affectedUserCount: 100000,
        timeToImpact: 0.5,
      });

      const assessment = assessor.assess(change, prediction);

      expect(['high', 'critical']).toContain(assessment.overallRisk);
    });
  });
});
