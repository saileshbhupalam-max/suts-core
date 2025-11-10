/**
 * Referral event model representing a single user referral
 */

import { z } from 'zod';

/**
 * Schema for a referral event
 */
export const ReferralEventSchema = z.object({
  /** Unique identifier for this referral event */
  id: z.string(),
  /** ID of the user who made the referral */
  referrerId: z.string(),
  /** ID of the user who was referred (may be null if not yet accepted) */
  referredUserId: z.string().nullable(),
  /** Timestamp when the referral was sent */
  timestamp: z.date(),
  /** Whether the referral was accepted */
  accepted: z.boolean(),
  /** Timestamp when the referral was accepted (if applicable) */
  acceptedAt: z.date().nullable(),
  /** Channel through which the referral was sent */
  channel: z.enum(['email', 'social', 'link', 'in-app', 'other']),
  /** Additional metadata about the referral */
  metadata: z.record(z.unknown()),
});

/**
 * Type representing a referral event
 */
export type ReferralEvent = z.infer<typeof ReferralEventSchema>;

/**
 * Creates a new referral event
 * @param referrerId - ID of the user making the referral
 * @param channel - Channel through which the referral is sent
 * @param metadata - Additional metadata
 * @returns A new ReferralEvent
 */
export function createReferralEvent(
  referrerId: string,
  channel: 'email' | 'social' | 'link' | 'in-app' | 'other',
  metadata: Record<string, unknown> = {}
): ReferralEvent {
  return {
    id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    referrerId,
    referredUserId: null,
    timestamp: new Date(),
    accepted: false,
    acceptedAt: null,
    channel,
    metadata,
  };
}

/**
 * Marks a referral event as accepted
 * @param event - The referral event to update
 * @param referredUserId - ID of the user who accepted the referral
 * @returns Updated referral event
 */
export function acceptReferral(
  event: ReferralEvent,
  referredUserId: string
): ReferralEvent {
  return {
    ...event,
    referredUserId,
    accepted: true,
    acceptedAt: new Date(),
  };
}
