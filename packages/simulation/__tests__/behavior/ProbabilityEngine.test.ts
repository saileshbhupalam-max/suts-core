/**
 * Tests for ProbabilityEngine
 */

import { ProbabilityEngine, SeededRandom } from '../../src/behavior/ProbabilityEngine';

describe('SeededRandom', () => {
  it('should generate deterministic random numbers', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('should generate different sequences with different seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(54321);

    const val1 = rng1.next();
    const val2 = rng2.next();

    expect(val1).not.toBe(val2);
  });

  it('should generate numbers in [0, 1) range', () => {
    const rng = new SeededRandom(12345);

    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should generate integers in specified range', () => {
    const rng = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('should generate floats in specified range', () => {
    const rng = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      const val = rng.nextFloat(1.5, 5.5);
      expect(val).toBeGreaterThanOrEqual(1.5);
      expect(val).toBeLessThan(5.5);
    }
  });
});

describe('ProbabilityEngine', () => {
  it('should make deterministic weighted choices', () => {
    const engine1 = new ProbabilityEngine(12345);
    const engine2 = new ProbabilityEngine(12345);

    const choices = [
      { value: 'A', weight: 1 },
      { value: 'B', weight: 2 },
      { value: 'C', weight: 3 },
    ];

    for (let i = 0; i < 10; i++) {
      expect(engine1.weightedChoice(choices)).toBe(engine2.weightedChoice(choices));
    }
  });

  it('should respect weight distribution', () => {
    const engine = new ProbabilityEngine(12345);
    const choices = [
      { value: 'A', weight: 1 },
      { value: 'B', weight: 9 },
    ];

    const counts = { A: 0, B: 0 };
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const choice = engine.weightedChoice(choices);
      counts[choice as keyof typeof counts]++;
    }

    // B should appear roughly 9x more than A
    const ratio = counts.B / counts.A;
    expect(ratio).toBeGreaterThan(5); // Allow some variance
    expect(ratio).toBeLessThan(15);
  });

  it('should throw error for empty choices', () => {
    const engine = new ProbabilityEngine(12345);
    expect(() => engine.weightedChoice([])).toThrow('Cannot choose from empty array');
  });

  it('should throw error for zero total weight', () => {
    const engine = new ProbabilityEngine(12345);
    const choices = [
      { value: 'A', weight: 0 },
      { value: 'B', weight: 0 },
    ];
    expect(() => engine.weightedChoice(choices)).toThrow('Total weight must be positive');
  });

  it('should sample without replacement', () => {
    const engine = new ProbabilityEngine(12345);
    const choices = [
      { value: 1, weight: 1 },
      { value: 2, weight: 1 },
      { value: 3, weight: 1 },
    ];

    const sample = engine.weightedSample(choices, 2);

    expect(sample.length).toBe(2);
    expect(new Set(sample).size).toBe(2); // All unique
  });

  it('should throw error when sample size exceeds population', () => {
    const engine = new ProbabilityEngine(12345);
    const choices = [
      { value: 1, weight: 1 },
      { value: 2, weight: 1 },
    ];

    expect(() => engine.weightedSample(choices, 3)).toThrow(
      'Sample size cannot exceed population size'
    );
  });

  it('should determine occurrence based on probability', () => {
    const engine = new ProbabilityEngine(12345);

    // Test with high probability
    let trueCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (engine.occurs(0.9)) {
        trueCount++;
      }
    }
    expect(trueCount).toBeGreaterThan(800);
    expect(trueCount).toBeLessThan(1000);

    // Test with low probability
    const engine2 = new ProbabilityEngine(12345);
    trueCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (engine2.occurs(0.1)) {
        trueCount++;
      }
    }
    expect(trueCount).toBeGreaterThan(0);
    expect(trueCount).toBeLessThan(200);
  });

  it('should throw error for invalid probability', () => {
    const engine = new ProbabilityEngine(12345);
    expect(() => engine.occurs(-0.1)).toThrow('Probability must be between 0 and 1');
    expect(() => engine.occurs(1.1)).toThrow('Probability must be between 0 and 1');
  });

  it('should generate normal distribution', () => {
    const engine = new ProbabilityEngine(12345);
    const values: number[] = [];

    for (let i = 0; i < 1000; i++) {
      values.push(engine.normal(0, 1));
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;

    expect(mean).toBeGreaterThan(-0.2);
    expect(mean).toBeLessThan(0.2);
    expect(variance).toBeGreaterThan(0.8);
    expect(variance).toBeLessThan(1.2);
  });

  it('should shuffle array deterministically', () => {
    const engine1 = new ProbabilityEngine(12345);
    const engine2 = new ProbabilityEngine(12345);

    const arr1 = [1, 2, 3, 4, 5];
    const arr2 = [1, 2, 3, 4, 5];

    const shuffled1 = engine1.shuffle(arr1);
    const shuffled2 = engine2.shuffle(arr2);

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('should return underlying RNG', () => {
    const engine = new ProbabilityEngine(12345);
    const rng = engine.getRNG();
    expect(rng).toBeInstanceOf(SeededRandom);
  });
});
