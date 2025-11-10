/**
 * Onboarding scenario - first-time user flow
 */

import type { UserAction, PersonaProfile, ProductState } from '@suts/core';
import { ActionType } from '@suts/core';

/**
 * Onboarding step
 */
export interface OnboardingStep {
  stepNumber: number;
  action: UserAction;
  required: boolean;
  expectedDuration: number;
  successCriteria: string;
}

/**
 * Get onboarding steps for a persona
 */
export function getOnboardingSteps(persona: PersonaProfile): OnboardingStep[] {
  const steps: OnboardingStep[] = [
    {
      stepNumber: 1,
      action: {
        type: ActionType.INSTALL,
        feature: 'vibeatlas',
        description: 'Install VibeAtlas extension',
        expectedOutcome: 'Extension installed and activated',
      },
      required: true,
      expectedDuration: 60,
      successCriteria: 'Extension appears in VS Code',
    },
    {
      stepNumber: 2,
      action: {
        type: ActionType.CONFIGURE,
        feature: 'tryMode',
        description: 'Enable try mode',
        expectedOutcome: 'Try mode activated with token limit',
      },
      required: true,
      expectedDuration: 30,
      successCriteria: 'Try mode banner shows tokens available',
    },
    {
      stepNumber: 3,
      action: {
        type: ActionType.READ_DOCS,
        feature: 'vibeatlas',
        description: 'Read quick start guide',
        expectedOutcome: 'User understands basic features',
      },
      required: persona.learningStyle === 'Documentation',
      expectedDuration: 180,
      successCriteria: 'User completes tutorial',
    },
    {
      stepNumber: 4,
      action: {
        type: ActionType.USE_FEATURE,
        feature: 'contextPreview',
        description: 'Use context preview for first time',
        expectedOutcome: 'User sees before/after context',
      },
      required: true,
      expectedDuration: 120,
      successCriteria: 'Context preview shows expected changes',
    },
    {
      stepNumber: 5,
      action: {
        type: ActionType.USE_FEATURE,
        feature: 'tokenCounter',
        description: 'Check token usage',
        expectedOutcome: 'User sees token consumption',
      },
      required: false,
      expectedDuration: 30,
      successCriteria: 'Token counter displays current usage',
    },
  ];

  return steps;
}

/**
 * Calculate onboarding completion rate
 */
export function calculateOnboardingCompletion(completedSteps: number[], totalSteps: number): number {
  if (totalSteps === 0) {
    return 0;
  }
  return completedSteps.length / totalSteps;
}

/**
 * Identify onboarding friction points
 */
export function identifyFrictionPoints(
  steps: OnboardingStep[],
  completedSteps: number[],
  timeSpent: Record<number, number>
): string[] {
  const frictionPoints: string[] = [];

  steps.forEach((step) => {
    const isCompleted = completedSteps.includes(step.stepNumber) === true;
    const actualTime = timeSpent[step.stepNumber] ?? 0;

    if (isCompleted === false && step.required === true) {
      frictionPoints.push(`Step ${step.stepNumber} (${step.action.feature}) not completed`);
    }

    if (actualTime > step.expectedDuration * 2) {
      frictionPoints.push(`Step ${step.stepNumber} (${step.action.feature}) took too long`);
    }
  });

  return frictionPoints;
}

/**
 * Get time to first value
 */
export function getTimeToFirstValue(
  steps: OnboardingStep[],
  completedSteps: number[],
  timeSpent: Record<number, number>
): number {
  const firstValueStep = steps.find(
    (step) => step.action.feature === 'contextPreview' && completedSteps.includes(step.stepNumber) === true
  );

  if (firstValueStep === undefined) {
    return 0;
  }

  let totalTime = 0;
  for (let i = 1; i <= firstValueStep.stepNumber; i++) {
    totalTime += timeSpent[i] ?? 0;
  }

  return totalTime;
}

/**
 * Simulate onboarding flow
 */
export function simulateOnboarding(
  persona: PersonaProfile,
  _state: ProductState
): {
  completedSteps: number[];
  timeSpent: Record<number, number>;
  frustration: number;
} {
  const steps = getOnboardingSteps(persona);
  const completedSteps: number[] = [];
  const timeSpent: Record<number, number> = {};
  let frustration = 0;

  steps.forEach((step) => {
    const shouldComplete =
      step.required === true || persona.patienceLevel > 0.5 || persona.experienceLevel === 'Expert';

    if (shouldComplete === true) {
      completedSteps.push(step.stepNumber);
      const timeMultiplier =
        persona.experienceLevel === 'Expert' ? 0.7 : persona.experienceLevel === 'Intermediate' ? 1.0 : 1.5;
      timeSpent[step.stepNumber] = step.expectedDuration * timeMultiplier;
    } else {
      frustration += 0.1;
    }
  });

  return { completedSteps, timeSpent, frustration };
}
