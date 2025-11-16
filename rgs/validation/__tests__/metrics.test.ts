/**
 * Tests for metrics calculations
 */

import {
  calculateAccuracy,
  calculateAccuracyBreakdown,
  calculateConfidence,
  calculateImprovement,
} from '../src/metrics';
import type { SUTSResult, ActualData } from '../src/types';

describe('calculateAccuracy', () => {
  const mockPredicted: SUTSResult = {
    testId: 'test-123',
    timestamp: new Date().toISOString(),
    predictions: {
      positioning: [
        {
          personaId: 'p1',
          predictedResponse: 'Very interested in this product',
          confidence: 0.8,
          reasoning: 'High engagement',
        },
      ],
      retention: [
        {
          personaId: 'p1',
          predictedRetention: 0.8,
          timeframe: '30d',
          reasoning: 'Strong usage',
        },
      ],
      viral: [
        {
          personaId: 'p1',
          predictedViralCoefficient: 1.2,
          channels: ['social'],
          reasoning: 'Active sharer',
        },
      ],
    },
    metadata: {
      personaCount: 1,
      testDuration: '1000ms',
      sutsVersion: '1.0.0',
    },
  };

  const mockActual: ActualData = {
    positioning: [
      {
        personaId: 'p1',
        actualResponse: 'Very interested in this amazing product',
        wasAccurate: true,
      },
    ],
    retention: [
      {
        personaId: 'p1',
        actualRetention: 0.85,
        timeframe: '30d',
      },
    ],
    viral: [
      {
        personaId: 'p1',
        actualViralCoefficient: 1.3,
        channels: ['social', 'email'],
      },
    ],
  };

  it('should calculate overall accuracy', () => {
    const accuracy = calculateAccuracy(mockPredicted, mockActual);
    expect(accuracy).toBeGreaterThanOrEqual(0);
    expect(accuracy).toBeLessThanOrEqual(100);
    expect(typeof accuracy).toBe('number');
  });

  it('should throw error for null predicted data', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => calculateAccuracy(null as any, mockActual)).toThrow(
      'Predicted data cannot be null or undefined'
    );
  });

  it('should throw error for undefined predicted data', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => calculateAccuracy(undefined as any, mockActual)).toThrow(
      'Predicted data cannot be null or undefined'
    );
  });

  it('should throw error for null actual data', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => calculateAccuracy(mockPredicted, null as any)).toThrow(
      'Actual data cannot be null or undefined'
    );
  });

  it('should throw error for undefined actual data', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => calculateAccuracy(mockPredicted, undefined as any)).toThrow(
      'Actual data cannot be null or undefined'
    );
  });
});

describe('calculateAccuracyBreakdown', () => {
  const mockPredicted: SUTSResult = {
    testId: 'test-123',
    timestamp: new Date().toISOString(),
    predictions: {
      positioning: [
        {
          personaId: 'p1',
          predictedResponse: 'interested product',
          confidence: 0.8,
          reasoning: 'test',
        },
        {
          personaId: 'p2',
          predictedResponse: 'not interested',
          confidence: 0.7,
          reasoning: 'test',
        },
      ],
      retention: [
        {
          personaId: 'p1',
          predictedRetention: 0.8,
          timeframe: '30d',
          reasoning: 'test',
        },
        {
          personaId: 'p2',
          predictedRetention: 0.5,
          timeframe: '30d',
          reasoning: 'test',
        },
      ],
      viral: [
        {
          personaId: 'p1',
          predictedViralCoefficient: 1.2,
          channels: ['social'],
          reasoning: 'test',
        },
        {
          personaId: 'p2',
          predictedViralCoefficient: 0.8,
          channels: ['email'],
          reasoning: 'test',
        },
      ],
    },
    metadata: {
      personaCount: 2,
      testDuration: '1000ms',
      sutsVersion: '1.0.0',
    },
  };

  const mockActual: ActualData = {
    positioning: [
      {
        personaId: 'p1',
        actualResponse: 'interested product',
        wasAccurate: true,
      },
      {
        personaId: 'p2',
        actualResponse: 'skeptical concerns',
        wasAccurate: false,
      },
    ],
    retention: [
      {
        personaId: 'p1',
        actualRetention: 0.85,
        timeframe: '30d',
      },
      {
        personaId: 'p2',
        actualRetention: 0.55,
        timeframe: '30d',
      },
    ],
    viral: [
      {
        personaId: 'p1',
        actualViralCoefficient: 1.3,
        channels: ['social'],
      },
      {
        personaId: 'p2',
        actualViralCoefficient: 0.9,
        channels: ['email'],
      },
    ],
  };

  it('should calculate breakdown for all categories', () => {
    const breakdown = calculateAccuracyBreakdown(mockPredicted, mockActual);

    expect(breakdown).toHaveProperty('positioning');
    expect(breakdown).toHaveProperty('retention');
    expect(breakdown).toHaveProperty('viral');

    expect(breakdown.positioning).toBeGreaterThanOrEqual(0);
    expect(breakdown.positioning).toBeLessThanOrEqual(100);

    expect(breakdown.retention).toBeGreaterThanOrEqual(0);
    expect(breakdown.retention).toBeLessThanOrEqual(100);

    expect(breakdown.viral).toBeGreaterThanOrEqual(0);
    expect(breakdown.viral).toBeLessThanOrEqual(100);
  });

  it('should handle empty predictions', () => {
    const emptyPredicted: SUTSResult = {
      ...mockPredicted,
      predictions: {
        positioning: [],
        retention: [],
        viral: [],
      },
    };

    const breakdown = calculateAccuracyBreakdown(emptyPredicted, mockActual);

    expect(breakdown.positioning).toBe(0);
    expect(breakdown.retention).toBe(0);
    expect(breakdown.viral).toBe(0);
  });

  it('should handle mismatched persona IDs', () => {
    const mismatchedActual: ActualData = {
      positioning: [
        {
          personaId: 'p99',
          actualResponse: 'test',
          wasAccurate: true,
        },
      ],
      retention: [
        {
          personaId: 'p99',
          actualRetention: 0.5,
          timeframe: '30d',
        },
      ],
      viral: [
        {
          personaId: 'p99',
          actualViralCoefficient: 1.0,
          channels: [],
        },
      ],
    };

    const breakdown = calculateAccuracyBreakdown(mockPredicted, mismatchedActual);

    // Should handle gracefully by returning 0 for unmatched personas
    expect(breakdown.positioning).toBeGreaterThanOrEqual(0);
    expect(breakdown.retention).toBeGreaterThanOrEqual(0);
    expect(breakdown.viral).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateConfidence', () => {
  it('should calculate confidence for valid inputs', () => {
    const confidence = calculateConfidence(50, 0.85);
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it('should increase confidence with larger sample size', () => {
    const confidence1 = calculateConfidence(10, 0.85);
    const confidence2 = calculateConfidence(100, 0.85);
    expect(confidence2).toBeGreaterThan(confidence1);
  });

  it('should throw error for zero sample size', () => {
    expect(() => calculateConfidence(0, 0.85)).toThrow('Sample size must be positive');
  });

  it('should throw error for negative sample size', () => {
    expect(() => calculateConfidence(-10, 0.85)).toThrow('Sample size must be positive');
  });

  it('should throw error for accuracy < 0', () => {
    expect(() => calculateConfidence(50, -0.1)).toThrow('Accuracy must be between 0 and 1');
  });

  it('should throw error for accuracy > 1', () => {
    expect(() => calculateConfidence(50, 1.5)).toThrow('Accuracy must be between 0 and 1');
  });

  it('should return value with 3 decimal places', () => {
    const confidence = calculateConfidence(50, 0.85);
    const decimals = confidence.toString().split('.')[1];
    expect(decimals).toBeDefined();
    if (decimals !== undefined) {
      expect(decimals.length).toBeLessThanOrEqual(3);
    }
  });
});

describe('calculateImprovement', () => {
  it('should calculate positive improvement', () => {
    const improvement = calculateImprovement(85, 92);
    expect(improvement).toBe(7.0);
  });

  it('should calculate negative improvement', () => {
    const improvement = calculateImprovement(92, 85);
    expect(improvement).toBe(-7.0);
  });

  it('should calculate zero improvement', () => {
    const improvement = calculateImprovement(85, 85);
    expect(improvement).toBe(0);
  });

  it('should return value with 2 decimal places', () => {
    const improvement = calculateImprovement(85.456, 92.123);
    const decimals = improvement.toString().split('.')[1];
    expect(decimals).toBeDefined();
    if (decimals !== undefined) {
      expect(decimals.length).toBeLessThanOrEqual(2);
    }
  });

  it('should throw error for base accuracy < 0', () => {
    expect(() => calculateImprovement(-5, 92)).toThrow('Base accuracy must be between 0 and 100');
  });

  it('should throw error for base accuracy > 100', () => {
    expect(() => calculateImprovement(105, 92)).toThrow('Base accuracy must be between 0 and 100');
  });

  it('should throw error for grounded accuracy < 0', () => {
    expect(() => calculateImprovement(85, -5)).toThrow(
      'Grounded accuracy must be between 0 and 100'
    );
  });

  it('should throw error for grounded accuracy > 100', () => {
    expect(() => calculateImprovement(85, 105)).toThrow(
      'Grounded accuracy must be between 0 and 100'
    );
  });

  it('should handle large improvements', () => {
    const improvement = calculateImprovement(50, 95);
    expect(improvement).toBe(45.0);
  });

  it('should handle small improvements', () => {
    const improvement = calculateImprovement(90, 90.5);
    expect(improvement).toBe(0.5);
  });
});
