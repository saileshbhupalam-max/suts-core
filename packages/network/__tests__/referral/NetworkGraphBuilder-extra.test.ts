/**
 * Additional tests for NetworkGraphBuilder to improve coverage
 */

import { NetworkGraphBuilder } from '../../src/referral/NetworkGraphBuilder';
import { PersonaProfile } from '@suts/persona';
import { createReferralEvent, acceptReferral } from '../../src/models/ReferralEvent';

describe('NetworkGraphBuilder - Additional Coverage', () => {
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

  describe('buildFromEvents - edge cases', () => {
    it('should handle events with acceptedAt timestamp', () => {
      const event = createReferralEvent('user_1', 'email');
      const acceptedEvent = acceptReferral(event, 'user_2');

      builder.buildFromEvents([acceptedEvent]);
      const graph = builder.getGraph();

      expect(graph.totalReferrals).toBe(1);
      expect(graph.nodes.has('user_2')).toBe(true);
    });

    it('should handle events without acceptedAt timestamp', () => {
      const event = createReferralEvent('user_1', 'email');
      const acceptedEvent = acceptReferral(event, 'user_2');
      // Remove acceptedAt
      const modifiedEvent = { ...acceptedEvent, acceptedAt: null };

      builder.buildFromEvents([modifiedEvent]);
      const graph = builder.getGraph();

      expect(graph.totalReferrals).toBe(1);
    });
  });

  describe('markAsChurned - edge cases', () => {
    it('should handle marking non-existent user as churned', () => {
      builder.markAsChurned('non_existent');
      const graph = builder.getGraph();

      expect(graph.totalUsers).toBe(0);
    });

    it('should handle marking user as churned multiple times', () => {
      builder.addPersonas([createMockPersona('user_1')]);
      builder.markAsChurned('user_1');
      builder.markAsChurned('user_1');

      const graph = builder.getGraph();
      const node = graph.nodes.get('user_1');

      expect(node?.churned).toBe(true);
    });
  });

  describe('getReferrer - edge cases', () => {
    it('should return null for non-existent user', () => {
      const referrer = builder.getReferrer('non_existent');

      expect(referrer).toBeNull();
    });
  });

  describe('getReferralChain - edge cases', () => {
    it('should return single user chain for organic user', () => {
      builder.addPersonas([createMockPersona('user_1')]);

      const chain = builder.getReferralChain('user_1');

      expect(chain).toEqual(['user_1']);
    });

    it('should return empty chain for non-existent user', () => {
      const chain = builder.getReferralChain('non_existent');

      expect(chain).toEqual(['non_existent']);
    });

    it('should handle deep referral chains', () => {
      builder.addPersonas([createMockPersona('user_1')]);
      builder.addReferral('user_1', 'user_2', new Date(), 'email');
      builder.addReferral('user_2', 'user_3', new Date(), 'email');
      builder.addReferral('user_3', 'user_4', new Date(), 'email');

      const chain = builder.getReferralChain('user_4');

      expect(chain.length).toBe(4);
      expect(chain).toEqual(['user_1', 'user_2', 'user_3', 'user_4']);
    });
  });
});
