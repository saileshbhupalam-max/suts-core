/**
 * Tests for RevenuePredictor
 */

import { RevenuePredictor } from '../../prediction/RevenuePredictor';
import { ProductChange } from '../../models';

describe('RevenuePredictor', () => {
  let predictor: RevenuePredictor;

  beforeEach(() => {
    predictor = new RevenuePredictor({
      avgRevenuePerUser: 50,
      currentUserBase: 10000,
    });
  });

  const createChange = (overrides?: Partial<ProductChange>): ProductChange => ({
    id: 'change-1',
    name: 'Test Change',
    description: 'Test description',
    type: 'feature',
    estimatedEffort: 5,
    targetMetrics: ['revenue'],
    expectedReach: 1000,
    ...overrides,
  });

  describe('predict', () => {
    it('should predict revenue impact', () => {
      const change = createChange();
      const prediction = predictor.predict(change, 0.05, 0.1);

      expect(typeof prediction).toBe('number');
    });

    it('should be higher for monetization changes', () => {
      const regular = createChange({ description: 'Regular feature' });
      const monetization = createChange({
        description: 'New subscription pricing',
      });

      const regularPrediction = Math.abs(
        predictor.predict(regular, 0.05, 0.05)
      );
      const monetizationPrediction = Math.abs(
        predictor.predict(monetization, 0.05, 0.05)
      );

      expect(monetizationPrediction).toBeGreaterThanOrEqual(regularPrediction);
    });

    it('should account for retention and growth changes', () => {
      const change = createChange();
      const withPositive = predictor.predict(change, 0.1, 0.1);
      const withNegative = predictor.predict(change, -0.1, -0.1);

      expect(withPositive).toBeGreaterThan(withNegative);
    });
  });

  describe('getConfidence', () => {
    it('should return confidence between 0 and 1', () => {
      const change = createChange();
      const confidence = predictor.getConfidence(change);

      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('should be higher for revenue-related changes', () => {
      const regular = createChange({ description: 'Regular feature' });
      const revenue = createChange({ description: 'Payment optimization' });

      const regularConfidence = predictor.getConfidence(regular);
      const revenueConfidence = predictor.getConfidence(revenue);

      expect(revenueConfidence).toBeGreaterThanOrEqual(regularConfidence);
    });
  });
});
