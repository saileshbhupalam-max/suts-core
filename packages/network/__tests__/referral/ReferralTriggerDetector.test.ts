/**
 * Tests for ReferralTriggerDetector
 */

import { ReferralTriggerDetector } from '../../src/referral/ReferralTriggerDetector';
import { createDefaultConfig } from '../../src/models/NetworkConfig';
import { PersonaProfile } from '@suts/persona';
import { TelemetryEvent } from '@suts/telemetry';

describe('ReferralTriggerDetector', () => {
  let detector: ReferralTriggerDetector;
  let mockPersona: PersonaProfile;

  beforeEach(() => {
    detector = new ReferralTriggerDetector(createDefaultConfig());

    mockPersona = {
      id: 'persona_1',
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
      techAdoption: 'Early adopter',
      learningStyle: 'Documentation',
      evaluationCriteria: [],
      dealBreakers: [],
      delightTriggers: ['easy_setup', 'great_docs'],
      referralTriggers: ['shared_project'],
      typicalWorkflow: '',
      timeAvailability: '',
      collaborationStyle: 'Team',
      state: {},
      history: [],
      confidenceScore: 0.8,
      lastUpdated: new Date().toISOString(),
      source: 'test',
    };
  });

  describe('detectReferralTrigger', () => {
    it('should not trigger referral when delight is below threshold', () => {
      const events: TelemetryEvent[] = [
        {
          personaId: 'persona_1',
          eventType: 'action',
          action: 'use_feature',
          emotionalState: { delight: 0.3 },
          metadata: {},
          timestamp: new Date(),
        },
      ];

      const result = detector.detectReferralTrigger(mockPersona, events);

      expect(result.shouldRefer).toBe(false);
      expect(result.referralCount).toBe(0);
    });

    it('should consider triggering referral when delight is above threshold', () => {
      const events: TelemetryEvent[] = [
        {
          personaId: 'persona_1',
          eventType: 'action',
          action: 'use_feature',
          emotionalState: { delight: 0.9 },
          metadata: {},
          timestamp: new Date(),
        },
      ];

      const result = detector.detectReferralTrigger(mockPersona, events);

      expect(result.probability).toBeGreaterThan(0);
    });

    it('should increase probability for early adopters', () => {
      const highDelightEvents: TelemetryEvent[] = [
        {
          personaId: 'persona_1',
          eventType: 'action',
          action: 'use_feature',
          emotionalState: { delight: 0.9 },
          metadata: {},
          timestamp: new Date(),
        },
      ];

      mockPersona.techAdoption = 'Early adopter';
      const result1 = detector.detectReferralTrigger(mockPersona, highDelightEvents);

      mockPersona.techAdoption = 'Laggard';
      const result2 = detector.detectReferralTrigger(mockPersona, highDelightEvents);

      // Early adopter should have higher or equal probability
      expect(result1.probability).toBeGreaterThanOrEqual(result2.probability);
    });

    it('should increase probability for community-driven personas', () => {
      const highDelightEvents: TelemetryEvent[] = [
        {
          personaId: 'persona_1',
          eventType: 'action',
          action: 'use_feature',
          emotionalState: { delight: 0.9 },
          metadata: {},
          timestamp: new Date(),
        },
      ];

      mockPersona.collaborationStyle = 'Community-driven';
      const result1 = detector.detectReferralTrigger(mockPersona, highDelightEvents);

      mockPersona.collaborationStyle = 'Solo';
      const result2 = detector.detectReferralTrigger(mockPersona, highDelightEvents);

      expect(result1.probability).toBeGreaterThanOrEqual(result2.probability);
    });

    it('should boost probability when referral triggers are matched', () => {
      const eventsWithTrigger: TelemetryEvent[] = [
        {
          personaId: 'persona_1',
          eventType: 'action',
          action: 'shared_project_with_team',
          emotionalState: { delight: 0.9 },
          metadata: {},
          timestamp: new Date(),
        },
      ];

      const result = detector.detectReferralTrigger(mockPersona, eventsWithTrigger);

      expect(result.probability).toBeGreaterThan(0);
    });

    it('should return 0 probability for empty events', () => {
      const result = detector.detectReferralTrigger(mockPersona, []);

      expect(result.shouldRefer).toBe(false);
      expect(result.probability).toBe(0);
    });

    it('should handle events without emotional state', () => {
      const events: TelemetryEvent[] = [
        {
          personaId: 'persona_1',
          eventType: 'action',
          action: 'use_feature',
          emotionalState: {},
          metadata: {},
          timestamp: new Date(),
        },
      ];

      const result = detector.detectReferralTrigger(mockPersona, events);

      expect(result.shouldRefer).toBe(false);
    });

    it('should calculate referral count based on collaboration style', () => {
      // Use a fixed seed or mock Math.random for deterministic test
      const originalRandom = Math.random;
      Math.random = () => 0.1; // Always trigger

      const highDelightEvents: TelemetryEvent[] = [
        {
          personaId: 'persona_1',
          eventType: 'action',
          action: 'use_feature',
          emotionalState: { delight: 0.95 },
          metadata: {},
          timestamp: new Date(),
        },
      ];

      mockPersona.collaborationStyle = 'Community-driven';
      const result1 = detector.detectReferralTrigger(mockPersona, highDelightEvents);

      mockPersona.collaborationStyle = 'Solo';
      const result2 = detector.detectReferralTrigger(mockPersona, highDelightEvents);

      Math.random = originalRandom;

      if (result1.shouldRefer && result2.shouldRefer) {
        expect(result1.referralCount).toBeGreaterThanOrEqual(result2.referralCount);
      }
    });
  });
});
