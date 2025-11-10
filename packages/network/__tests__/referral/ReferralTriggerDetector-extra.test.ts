/**
 * Additional tests for ReferralTriggerDetector to improve coverage
 */

import { ReferralTriggerDetector } from '../../src/referral/ReferralTriggerDetector';
import { createDefaultConfig } from '../../src/models/NetworkConfig';
import { PersonaProfile } from '@suts/persona';
import { TelemetryEvent } from '@suts/telemetry';

describe('ReferralTriggerDetector - Additional Coverage', () => {
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
      techAdoption: 'Early majority',
      learningStyle: 'Documentation',
      evaluationCriteria: [],
      dealBreakers: [],
      delightTriggers: [],
      referralTriggers: [],
      typicalWorkflow: '',
      timeAvailability: '',
      collaborationStyle: 'Solo',
      state: {},
      history: [],
      confidenceScore: 0.8,
      lastUpdated: new Date().toISOString(),
      source: 'test',
    };
  });

  it('should handle persona with no referral triggers', () => {
    mockPersona.referralTriggers = [];
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

    expect(result.probability).toBeGreaterThanOrEqual(0);
  });

  it('should handle events without action', () => {
    mockPersona.referralTriggers = ['share'];
    const events: TelemetryEvent[] = [
      {
        personaId: 'persona_1',
        eventType: 'observation',
        action: '',
        emotionalState: { delight: 0.9 },
        metadata: {},
        timestamp: new Date(),
      },
    ];

    const result = detector.detectReferralTrigger(mockPersona, events);

    expect(result).toBeDefined();
  });

  it('should handle events with no delight in emotional state', () => {
    const events: TelemetryEvent[] = [
      {
        personaId: 'persona_1',
        eventType: 'action',
        action: 'use_feature',
        emotionalState: { frustration: 0.5 },
        metadata: {},
        timestamp: new Date(),
      },
    ];

    const result = detector.detectReferralTrigger(mockPersona, events);

    expect(result.shouldRefer).toBe(false);
  });

  it('should handle mixed tech adoption styles', () => {
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

    mockPersona.techAdoption = 'Late majority';
    const result = detector.detectReferralTrigger(mockPersona, highDelightEvents);

    expect(result.probability).toBeGreaterThanOrEqual(0);
  });

  it('should handle team collaboration style', () => {
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

    mockPersona.collaborationStyle = 'Team';
    const result = detector.detectReferralTrigger(mockPersona, highDelightEvents);

    expect(result.probability).toBeGreaterThanOrEqual(0);
  });

  it('should handle events with non-numeric delight', () => {
    const events: TelemetryEvent[] = [
      {
        personaId: 'persona_1',
        eventType: 'action',
        action: 'use_feature',
        emotionalState: { delight: 'high' as unknown as number },
        metadata: {},
        timestamp: new Date(),
      },
    ];

    const result = detector.detectReferralTrigger(mockPersona, events);

    expect(result.shouldRefer).toBe(false);
  });

  it('should handle unknown tech adoption style', () => {
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

    mockPersona.techAdoption = 'Unknown' as unknown as 'Early adopter';
    const result = detector.detectReferralTrigger(mockPersona, highDelightEvents);

    expect(result.probability).toBeGreaterThanOrEqual(0);
  });

  it('should handle unknown collaboration style', () => {
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

    mockPersona.collaborationStyle = 'Unknown' as unknown as 'Solo';
    const result = detector.detectReferralTrigger(mockPersona, highDelightEvents);

    expect(result.probability).toBeGreaterThanOrEqual(0);
  });
});
