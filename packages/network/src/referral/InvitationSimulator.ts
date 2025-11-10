/**
 * Simulates invitation sends and accepts
 */

import { NetworkConfig } from '../models/NetworkConfig';
import { ReferralEvent, createReferralEvent, acceptReferral } from '../models/ReferralEvent';

/**
 * Result of invitation simulation
 */
export interface InvitationSimulationResult {
  /** Array of referral events generated */
  events: ReferralEvent[];
  /** Number of invitations sent */
  invitationsSent: number;
  /** Number of invitations accepted */
  invitationsAccepted: number;
  /** Acceptance rate */
  acceptanceRate: number;
}

/**
 * Simulates invitation sends and accepts
 */
export class InvitationSimulator {
  private config: NetworkConfig;
  private userIdCounter: number;

  /**
   * Creates a new InvitationSimulator
   * @param config - Network simulator configuration
   */
  constructor(config: NetworkConfig) {
    this.config = config;
    this.userIdCounter = 1000;
  }

  /**
   * Simulates invitations from a user
   * @param referrerId - ID of the user sending invitations
   * @param invitationCount - Number of invitations to send
   * @param networkSize - Current size of the network (for social proof effect)
   * @returns Simulation result
   */
  simulateInvitations(
    referrerId: string,
    invitationCount: number,
    networkSize: number
  ): InvitationSimulationResult {
    const events: ReferralEvent[] = [];
    let acceptedCount = 0;

    for (let i = 0; i < invitationCount; i++) {
      // Create referral event
      const channel = this.selectChannel();
      const event = createReferralEvent(referrerId, channel, {
        networkSize,
      });

      // Determine if invitation is accepted
      const acceptanceRate = this.calculateAcceptanceRate(networkSize);
      const isAccepted = Math.random() < acceptanceRate;

      if (isAccepted) {
        // Generate new user ID for the referred user
        const newUserId = this.generateUserId();
        const acceptedEvent = acceptReferral(event, newUserId);
        events.push(acceptedEvent);
        acceptedCount++;
      } else {
        events.push(event);
      }
    }

    return {
      events,
      invitationsSent: invitationCount,
      invitationsAccepted: acceptedCount,
      acceptanceRate: invitationCount > 0 ? acceptedCount / invitationCount : 0,
    };
  }

  /**
   * Simulates invitations from multiple users
   * @param referrerIds - Array of user IDs sending invitations
   * @param invitationCounts - Array of invitation counts per user
   * @param networkSize - Current size of the network
   * @returns Simulation result
   */
  simulateBatchInvitations(
    referrerIds: string[],
    invitationCounts: number[],
    networkSize: number
  ): InvitationSimulationResult {
    if (referrerIds.length !== invitationCounts.length) {
      throw new Error('referrerIds and invitationCounts must have the same length');
    }

    const allEvents: ReferralEvent[] = [];
    let totalSent = 0;
    let totalAccepted = 0;

    for (let i = 0; i < referrerIds.length; i++) {
      const referrerId = referrerIds[i];
      const count = invitationCounts[i];

      if (referrerId !== null && referrerId !== undefined && count !== undefined) {
        const result = this.simulateInvitations(referrerId, count, networkSize);
        allEvents.push(...result.events);
        totalSent += result.invitationsSent;
        totalAccepted += result.invitationsAccepted;
      }
    }

    return {
      events: allEvents,
      invitationsSent: totalSent,
      invitationsAccepted: totalAccepted,
      acceptanceRate: totalSent > 0 ? totalAccepted / totalSent : 0,
    };
  }

  /**
   * Calculates acceptance rate based on network size (social proof effect)
   * @param networkSize - Current network size
   * @returns Acceptance rate (0-1)
   */
  private calculateAcceptanceRate(networkSize: number): number {
    let rate = this.config.baseAcceptanceRate;

    // Apply social proof effect if network effects are enabled
    if (this.config.enableNetworkEffects) {
      // Larger networks increase acceptance rate (up to a point)
      const socialProofFactor = Math.log10(Math.max(1, networkSize)) / 5;
      rate = rate * (1 + socialProofFactor * (this.config.socialProofMultiplier - 1));
      rate = Math.min(0.9, rate); // Cap at 90%
    }

    return rate;
  }

  /**
   * Selects a random channel for the invitation
   * @returns Channel type
   */
  private selectChannel(): 'email' | 'social' | 'link' | 'in-app' | 'other' {
    const channels: Array<'email' | 'social' | 'link' | 'in-app' | 'other'> = [
      'email',
      'social',
      'link',
      'in-app',
    ];
    const weights = [0.4, 0.3, 0.2, 0.1]; // Email is most common

    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < channels.length; i++) {
      const weight = weights[i];
      if (weight !== null && weight !== undefined) {
        cumulative += weight;
        if (random < cumulative) {
          const channel = channels[i];
          if (channel !== null && channel !== undefined) {
            return channel;
          }
        }
      }
    }

    return 'email'; // Default fallback
  }

  /**
   * Generates a new user ID
   * @returns User ID
   */
  private generateUserId(): string {
    this.userIdCounter++;
    return `user_${this.userIdCounter}`;
  }

  /**
   * Resets the user ID counter
   * @param startingId - Starting ID number
   */
  resetUserIdCounter(startingId: number = 1000): void {
    this.userIdCounter = startingId;
  }
}
