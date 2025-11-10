/**
 * Builds referral graph from events and referral data
 */

import { PersonaProfile } from '@suts/persona';
import {
  ReferralGraph,
  createEmptyGraph,
  addNode,
  addEdge,
} from '../models/ReferralGraph';
import { ReferralEvent } from '../models/ReferralEvent';

/**
 * Builds and manages referral graphs
 */
export class NetworkGraphBuilder {
  private graph: ReferralGraph;

  /**
   * Creates a new NetworkGraphBuilder
   */
  constructor() {
    this.graph = createEmptyGraph();
  }

  /**
   * Gets the current graph
   * @returns The referral graph
   */
  getGraph(): ReferralGraph {
    return this.graph;
  }

  /**
   * Resets the graph to empty state
   */
  reset(): void {
    this.graph = createEmptyGraph();
  }

  /**
   * Adds personas as nodes to the graph
   * @param personas - Array of persona profiles
   */
  addPersonas(personas: PersonaProfile[]): void {
    for (const persona of personas) {
      // All initial personas are organic users (not referred by anyone)
      this.graph = addNode(this.graph, persona.id, null, new Date(), {
        archetype: persona.archetype,
        experienceLevel: persona.experienceLevel,
      });
    }
  }

  /**
   * Builds graph from referral events
   * @param events - Array of referral events
   */
  buildFromEvents(events: ReferralEvent[]): void {
    for (const event of events) {
      if (event.accepted && event.referredUserId !== null && event.referredUserId !== undefined) {
        // Add referred user as a node if not already present
        if (!this.graph.nodes.has(event.referredUserId)) {
          const joinedAt = event.acceptedAt ?? event.timestamp;
          this.graph = addNode(
            this.graph,
            event.referredUserId,
            event.referrerId,
            joinedAt,
            {}
          );
        }

        // Add edge representing the referral
        const timestamp = event.acceptedAt ?? event.timestamp;
        this.graph = addEdge(
          this.graph,
          event.referrerId,
          event.referredUserId,
          timestamp,
          event.channel
        );
      }
    }
  }

  /**
   * Adds a single referral to the graph
   * @param referrerId - ID of the user making the referral
   * @param referredUserId - ID of the user being referred
   * @param timestamp - Timestamp of the referral
   * @param channel - Channel through which the referral was made
   */
  addReferral(
    referrerId: string,
    referredUserId: string,
    timestamp: Date,
    channel: 'email' | 'social' | 'link' | 'in-app' | 'other'
  ): void {
    // Add referred user as a node if not already present
    if (!this.graph.nodes.has(referredUserId)) {
      this.graph = addNode(this.graph, referredUserId, referrerId, timestamp, {});
    }

    // Add edge
    this.graph = addEdge(
      this.graph,
      referrerId,
      referredUserId,
      timestamp,
      channel
    );
  }

  /**
   * Marks a user as churned
   * @param userId - ID of the user who churned
   */
  markAsChurned(userId: string): void {
    const node = this.graph.nodes.get(userId);
    if (node !== null && node !== undefined) {
      const updatedNode = {
        ...node,
        churned: true,
      };
      const nodes = new Map(this.graph.nodes);
      nodes.set(userId, updatedNode);
      this.graph = {
        ...this.graph,
        nodes,
      };
    }
  }

  /**
   * Gets all users who were referred by a specific user
   * @param userId - ID of the referrer
   * @returns Array of referred user IDs
   */
  getReferredUsers(userId: string): string[] {
    const referred: string[] = [];
    for (const edge of this.graph.edges) {
      if (edge.from === userId) {
        referred.push(edge.to);
      }
    }
    return referred;
  }

  /**
   * Gets the user who referred a specific user
   * @param userId - ID of the user
   * @returns ID of the referrer, or null if organic user
   */
  getReferrer(userId: string): string | null {
    const node = this.graph.nodes.get(userId);
    if (node !== null && node !== undefined) {
      return node.referredBy;
    }
    return null;
  }

  /**
   * Gets the full referral chain for a user (from organic user to this user)
   * @param userId - ID of the user
   * @returns Array of user IDs representing the chain
   */
  getReferralChain(userId: string): string[] {
    const chain: string[] = [];
    let currentUserId: string | null = userId;

    while (currentUserId !== null && currentUserId !== undefined) {
      chain.unshift(currentUserId);
      const node = this.graph.nodes.get(currentUserId);
      if (node === null || node === undefined) {
        break;
      }
      currentUserId = node.referredBy;
    }

    return chain;
  }

  /**
   * Gets statistics about the graph
   * @returns Graph statistics
   */
  getStatistics(): {
    totalUsers: number;
    organicUsers: number;
    referredUsers: number;
    totalReferrals: number;
    activeReferrers: number;
    churnedUsers: number;
  } {
    let organicUsers = 0;
    let activeReferrers = 0;
    let churnedUsers = 0;

    for (const [, node] of this.graph.nodes) {
      if (node.referredBy === null || node.referredBy === undefined) {
        organicUsers++;
      }
      if (node.referralCount > 0) {
        activeReferrers++;
      }
      if (node.churned) {
        churnedUsers++;
      }
    }

    return {
      totalUsers: this.graph.totalUsers,
      organicUsers,
      referredUsers: this.graph.totalUsers - organicUsers,
      totalReferrals: this.graph.totalReferrals,
      activeReferrers,
      churnedUsers,
    };
  }
}
