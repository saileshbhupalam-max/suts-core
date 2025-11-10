/**
 * Tests for ReferralGraph model
 */

import {
  createEmptyGraph,
  addNode,
  addEdge,
  getReferralChains,
  getGraphDepth,
} from '../../src/models/ReferralGraph';

describe('ReferralGraph', () => {
  describe('createEmptyGraph', () => {
    it('should create an empty graph', () => {
      const graph = createEmptyGraph();

      expect(graph.nodes.size).toBe(0);
      expect(graph.edges.length).toBe(0);
      expect(graph.totalUsers).toBe(0);
      expect(graph.totalReferrals).toBe(0);
      expect(graph.organicUsers).toBe(0);
    });
  });

  describe('addNode', () => {
    it('should add an organic user node', () => {
      const graph = createEmptyGraph();
      const updated = addNode(graph, 'user_1', null, new Date());

      expect(updated.nodes.size).toBe(1);
      expect(updated.totalUsers).toBe(1);
      expect(updated.organicUsers).toBe(1);
      expect(updated.nodes.get('user_1')?.referredBy).toBeNull();
    });

    it('should add a referred user node', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());

      expect(graph.nodes.size).toBe(2);
      expect(graph.totalUsers).toBe(2);
      expect(graph.organicUsers).toBe(1);
      expect(graph.nodes.get('user_2')?.referredBy).toBe('user_1');
    });

    it('should store metadata', () => {
      const graph = createEmptyGraph();
      const metadata = { archetype: 'test' };
      const updated = addNode(graph, 'user_1', null, new Date(), metadata);

      expect(updated.nodes.get('user_1')?.metadata['archetype']).toBe('test');
    });
  });

  describe('addEdge', () => {
    it('should add an edge between users', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');

      expect(graph.edges.length).toBe(1);
      expect(graph.totalReferrals).toBe(1);
      expect(graph.edges[0]?.from).toBe('user_1');
      expect(graph.edges[0]?.to).toBe('user_2');
    });

    it('should increment referral count for referrer', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');

      expect(graph.nodes.get('user_1')?.referralCount).toBe(1);
    });

    it('should handle multiple referrals from same user', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addNode(graph, 'user_3', 'user_1', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');
      graph = addEdge(graph, 'user_1', 'user_3', new Date(), 'social');

      expect(graph.edges.length).toBe(2);
      expect(graph.totalReferrals).toBe(2);
      expect(graph.nodes.get('user_1')?.referralCount).toBe(2);
    });
  });

  describe('getReferralChains', () => {
    it('should return empty array for empty graph', () => {
      const graph = createEmptyGraph();
      const chains = getReferralChains(graph);

      expect(chains.length).toBe(0);
    });

    it('should return single chain for organic user with no referrals', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());

      const chains = getReferralChains(graph);

      expect(chains.length).toBe(1);
      expect(chains[0]).toEqual(['user_1']);
    });

    it('should return chain for organic user with one referral', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');

      const chains = getReferralChains(graph);

      expect(chains.length).toBe(1);
      expect(chains[0]).toEqual(['user_1', 'user_2']);
    });

    it('should return multiple chains for branching referrals', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addNode(graph, 'user_3', 'user_1', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');
      graph = addEdge(graph, 'user_1', 'user_3', new Date(), 'social');

      const chains = getReferralChains(graph);

      expect(chains.length).toBe(2);
      expect(chains).toContainEqual(['user_1', 'user_2']);
      expect(chains).toContainEqual(['user_1', 'user_3']);
    });
  });

  describe('getGraphDepth', () => {
    it('should return 0 for empty graph', () => {
      const graph = createEmptyGraph();
      const depth = getGraphDepth(graph);

      expect(depth).toBe(0);
    });

    it('should return 1 for single organic user', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());

      const depth = getGraphDepth(graph);

      expect(depth).toBe(1);
    });

    it('should return correct depth for chain', () => {
      let graph = createEmptyGraph();
      graph = addNode(graph, 'user_1', null, new Date());
      graph = addNode(graph, 'user_2', 'user_1', new Date());
      graph = addNode(graph, 'user_3', 'user_2', new Date());
      graph = addEdge(graph, 'user_1', 'user_2', new Date(), 'email');
      graph = addEdge(graph, 'user_2', 'user_3', new Date(), 'email');

      const depth = getGraphDepth(graph);

      expect(depth).toBe(3);
    });
  });
});
