/**
 * Known good/bad patterns and expected outcomes
 */

/**
 * Expected outcome pattern
 */
export interface ExpectedOutcome {
  scenario: string;
  persona: string;
  expectedMetrics: {
    onboardingCompletion: number;
    timeToFirstValue: number;
    frustrationScore: number;
    delightScore: number;
    churnProbability: number;
    referralProbability: number;
  };
  expectedBehavior: string[];
  redFlags: string[];
}

/**
 * Good pattern - Early Adopter happy path
 */
export const earlyAdopterHappyPath: ExpectedOutcome = {
  scenario: 'happy-path-001',
  persona: 'Early Adopter',
  expectedMetrics: {
    onboardingCompletion: 0.95,
    timeToFirstValue: 180,
    frustrationScore: 0.1,
    delightScore: 0.85,
    churnProbability: 0.05,
    referralProbability: 0.8,
  },
  expectedBehavior: ['Quick installation', 'Eager exploration', 'Feature discovery', 'Team sharing', 'Evangelist'],
  redFlags: ['Slow adoption', 'High friction', 'No sharing', 'Early churn'],
};

/**
 * Good pattern - Pragmatic Lead team adoption
 */
export const pragmaticLeadTeamAdoption: ExpectedOutcome = {
  scenario: 'team-collab-001',
  persona: 'Pragmatic Team Lead',
  expectedMetrics: {
    onboardingCompletion: 0.9,
    timeToFirstValue: 300,
    frustrationScore: 0.15,
    delightScore: 0.75,
    churnProbability: 0.1,
    referralProbability: 0.7,
  },
  expectedBehavior: ['Careful evaluation', 'Metrics focus', 'Team sharing', 'Stakeholder reporting', 'Measured adoption'],
  redFlags: ['No metrics', 'Cannot share', 'Poor team adoption', 'Missing ROI'],
};

/**
 * Bad pattern - Skeptical Dev friction
 */
export const skepticalDevFriction: ExpectedOutcome = {
  scenario: 'friction-001',
  persona: 'Skeptical Developer',
  expectedMetrics: {
    onboardingCompletion: 0.6,
    timeToFirstValue: 600,
    frustrationScore: 0.65,
    delightScore: 0.25,
    churnProbability: 0.5,
    referralProbability: 0.1,
  },
  expectedBehavior: ['Hesitant installation', 'High scrutiny', 'Documentation seeking', 'Friction sensitivity', 'Skeptical'],
  redFlags: ['Hidden costs', 'Unclear limits', 'Poor documentation', 'Vendor lock-in signals'],
};

/**
 * Bad pattern - Budget-Conscious churn
 */
export const budgetConsciousChurn: ExpectedOutcome = {
  scenario: 'churn-001',
  persona: 'Budget-Conscious Developer',
  expectedMetrics: {
    onboardingCompletion: 0.4,
    timeToFirstValue: 0,
    frustrationScore: 0.9,
    delightScore: 0.1,
    churnProbability: 0.9,
    referralProbability: 0.05,
  },
  expectedBehavior: ['Cost concerns', 'Trial focus', 'Limit sensitivity', 'Quick abandonment', 'Negative feedback'],
  redFlags: ['Unexpected costs', 'Unclear pricing', 'Limited trial', 'Forced upgrade'],
};

/**
 * Good pattern - Power User advanced usage
 */
export const powerUserAdvanced: ExpectedOutcome = {
  scenario: 'power-user-001',
  persona: 'Power User',
  expectedMetrics: {
    onboardingCompletion: 1.0,
    timeToFirstValue: 120,
    frustrationScore: 0.05,
    delightScore: 0.95,
    churnProbability: 0.02,
    referralProbability: 0.95,
  },
  expectedBehavior: ['Rapid onboarding', 'Deep exploration', 'Customization', 'Advanced features', 'Community engagement'],
  redFlags: ['Limited features', 'No customization', 'Missing API', 'Poor performance'],
};

/**
 * Get all expected outcomes
 */
export function getAllExpectedOutcomes(): ExpectedOutcome[] {
  return [
    earlyAdopterHappyPath,
    pragmaticLeadTeamAdoption,
    skepticalDevFriction,
    budgetConsciousChurn,
    powerUserAdvanced,
  ];
}

/**
 * Get expected outcome for scenario and persona
 */
export function getExpectedOutcome(scenario: string, persona: string): ExpectedOutcome | undefined {
  const outcomes = getAllExpectedOutcomes();
  return outcomes.find((outcome) => outcome.scenario === scenario && outcome.persona === persona);
}

/**
 * Validate actual metrics against expected
 */
export function validateMetrics(
  actual: Record<string, number>,
  expected: ExpectedOutcome,
  tolerance: number = 0.2
): {
  passed: boolean;
  deviations: Array<{ metric: string; expected: number; actual: number; deviation: number }>;
} {
  const deviations: Array<{ metric: string; expected: number; actual: number; deviation: number }> = [];

  Object.entries(expected.expectedMetrics).forEach(([metric, expectedValue]) => {
    const actualValue = actual[metric] ?? 0;
    const deviation = Math.abs(actualValue - expectedValue);

    if (deviation > tolerance) {
      deviations.push({
        metric,
        expected: expectedValue,
        actual: actualValue,
        deviation,
      });
    }
  });

  return {
    passed: deviations.length === 0,
    deviations,
  };
}

/**
 * Identify red flags in behavior
 */
export function identifyRedFlags(
  behavior: string[],
  expectedOutcome: ExpectedOutcome
): { hasRedFlags: boolean; flags: string[] } {
  const flags = expectedOutcome.redFlags.filter((redFlag) => {
    return behavior.some((b) => b.toLowerCase().includes(redFlag.toLowerCase())) === true;
  });

  return {
    hasRedFlags: flags.length > 0,
    flags,
  };
}

/**
 * Calculate outcome quality score
 */
export function calculateOutcomeQuality(
  actualMetrics: Record<string, number>,
  actualBehavior: string[],
  expected: ExpectedOutcome
): {
  score: number;
  metricScore: number;
  behaviorScore: number;
  redFlagPenalty: number;
} {
  const metricValidation = validateMetrics(actualMetrics, expected);
  const metricScore = metricValidation.passed === true ? 1.0 : 1.0 - metricValidation.deviations.length * 0.15;

  const expectedBehaviorCount = expected.expectedBehavior.filter((eb) => {
    return actualBehavior.some((ab) => ab.toLowerCase().includes(eb.toLowerCase())) === true;
  }).length;

  const behaviorScore = expectedBehaviorCount / expected.expectedBehavior.length;

  const redFlagCheck = identifyRedFlags(actualBehavior, expected);
  const redFlagPenalty = redFlagCheck.hasRedFlags === true ? redFlagCheck.flags.length * 0.2 : 0;

  const finalScore = Math.max(0, Math.min(1, (metricScore * 0.6 + behaviorScore * 0.4 - redFlagPenalty)));

  return {
    score: finalScore,
    metricScore,
    behaviorScore,
    redFlagPenalty,
  };
}

/**
 * Generate recommendations based on outcome
 */
export function generateRecommendations(
  actualMetrics: Record<string, number>,
  actualBehavior: string[],
  expected: ExpectedOutcome
): string[] {
  const recommendations: string[] = [];
  const metricValidation = validateMetrics(actualMetrics, expected);
  const redFlagCheck = identifyRedFlags(actualBehavior, expected);

  metricValidation.deviations.forEach((deviation) => {
    if (deviation.actual < deviation.expected) {
      recommendations.push(`Improve ${deviation.metric}: current ${deviation.actual.toFixed(2)}, target ${deviation.expected.toFixed(2)}`);
    }
  });

  if (redFlagCheck.hasRedFlags === true) {
    redFlagCheck.flags.forEach((flag) => {
      recommendations.push(`Address red flag: ${flag}`);
    });
  }

  const missingBehaviors = expected.expectedBehavior.filter((eb) => {
    return actualBehavior.some((ab) => ab.toLowerCase().includes(eb.toLowerCase())) === false;
  });

  missingBehaviors.forEach((behavior) => {
    recommendations.push(`Encourage behavior: ${behavior}`);
  });

  return recommendations;
}
