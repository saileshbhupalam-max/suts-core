/**
 * Network simulator configuration
 */

import { z } from 'zod';

/**
 * Schema for network simulator configuration
 */
export const NetworkConfigSchema = z.object({
  /** Base referral probability (0-1) */
  baseReferralProbability: z.number().min(0).max(1),
  /** Delight threshold for triggering referrals (0-1) */
  delightThreshold: z.number().min(0).max(1),
  /** Base invitation acceptance rate (0-1) */
  baseAcceptanceRate: z.number().min(0).max(1),
  /** Influence of social proof on acceptance rate */
  socialProofMultiplier: z.number().min(0),
  /** Average time from signup to first referral (in days) */
  avgTimeToFirstReferral: z.number().min(0),
  /** Standard deviation for time to first referral (in days) */
  timeToReferralStdDev: z.number().min(0),
  /** Maximum referrals per user */
  maxReferralsPerUser: z.number().int().min(0),
  /** Daily churn rate (0-1) */
  dailyChurnRate: z.number().min(0).max(1),
  /** Reduction in churn due to network effects (0-1) */
  networkChurnReduction: z.number().min(0).max(1),
  /** Whether to enable network effects */
  enableNetworkEffects: z.boolean(),
  /** Random seed for reproducibility */
  randomSeed: z.number().int().optional(),
});

/**
 * Type representing network simulator configuration
 */
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;

/**
 * Creates default network configuration
 * @returns Default NetworkConfig
 */
export function createDefaultConfig(): NetworkConfig {
  return {
    baseReferralProbability: 0.3,
    delightThreshold: 0.7,
    baseAcceptanceRate: 0.25,
    socialProofMultiplier: 1.2,
    avgTimeToFirstReferral: 3,
    timeToReferralStdDev: 1.5,
    maxReferralsPerUser: 10,
    dailyChurnRate: 0.02,
    networkChurnReduction: 0.5,
    enableNetworkEffects: true,
  };
}

/**
 * Validates network configuration
 * @param config - Configuration to validate
 * @returns True if valid, throws error otherwise
 */
export function validateConfig(config: NetworkConfig): boolean {
  NetworkConfigSchema.parse(config);
  return true;
}
