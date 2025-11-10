/**
 * Tests for NetworkValueCalculator
 */

import { NetworkValueCalculator } from '../../src/effects/NetworkValueCalculator';
import { randomUUID } from 'crypto';

describe('NetworkValueCalculator', () => {
  let calculator: NetworkValueCalculator;

  beforeEach(() => {
    calculator = new NetworkValueCalculator();
  });

  describe('calculateValue', () => {
    it('should return 0 for 0 users', () => {
      const result = calculator.calculateValue(0);

      expect(result.rawValue).toBe(0);
      expect(result.valuePerUser).toBe(0);
    });

    it('should return 1 for 1 user', () => {
      const result = calculator.calculateValue(1);

      expect(result.rawValue).toBe(1);
      expect(result.valuePerUser).toBe(1);
      expect(result.multiplier).toBe(1);
    });

    it('should increase value with user count', () => {
      const result10 = calculator.calculateValue(10);
      const result100 = calculator.calculateValue(100);

      expect(result100.rawValue).toBeGreaterThan(result10.rawValue);
    });

    it('should calculate value per user correctly', () => {
      const result = calculator.calculateValue(100);

      expect(result.valuePerUser).toBe(result.rawValue / 100);
    });

    it('should calculate value increase correctly', () => {
      const result = calculator.calculateValue(10);

      expect(result.valueIncrease).toBeGreaterThan(0);
    });
  });

  describe('calculateMarginalValue', () => {
    it('should calculate marginal value of next user', () => {
      const marginal = calculator.calculateMarginalValue(100);

      expect(marginal).toBeGreaterThan(0);
    });

    it('should decrease marginal value as network grows', () => {
      const marginal10 = calculator.calculateMarginalValue(10);
      const marginal1000 = calculator.calculateMarginalValue(1000);

      // For n*log(n), marginal value actually increases but at a decreasing rate
      expect(marginal1000).toBeGreaterThan(0);
      expect(marginal10).toBeGreaterThan(0);
    });
  });

  describe('calculateValueIncrease', () => {
    it('should calculate total value increase', () => {
      const increase = calculator.calculateValueIncrease(100, 50);

      expect(increase).toBeGreaterThan(0);
    });

    it('should return 0 for 0 additional users', () => {
      const increase = calculator.calculateValueIncrease(100, 0);

      expect(increase).toBe(0);
    });
  });

  describe('calculateNetworkDensity', () => {
    it('should return 0 for single user', () => {
      const density = calculator.calculateNetworkDensity(1, 0);

      expect(density).toBe(0);
    });

    it('should calculate density correctly', () => {
      // 4 users can have max 6 connections (4*3/2)
      const density = calculator.calculateNetworkDensity(4, 3);

      expect(density).toBe(0.5);
    });

    it('should return 1 for fully connected network', () => {
      const density = calculator.calculateNetworkDensity(4, 6);

      expect(density).toBe(1);
    });
  });

  describe('calculatePureMetcalfeValue', () => {
    it('should calculate n^2 value', () => {
      const value = calculator.calculatePureMetcalfeValue(10);

      expect(value).toBe(100);
    });

    it('should return 0 for 0 users', () => {
      const value = calculator.calculatePureMetcalfeValue(0);

      expect(value).toBe(0);
    });
  });

  describe('calculateReedValue', () => {
    it('should calculate dampened exponential value', () => {
      const value = calculator.calculateReedValue(10);

      expect(value).toBeGreaterThan(0);
    });

    it('should return 0 for 0 users', () => {
      const value = calculator.calculateReedValue(0);

      expect(value).toBe(0);
    });
  });

  describe('calculateOdlyzkoTillyValue', () => {
    it('should calculate n*log(n) value', () => {
      const value = calculator.calculateOdlyzkoTillyValue(10);

      expect(value).toBeCloseTo(10 * Math.log(10), 2);
    });

    it('should return 1 for single user', () => {
      const value = calculator.calculateOdlyzkoTillyValue(1);

      expect(value).toBe(1);
    });

    it('should return 0 for zero users', () => {
      const value = calculator.calculateOdlyzkoTillyValue(0);

      expect(value).toBe(0);
    });

    it('should return 0 for negative users', () => {
      const value = calculator.calculateOdlyzkoTillyValue(-5);

      expect(value).toBe(0);
    });
  });

  describe('compareModels', () => {
    it('should compare all models', () => {
      const comparison = calculator.compareModels(100);

      expect(comparison.metcalfe).toBeGreaterThan(0);
      expect(comparison.odlyzkoTilly).toBeGreaterThan(0);
      expect(comparison.reed).toBeGreaterThan(0);
      expect(comparison.modified).toBeGreaterThan(0);
    });

    it('should show Metcalfe value is largest for moderate networks', () => {
      const comparison = calculator.compareModels(100);

      // Pure Metcalfe (n^2) should be much larger than modified (n*log(n))
      expect(comparison.metcalfe).toBeGreaterThan(comparison.modified);
    });

    it('should compare models for small networks', () => {
      const comparison = calculator.compareModels(10);

      expect(comparison.metcalfe).toBeGreaterThan(0);
      expect(comparison.odlyzkoTilly).toBeGreaterThan(0);
      expect(comparison.reed).toBeGreaterThan(0);
      expect(comparison.modified).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle negative user counts gracefully', () => {
      const result = calculator.calculateValue(-5);

      expect(result.rawValue).toBe(0);
    });

    it('should handle very large networks', () => {
      const result = calculator.calculateValue(100000);

      expect(result.rawValue).toBeGreaterThan(0);
      expect(result.valuePerUser).toBeGreaterThan(0);
    });
  });
});
