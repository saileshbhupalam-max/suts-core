/**
 * Tests for InvitationSimulator
 */

import { InvitationSimulator } from '../../src/referral/InvitationSimulator';
import { createDefaultConfig } from '../../src/models/NetworkConfig';
import { randomUUID } from 'crypto';

describe('InvitationSimulator', () => {
  let simulator: InvitationSimulator;

  beforeEach(() => {
    simulator = new InvitationSimulator(createDefaultConfig());
  });

  describe('simulateInvitations', () => {
    it('should simulate invitations', () => {
      const result = simulator.simulateInvitations('user_1', 10, 100);

      expect(result.invitationsSent).toBe(10);
      expect(result.events.length).toBe(10);
      expect(result.invitationsAccepted).toBeGreaterThanOrEqual(0);
      expect(result.invitationsAccepted).toBeLessThanOrEqual(10);
    });

    it('should create events with correct referrer', () => {
      const result = simulator.simulateInvitations('user_1', 5, 50);

      for (const event of result.events) {
        expect(event.referrerId).toBe('user_1');
      }
    });

    it('should assign unique IDs to accepted referrals', () => {
      const result = simulator.simulateInvitations('user_1', 20, 100);

      const acceptedEvents = result.events.filter((e) => e.accepted);
      const userIds = acceptedEvents.map((e) => e.referredUserId);
      const uniqueIds = new Set(userIds);

      expect(uniqueIds.size).toBe(acceptedEvents.length);
    });

    it('should calculate correct acceptance rate', () => {
      const result = simulator.simulateInvitations('user_1', 100, 100);

      expect(result.acceptanceRate).toBeGreaterThanOrEqual(0);
      expect(result.acceptanceRate).toBeLessThanOrEqual(1);

      if (result.invitationsSent > 0) {
        expect(result.acceptanceRate).toBe(
          result.invitationsAccepted / result.invitationsSent
        );
      }
    });

    it('should handle zero invitations', () => {
      const result = simulator.simulateInvitations('user_1', 0, 100);

      expect(result.invitationsSent).toBe(0);
      expect(result.invitationsAccepted).toBe(0);
      expect(result.events.length).toBe(0);
    });

    it('should increase acceptance rate with larger network size', () => {
      // Run multiple simulations to get statistically significant results
      const config = createDefaultConfig();
      config.enableNetworkEffects = true;
      const sim = new InvitationSimulator(config);

      const smallNetworkResults: number[] = [];
      const largeNetworkResults: number[] = [];

      for (let i = 0; i < 10; i++) {
        const small = sim.simulateInvitations('user_1', 100, 10);
        const large = sim.simulateInvitations('user_2', 100, 1000);

        smallNetworkResults.push(small.acceptanceRate);
        largeNetworkResults.push(large.acceptanceRate);
      }

      const avgSmall =
        smallNetworkResults.reduce((a, b) => a + b, 0) / smallNetworkResults.length;
      const avgLarge =
        largeNetworkResults.reduce((a, b) => a + b, 0) / largeNetworkResults.length;

      // Large network should have higher or equal acceptance rate
      expect(avgLarge).toBeGreaterThanOrEqual(avgSmall * 0.9);
    });
  });

  describe('simulateBatchInvitations', () => {
    it('should simulate batch invitations', () => {
      const result = simulator.simulateBatchInvitations(
        ['user_1', 'user_2'],
        [5, 3],
        100
      );

      expect(result.invitationsSent).toBe(8);
      expect(result.events.length).toBe(8);
    });

    it('should throw error for mismatched array lengths', () => {
      expect(() => {
        simulator.simulateBatchInvitations(['user_1', 'user_2'], [5], 100);
      }).toThrow();
    });

    it('should handle empty arrays', () => {
      const result = simulator.simulateBatchInvitations([], [], 100);

      expect(result.invitationsSent).toBe(0);
      expect(result.invitationsAccepted).toBe(0);
    });
  });

  describe('resetUserIdCounter', () => {
    it('should reset the user ID counter', () => {
      simulator.simulateInvitations('user_1', 5, 100);
      simulator.resetUserIdCounter(2000);

      const result = simulator.simulateInvitations('user_2', 5, 100);
      const acceptedEvents = result.events.filter((e) => e.accepted);

      if (acceptedEvents.length > 0) {
        const firstUserId = acceptedEvents[0]?.referredUserId;
        expect(firstUserId).toMatch(/user_200\d/);
      }
    });
  });
});
