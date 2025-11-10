/**
 * Friction scenario - where users might struggle
 */

import type { PersonaProfile, ProductState } from '@suts/core';

/**
 * Friction point
 */
export interface FrictionPoint {
  feature: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedPersonas: string[];
  impact: string;
  mitigation: string;
}

/**
 * Get potential friction points
 */
export function getFrictionPoints(): FrictionPoint[] {
  return [
    {
      feature: 'tryMode',
      issue: 'Token limit not clear during activation',
      severity: 'medium',
      affectedPersonas: ['Novice'],
      impact: 'Users surprised when tokens run out',
      mitigation: 'Show clear token limit messaging',
    },
    {
      feature: 'tokenCounter',
      issue: 'Warning appears too late',
      severity: 'high',
      affectedPersonas: ['Novice', 'Intermediate'],
      impact: 'Users exceed limits unexpectedly',
      mitigation: 'Earlier warnings at 50% usage',
    },
    {
      feature: 'contextPreview',
      issue: 'Preview takes too long to load for large contexts',
      severity: 'medium',
      affectedPersonas: ['Expert'],
      impact: 'Workflow interruption',
      mitigation: 'Optimize loading for large contexts',
    },
    {
      feature: 'dashboard',
      issue: 'Metrics not explained clearly',
      severity: 'low',
      affectedPersonas: ['Novice'],
      impact: 'Users dont understand value',
      mitigation: 'Add tooltips and explanations',
    },
    {
      feature: 'dashboard',
      issue: 'Export format not compatible with tools',
      severity: 'high',
      affectedPersonas: ['Team'],
      impact: 'Cannot share with stakeholders',
      mitigation: 'Support multiple export formats',
    },
  ];
}

/**
 * Calculate friction severity for persona
 */
export function calculateFrictionSeverity(persona: PersonaProfile, state: ProductState): number {
  const frictionPoints = getFrictionPoints();
  let totalFriction = 0;
  let applicablePoints = 0;

  frictionPoints.forEach((point) => {
    const isAffected =
      point.affectedPersonas.includes(persona.experienceLevel) === true ||
      point.affectedPersonas.includes(persona.collaborationStyle) === true;

    if (isAffected === true) {
      applicablePoints++;
      const featureEnabled = state.features[point.feature] === true;

      if (featureEnabled === true) {
        const severityScore = {
          low: 0.1,
          medium: 0.3,
          high: 0.6,
          critical: 1.0,
        }[point.severity];

        totalFriction += severityScore;
      }
    }
  });

  return applicablePoints > 0 ? totalFriction / applicablePoints : 0;
}

/**
 * Identify critical friction points for persona
 */
export function identifyCriticalFriction(persona: PersonaProfile): FrictionPoint[] {
  const frictionPoints = getFrictionPoints();

  return frictionPoints.filter((point) => {
    const isAffected =
      point.affectedPersonas.includes(persona.experienceLevel) === true ||
      point.affectedPersonas.includes(persona.collaborationStyle) === true;

    return isAffected === true && (point.severity === 'high' || point.severity === 'critical');
  });
}

/**
 * Simulate friction encounter
 */
export function simulateFrictionEncounter(
  persona: PersonaProfile,
  state: ProductState
): {
  encountered: boolean;
  frictionPoint: FrictionPoint | null;
  userReaction: 'continue' | 'frustrated' | 'churned';
  frustrationIncrease: number;
} {
  const criticalFriction = identifyCriticalFriction(persona);

  if (criticalFriction.length === 0) {
    return {
      encountered: false,
      frictionPoint: null,
      userReaction: 'continue',
      frustrationIncrease: 0,
    };
  }

  const frictionPoint = criticalFriction[0];
  if (frictionPoint === undefined) {
    return {
      encountered: false,
      frictionPoint: null,
      userReaction: 'continue',
      frustrationIncrease: 0,
    };
  }

  const frictionSeverity = calculateFrictionSeverity(persona, state);

  let userReaction: 'continue' | 'frustrated' | 'churned';
  let frustrationIncrease: number;

  if (persona.patienceLevel > 0.7) {
    userReaction = 'continue';
    frustrationIncrease = frictionSeverity * 0.2;
  } else if (persona.patienceLevel > 0.4) {
    userReaction = 'frustrated';
    frustrationIncrease = frictionSeverity * 0.5;
  } else {
    userReaction = 'churned';
    frustrationIncrease = frictionSeverity;
  }

  const isDealBreaker =
    persona.dealBreakers.some((dealBreaker) => frictionPoint.impact.toLowerCase().includes(dealBreaker.toLowerCase())) === true;

  if (isDealBreaker === true) {
    userReaction = 'churned';
    frustrationIncrease = 1.0;
  }

  return {
    encountered: true,
    frictionPoint,
    userReaction,
    frustrationIncrease,
  };
}

/**
 * Calculate churn probability
 */
export function calculateChurnProbability(persona: PersonaProfile, state: ProductState): number {
  const frictionSeverity = calculateFrictionSeverity(persona, state);
  const patienceFactor = 1 - persona.patienceLevel;
  const riskFactor = 1 - persona.riskTolerance;

  const churnProbability = (frictionSeverity * 0.5 + patienceFactor * 0.3 + riskFactor * 0.2);

  return Math.min(1, Math.max(0, churnProbability));
}
