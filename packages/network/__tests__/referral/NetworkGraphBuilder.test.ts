/**
 * Tests for NetworkGraphBuilder
 */

import { NetworkGraphBuilder } from '../../src/referral/NetworkGraphBuilder';
import { PersonaProfile } from '@suts/persona';
import { createReferralEvent, acceptReferral } from '../../src/models/ReferralEvent';

describe('NetworkGraphBuilder', () => {
  let builder: NetworkGraphBuilder;

  beforeEach(() => {
    builder = new NetworkGraphBuilder();
  });

  const createMockPersona = (id: string): PersonaProfile => ({
    id,
    archetype: 'test',
    role: 'Developer',
    experienceLevel: 'Intermediate',
    companySize: 'SMB',
    techStack: [],
    painPoints: [],
    goals: [],
    fears: [],
    values: [],
    riskTolerance: 0.5,
    patienceLevel: 0.5,
    techAdoption: 'Early majority',
    learningStyle: 'Documentation',
    evaluationCriteria: [],
    dealBreakers: [],
    delightTriggers: [],
    referralTriggers: [],
    typicalWorkflow: '',
    timeAvailability: '',
    collaborationStyle: 'Team',
    state: {},
    history: [],
    confidenceScore: 0.8,
    lastUpdated: new Date().toISOString(),
    source: 'test',
  });

  describe('getGraph', () => {
    it('should return empty graph initially', () => {
      const graph = builder.getGraph();

      expect(graph.totalUsers).toBe(0);
      expect(graph.totalReferrals).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset the graph', () => {
      builder.addPersonas([createMockPersona('user_1')]);
      expect(builder.getGraph().totalUsers).toBe(1);

      builder.reset();
      expect(builder.getGraph().totalUsers).toBe(0);
    });
  });

  describe('addPersonas', () => {
    it('should add personas as organic users', () => {
      const personas = [
        createMockPersona('user_1'),
        createMockPersona('user_2'),
      ];

      builder.addPersonas(personas);
      const graph = builder.getGraph();

      expect(graph.totalUsers).toBe(2);
      expect(graph.organicUsers).toBe(2);
      expect(graph.nodes.has('user_1')).toBe(true);
      expect(graph.nodes.has('user_2')).toBe(true);
    });
  });

  describe('buildFromEvents', () => {
    it('should build graph from accepted referral events', () => {
      const event1 = createReferralEvent('user_1', 'email');
      const acceptedEvent1 = acceptReferral(event1, 'user_2');

      builder.buildFromEvents([acceptedEvent1]);
      const graph = builder.getGraph();

      expect(graph.totalUsers).toBe(1);
      expect(graph.totalReferrals).toBe(1);
      expect(graph.nodes.has('user_2')).toBe(true);
    });

    it('should ignore non-accepted referral events', () => {
      const event = createReferralEvent('user_1', 'email');

      builder.buildFromEvents([event]);
      const graph = builder.getGraph();

      expect(graph.totalReferrals).toBe(0);
    });

    it('should handle multiple referral events', () => {
      const event1 = createReferralEvent('user_1', 'email');
      const event2 = createReferralEvent('user_1', 'social');
      const acceptedEvent1 = acceptReferral(event1, 'user_2');
      const acceptedEvent2 = acceptReferral(event2, 'user_3');

      builder.buildFromEvents([acceptedEvent1, acceptedEvent2]);
      const graph = builder.getGraph();

      expect(graph.totalUsers).toBe(2);
      expect(graph.totalReferrals).toBe(2);
    });
  });

  describe('addReferral', () => {
    it('should add a referral to the graph', () => {
      builder.addReferral('user_1', 'user_2', new Date(), 'email');
      const graph = builder.getGraph();

      expect(graph.totalReferrals).toBe(1);
      expect(graph.nodes.has('user_2')).toBe(true);
    });
  });

  describe('markAsChurned', () => {
    it('should mark a user as churned', () => {
      builder.addPersonas([createMockPersona('user_1')]);
      builder.markAsChurned('user_1');

      const graph = builder.getGraph();
      const node = graph.nodes.get('user_1');

      expect(node?.churned).toBe(true);
    });
  });

  describe('getReferredUsers', () => {
    it('should return users referred by a specific user', () => {
      builder.addReferral('user_1', 'user_2', new Date(), 'email');
      builder.addReferral('user_1', 'user_3', new Date(), 'social');

      const referred = builder.getReferredUsers('user_1');

      expect(referred.length).toBe(2);
      expect(referred).toContain('user_2');
      expect(referred).toContain('user_3');
    });

    it('should return empty array for user with no referrals', () => {
      const referred = builder.getReferredUsers('user_1');

      expect(referred.length).toBe(0);
    });
  });

  describe('getReferrer', () => {
    it('should return the referrer of a user', () => {
      builder.addReferral('user_1', 'user_2', new Date(), 'email');

      const referrer = builder.getReferrer('user_2');

      expect(referrer).toBe('user_1');
    });

    it('should return null for organic user', () => {
      builder.addPersonas([createMockPersona('user_1')]);

      const referrer = builder.getReferrer('user_1');

      expect(referrer).toBeNull();
    });
  });

  describe('getReferralChain', () => {
    it('should return the full referral chain', () => {
      builder.addPersonas([createMockPersona('user_1')]);
      builder.addReferral('user_1', 'user_2', new Date(), 'email');
      builder.addReferral('user_2', 'user_3', new Date(), 'email');

      const chain = builder.getReferralChain('user_3');

      expect(chain).toEqual(['user_1', 'user_2', 'user_3']);
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', () => {
      builder.addPersonas([createMockPersona('user_1')]);
      builder.addReferral('user_1', 'user_2', new Date(), 'email');
      builder.addReferral('user_1', 'user_3', new Date(), 'social');
      builder.markAsChurned('user_3');

      const stats = builder.getStatistics();

      expect(stats.totalUsers).toBe(3);
      expect(stats.organicUsers).toBe(1);
      expect(stats.referredUsers).toBe(2);
      expect(stats.totalReferrals).toBe(2);
      expect(stats.activeReferrers).toBe(1);
      expect(stats.churnedUsers).toBe(1);
    });
  });
});
