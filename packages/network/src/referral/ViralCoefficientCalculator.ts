/**
 * Calculates viral coefficient (k-factor) from referral graph
 */

import { ReferralGraph, getReferralChains } from '../models/ReferralGraph';
import { NetworkMetrics, createDefaultMetrics } from '../models/NetworkMetrics';

/**
 * Calculates viral coefficient and related metrics from a referral graph
 */
export class ViralCoefficientCalculator {
  /**
   * Calculates the viral coefficient (k-factor) from the graph
   * The k-factor is the average number of successful referrals per user
   * @param graph - The referral graph
   * @returns K-factor value
   */
  calculateKFactor(graph: ReferralGraph): number {
    if (graph.totalUsers === 0) {
      return 0;
    }

    // K-factor = total successful referrals / total users
    return graph.totalReferrals / graph.totalUsers;
  }

  /**
   * Calculates comprehensive network metrics from the graph
   * @param graph - The referral graph
   * @param totalInvitationsSent - Total number of invitations sent (including not accepted)
   * @returns Network metrics
   */
  calculateMetrics(
    graph: ReferralGraph,
    totalInvitationsSent: number = 0
  ): NetworkMetrics {
    const metrics = createDefaultMetrics();

    if (graph.totalUsers === 0) {
      return metrics;
    }

    // Calculate k-factor
    metrics.kFactor = this.calculateKFactor(graph);

    // Calculate conversion rate
    metrics.conversionRate =
      totalInvitationsSent > 0 ? graph.totalReferrals / totalInvitationsSent : 0;

    // Calculate invitations per user
    metrics.invitationsPerUser =
      totalInvitationsSent > 0 ? totalInvitationsSent / graph.totalUsers : 0;

    // Calculate active referrer rate
    let activeReferrers = 0;
    let churnedUsers = 0;

    for (const [, node] of graph.nodes) {
      if (node.referralCount > 0) {
        activeReferrers++;
      }
      if (node.churned) {
        churnedUsers++;
      }
    }

    metrics.activeReferrerRate = activeReferrers / graph.totalUsers;
    metrics.churnRate = churnedUsers / graph.totalUsers;

    // Calculate chain depths
    const chains = getReferralChains(graph);
    if (chains.length > 0) {
      const chainLengths = chains.map((chain) => chain.length);
      metrics.maxChainDepth = Math.max(...chainLengths);
      metrics.avgChainDepth =
        chainLengths.reduce((sum, len) => sum + len, 0) / chainLengths.length;
    }

    // Calculate viral cycle time (estimated from edge timestamps)
    metrics.viralCycleTime = this.calculateViralCycleTime(graph);

    // Calculate network value multiplier (Metcalfe's law: value ~ n^2)
    metrics.networkValueMultiplier = this.calculateNetworkValue(graph.totalUsers);

    // Update metadata
    metrics.totalUsers = graph.totalUsers;
    metrics.totalReferrals = graph.totalReferrals;
    metrics.successfulReferrals = graph.totalReferrals;

    return metrics;
  }

  /**
   * Calculates viral cycle time (average time from signup to first referral)
   * @param graph - The referral graph
   * @returns Viral cycle time in days
   */
  private calculateViralCycleTime(graph: ReferralGraph): number {
    const cycleTimes: number[] = [];

    for (const [userId, node] of graph.nodes) {
      // Find the first referral made by this user
      const userEdges = graph.edges.filter((edge) => edge.from === userId);

      if (userEdges.length > 0) {
        // Sort by timestamp to find first referral
        userEdges.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const firstReferral = userEdges[0];

        if (firstReferral !== null && firstReferral !== undefined) {
          // Calculate time difference in days
          const timeDiff =
            firstReferral.timestamp.getTime() - node.joinedAt.getTime();
          const days = timeDiff / (1000 * 60 * 60 * 24);
          cycleTimes.push(days);
        }
      }
    }

    if (cycleTimes.length === 0) {
      return 0;
    }

    const sum = cycleTimes.reduce((acc, val) => acc + val, 0);
    return sum / cycleTimes.length;
  }

  /**
   * Calculates network value multiplier based on Metcalfe's law
   * Value of a network is proportional to the square of the number of users
   * @param userCount - Number of users in the network
   * @returns Network value multiplier
   */
  private calculateNetworkValue(userCount: number): number {
    if (userCount === 0) {
      return 1;
    }

    // Simplified Metcalfe's law: value = n * log(n)
    // This is more realistic than pure n^2 for very large networks
    const baseValue = 1;
    if (userCount <= 1) {
      return baseValue;
    }

    return baseValue * userCount * Math.log10(userCount);
  }

  /**
   * Calculates the compounding growth rate over time
   * @param graph - The referral graph
   * @param periodDays - Period over which to calculate growth (in days)
   * @returns Daily growth rate
   */
  calculateGrowthRate(graph: ReferralGraph, periodDays: number): number {
    if (periodDays <= 0 || graph.totalUsers === 0) {
      return 0;
    }

    // Simplified: assume organic users started at day 0
    // and calculate average daily growth rate
    const kFactor = this.calculateKFactor(graph);

    // Daily growth rate = k-factor / viral cycle time
    const viralCycleTime = this.calculateViralCycleTime(graph);
    if (viralCycleTime === 0) {
      return 0;
    }

    return kFactor / viralCycleTime;
  }
}
