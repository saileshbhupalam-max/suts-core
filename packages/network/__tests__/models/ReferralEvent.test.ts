/**
 * Tests for ReferralEvent model
 */

import {
  ReferralEventSchema,
  createReferralEvent,
  acceptReferral,
} from '../../src/models/ReferralEvent';

describe('ReferralEvent', () => {
  describe('ReferralEventSchema', () => {
    it('should validate a valid referral event', () => {
      const event = {
        id: 'ref_123',
        referrerId: 'user_1',
        referredUserId: 'user_2',
        timestamp: new Date(),
        accepted: true,
        acceptedAt: new Date(),
        channel: 'email' as const,
        metadata: { source: 'test' },
      };

      expect(() => ReferralEventSchema.parse(event)).not.toThrow();
    });

    it('should accept null referredUserId for pending referrals', () => {
      const event = {
        id: 'ref_123',
        referrerId: 'user_1',
        referredUserId: null,
        timestamp: new Date(),
        accepted: false,
        acceptedAt: null,
        channel: 'email' as const,
        metadata: {},
      };

      expect(() => ReferralEventSchema.parse(event)).not.toThrow();
    });

    it('should reject invalid channel', () => {
      const event = {
        id: 'ref_123',
        referrerId: 'user_1',
        referredUserId: null,
        timestamp: new Date(),
        accepted: false,
        acceptedAt: null,
        channel: 'invalid',
        metadata: {},
      };

      expect(() => ReferralEventSchema.parse(event)).toThrow();
    });
  });

  describe('createReferralEvent', () => {
    it('should create a new referral event', () => {
      const event = createReferralEvent('user_1', 'email', { source: 'test' });

      expect(event.referrerId).toBe('user_1');
      expect(event.channel).toBe('email');
      expect(event.referredUserId).toBeNull();
      expect(event.accepted).toBe(false);
      expect(event.acceptedAt).toBeNull();
      expect(event.metadata['source']).toBe('test');
      expect(event.id).toMatch(/^ref_/);
    });

    it('should create unique IDs for multiple events', () => {
      const event1 = createReferralEvent('user_1', 'email');
      const event2 = createReferralEvent('user_1', 'email');

      expect(event1.id).not.toBe(event2.id);
    });

    it('should support all channel types', () => {
      const channels: Array<'email' | 'social' | 'link' | 'in-app' | 'other'> = [
        'email',
        'social',
        'link',
        'in-app',
        'other',
      ];

      for (const channel of channels) {
        const event = createReferralEvent('user_1', channel);
        expect(event.channel).toBe(channel);
      }
    });
  });

  describe('acceptReferral', () => {
    it('should mark a referral as accepted', () => {
      const event = createReferralEvent('user_1', 'email');
      const acceptedEvent = acceptReferral(event, 'user_2');

      expect(acceptedEvent.referredUserId).toBe('user_2');
      expect(acceptedEvent.accepted).toBe(true);
      expect(acceptedEvent.acceptedAt).toBeInstanceOf(Date);
    });

    it('should preserve original event properties', () => {
      const event = createReferralEvent('user_1', 'social', { test: 'value' });
      const acceptedEvent = acceptReferral(event, 'user_2');

      expect(acceptedEvent.referrerId).toBe('user_1');
      expect(acceptedEvent.channel).toBe('social');
      expect(acceptedEvent.metadata['test']).toBe('value');
      expect(acceptedEvent.id).toBe(event.id);
    });
  });
});
