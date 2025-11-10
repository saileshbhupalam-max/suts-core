/**
 * Tests for telemetry modules
 */

import { ActionType } from '@suts/core';
import type { UserAction, ProductState } from '@suts/core';
import {
  mapActionToTelemetryEvent,
  mapActionToPostHog,
  mapOnboardingEvent,
  mapEngagementEvent,
  mapFrictionEvent,
  mapDelightEvent,
  mapReferralEvent,
  mapChurnEvent,
  batchMapEvents,
} from '../telemetry/EventMapper';
import {
  calculateOnboardingCompletionRate,
  calculateTimeToFirstValue,
  calculateFeatureAdoptionRate,
  calculateAverageSessionDuration,
  calculateFrictionScore,
  calculateDelightScore,
  calculateChurnRate,
  calculateReferralRate,
  calculateNPS,
  calculateAllMetrics,
  calculatePersonaMetrics,
  calculateAggregatedMetrics,
} from '../telemetry/MetricCalculator';
import { earlyAdopter, skepticalDev } from '../testdata/PersonaTemplates';
import type { PostHogEvent } from '../telemetry/EventMapper';

describe('EventMapper', () => {
  const testAction: UserAction = {
    type: ActionType.USE_FEATURE,
    feature: 'contextPreview',
    description: 'View context',
    expectedOutcome: 'Context visible',
  };

  it('should map action to telemetry event', () => {
    const emotionalState = { frustration: 0.2, confidence: 0.8, delight: 0.7, confusion: 0.1 };
    const event = mapActionToTelemetryEvent(testAction, earlyAdopter, emotionalState);

    expect(event.personaId).toBe(earlyAdopter.id);
    expect(event.eventType).toBe('action');
    expect(event.action).toContain('contextPreview');
    expect(event.emotionalState).toEqual(emotionalState);
  });

  it('should map action to PostHog event', () => {
    const event = mapActionToPostHog(testAction, earlyAdopter);

    expect(event.event).toContain('vibeatlas');
    expect(event.distinctId).toBe(earlyAdopter.id);
    expect(event.properties.feature).toBe('contextPreview');
    expect(event.properties.experienceLevel).toBe(earlyAdopter.experienceLevel);
  });

  it('should map onboarding event', () => {
    const event = mapOnboardingEvent(1, true, 60, earlyAdopter);

    expect(event.event).toBe('vibeatlas_onboarding_step');
    expect(event.properties.step).toBe(1);
    expect(event.properties.completed).toBe(true);
    expect(event.properties.duration).toBe(60);
  });

  it('should map engagement event', () => {
    const event = mapEngagementEvent('dashboard', 300, 'success', earlyAdopter);

    expect(event.event).toBe('vibeatlas_feature_engagement');
    expect(event.properties.feature).toBe('dashboard');
    expect(event.properties.duration).toBe(300);
    expect(event.properties.outcome).toBe('success');
  });

  it('should map friction event', () => {
    const event = mapFrictionEvent('tryMode', 'Token limit unclear', 'medium', skepticalDev);

    expect(event.event).toBe('vibeatlas_friction_encountered');
    expect(event.properties.feature).toBe('tryMode');
    expect(event.properties.severity).toBe('medium');
  });

  it('should map delight event', () => {
    const event = mapDelightEvent('contextPreview', 'First use', 'major', earlyAdopter);

    expect(event.event).toBe('vibeatlas_delight_moment');
    expect(event.properties.feature).toBe('contextPreview');
    expect(event.properties.impact).toBe('major');
  });

  it('should map referral event', () => {
    const event = mapReferralEvent('Great features', earlyAdopter);

    expect(event.event).toBe('vibeatlas_referral');
    expect(event.properties.reason).toBe('Great features');
  });

  it('should map churn event', () => {
    const event = mapChurnEvent('Too expensive', 'tryMode', skepticalDev);

    expect(event.event).toBe('vibeatlas_churn');
    expect(event.properties.reason).toBe('Too expensive');
    expect(event.properties.feature).toBe('tryMode');
  });

  it('should batch map events', () => {
    const actions: UserAction[] = [
      testAction,
      { type: ActionType.CONFIGURE, feature: 'dashboard', description: 'Setup', expectedOutcome: 'Ready' },
    ];
    const emotionalStates = [
      { frustration: 0.1, confidence: 0.9, delight: 0.8, confusion: 0.0 },
      { frustration: 0.2, confidence: 0.7, delight: 0.6, confusion: 0.1 },
    ];

    const events = batchMapEvents(actions, earlyAdopter, emotionalStates);

    expect(events.length).toBe(2);
    expect(events[0]?.personaId).toBe(earlyAdopter.id);
  });
});

describe('MetricCalculator', () => {
  const createPostHogEvents = (): PostHogEvent[] => {
    const now = new Date();
    return [
      {
        event: 'vibeatlas_onboarding_step',
        distinctId: 'user1',
        properties: { step: 1, completed: true },
        timestamp: now,
      },
      {
        event: 'vibeatlas_onboarding_step',
        distinctId: 'user1',
        properties: { step: 2, completed: true },
        timestamp: now,
      },
      {
        event: 'vibeatlas_use_feature_contextPreview',
        distinctId: 'user1',
        properties: { feature: 'contextPreview' },
        timestamp: new Date(now.getTime() + 300000),
      },
      {
        event: 'vibeatlas_feature_engagement',
        distinctId: 'user1',
        properties: { duration: 600 },
        timestamp: now,
      },
      {
        event: 'vibeatlas_friction_encountered',
        distinctId: 'user1',
        properties: { severity: 'medium' },
        timestamp: now,
      },
      {
        event: 'vibeatlas_delight_moment',
        distinctId: 'user1',
        properties: { impact: 'major' },
        timestamp: now,
      },
      {
        event: 'vibeatlas_referral',
        distinctId: 'user1',
        properties: {},
        timestamp: now,
      },
    ];
  };

  it('should calculate onboarding completion rate', () => {
    const events = createPostHogEvents();
    const result = calculateOnboardingCompletionRate(events);

    expect(result.name).toBe('onboardingCompletionRate');
    expect(result.value).toBeGreaterThan(0);
    expect(result.unit).toBe('percentage');
  });

  it('should calculate time to first value', () => {
    const events = createPostHogEvents();
    const result = calculateTimeToFirstValue(events);

    expect(result.name).toBe('timeToFirstValue');
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.unit).toBe('seconds');
  });

  it('should calculate feature adoption rate', () => {
    const events = createPostHogEvents();
    const result = calculateFeatureAdoptionRate(events, 'contextPreview');

    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(1);
  });

  it('should calculate average session duration', () => {
    const events = createPostHogEvents();
    const result = calculateAverageSessionDuration(events);

    expect(result.name).toBe('avgSessionDuration');
    expect(result.value).toBeGreaterThanOrEqual(0);
  });

  it('should calculate friction score', () => {
    const events = createPostHogEvents();
    const result = calculateFrictionScore(events);

    expect(result.name).toBe('frictionScore');
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(1);
  });

  it('should calculate delight score', () => {
    const events = createPostHogEvents();
    const result = calculateDelightScore(events);

    expect(result.name).toBe('delightScore');
    expect(result.value).toBeGreaterThanOrEqual(0);
  });

  it('should calculate churn rate', () => {
    const events = createPostHogEvents();
    const result = calculateChurnRate(events);

    expect(result.name).toBe('churnRate');
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(1);
  });

  it('should calculate referral rate', () => {
    const events = createPostHogEvents();
    const result = calculateReferralRate(events);

    expect(result.name).toBe('referralRate');
    expect(result.value).toBeGreaterThanOrEqual(0);
  });

  it('should calculate NPS', () => {
    const events = createPostHogEvents();
    const result = calculateNPS(events);

    expect(result.name).toBe('nps');
    expect(result.value).toBeGreaterThanOrEqual(-100);
    expect(result.value).toBeLessThanOrEqual(100);
  });

  it('should calculate all metrics', () => {
    const events = createPostHogEvents();
    const metrics = calculateAllMetrics(events);

    expect(metrics.onboardingCompletionRate).toBeDefined();
    expect(metrics.timeToFirstValue).toBeDefined();
    expect(metrics.frictionScore).toBeDefined();
    expect(metrics.delightScore).toBeDefined();
    expect(metrics.churnRate).toBeDefined();
    expect(metrics.nps).toBeDefined();
  });

  it('should calculate persona metrics', () => {
    const events = createPostHogEvents();
    const metrics = calculatePersonaMetrics(events, earlyAdopter);

    expect(metrics).toBeDefined();
    expect(Object.keys(metrics).length).toBeGreaterThan(0);
  });

  it('should calculate aggregated metrics', () => {
    const events = createPostHogEvents();
    const state: ProductState = {
      features: {},
      uiElements: {},
      userData: {}, config: {}, environment: "development" as const, metadata: {},
      version: '1.0.0',
    };

    const metrics = calculateAggregatedMetrics(events, [earlyAdopter], state);

    expect(metrics.onboardingCompletionRate).toBeDefined();
    expect(metrics.delightScore).toBeDefined();
    expect(metrics.churnRate).toBeDefined();
  });

  it('should handle empty events', () => {
    const emptyEvents: PostHogEvent[] = [];
    const result = calculateOnboardingCompletionRate(emptyEvents);

    expect(result.value).toBe(0);
  });
});
