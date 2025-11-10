/**
 * Map actions to telemetry events
 */

import type { UserAction, PersonaProfile } from '@suts/core';
import type { TelemetryEvent } from '@suts/telemetry';

/**
 * PostHog event structure
 */
export interface PostHogEvent {
  event: string;
  distinctId: string;
  properties: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Map user action to telemetry event
 */
export function mapActionToTelemetryEvent(
  action: UserAction,
  persona: PersonaProfile,
  emotionalState: Record<string, number>
): TelemetryEvent {
  return {
    personaId: persona.id,
    eventType: 'action',
    action: `${action.type}:${action.feature}`,
    emotionalState,
    metadata: {
      actionType: action.type,
      feature: action.feature,
      description: action.description,
      expectedOutcome: action.expectedOutcome,
      ...action.metadata,
    },
    timestamp: new Date(),
  };
}

/**
 * Map user action to PostHog event
 */
export function mapActionToPostHog(action: UserAction, persona: PersonaProfile): PostHogEvent {
  const eventName = `vibeatlas_${action.type}_${action.feature}`;

  return {
    event: eventName,
    distinctId: persona.id,
    properties: {
      feature: action.feature,
      actionType: action.type,
      description: action.description,
      expectedOutcome: action.expectedOutcome,
      personaArchetype: persona.archetype,
      personaRole: persona.role,
      experienceLevel: persona.experienceLevel,
      techAdoption: persona.techAdoption,
      ...action.metadata,
    },
    timestamp: new Date(),
  };
}

/**
 * Map onboarding event
 */
export function mapOnboardingEvent(
  step: number,
  completed: boolean,
  duration: number,
  persona: PersonaProfile
): PostHogEvent {
  return {
    event: 'vibeatlas_onboarding_step',
    distinctId: persona.id,
    properties: {
      step,
      completed,
      duration,
      experienceLevel: persona.experienceLevel,
      learningStyle: persona.learningStyle,
    },
    timestamp: new Date(),
  };
}

/**
 * Map engagement event
 */
export function mapEngagementEvent(
  feature: string,
  duration: number,
  outcome: string,
  persona: PersonaProfile
): PostHogEvent {
  return {
    event: 'vibeatlas_feature_engagement',
    distinctId: persona.id,
    properties: {
      feature,
      duration,
      outcome,
      techAdoption: persona.techAdoption,
      collaborationStyle: persona.collaborationStyle,
    },
    timestamp: new Date(),
  };
}

/**
 * Map friction event
 */
export function mapFrictionEvent(
  feature: string,
  issue: string,
  severity: string,
  persona: PersonaProfile
): PostHogEvent {
  return {
    event: 'vibeatlas_friction_encountered',
    distinctId: persona.id,
    properties: {
      feature,
      issue,
      severity,
      patienceLevel: persona.patienceLevel,
      experienceLevel: persona.experienceLevel,
    },
    timestamp: new Date(),
  };
}

/**
 * Map delight event
 */
export function mapDelightEvent(
  feature: string,
  trigger: string,
  impact: string,
  persona: PersonaProfile
): PostHogEvent {
  return {
    event: 'vibeatlas_delight_moment',
    distinctId: persona.id,
    properties: {
      feature,
      trigger,
      impact,
      techAdoption: persona.techAdoption,
      delightTriggers: persona.delightTriggers,
    },
    timestamp: new Date(),
  };
}

/**
 * Map referral event
 */
export function mapReferralEvent(reason: string, persona: PersonaProfile): PostHogEvent {
  return {
    event: 'vibeatlas_referral',
    distinctId: persona.id,
    properties: {
      reason,
      techAdoption: persona.techAdoption,
      referralTriggers: persona.referralTriggers,
      collaborationStyle: persona.collaborationStyle,
    },
    timestamp: new Date(),
  };
}

/**
 * Map churn event
 */
export function mapChurnEvent(reason: string, feature: string, persona: PersonaProfile): PostHogEvent {
  return {
    event: 'vibeatlas_churn',
    distinctId: persona.id,
    properties: {
      reason,
      feature,
      dealBreakers: persona.dealBreakers,
      patienceLevel: persona.patienceLevel,
      experienceLevel: persona.experienceLevel,
    },
    timestamp: new Date(),
  };
}

/**
 * Batch map events
 */
export function batchMapEvents(
  actions: UserAction[],
  persona: PersonaProfile,
  emotionalStates: Record<string, number>[]
): TelemetryEvent[] {
  return actions.map((action, index) => {
    const emotionalState = emotionalStates[index] ?? { frustration: 0, confidence: 0, delight: 0, confusion: 0 };
    return mapActionToTelemetryEvent(action, persona, emotionalState);
  });
}
