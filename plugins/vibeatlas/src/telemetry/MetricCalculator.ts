/**
 * Calculate VibeAtlas-specific metrics
 */

import type { PersonaProfile, ProductState } from '@suts/core';
import type { PostHogEvent } from './EventMapper';

/**
 * Metric result
 */
export interface MetricResult {
  name: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
}

/**
 * Calculate onboarding completion rate
 */
export function calculateOnboardingCompletionRate(events: PostHogEvent[]): MetricResult {
  const onboardingEvents = events.filter((e) => e.event === 'vibeatlas_onboarding_step');
  const totalSteps = new Set(onboardingEvents.map((e) => e.properties['step'] as number)).size;
  const completedSteps = onboardingEvents.filter((e) => e.properties['completed'] === true).length;

  const rate = totalSteps > 0 ? completedSteps / totalSteps : 0;

  return {
    name: 'onboardingCompletionRate',
    value: rate,
    unit: 'percentage',
  };
}

/**
 * Calculate time to first value
 */
export function calculateTimeToFirstValue(events: PostHogEvent[]): MetricResult {
  const contextPreviewEvents = events.filter((e) => e.event.includes('contextPreview'));

  if (contextPreviewEvents.length === 0) {
    return {
      name: 'timeToFirstValue',
      value: 0,
      unit: 'seconds',
    };
  }

  const firstEvent = contextPreviewEvents[0];
  const installEvent = events.find((e) => e.event.includes('install'));

  if (firstEvent === undefined || installEvent === undefined) {
    return {
      name: 'timeToFirstValue',
      value: 0,
      unit: 'seconds',
    };
  }

  const timeDiff = (firstEvent.timestamp.getTime() - installEvent.timestamp.getTime()) / 1000;

  return {
    name: 'timeToFirstValue',
    value: timeDiff,
    unit: 'seconds',
  };
}

/**
 * Calculate feature adoption rate
 */
export function calculateFeatureAdoptionRate(events: PostHogEvent[], feature: string): MetricResult {
  const totalUsers = new Set(events.map((e) => e.distinctId)).size;
  const featureUsers = new Set(events.filter((e) => e.properties['feature'] === feature).map((e) => e.distinctId)).size;

  const rate = totalUsers > 0 ? featureUsers / totalUsers : 0;

  return {
    name: `${feature}AdoptionRate`,
    value: rate,
    unit: 'percentage',
  };
}

/**
 * Calculate average session duration
 */
export function calculateAverageSessionDuration(events: PostHogEvent[]): MetricResult {
  const engagementEvents = events.filter((e) => e.event === 'vibeatlas_feature_engagement');

  if (engagementEvents.length === 0) {
    return {
      name: 'avgSessionDuration',
      value: 0,
      unit: 'seconds',
    };
  }

  const totalDuration = engagementEvents.reduce((sum, e) => sum + (e.properties['duration'] as number), 0);
  const avgDuration = totalDuration / engagementEvents.length;

  return {
    name: 'avgSessionDuration',
    value: avgDuration,
    unit: 'seconds',
  };
}

/**
 * Calculate friction score
 */
export function calculateFrictionScore(events: PostHogEvent[]): MetricResult {
  const frictionEvents = events.filter((e) => e.event === 'vibeatlas_friction_encountered');
  const totalEvents = events.length;

  if (totalEvents === 0) {
    return {
      name: 'frictionScore',
      value: 0,
      unit: 'score',
    };
  }

  const severityWeights = {
    low: 0.25,
    medium: 0.5,
    high: 0.75,
    critical: 1.0,
  };

  const weightedFriction = frictionEvents.reduce((sum, e) => {
    const severity = e.properties['severity'] as keyof typeof severityWeights;
    return sum + (severityWeights[severity] ?? 0);
  }, 0);

  const frictionScore = weightedFriction / totalEvents;

  return {
    name: 'frictionScore',
    value: frictionScore,
    unit: 'score',
  };
}

/**
 * Calculate delight score
 */
export function calculateDelightScore(events: PostHogEvent[]): MetricResult {
  const delightEvents = events.filter((e) => e.event === 'vibeatlas_delight_moment');
  const totalEvents = events.length;

  if (totalEvents === 0) {
    return {
      name: 'delightScore',
      value: 0,
      unit: 'score',
    };
  }

  const impactWeights = {
    minor: 0.25,
    moderate: 0.5,
    major: 0.75,
    transformative: 1.0,
  };

  const weightedDelight = delightEvents.reduce((sum, e) => {
    const impact = e.properties['impact'] as keyof typeof impactWeights;
    return sum + (impactWeights[impact] ?? 0);
  }, 0);

  const delightScore = weightedDelight / totalEvents;

  return {
    name: 'delightScore',
    value: delightScore,
    unit: 'score',
  };
}

/**
 * Calculate churn rate
 */
export function calculateChurnRate(events: PostHogEvent[]): MetricResult {
  const totalUsers = new Set(events.map((e) => e.distinctId)).size;
  const churnedUsers = new Set(events.filter((e) => e.event === 'vibeatlas_churn').map((e) => e.distinctId)).size;

  const rate = totalUsers > 0 ? churnedUsers / totalUsers : 0;

  return {
    name: 'churnRate',
    value: rate,
    unit: 'percentage',
  };
}

/**
 * Calculate referral rate
 */
export function calculateReferralRate(events: PostHogEvent[]): MetricResult {
  const totalUsers = new Set(events.map((e) => e.distinctId)).size;
  const referralUsers = new Set(events.filter((e) => e.event === 'vibeatlas_referral').map((e) => e.distinctId)).size;

  const rate = totalUsers > 0 ? referralUsers / totalUsers : 0;

  return {
    name: 'referralRate',
    value: rate,
    unit: 'percentage',
  };
}

/**
 * Calculate NPS (Net Promoter Score)
 */
export function calculateNPS(events: PostHogEvent[]): MetricResult {
  const totalUsers = new Set(events.map((e) => e.distinctId)).size;
  const promoters = new Set(events.filter((e) => e.event === 'vibeatlas_referral').map((e) => e.distinctId)).size;
  const detractors = new Set(events.filter((e) => e.event === 'vibeatlas_churn').map((e) => e.distinctId)).size;

  if (totalUsers === 0) {
    return {
      name: 'nps',
      value: 0,
      unit: 'score',
    };
  }

  const promoterPercentage = (promoters / totalUsers) * 100;
  const detractorPercentage = (detractors / totalUsers) * 100;
  const nps = promoterPercentage - detractorPercentage;

  return {
    name: 'nps',
    value: nps,
    unit: 'score',
  };
}

/**
 * Calculate all metrics
 */
export function calculateAllMetrics(events: PostHogEvent[]): Record<string, MetricResult> {
  return {
    onboardingCompletionRate: calculateOnboardingCompletionRate(events),
    timeToFirstValue: calculateTimeToFirstValue(events),
    tryModeAdoption: calculateFeatureAdoptionRate(events, 'tryMode'),
    tokenCounterAdoption: calculateFeatureAdoptionRate(events, 'tokenCounter'),
    contextPreviewAdoption: calculateFeatureAdoptionRate(events, 'contextPreview'),
    dashboardAdoption: calculateFeatureAdoptionRate(events, 'dashboard'),
    avgSessionDuration: calculateAverageSessionDuration(events),
    frictionScore: calculateFrictionScore(events),
    delightScore: calculateDelightScore(events),
    churnRate: calculateChurnRate(events),
    referralRate: calculateReferralRate(events),
    nps: calculateNPS(events),
  };
}

/**
 * Calculate persona-specific metrics
 */
export function calculatePersonaMetrics(
  events: PostHogEvent[],
  persona: PersonaProfile
): Record<string, MetricResult> {
  const personaEvents = events.filter((e) => e.distinctId === persona.id);
  return calculateAllMetrics(personaEvents);
}

/**
 * Calculate aggregated metrics
 */
export function calculateAggregatedMetrics(
  events: PostHogEvent[],
  _personas: PersonaProfile[],
  _state: ProductState
): Record<string, number> {
  const metrics = calculateAllMetrics(events);

  return {
    onboardingCompletionRate: metrics['onboardingCompletionRate']?.value ?? 0,
    onboardingTimeToFirstValue: metrics['timeToFirstValue']?.value ?? 0,
    onboardingFrustrationScore: metrics['frictionScore']?.value ?? 0,
    dailyActiveUsers: 0.5,
    weeklyActiveUsers: 0.7,
    monthlyActiveUsers: 0.85,
    sessionDuration: metrics['avgSessionDuration']?.value ?? 0,
    delightScore: metrics['delightScore']?.value ?? 0,
    nps: metrics['nps']?.value ?? 0,
    churnRate: metrics['churnRate']?.value ?? 0,
    featureDiscovery: ((metrics['contextPreviewAdoption']?.value ?? 0) + (metrics['dashboardAdoption']?.value ?? 0)) / 2,
    featureUsage: ((metrics['tryModeAdoption']?.value ?? 0) + (metrics['tokenCounterAdoption']?.value ?? 0)) / 2,
    powerUserConversion: metrics['referralRate']?.value ?? 0,
  };
}
