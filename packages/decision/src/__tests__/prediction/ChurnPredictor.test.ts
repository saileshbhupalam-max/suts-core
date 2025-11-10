/**
 * Tests for ChurnPredictor
 */

import { ChurnPredictor } from '../../prediction/ChurnPredictor';
import { ProductChange } from '../../models';

describe('ChurnPredictor', () => {
  let predictor: ChurnPredictor;

  beforeEach(() => {
    predictor = new ChurnPredictor();
  });

  const createChange = (overrides?: Partial<ProductChange>): ProductChange => ({
    id: 'change-1',
    name: 'Test Change',
    description: 'Test description',
    type: 'fix',
    estimatedEffort: 5,
    targetMetrics: ['churn'],
    expectedReach: 1000,
    ...overrides,
  });

  describe('predict', () => {
    it('should return negative change for fixes (churn reduction)', () => {
      const fix = createChange({ type: 'fix' });
      const prediction = predictor.predict(fix, 0.3);

      expect(prediction).toBeLessThanOrEqual(0);
    });

    it('should return change within valid range', () => {
      const change = createChange();
      const prediction = predictor.predict(change, 0.3);

      expect(prediction).toBeGreaterThanOrEqual(-0.3);
      expect(prediction).toBeLessThanOrEqual(0.1);
    });

    it('should account for baseline churn', () => {
      const change = createChange();
      const lowBaseline = predictor.predict(change, 0.3);
      const highBaseline = predictor.predict(change, 0.1);

      expect(Math.abs(lowBaseline)).toBeGreaterThanOrEqual(
        Math.abs(highBaseline)
      );
    });

    it('should handle zero effort', () => {
      const change = createChange({ estimatedEffort: 0 });
      const prediction = predictor.predict(change, 0.3);

      expect(Math.abs(prediction)).toBe(0);
    });
  });

  describe('getConfidence', () => {
    it('should return confidence between 0 and 1', () => {
      const change = createChange();
      const confidence = predictor.getConfidence(change);

      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('should be higher for fixes', () => {
      const feature = createChange({ type: 'feature' });
      const fix = createChange({ type: 'fix' });

      const featureConfidence = predictor.getConfidence(feature);
      const fixConfidence = predictor.getConfidence(fix);

      expect(fixConfidence).toBeGreaterThan(featureConfidence);
    });
  });
});
