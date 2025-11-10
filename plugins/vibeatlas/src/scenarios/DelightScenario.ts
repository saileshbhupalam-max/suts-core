/**
 * Delight scenario - aha moments
 */

import type { PersonaProfile, ProductState, UserAction } from '@suts/core';
import { ActionType } from '@suts/core';

/**
 * Delight moment
 */
export interface DelightMoment {
  feature: string;
  trigger: string;
  description: string;
  impact: 'minor' | 'moderate' | 'major' | 'transformative';
  likelihood: number;
  targetPersonas: string[];
}

/**
 * Get potential delight moments
 */
export function getDelightMoments(): DelightMoment[] {
  return [
    {
      feature: 'contextPreview',
      trigger: 'First time seeing before/after context',
      description: 'User immediately understands the value',
      impact: 'major',
      likelihood: 0.8,
      targetPersonas: ['Novice', 'Intermediate'],
    },
    {
      feature: 'tokenCounter',
      trigger: 'Realizes token savings compared to manual work',
      description: 'User sees ROI clearly',
      impact: 'moderate',
      likelihood: 0.6,
      targetPersonas: ['Expert'],
    },
    {
      feature: 'dashboard',
      trigger: 'Sharing metrics with team shows productivity gains',
      description: 'Team validates the value',
      impact: 'transformative',
      likelihood: 0.7,
      targetPersonas: ['Team', 'Community-driven'],
    },
    {
      feature: 'tryMode',
      trigger: 'Completing complex task within try mode limits',
      description: 'User experiences full capability without commitment',
      impact: 'major',
      likelihood: 0.9,
      targetPersonas: ['Early adopter', 'Early majority'],
    },
    {
      feature: 'dashboard',
      trigger: 'Discovering unexpected insights in metrics',
      description: 'User finds value beyond initial expectations',
      impact: 'major',
      likelihood: 0.5,
      targetPersonas: ['Expert'],
    },
  ];
}

/**
 * Calculate delight score for persona
 */
export function calculateDelightScore(persona: PersonaProfile, state: ProductState): number {
  const delightMoments = getDelightMoments();
  let totalDelight = 0;
  let applicableMoments = 0;

  delightMoments.forEach((moment) => {
    const isTargeted =
      moment.targetPersonas.includes(persona.experienceLevel) === true ||
      moment.targetPersonas.includes(persona.collaborationStyle) === true ||
      moment.targetPersonas.includes(persona.techAdoption) === true;

    if (isTargeted === true) {
      applicableMoments++;
      const featureEnabled = state.features[moment.feature] === true;

      if (featureEnabled === true) {
        const impactScore = {
          minor: 0.2,
          moderate: 0.5,
          major: 0.8,
          transformative: 1.0,
        }[moment.impact];

        totalDelight += impactScore * moment.likelihood;
      }
    }
  });

  return applicableMoments > 0 ? totalDelight / applicableMoments : 0;
}

/**
 * Identify likely delight moments for persona
 */
export function identifyLikelyDelights(persona: PersonaProfile): DelightMoment[] {
  const delightMoments = getDelightMoments();

  return delightMoments
    .filter((moment) => {
      const isTargeted =
        moment.targetPersonas.includes(persona.experienceLevel) === true ||
        moment.targetPersonas.includes(persona.collaborationStyle) === true ||
        moment.targetPersonas.includes(persona.techAdoption) === true;

      return isTargeted === true && moment.likelihood >= 0.6;
    })
    .sort((a, b) => b.likelihood - a.likelihood);
}

/**
 * Get delight actions
 */
export function getDelightActions(persona: PersonaProfile, state: ProductState): UserAction[] {
  const actions: UserAction[] = [];
  const likelyDelights = identifyLikelyDelights(persona);

  likelyDelights.forEach((moment) => {
    const featureEnabled = state.features[moment.feature] === true;

    if (featureEnabled === true) {
      actions.push({
        type: ActionType.USE_FEATURE,
        feature: moment.feature,
        description: moment.trigger,
        expectedOutcome: moment.description,
        metadata: {
          delightImpact: moment.impact,
          likelihood: moment.likelihood,
        },
      });
    }
  });

  return actions;
}

/**
 * Simulate delight encounter
 */
export function simulateDelightEncounter(
  persona: PersonaProfile,
  _state: ProductState
): {
  encountered: boolean;
  delightMoment: DelightMoment | null;
  userReaction: 'neutral' | 'pleased' | 'delighted' | 'evangelist';
  delightIncrease: number;
  willRefer: boolean;
} {
  const likelyDelights = identifyLikelyDelights(persona);

  if (likelyDelights.length === 0) {
    return {
      encountered: false,
      delightMoment: null,
      userReaction: 'neutral',
      delightIncrease: 0,
      willRefer: false,
    };
  }

  const delightMoment = likelyDelights[0];
  if (delightMoment === undefined) {
    return {
      encountered: false,
      delightMoment: null,
      userReaction: 'neutral',
      delightIncrease: 0,
      willRefer: false,
    };
  }

  const encounterProbability = Math.random();

  if (encounterProbability > delightMoment.likelihood) {
    return {
      encountered: false,
      delightMoment: null,
      userReaction: 'neutral',
      delightIncrease: 0,
      willRefer: false,
    };
  }

  const impactScore = {
    minor: 0.2,
    moderate: 0.5,
    major: 0.8,
    transformative: 1.0,
  }[delightMoment.impact];

  let userReaction: 'neutral' | 'pleased' | 'delighted' | 'evangelist';
  let delightIncrease: number;
  let willRefer: boolean;

  if (impactScore >= 0.8) {
    userReaction = 'evangelist';
    delightIncrease = impactScore;
    willRefer = true;
  } else if (impactScore >= 0.5) {
    userReaction = 'delighted';
    delightIncrease = impactScore * 0.8;
    willRefer = persona.techAdoption === 'Early adopter';
  } else if (impactScore >= 0.2) {
    userReaction = 'pleased';
    delightIncrease = impactScore * 0.6;
    willRefer = false;
  } else {
    userReaction = 'neutral';
    delightIncrease = impactScore * 0.3;
    willRefer = false;
  }

  const matchesDelightTrigger =
    persona.delightTriggers.some((trigger) => delightMoment.description.toLowerCase().includes(trigger.toLowerCase())) === true;

  if (matchesDelightTrigger === true) {
    delightIncrease *= 1.5;
    willRefer = true;
  }

  return {
    encountered: true,
    delightMoment,
    userReaction,
    delightIncrease: Math.min(1, delightIncrease),
    willRefer,
  };
}

/**
 * Calculate referral probability
 */
export function calculateReferralProbability(persona: PersonaProfile, state: ProductState): number {
  const delightScore = calculateDelightScore(persona, state);
  const confidenceFactor = persona.confidenceScore;

  const techAdoptionFactor = {
    'Early adopter': 1.2,
    'Early majority': 1.0,
    'Late majority': 0.7,
    Laggard: 0.4,
  }[persona.techAdoption];

  const referralProbability = delightScore * confidenceFactor * techAdoptionFactor;

  return Math.min(1, Math.max(0, referralProbability));
}
