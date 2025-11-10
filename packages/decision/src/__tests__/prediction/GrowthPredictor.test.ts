/**
 * Tests for GrowthPredictor
 */

import { GrowthPredictor } from '../../prediction/GrowthPredictor';
import { ProductChange } from '../../models';

describe('GrowthPredictor', () => {
  let predictor: GrowthPredictor;

  beforeEach(() => {
    predictor = new GrowthPredictor();
  });

  const createChange = (overrides?: Partial<ProductChange>): ProductChange => ({
    id: 'change-1',
    name: 'Test Change',
    description: 'Test description',
    type: 'feature',
    estimatedEffort: 5,
    targetMetrics: ['growth'],
    expectedReach: 1000,
    ...overrides,
  });

  describe('predict', () => {
    it('should return change within valid range', () => {
      const change = createChange();
      const prediction = predictor.predict(change, 0.05);

      expect(prediction).toBeGreaterThanOrEqual(-0.2);
      expect(prediction).toBeLessThanOrEqual(0.2);
    });

    it('should be higher for features', () => {
      const fix = createChange({ type: 'fix' });
      const feature = createChange({ type: 'feature' });

      const fixPrediction = Math.abs(predictor.predict(fix, 0.05));
      const featurePrediction = Math.abs(predictor.predict(feature, 0.05));

      expect(featurePrediction).toBeGreaterThanOrEqual(fixPrediction);
    });

    it('should increase for viral features', () => {
      const regular = createChange({ description: 'Regular feature' });
      const viral = createChange({ description: 'Social sharing feature' });

      const regularPrediction = Math.abs(predictor.predict(regular, 0.05));
      const viralPrediction = Math.abs(predictor.predict(viral, 0.05));

      expect(viralPrediction).toBeGreaterThan(regularPrediction);
    });
  });

  describe('getConfidence', () => {
    it('should return confidence between 0 and 1', () => {
      const change = createChange();
      const confidence = predictor.getConfidence(change);

      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });
});
