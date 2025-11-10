/**
 * Tests for NetworkConfig model
 */

import {
  createDefaultConfig,
  validateConfig,
} from '../../src/models/NetworkConfig';

describe('NetworkConfig', () => {
  describe('createDefaultConfig', () => {
    it('should create default configuration', () => {
      const config = createDefaultConfig();

      expect(config.baseReferralProbability).toBeGreaterThan(0);
      expect(config.baseReferralProbability).toBeLessThanOrEqual(1);
      expect(config.delightThreshold).toBeGreaterThan(0);
      expect(config.delightThreshold).toBeLessThanOrEqual(1);
      expect(config.enableNetworkEffects).toBeDefined();
    });

    it('should have valid probability values', () => {
      const config = createDefaultConfig();

      expect(config.baseReferralProbability).toBeGreaterThanOrEqual(0);
      expect(config.baseReferralProbability).toBeLessThanOrEqual(1);
      expect(config.baseAcceptanceRate).toBeGreaterThanOrEqual(0);
      expect(config.baseAcceptanceRate).toBeLessThanOrEqual(1);
    });

    it('should have positive time values', () => {
      const config = createDefaultConfig();

      expect(config.avgTimeToFirstReferral).toBeGreaterThan(0);
      expect(config.timeToReferralStdDev).toBeGreaterThan(0);
    });
  });

  describe('validateConfig', () => {
    it('should validate a valid configuration', () => {
      const config = createDefaultConfig();

      expect(() => validateConfig(config)).not.toThrow();
      expect(validateConfig(config)).toBe(true);
    });

    it('should reject invalid probability values', () => {
      const config = createDefaultConfig();
      config.baseReferralProbability = 1.5;

      expect(() => validateConfig(config)).toThrow();
    });

    it('should reject negative time values', () => {
      const config = createDefaultConfig();
      config.avgTimeToFirstReferral = -1;

      expect(() => validateConfig(config)).toThrow();
    });

    it('should reject invalid churn rate', () => {
      const config = createDefaultConfig();
      config.dailyChurnRate = 1.5;

      expect(() => validateConfig(config)).toThrow();
    });
  });
});
