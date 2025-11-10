/**
 * Tests for scenario modules
 */

import type { ProductState } from '@suts/core';
import {
  getOnboardingSteps,
  calculateOnboardingCompletion,
  identifyFrictionPoints,
  getTimeToFirstValue,
  simulateOnboarding,
} from '../scenarios/OnboardingScenario';
import {
  getDailyActivities,
  calculateDailyEngagement,
  getPeakUsageHours,
  identifyUsagePatterns,
  simulateDailyUsage,
} from '../scenarios/DailyUsageScenario';
import {
  getFrictionPoints,
  calculateFrictionSeverity,
  identifyCriticalFriction,
  simulateFrictionEncounter,
  calculateChurnProbability,
} from '../scenarios/FrictionScenario';
import {
  getDelightMoments,
  calculateDelightScore,
  identifyLikelyDelights,
  simulateDelightEncounter,
  calculateReferralProbability,
} from '../scenarios/DelightScenario';
import { earlyAdopter, skepticalDev, powerUser } from '../testdata/PersonaTemplates';

describe('OnboardingScenario', () => {
  it('should get onboarding steps', () => {
    const steps = getOnboardingSteps(earlyAdopter);

    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]?.stepNumber).toBe(1);
    expect(steps.every((s) => s.action)).toBe(true);
  });

  it('should calculate onboarding completion', () => {
    const completedSteps = [1, 2, 3, 4];
    const totalSteps = 5;
    const rate = calculateOnboardingCompletion(completedSteps, totalSteps);

    expect(rate).toBe(0.8);
  });

  it('should handle zero total steps', () => {
    const rate = calculateOnboardingCompletion([1, 2], 0);

    expect(rate).toBe(0);
  });

  it('should identify friction points', () => {
    const steps = getOnboardingSteps(earlyAdopter);
    const completedSteps = [1, 2];
    const timeSpent = { 1: 100, 2: 500 };

    const frictionPoints = identifyFrictionPoints(steps, completedSteps, timeSpent);

    expect(frictionPoints.length).toBeGreaterThan(0);
  });

  it('should calculate time to first value', () => {
    const steps = getOnboardingSteps(earlyAdopter);
    const completedSteps = [1, 2, 3, 4];
    const timeSpent = { 1: 60, 2: 30, 3: 180, 4: 120 };

    const time = getTimeToFirstValue(steps, completedSteps, timeSpent);

    expect(time).toBeGreaterThan(0);
  });

  it('should simulate onboarding', () => {
    const state: ProductState = {
      features: {},
      uiElements: {},
      userData: {}, config: {}, environment: "development" as const, metadata: {},
      version: '1.0.0',
    };

    const result = simulateOnboarding(earlyAdopter, state);

    expect(result.completedSteps).toBeDefined();
    expect(result.timeSpent).toBeDefined();
    expect(result.frustration).toBeGreaterThanOrEqual(0);
  });
});

describe('DailyUsageScenario', () => {
  it('should get daily activities', () => {
    const activities = getDailyActivities(earlyAdopter);

    expect(activities.length).toBeGreaterThan(0);
    expect(activities.every((a) => a.action)).toBe(true);
    expect(activities.every((a) => a.frequency > 0)).toBe(true);
  });

  it('should calculate daily engagement', () => {
    const activities = getDailyActivities(earlyAdopter);
    const engagement = calculateDailyEngagement(activities, 5);

    expect(engagement).toBeGreaterThanOrEqual(0);
    expect(engagement).toBeLessThanOrEqual(1);
  });

  it('should get peak usage hours', () => {
    const activities = getDailyActivities(earlyAdopter);
    const peakHours = getPeakUsageHours(activities);

    expect(peakHours.length).toBeGreaterThan(0);
    expect(peakHours.length).toBeLessThanOrEqual(3);
  });

  it('should identify usage patterns for power user', () => {
    const activities = getDailyActivities(powerUser);
    const { pattern, confidence } = identifyUsagePatterns(activities, powerUser);

    expect(pattern).toBeDefined();
    expect(confidence).toBeGreaterThan(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it('should identify usage patterns for low activity', () => {
    const activities: ReturnType<typeof getDailyActivities> = [];
    const { pattern } = identifyUsagePatterns(activities, skepticalDev);

    expect(pattern).toBe('churning');
  });

  it('should simulate daily usage', () => {
    const state: ProductState = {
      features: {},
      uiElements: {},
      userData: {}, config: {}, environment: "development" as const, metadata: {},
      version: '1.0.0',
    };

    const result = simulateDailyUsage(earlyAdopter, state);

    expect(result.activitiesCompleted).toBeGreaterThanOrEqual(0);
    expect(result.totalDuration).toBeGreaterThanOrEqual(0);
    expect(result.pattern).toBeDefined();
    expect(result.satisfaction).toBeGreaterThanOrEqual(0);
  });
});

describe('FrictionScenario', () => {
  const state: ProductState = {
    features: {
      tryMode: true,
      tokenCounter: true,
      contextPreview: true,
      dashboard: true,
    },
    uiElements: {},
    userData: {}, config: {}, environment: "development" as const, metadata: {},
    version: '1.0.0',
  };

  it('should get friction points', () => {
    const points = getFrictionPoints();

    expect(points.length).toBeGreaterThan(0);
    expect(points.every((p) => p.feature)).toBe(true);
    expect(points.every((p) => p.severity)).toBe(true);
  });

  it('should calculate friction severity', () => {
    const severity = calculateFrictionSeverity(skepticalDev, state);

    expect(severity).toBeGreaterThanOrEqual(0);
    expect(severity).toBeLessThanOrEqual(1);
  });

  it('should identify critical friction', () => {
    const critical = identifyCriticalFriction(skepticalDev);

    expect(critical.length).toBeGreaterThanOrEqual(0);
    expect(critical.every((f) => f.severity === 'high' || f.severity === 'critical')).toBe(true);
  });

  it('should simulate friction encounter', () => {
    const result = simulateFrictionEncounter(skepticalDev, state);

    expect(result.encountered).toBeDefined();
    expect(result.userReaction).toBeDefined();
    expect(result.frustrationIncrease).toBeGreaterThanOrEqual(0);
  });

  it('should calculate churn probability', () => {
    const probability = calculateChurnProbability(skepticalDev, state);

    expect(probability).toBeGreaterThanOrEqual(0);
    expect(probability).toBeLessThanOrEqual(1);
  });

  it('should have higher churn for low patience', () => {
    const lowPatienceChurn = calculateChurnProbability(skepticalDev, state);
    const highPatienceChurn = calculateChurnProbability(powerUser, state);

    expect(lowPatienceChurn).toBeGreaterThanOrEqual(highPatienceChurn);
  });
});

describe('DelightScenario', () => {
  const state: ProductState = {
    features: {
      tryMode: true,
      tokenCounter: true,
      contextPreview: true,
      dashboard: true,
    },
    uiElements: {},
    userData: {}, config: {}, environment: "development" as const, metadata: {},
    version: '1.0.0',
  };

  it('should get delight moments', () => {
    const moments = getDelightMoments();

    expect(moments.length).toBeGreaterThan(0);
    expect(moments.every((m) => m.feature)).toBe(true);
    expect(moments.every((m) => m.impact)).toBe(true);
  });

  it('should calculate delight score', () => {
    const score = calculateDelightScore(earlyAdopter, state);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should identify likely delights', () => {
    const delights = identifyLikelyDelights(earlyAdopter);

    expect(delights.length).toBeGreaterThanOrEqual(0);
    expect(delights.every((d) => d.likelihood >= 0.6)).toBe(true);
  });

  it('should simulate delight encounter', () => {
    const result = simulateDelightEncounter(earlyAdopter, state);

    expect(result.encountered).toBeDefined();
    expect(result.userReaction).toBeDefined();
    expect(result.delightIncrease).toBeGreaterThanOrEqual(0);
    expect(result.willRefer).toBeDefined();
  });

  it('should calculate referral probability', () => {
    const probability = calculateReferralProbability(earlyAdopter, state);

    expect(probability).toBeGreaterThanOrEqual(0);
    expect(probability).toBeLessThanOrEqual(1);
  });

  it('should have higher referral for early adopters', () => {
    const earlyAdopterReferral = calculateReferralProbability(earlyAdopter, state);
    const skepticalReferral = calculateReferralProbability(skepticalDev, state);

    expect(earlyAdopterReferral).toBeGreaterThanOrEqual(skepticalReferral);
  });
});
