/**
 * Churn reduction calculator - models how network effects reduce churn
 */

import { NetworkConfig } from '../models/NetworkConfig';
import { ReferralGraph } from '../models/ReferralGraph';

/**
 * Result of churn reduction calculation
 */
export interface ChurnReductionResult {
  /** Base churn rate without network effects */
  baseChurnRate: number;
  /** Adjusted churn rate with network effects */
  adjustedChurnRate: number;
  /** Reduction factor applied */
  reductionFactor: number;
  /** Network size used for calculation */
  networkSize: number;
  /** Number of connections for the user */
  connectionCount: number;
}

/**
 * Calculator for churn reduction due to network effects
 */
export class ChurnReduction {
  private config: NetworkConfig;

  /**
   * Creates a new ChurnReduction calculator
   * @param config - Network simulator configuration
   */
  constructor(config: NetworkConfig) {
    this.config = config;
  }

  /**
   * Calculates churn rate for a user based on their network connections
   * @param userId - ID of the user
   * @param graph - The referral graph
   * @returns Churn reduction result
   */
  calculateUserChurnRate(
    userId: string,
    graph: ReferralGraph
  ): ChurnReductionResult {
    const baseChurnRate = this.config.dailyChurnRate;

    if (!this.config.enableNetworkEffects) {
      return {
        baseChurnRate,
        adjustedChurnRate: baseChurnRate,
        reductionFactor: 0,
        networkSize: graph.totalUsers,
        connectionCount: 0,
      };
    }

    // Calculate connection count for the user
    const connectionCount = this.getConnectionCount(userId, graph);

    // Calculate churn reduction factor
    const reductionFactor = this.calculateReductionFactor(
      connectionCount,
      graph.totalUsers
    );

    // Apply reduction
    const adjustedChurnRate = baseChurnRate * (1 - reductionFactor);

    return {
      baseChurnRate,
      adjustedChurnRate,
      reductionFactor,
      networkSize: graph.totalUsers,
      connectionCount,
    };
  }

  /**
   * Calculates average churn rate across the entire network
   * @param graph - The referral graph
   * @returns Average adjusted churn rate
   */
  calculateNetworkChurnRate(graph: ReferralGraph): number {
    if (graph.totalUsers === 0) {
      return this.config.dailyChurnRate;
    }

    let totalChurnRate = 0;

    for (const [userId] of graph.nodes) {
      const result = this.calculateUserChurnRate(userId, graph);
      totalChurnRate += result.adjustedChurnRate;
    }

    return totalChurnRate / graph.totalUsers;
  }

  /**
   * Predicts number of users who will churn in a given period
   * @param graph - The referral graph
   * @param days - Number of days to predict
   * @returns Expected number of churned users
   */
  predictChurn(graph: ReferralGraph, days: number): number {
    const avgChurnRate = this.calculateNetworkChurnRate(graph);
    const activeUsers = this.getActiveUserCount(graph);

    // Calculate expected churn over the period
    // Using compound churn: remaining = initial * (1 - rate)^days
    const remaining = activeUsers * Math.pow(1 - avgChurnRate, days);
    const churned = activeUsers - remaining;

    return Math.floor(churned);
  }

  /**
   * Calculates the retention improvement due to network effects
   * @param graph - The referral graph
   * @returns Retention improvement factor (0-1)
   */
  calculateRetentionImprovement(graph: ReferralGraph): number {
    const baseChurnRate = this.config.dailyChurnRate;
    const adjustedChurnRate = this.calculateNetworkChurnRate(graph);

    if (baseChurnRate === 0) {
      return 0;
    }

    return (baseChurnRate - adjustedChurnRate) / baseChurnRate;
  }

  /**
   * Gets the number of connections for a user
   * Connections include both referrals made and being referred by someone
   * @param userId - ID of the user
   * @param graph - The referral graph
   * @returns Number of connections
   */
  private getConnectionCount(userId: string, graph: ReferralGraph): number {
    let connections = 0;

    // Count referrals made by the user
    for (const edge of graph.edges) {
      if (edge.from === userId) {
        connections++;
      }
    }

    // Count being referred by someone (1 connection)
    const node = graph.nodes.get(userId);
    if (node?.referredBy !== null && node?.referredBy !== undefined) {
      connections++;
    }

    // Count referrals made to the user
    for (const edge of graph.edges) {
      if (edge.to === userId) {
        connections++;
      }
    }

    return connections;
  }

  /**
   * Calculates the churn reduction factor based on connections and network size
   * @param connectionCount - Number of connections the user has
   * @param networkSize - Total size of the network
   * @returns Reduction factor (0-1)
   */
  private calculateReductionFactor(
    connectionCount: number,
    networkSize: number
  ): number {
    if (connectionCount === 0) {
      return 0;
    }

    // Base reduction from connections (logarithmic)
    const connectionFactor = Math.log10(1 + connectionCount) / 2;

    // Additional reduction from network size (diminishing returns)
    const networkFactor = Math.log10(Math.max(1, networkSize)) / 10;

    // Combine factors and apply max reduction from config
    const totalFactor = Math.min(1, connectionFactor + networkFactor);
    const maxReduction = this.config.networkChurnReduction;

    return totalFactor * maxReduction;
  }

  /**
   * Gets the count of active (non-churned) users
   * @param graph - The referral graph
   * @returns Number of active users
   */
  private getActiveUserCount(graph: ReferralGraph): number {
    let activeCount = 0;

    for (const [, node] of graph.nodes) {
      if (!node.churned) {
        activeCount++;
      }
    }

    return activeCount;
  }

  /**
   * Simulates churn for a given user based on their churn rate
   * @param userId - ID of the user
   * @param graph - The referral graph
   * @returns True if the user churns
   */
  simulateUserChurn(userId: string, graph: ReferralGraph): boolean {
    const result = this.calculateUserChurnRate(userId, graph);
    return Math.random() < result.adjustedChurnRate;
  }
}
