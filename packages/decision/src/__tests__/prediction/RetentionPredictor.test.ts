/**
 * Tests for RetentionPredictor
 */

import { RetentionPredictor } from '../../prediction/RetentionPredictor';
import { ProductChange } from '../../models';

describe('RetentionPredictor', () => {
  let predictor: RetentionPredictor;

  beforeEach(() => {
    predictor = new RetentionPredictor();
  });

  const createChange = (overrides?: Partial<ProductChange>): ProductChange => ({
    id: 'change-1',
    name: 'Test Change',
    description: 'Test description',
    type: 'feature',
    estimatedEffort: 5,
    targetMetrics: ['retention'],
    expectedReach: 1000,
    ...overrides,
  });

  describe('predict', () => {
    it('should return change within valid range', () => {
      const change = createChange();
      const prediction = predictor.predict(change, 0.7);

      expect(prediction).toBeGreaterThanOrEqual(-0.3);
      expect(prediction).toBeLessThanOrEqual(0.3);
    });

    it('should predict positive change for fixes', () => {
      const fix = createChange({ type: 'fix' });
      const prediction = predictor.predict(fix, 0.7);

      expect(prediction).toBeGreaterThanOrEqual(0);
    });

    it('should account for baseline retention', () => {
      const change = createChange();
      const lowBaseline = predictor.predict(change, 0.5);
      const highBaseline = predictor.predict(change, 0.9);

      expect(Math.abs(lowBaseline)).toBeGreaterThanOrEqual(
        Math.abs(highBaseline)
      );
    });

    it('should increase with higher effort', () => {
      const lowEffort = createChange({ estimatedEffort: 1 });
      const highEffort = createChange({ estimatedEffort: 20 });

      const lowPrediction = Math.abs(predictor.predict(lowEffort, 0.7));
      const highPrediction = Math.abs(predictor.predict(highEffort, 0.7));

      expect(highPrediction).toBeGreaterThanOrEqual(lowPrediction);
    });

    it('should handle zero effort', () => {
      const change = createChange({ estimatedEffort: 0 });
      const prediction = predictor.predict(change, 0.7);

      expect(prediction).toBe(0);
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

    it('should increase with historical data', () => {
      const change = createChange();
      const withoutData = predictor.getConfidence(change, false);
      const withData = predictor.getConfidence(change, true);

      expect(withData).toBeGreaterThan(withoutData);
    });
  });
});
