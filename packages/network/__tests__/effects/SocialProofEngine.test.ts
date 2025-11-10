/**
 * Tests for SocialProofEngine
 */

import { SocialProofEngine } from '../../src/effects/SocialProofEngine';
import { createDefaultConfig } from '../../src/models/NetworkConfig';

describe('SocialProofEngine', () => {
  let engine: SocialProofEngine;

  beforeEach(() => {
    engine = new SocialProofEngine(createDefaultConfig());
  });

  describe('calculateConversionRate', () => {
    it('should return base rate for zero network size', () => {
      const result = engine.calculateConversionRate(0);

      expect(result.adjustedRate).toBe(result.baseRate);
      expect(result.multiplier).toBe(1);
    });

    it('should increase conversion rate with network size', () => {
      const small = engine.calculateConversionRate(10);
      const large = engine.calculateConversionRate(1000);

      expect(large.adjustedRate).toBeGreaterThanOrEqual(small.adjustedRate);
    });

    it('should cap adjusted rate at 95%', () => {
      const result = engine.calculateConversionRate(1000000);

      expect(result.adjustedRate).toBeLessThanOrEqual(0.95);
    });

    it('should return base rate when network effects disabled', () => {
      const config = createDefaultConfig();
      config.enableNetworkEffects = false;
      const disabledEngine = new SocialProofEngine(config);

      const result = disabledEngine.calculateConversionRate(1000);

      expect(result.adjustedRate).toBe(result.baseRate);
    });
  });

  describe('calculateCredibilityBoost', () => {
    it('should return 1 for network below threshold', () => {
      const boost = engine.calculateCredibilityBoost(50, 100);

      expect(boost).toBe(1);
    });

    it('should increase boost above threshold', () => {
      const boost = engine.calculateCredibilityBoost(200, 100);

      expect(boost).toBeGreaterThan(1);
    });

    it('should cap boost at 1.5x', () => {
      const boost = engine.calculateCredibilityBoost(100000, 100);

      expect(boost).toBeLessThanOrEqual(1.5);
    });
  });

  describe('estimateConversions', () => {
    it('should estimate conversions correctly', () => {
      const conversions = engine.estimateConversions(100, 1000);

      expect(conversions).toBeGreaterThanOrEqual(0);
      expect(conversions).toBeLessThanOrEqual(100);
    });

    it('should return 0 for zero cohort size', () => {
      const conversions = engine.estimateConversions(0, 1000);

      expect(conversions).toBe(0);
    });

    it('should increase with larger network', () => {
      const small = engine.estimateConversions(100, 10);
      const large = engine.estimateConversions(100, 1000);

      expect(large).toBeGreaterThanOrEqual(small);
    });
  });

  describe('calculateRequiredNetworkSize', () => {
    it('should return 0 for target below base rate', () => {
      const config = createDefaultConfig();
      const baseRate = config.baseAcceptanceRate;
      const size = engine.calculateRequiredNetworkSize(baseRate * 0.5);

      expect(size).toBe(0);
    });

    it('should return Infinity when network effects disabled', () => {
      const config = createDefaultConfig();
      config.enableNetworkEffects = false;
      const disabledEngine = new SocialProofEngine(config);

      const size = disabledEngine.calculateRequiredNetworkSize(0.5);

      expect(size).toBe(Infinity);
    });

    it('should calculate required size for achievable target', () => {
      const size = engine.calculateRequiredNetworkSize(0.4);

      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(Infinity);
    });

    it('should return 0 for target equal to base rate', () => {
      const config = createDefaultConfig();
      const size = engine.calculateRequiredNetworkSize(config.baseAcceptanceRate);

      expect(size).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle negative network size', () => {
      const result = engine.calculateConversionRate(-10);

      expect(result.adjustedRate).toBe(result.baseRate);
    });

    it('should handle zero cohort in estimateConversions', () => {
      const conversions = engine.estimateConversions(0, 0);

      expect(conversions).toBe(0);
    });

    it('should handle credibility boost at threshold exactly', () => {
      const boost = engine.calculateCredibilityBoost(100, 100);

      expect(boost).toBe(1);
    });
  });
});
