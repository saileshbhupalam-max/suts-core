/**
 * Tests for ExperimentDesigner
 */

import { ExperimentDesigner } from '../../recommendation/ExperimentDesigner';
import { AnalysisResult } from '../../models';

describe('ExperimentDesigner', () => {
  let designer: ExperimentDesigner;

  beforeEach(() => {
    designer = new ExperimentDesigner();
  });

  const createInsight = (overrides?: Partial<AnalysisResult>): AnalysisResult => ({
    id: 'test-1',
    type: 'retention',
    severity: 'high',
    title: 'Low retention',
    description: 'Users are not returning',
    affectedUsers: 5000,
    potentialImpact: 0.8,
    confidence: 0.9,
    metadata: {},
    ...overrides,
  });

  describe('design', () => {
    it('should design complete experiment', () => {
      const insight = createInsight();
      const experiment = designer.design(insight);

      expect(experiment).toHaveProperty('id');
      expect(experiment).toHaveProperty('name');
      expect(experiment).toHaveProperty('description');
      expect(experiment).toHaveProperty('hypothesis');
      expect(experiment).toHaveProperty('targetMetric');
      expect(experiment).toHaveProperty('controlGroup');
      expect(experiment).toHaveProperty('treatmentGroups');
      expect(experiment).toHaveProperty('minimumSampleSize');
      expect(experiment).toHaveProperty('expectedDuration');
      expect(experiment).toHaveProperty('successCriteria');
      expect(experiment).toHaveProperty('risks');
      expect(experiment).toHaveProperty('estimatedLift');
    });

    it('should have valid control group', () => {
      const insight = createInsight();
      const experiment = designer.design(insight);

      expect(experiment.controlGroup.size).toBeGreaterThan(0);
      expect(experiment.controlGroup.size).toBeLessThanOrEqual(1);
    });

    it('should have treatment group', () => {
      const insight = createInsight();
      const experiment = designer.design(insight);

      expect(experiment.treatmentGroups.length).toBeGreaterThan(0);
      expect(experiment.treatmentGroups[0]).toHaveProperty('name');
      expect(experiment.treatmentGroups[0]).toHaveProperty('size');
      expect(experiment.treatmentGroups[0]).toHaveProperty('description');
      expect(experiment.treatmentGroups[0]).toHaveProperty('changes');
    });

    it('should calculate sample size based on impact', () => {
      const lowImpact = createInsight({ potentialImpact: 0.1 });
      const highImpact = createInsight({ potentialImpact: 0.9 });

      const lowExp = designer.design(lowImpact);
      const highExp = designer.design(highImpact);

      expect(lowExp.minimumSampleSize).toBeGreaterThan(
        highExp.minimumSampleSize
      );
    });

    it('should include success criteria', () => {
      const insight = createInsight();
      const experiment = designer.design(insight);

      expect(Array.isArray(experiment.successCriteria)).toBe(true);
      expect(experiment.successCriteria.length).toBeGreaterThan(0);
    });

    it('should identify risks', () => {
      const criticalInsight = createInsight({
        severity: 'critical',
        affectedUsers: 50000,
        confidence: 0.3,
      });

      const experiment = designer.design(criticalInsight);
      expect(experiment.risks.length).toBeGreaterThan(0);
    });
  });

  describe('custom configuration', () => {
    it('should accept custom configuration', () => {
      const customDesigner = new ExperimentDesigner({
        defaultControlSize: 0.7,
        minSampleSize: 2000,
        defaultDuration: 21,
      });

      const insight = createInsight();
      const experiment = customDesigner.design(insight);

      expect(experiment.controlGroup.size).toBe(0.7);
    });
  });
});
