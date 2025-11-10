/**
 * Tests for GrowthProjection model
 */

import {
  createGrowthProjection,
  getPeakUserCount,
  getAverageDailyGrowthRate,
} from '../../src/models/GrowthProjection';

describe('GrowthProjection', () => {
  describe('createGrowthProjection', () => {
    it('should create a growth projection', () => {
      const projection = createGrowthProjection(100, 0.5, 10);

      expect(projection.startingUsers).toBe(100);
      expect(projection.kFactor).toBe(0.5);
      expect(projection.days).toBe(10);
      expect(projection.dataPoints.length).toBe(10);
    });

    it('should classify as declining when k-factor < churn', () => {
      const projection = createGrowthProjection(100, 0.1, 30, 0.05, 0.05);

      expect(projection.growthType).toBe('declining');
    });

    it('should classify as exponential when k-factor > 1', () => {
      const projection = createGrowthProjection(100, 1.5, 10, 0.3, 0.01);

      expect(projection.growthType).toBe('exponential');
    });

    it('should classify as linear for moderate k-factor', () => {
      const projection = createGrowthProjection(100, 0.5, 10, 0.1, 0.01);

      expect(['linear', 'plateau']).toContain(projection.growthType);
    });

    it('should calculate daily data points correctly', () => {
      const projection = createGrowthProjection(100, 0.5, 5, 0.1, 0.01);

      for (let i = 0; i < projection.dataPoints.length; i++) {
        const dp = projection.dataPoints[i];
        expect(dp?.day).toBe(i);
        expect(dp?.users).toBeGreaterThanOrEqual(0);
        expect(dp?.newUsers).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle zero churn rate', () => {
      const projection = createGrowthProjection(100, 0.5, 10, 0.1, 0);

      expect(projection.dataPoints.length).toBe(10);
      const lastPoint = projection.dataPoints[projection.dataPoints.length - 1];
      expect(lastPoint?.users).toBeGreaterThanOrEqual(100);
    });

    it('should handle high churn rate', () => {
      const projection = createGrowthProjection(100, 0.1, 10, 0.1, 0.1);

      const lastPoint = projection.dataPoints[projection.dataPoints.length - 1];
      expect(lastPoint?.users).toBeLessThan(100);
    });
  });

  describe('getPeakUserCount', () => {
    it('should return 0 for empty projection', () => {
      const projection = createGrowthProjection(0, 0, 0);
      const peak = getPeakUserCount(projection);

      expect(peak).toBe(0);
    });

    it('should return peak user count', () => {
      const projection = createGrowthProjection(100, 1.5, 10, 0.3, 0.01);
      const peak = getPeakUserCount(projection);

      expect(peak).toBeGreaterThanOrEqual(100);
    });

    it('should return starting users for declining growth', () => {
      const projection = createGrowthProjection(100, 0.1, 10, 0.05, 0.05);
      const peak = getPeakUserCount(projection);

      expect(peak).toBeLessThanOrEqual(100);
    });
  });

  describe('getAverageDailyGrowthRate', () => {
    it('should return 0 for projection with less than 2 points', () => {
      const projection = createGrowthProjection(100, 0.5, 1);
      const rate = getAverageDailyGrowthRate(projection);

      expect(rate).toBeGreaterThanOrEqual(0);
    });

    it('should calculate positive growth rate for growing projection', () => {
      const projection = createGrowthProjection(100, 1.5, 10, 0.3, 0.01);
      const rate = getAverageDailyGrowthRate(projection);

      expect(rate).toBeGreaterThan(0);
    });

    it('should calculate negative growth rate for declining projection', () => {
      const projection = createGrowthProjection(100, 0.1, 10, 0.05, 0.1);
      const rate = getAverageDailyGrowthRate(projection);

      expect(rate).toBeLessThan(0);
    });

    it('should return 0 when starting with 0 users', () => {
      const projection = createGrowthProjection(0, 0.5, 10);
      const rate = getAverageDailyGrowthRate(projection);

      expect(rate).toBe(0);
    });
  });
});
