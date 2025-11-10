/**
 * Network metrics model for tracking viral and network performance
 */

import { z } from 'zod';

/**
 * Schema for network metrics
 */
export const NetworkMetricsSchema = z.object({
  /** Viral coefficient (k-factor) - average number of successful referrals per user */
  kFactor: z.number().min(0),
  /** Viral cycle time - average time from signup to referral (in days) */
  viralCycleTime: z.number().min(0),
  /** Invitation conversion rate - percentage of invites that convert to signups */
  conversionRate: z.number().min(0).max(1),
  /** Average invitations sent per user */
  invitationsPerUser: z.number().min(0),
  /** Total number of users in the network */
  totalUsers: z.number().int().min(0),
  /** Total number of referrals sent */
  totalReferrals: z.number().int().min(0),
  /** Total number of successful referrals (accepted) */
  successfulReferrals: z.number().int().min(0),
  /** Percentage of users who have made at least one referral */
  activeReferrerRate: z.number().min(0).max(1),
  /** Average referral chain depth */
  avgChainDepth: z.number().min(0),
  /** Maximum referral chain depth */
  maxChainDepth: z.number().int().min(0),
  /** Churn rate - percentage of users who have left */
  churnRate: z.number().min(0).max(1),
  /** Network value multiplier (based on Metcalfe's law) */
  networkValueMultiplier: z.number().min(0),
  /** Timestamp when metrics were calculated */
  calculatedAt: z.date(),
});

/**
 * Type representing network metrics
 */
export type NetworkMetrics = z.infer<typeof NetworkMetricsSchema>;

/**
 * Creates initial network metrics with default values
 * @returns NetworkMetrics with default values
 */
export function createDefaultMetrics(): NetworkMetrics {
  return {
    kFactor: 0,
    viralCycleTime: 0,
    conversionRate: 0,
    invitationsPerUser: 0,
    totalUsers: 0,
    totalReferrals: 0,
    successfulReferrals: 0,
    activeReferrerRate: 0,
    avgChainDepth: 0,
    maxChainDepth: 0,
    churnRate: 0,
    networkValueMultiplier: 1,
    calculatedAt: new Date(),
  };
}

/**
 * Updates network metrics with new values
 * @param current - Current metrics
 * @param updates - Partial updates to apply
 * @returns Updated metrics
 */
export function updateMetrics(
  current: NetworkMetrics,
  updates: Partial<NetworkMetrics>
): NetworkMetrics {
  return {
    ...current,
    ...updates,
    calculatedAt: new Date(),
  };
}

/**
 * Checks if the network has viral growth (k-factor > 1)
 * @param metrics - Network metrics
 * @returns True if k-factor > 1
 */
export function hasViralGrowth(metrics: NetworkMetrics): boolean {
  return metrics.kFactor > 1;
}

/**
 * Gets the virality classification based on k-factor
 * @param metrics - Network metrics
 * @returns Virality classification
 */
export function getViralityClassification(
  metrics: NetworkMetrics
): 'viral' | 'moderate' | 'low' | 'none' {
  if (metrics.kFactor >= 1.5) {
    return 'viral';
  } else if (metrics.kFactor >= 1.0) {
    return 'moderate';
  } else if (metrics.kFactor >= 0.5) {
    return 'low';
  } else {
    return 'none';
  }
}
