/**
 * Weighted random choice engine with seed-based determinism
 */

/**
 * Seeded random number generator (Linear Congruential Generator)
 */
export class SeededRandom {
  private seed: number;
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = 2 ** 32;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number [0, 1)
   */
  next(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }

  /**
   * Generate random integer in range [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float in range [min, max)
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

/**
 * Choice with associated weight
 */
export interface WeightedChoice<T> {
  value: T;
  weight: number;
}

/**
 * Probability engine for weighted random choices
 */
export class ProbabilityEngine {
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * Select a random item from weighted choices
   */
  weightedChoice<T>(choices: WeightedChoice<T>[]): T {
    if (choices.length === 0) {
      throw new Error('Cannot choose from empty array');
    }

    const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);

    if (totalWeight <= 0) {
      throw new Error('Total weight must be positive');
    }

    const random = this.rng.next() * totalWeight;
    let accumulator = 0;

    for (const choice of choices) {
      accumulator += choice.weight;
      if (random < accumulator) {
        return choice.value;
      }
    }

    // Fallback (should not reach here)
    return choices[choices.length - 1]!.value;
  }

  /**
   * Select multiple items without replacement
   */
  weightedSample<T>(choices: WeightedChoice<T>[], count: number): T[] {
    if (count > choices.length) {
      throw new Error('Sample size cannot exceed population size');
    }

    const result: T[] = [];
    const remaining = [...choices];

    for (let i = 0; i < count; i++) {
      const selected = this.weightedChoice(remaining);
      result.push(selected);

      // Remove selected item
      const index = remaining.findIndex((c) => c.value === selected);
      if (index >= 0) {
        remaining.splice(index, 1);
      }
    }

    return result;
  }

  /**
   * Check if event occurs based on probability
   */
  occurs(probability: number): boolean {
    if (probability < 0 || probability > 1) {
      throw new Error('Probability must be between 0 and 1');
    }
    return this.rng.next() < probability;
  }

  /**
   * Generate random number from normal distribution (Box-Muller transform)
   */
  normal(mean: number, stdDev: number): number {
    const u1 = this.rng.next();
    const u2 = this.rng.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Shuffle array in place
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.rng.nextInt(0, i);
      const temp = result[i];
      result[i] = result[j]!;
      result[j] = temp!;
    }
    return result;
  }

  /**
   * Get underlying RNG for direct access
   */
  getRNG(): SeededRandom {
    return this.rng;
  }
}
