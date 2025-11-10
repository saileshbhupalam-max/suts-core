/**
 * Detects when a persona will make a referral based on their emotional state and profile
 */

import { PersonaProfile } from '@suts/persona';
import { TelemetryEvent } from '@suts/telemetry';
import { NetworkConfig } from '../models/NetworkConfig';

/**
 * Result of referral trigger detection
 */
export interface ReferralTriggerResult {
  /** Whether a referral should be triggered */
  shouldRefer: boolean;
  /** Probability that the referral will occur (0-1) */
  probability: number;
  /** Number of referrals to send */
  referralCount: number;
  /** Reason for the decision */
  reason: string;
}

/**
 * Detects when a persona will make a referral
 */
export class ReferralTriggerDetector {
  private config: NetworkConfig;

  /**
   * Creates a new ReferralTriggerDetector
   * @param config - Network simulator configuration
   */
  constructor(config: NetworkConfig) {
    this.config = config;
  }

  /**
   * Detects if a persona should make a referral based on their events
   * @param persona - The persona profile
   * @param events - Telemetry events for this persona
   * @returns Referral trigger result
   */
  detectReferralTrigger(
    persona: PersonaProfile,
    events: TelemetryEvent[]
  ): ReferralTriggerResult {
    // Calculate average delight from recent events
    const avgDelight = this.calculateAverageDelight(events);

    // Check if delight threshold is met
    if (avgDelight < this.config.delightThreshold) {
      return {
        shouldRefer: false,
        probability: 0,
        referralCount: 0,
        reason: `Delight level ${avgDelight.toFixed(2)} below threshold ${this.config.delightThreshold}`,
      };
    }

    // Calculate referral probability based on persona traits
    let probability = this.config.baseReferralProbability;

    // Adjust based on tech adoption style
    probability = this.adjustForTechAdoption(probability, persona.techAdoption);

    // Adjust based on collaboration style
    probability = this.adjustForCollaborationStyle(
      probability,
      persona.collaborationStyle
    );

    // Adjust based on delight level (higher delight = higher probability)
    const delightBonus = (avgDelight - this.config.delightThreshold) * 0.5;
    probability = Math.min(1, probability + delightBonus);

    // Check against referral triggers
    const hasMatchingTrigger = this.checkReferralTriggers(persona, events);
    if (hasMatchingTrigger) {
      probability = Math.min(1, probability * 1.5);
    }

    // Determine if referral should occur (using probability)
    const shouldRefer = Math.random() < probability;

    // Determine number of referrals
    let referralCount = 0;
    if (shouldRefer) {
      referralCount = this.calculateReferralCount(persona, avgDelight);
    }

    return {
      shouldRefer,
      probability,
      referralCount,
      reason: shouldRefer
        ? `High delight (${avgDelight.toFixed(2)}) triggered referral`
        : `Probability ${probability.toFixed(2)} did not trigger referral`,
    };
  }

  /**
   * Calculates average delight from telemetry events
   * @param events - Telemetry events
   * @returns Average delight (0-1)
   */
  private calculateAverageDelight(events: TelemetryEvent[]): number {
    if (events.length === 0) {
      return 0;
    }

    const delightValues: number[] = [];
    for (const event of events) {
      if (
        event.emotionalState !== null &&
        event.emotionalState !== undefined &&
        'delight' in event.emotionalState
      ) {
        const delight = event.emotionalState['delight'];
        if (typeof delight === 'number') {
          delightValues.push(delight);
        }
      }
    }

    if (delightValues.length === 0) {
      return 0;
    }

    const sum = delightValues.reduce((acc, val) => acc + val, 0);
    return sum / delightValues.length;
  }

  /**
   * Adjusts probability based on tech adoption style
   * @param baseProbability - Base probability
   * @param techAdoption - Tech adoption style
   * @returns Adjusted probability
   */
  private adjustForTechAdoption(
    baseProbability: number,
    techAdoption: string
  ): number {
    const multipliers: Record<string, number> = {
      'Early adopter': 1.5,
      'Early majority': 1.2,
      'Late majority': 0.8,
      Laggard: 0.5,
    };

    const multiplier = multipliers[techAdoption];
    if (multiplier !== null && multiplier !== undefined) {
      return baseProbability * multiplier;
    }
    return baseProbability;
  }

  /**
   * Adjusts probability based on collaboration style
   * @param baseProbability - Base probability
   * @param collaborationStyle - Collaboration style
   * @returns Adjusted probability
   */
  private adjustForCollaborationStyle(
    baseProbability: number,
    collaborationStyle: string
  ): number {
    const multipliers: Record<string, number> = {
      'Community-driven': 1.5,
      Team: 1.2,
      Solo: 0.8,
    };

    const multiplier = multipliers[collaborationStyle];
    if (multiplier !== null && multiplier !== undefined) {
      return baseProbability * multiplier;
    }
    return baseProbability;
  }

  /**
   * Checks if any referral triggers are present in events
   * @param persona - Persona profile
   * @param events - Telemetry events
   * @returns True if a referral trigger is found
   */
  private checkReferralTriggers(
    persona: PersonaProfile,
    events: TelemetryEvent[]
  ): boolean {
    if (
      persona.referralTriggers === null ||
      persona.referralTriggers === undefined ||
      persona.referralTriggers.length === 0
    ) {
      return false;
    }

    for (const event of events) {
      const action = event.action;
      if (action === null || action === undefined) {
        continue;
      }

      for (const trigger of persona.referralTriggers) {
        if (action.toLowerCase().includes(trigger.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculates the number of referrals to send
   * @param persona - Persona profile
   * @param delight - Delight level
   * @returns Number of referrals
   */
  private calculateReferralCount(
    persona: PersonaProfile,
    delight: number
  ): number {
    // Base count depends on collaboration style
    let baseCount = 1;
    if (persona.collaborationStyle === 'Community-driven') {
      baseCount = 3;
    } else if (persona.collaborationStyle === 'Team') {
      baseCount = 2;
    }

    // Adjust based on delight (higher delight = more referrals)
    const delightMultiplier = 1 + (delight - this.config.delightThreshold) * 2;
    const count = Math.floor(baseCount * delightMultiplier);

    // Cap at max referrals per user
    return Math.min(count, this.config.maxReferralsPerUser);
  }
}
