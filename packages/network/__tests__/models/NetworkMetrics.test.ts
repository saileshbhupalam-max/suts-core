/**
 * Tests for NetworkMetrics model
 */

import {
  createDefaultMetrics,
  updateMetrics,
  hasViralGrowth,
  getViralityClassification,
} from '../../src/models/NetworkMetrics';

describe('NetworkMetrics', () => {
  describe('createDefaultMetrics', () => {
    it('should create default metrics', () => {
      const metrics = createDefaultMetrics();

      expect(metrics.kFactor).toBe(0);
      expect(metrics.totalUsers).toBe(0);
      expect(metrics.totalReferrals).toBe(0);
      expect(metrics.calculatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateMetrics', () => {
    it('should update partial metrics', () => {
      const current = createDefaultMetrics();
      const updated = updateMetrics(current, {
        kFactor: 1.5,
        totalUsers: 100,
      });

      expect(updated.kFactor).toBe(1.5);
      expect(updated.totalUsers).toBe(100);
      expect(updated.totalReferrals).toBe(0);
    });

    it('should update calculatedAt timestamp', () => {
      const current = createDefaultMetrics();
      const beforeUpdate = new Date();

      setTimeout(() => {
        const updated = updateMetrics(current, { kFactor: 1.0 });
        expect(updated.calculatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeUpdate.getTime()
        );
      }, 10);
    });
  });

  describe('hasViralGrowth', () => {
    it('should return true for k-factor > 1', () => {
      const metrics = createDefaultMetrics();
      metrics.kFactor = 1.5;

      expect(hasViralGrowth(metrics)).toBe(true);
    });

    it('should return false for k-factor <= 1', () => {
      const metrics = createDefaultMetrics();
      metrics.kFactor = 0.8;

      expect(hasViralGrowth(metrics)).toBe(false);
    });

    it('should return false for k-factor = 1', () => {
      const metrics = createDefaultMetrics();
      metrics.kFactor = 1.0;

      expect(hasViralGrowth(metrics)).toBe(false);
    });
  });

  describe('getViralityClassification', () => {
    it('should classify k-factor >= 1.5 as viral', () => {
      const metrics = createDefaultMetrics();
      metrics.kFactor = 1.5;

      expect(getViralityClassification(metrics)).toBe('viral');
    });

    it('should classify k-factor >= 1.0 as moderate', () => {
      const metrics = createDefaultMetrics();
      metrics.kFactor = 1.2;

      expect(getViralityClassification(metrics)).toBe('moderate');
    });

    it('should classify k-factor >= 0.5 as low', () => {
      const metrics = createDefaultMetrics();
      metrics.kFactor = 0.7;

      expect(getViralityClassification(metrics)).toBe('low');
    });

    it('should classify k-factor < 0.5 as none', () => {
      const metrics = createDefaultMetrics();
      metrics.kFactor = 0.3;

      expect(getViralityClassification(metrics)).toBe('none');
    });
  });
});
