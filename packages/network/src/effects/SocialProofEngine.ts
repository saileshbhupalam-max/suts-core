/**
 * Social proof engine - models how larger networks increase conversion rates
 */

import { NetworkConfig } from '../models/NetworkConfig';

/**
 * Result of social proof calculation
 */
export interface SocialProofResult {
  /** Base conversion rate without social proof */
  baseRate: number;
  /** Adjusted conversion rate with social proof */
  adjustedRate: number;
  /** Multiplier applied */
  multiplier: number;
  /** Network size used for calculation */
  networkSize: number;
}

/**
 * Engine for calculating social proof effects on conversion
 */
export class SocialProofEngine {
  private config: NetworkConfig;

  /**
   * Creates a new SocialProofEngine
   * @param config - Network simulator configuration
   */
  constructor(config: NetworkConfig) {
    this.config = config;
  }

  /**
   * Calculates the conversion rate with social proof applied
   * @param networkSize - Current size of the network
   * @returns Social proof result
   */
  calculateConversionRate(networkSize: number): SocialProofResult {
    const baseRate = this.config.baseAcceptanceRate;

    if (!this.config.enableNetworkEffects || networkSize <= 0) {
      return {
        baseRate,
        adjustedRate: baseRate,
        multiplier: 1,
        networkSize,
      };
    }

    // Social proof effect increases logarithmically with network size
    // This reflects diminishing returns as the network gets very large
    const socialProofFactor = this.calculateSocialProofFactor(networkSize);
    const multiplier = 1 + socialProofFactor * (this.config.socialProofMultiplier - 1);
    const adjustedRate = Math.min(0.95, baseRate * multiplier); // Cap at 95%

    return {
      baseRate,
      adjustedRate,
      multiplier,
      networkSize,
    };
  }

  /**
   * Calculates the social proof factor based on network size
   * @param networkSize - Size of the network
   * @returns Social proof factor (0-1)
   */
  private calculateSocialProofFactor(networkSize: number): number {
    if (networkSize <= 0) {
      return 0;
    }

    // Logarithmic growth with diminishing returns
    // Factor ranges from 0 (very small networks) to ~1 (very large networks)
    const factor = Math.log10(Math.max(1, networkSize)) / 5;
    return Math.min(1, factor);
  }

  /**
   * Calculates the credibility boost for a specific network size threshold
   * @param networkSize - Current network size
   * @param threshold - Threshold for credibility boost
   * @returns Credibility boost multiplier
   */
  calculateCredibilityBoost(
    networkSize: number,
    threshold: number = 100
  ): number {
    if (networkSize < threshold) {
      return 1;
    }

    // Once past threshold, additional credibility boost
    const excessUsers = networkSize - threshold;
    const boost = 1 + Math.log10(1 + excessUsers / threshold) * 0.2;

    return Math.min(1.5, boost); // Cap at 1.5x
  }

  /**
   * Estimates the impact of social proof on a cohort
   * @param cohortSize - Size of the cohort being invited
   * @param networkSize - Current network size
   * @returns Expected number of conversions
   */
  estimateConversions(cohortSize: number, networkSize: number): number {
    const result = this.calculateConversionRate(networkSize);
    return Math.floor(cohortSize * result.adjustedRate);
  }

  /**
   * Calculates the network size needed to achieve a target conversion rate
   * @param targetRate - Target conversion rate (0-1)
   * @returns Required network size
   */
  calculateRequiredNetworkSize(targetRate: number): number {
    if (targetRate <= this.config.baseAcceptanceRate) {
      return 0;
    }

    if (!this.config.enableNetworkEffects) {
      return Infinity; // Cannot reach target without network effects
    }

    // Solve for network size using inverse of the conversion formula
    const requiredMultiplier = targetRate / this.config.baseAcceptanceRate;
    const requiredFactor =
      (requiredMultiplier - 1) / (this.config.socialProofMultiplier - 1);

    // Inverse of log10(n)/5 = factor => n = 10^(factor*5)
    const networkSize = Math.pow(10, requiredFactor * 5);

    return Math.ceil(networkSize);
  }
}
