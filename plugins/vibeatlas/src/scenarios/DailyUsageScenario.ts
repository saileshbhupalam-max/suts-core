/**
 * Daily usage scenario - typical developer day
 */

import type { UserAction, PersonaProfile, ProductState } from '@suts/core';
import { ActionType } from '@suts/core';

/**
 * Daily activity
 */
export interface DailyActivity {
  hour: number;
  action: UserAction;
  frequency: number;
  duration: number;
}

/**
 * Get typical daily activities
 */
export function getDailyActivities(persona: PersonaProfile): DailyActivity[] {
  const activities: DailyActivity[] = [];

  const baseFrequency = persona.techAdoption === 'Early adopter' ? 1.5 : 1.0;

  activities.push({
    hour: 9,
    action: {
      type: ActionType.USE_FEATURE,
      feature: 'contextPreview',
      description: 'Review context changes',
      expectedOutcome: 'Context reviewed and understood',
    },
    frequency: 3 * baseFrequency,
    duration: 120,
  });

  activities.push({
    hour: 10,
    action: {
      type: ActionType.USE_FEATURE,
      feature: 'tokenCounter',
      description: 'Check token usage',
      expectedOutcome: 'Token usage within limits',
    },
    frequency: 2 * baseFrequency,
    duration: 30,
  });

  activities.push({
    hour: 14,
    action: {
      type: ActionType.USE_FEATURE,
      feature: 'dashboard',
      description: 'Review metrics',
      expectedOutcome: 'Metrics show productivity gains',
    },
    frequency: 1 * baseFrequency,
    duration: 300,
  });

  if (persona.collaborationStyle === 'Team' || persona.collaborationStyle === 'Community-driven') {
    activities.push({
      hour: 16,
      action: {
        type: ActionType.SHARE,
        feature: 'dashboard',
        description: 'Share results with team',
        expectedOutcome: 'Team sees value',
      },
      frequency: 0.5 * baseFrequency,
      duration: 180,
    });
  }

  return activities;
}

/**
 * Calculate daily engagement score
 */
export function calculateDailyEngagement(activities: DailyActivity[], completedCount: number): number {
  if (activities.length === 0) {
    return 0;
  }

  const totalExpected = activities.reduce((sum, activity) => sum + activity.frequency, 0);
  const engagementRate = totalExpected > 0 ? completedCount / totalExpected : 0;

  return Math.min(1, engagementRate);
}

/**
 * Get peak usage hours
 */
export function getPeakUsageHours(activities: DailyActivity[]): number[] {
  const hourCounts = new Map<number, number>();

  activities.forEach((activity) => {
    const current = hourCounts.get(activity.hour) ?? 0;
    hourCounts.set(activity.hour, current + activity.frequency);
  });

  const sortedHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => hour);

  return sortedHours;
}

/**
 * Identify usage patterns
 */
export function identifyUsagePatterns(
  activities: DailyActivity[],
  persona: PersonaProfile
): {
  pattern: 'power-user' | 'regular' | 'occasional' | 'churning';
  confidence: number;
} {
  const totalActivities = activities.reduce((sum, activity) => sum + activity.frequency, 0);
  const totalDuration = activities.reduce((sum, activity) => sum + activity.duration * activity.frequency, 0);

  const avgDurationPerActivity = totalActivities > 0 ? totalDuration / totalActivities : 0;

  let pattern: 'power-user' | 'regular' | 'occasional' | 'churning';
  let confidence: number;

  if (totalActivities >= 5 && avgDurationPerActivity > 150) {
    pattern = 'power-user';
    confidence = 0.9;
  } else if (totalActivities >= 3 && avgDurationPerActivity > 100) {
    pattern = 'regular';
    confidence = 0.8;
  } else if (totalActivities >= 1) {
    pattern = 'occasional';
    confidence = 0.7;
  } else {
    pattern = 'churning';
    confidence = 0.6;
  }

  if (persona.patienceLevel < 0.3) {
    confidence *= 0.8;
  }

  return { pattern, confidence };
}

/**
 * Simulate daily usage
 */
export function simulateDailyUsage(
  persona: PersonaProfile,
  _state: ProductState
): {
  activitiesCompleted: number;
  totalDuration: number;
  pattern: string;
  satisfaction: number;
} {
  const activities = getDailyActivities(persona);
  let activitiesCompleted = 0;
  let totalDuration = 0;

  activities.forEach((activity) => {
    const completionProbability = persona.patienceLevel * 0.5 + 0.5;
    const willComplete = Math.random() < completionProbability;

    if (willComplete === true) {
      activitiesCompleted += Math.floor(activity.frequency);
      totalDuration += activity.duration * activity.frequency;
    }
  });

  const { pattern } = identifyUsagePatterns(activities, persona);
  const engagement = calculateDailyEngagement(activities, activitiesCompleted);
  const satisfaction = engagement * persona.confidenceScore;

  return {
    activitiesCompleted,
    totalDuration,
    pattern,
    satisfaction,
  };
}
