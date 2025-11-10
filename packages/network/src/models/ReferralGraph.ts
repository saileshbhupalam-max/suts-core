/**
 * Referral graph model representing the network of user referrals
 */

import { z } from 'zod';

/**
 * Schema for a node in the referral graph
 */
export const ReferralNodeSchema = z.object({
  /** User ID */
  userId: z.string(),
  /** ID of the user who referred this user (null for organic users) */
  referredBy: z.string().nullable(),
  /** Timestamp when this user joined */
  joinedAt: z.date(),
  /** Number of users this user has referred */
  referralCount: z.number().int().min(0),
  /** Whether this user has churned */
  churned: z.boolean(),
  /** Additional metadata about the user */
  metadata: z.record(z.unknown()),
});

/**
 * Type representing a node in the referral graph
 */
export type ReferralNode = z.infer<typeof ReferralNodeSchema>;

/**
 * Schema for an edge in the referral graph
 */
export const ReferralEdgeSchema = z.object({
  /** User who made the referral */
  from: z.string(),
  /** User who was referred */
  to: z.string(),
  /** Timestamp of the referral */
  timestamp: z.date(),
  /** Channel through which the referral was made */
  channel: z.enum(['email', 'social', 'link', 'in-app', 'other']),
});

/**
 * Type representing an edge in the referral graph
 */
export type ReferralEdge = z.infer<typeof ReferralEdgeSchema>;

/**
 * Schema for the referral graph
 */
export const ReferralGraphSchema = z.object({
  /** Map of user IDs to nodes */
  nodes: z.map(z.string(), ReferralNodeSchema),
  /** Array of edges representing referrals */
  edges: z.array(ReferralEdgeSchema),
  /** Total number of users in the graph */
  totalUsers: z.number().int().min(0),
  /** Total number of successful referrals */
  totalReferrals: z.number().int().min(0),
  /** Number of organic users (not referred by anyone) */
  organicUsers: z.number().int().min(0),
  /** Timestamp when the graph was last updated */
  lastUpdated: z.date(),
});

/**
 * Type representing the referral graph
 */
export type ReferralGraph = z.infer<typeof ReferralGraphSchema>;

/**
 * Creates an empty referral graph
 * @returns A new empty ReferralGraph
 */
export function createEmptyGraph(): ReferralGraph {
  return {
    nodes: new Map(),
    edges: [],
    totalUsers: 0,
    totalReferrals: 0,
    organicUsers: 0,
    lastUpdated: new Date(),
  };
}

/**
 * Adds a node to the referral graph
 * @param graph - The referral graph
 * @param userId - ID of the user to add
 * @param referredBy - ID of the user who referred this user (null for organic)
 * @param joinedAt - Timestamp when the user joined
 * @param metadata - Additional metadata
 * @returns Updated graph
 */
export function addNode(
  graph: ReferralGraph,
  userId: string,
  referredBy: string | null,
  joinedAt: Date,
  metadata: Record<string, unknown> = {}
): ReferralGraph {
  const node: ReferralNode = {
    userId,
    referredBy,
    joinedAt,
    referralCount: 0,
    churned: false,
    metadata,
  };

  const nodes = new Map(graph.nodes);
  nodes.set(userId, node);

  return {
    ...graph,
    nodes,
    totalUsers: graph.totalUsers + 1,
    organicUsers:
      referredBy === null || referredBy === undefined
        ? graph.organicUsers + 1
        : graph.organicUsers,
    lastUpdated: new Date(),
  };
}

/**
 * Adds an edge to the referral graph
 * @param graph - The referral graph
 * @param from - User who made the referral
 * @param to - User who was referred
 * @param timestamp - Timestamp of the referral
 * @param channel - Channel through which the referral was made
 * @returns Updated graph
 */
export function addEdge(
  graph: ReferralGraph,
  from: string,
  to: string,
  timestamp: Date,
  channel: 'email' | 'social' | 'link' | 'in-app' | 'other'
): ReferralGraph {
  const edge: ReferralEdge = {
    from,
    to,
    timestamp,
    channel,
  };

  const edges = [...graph.edges, edge];
  const nodes = new Map(graph.nodes);

  // Update referral count for the referrer
  const referrerNode = nodes.get(from);
  if (referrerNode !== null && referrerNode !== undefined) {
    nodes.set(from, {
      ...referrerNode,
      referralCount: referrerNode.referralCount + 1,
    });
  }

  return {
    ...graph,
    nodes,
    edges,
    totalReferrals: graph.totalReferrals + 1,
    lastUpdated: new Date(),
  };
}

/**
 * Gets all referral chains (paths from organic users to leaf users)
 * @param graph - The referral graph
 * @returns Array of referral chains
 */
export function getReferralChains(graph: ReferralGraph): string[][] {
  const chains: string[][] = [];
  const visited = new Set<string>();

  // Find all organic users
  const organicUserIds: string[] = [];
  for (const [userId, node] of graph.nodes) {
    if (node.referredBy === null || node.referredBy === undefined) {
      organicUserIds.push(userId);
    }
  }

  // DFS from each organic user
  function dfs(userId: string, chain: string[]): void {
    chain.push(userId);
    visited.add(userId);

    // Find all users referred by this user
    const referredUsers: string[] = [];
    for (const edge of graph.edges) {
      if (edge.from === userId && !visited.has(edge.to)) {
        referredUsers.push(edge.to);
      }
    }

    if (referredUsers.length === 0) {
      // Leaf node - save chain
      chains.push([...chain]);
    } else {
      // Continue DFS
      for (const referredUserId of referredUsers) {
        dfs(referredUserId, [...chain]);
      }
    }
  }

  for (const organicUserId of organicUserIds) {
    dfs(organicUserId, []);
  }

  return chains;
}

/**
 * Gets the depth of the referral graph (longest chain length)
 * @param graph - The referral graph
 * @returns Maximum chain depth
 */
export function getGraphDepth(graph: ReferralGraph): number {
  const chains = getReferralChains(graph);
  if (chains.length === 0) {
    return 0;
  }
  return Math.max(...chains.map((chain) => chain.length));
}
