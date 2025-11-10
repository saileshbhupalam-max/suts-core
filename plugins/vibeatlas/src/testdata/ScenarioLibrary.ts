/**
 * Pre-built test scenarios for VibeAtlas
 */

import type { PersonaProfile, UserAction } from '@suts/core';
import { ActionType } from '@suts/core';

/**
 * Test scenario
 */
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  targetPersonas: string[];
  actions: UserAction[];
  expectedDuration: number;
  successCriteria: string[];
  failureCriteria: string[];
}

/**
 * Happy path scenario - smooth onboarding
 */
export const happyPathScenario: TestScenario = {
  id: 'happy-path-001',
  name: 'Happy Path Onboarding',
  description: 'User discovers value quickly and becomes engaged',
  targetPersonas: ['Early Adopter', 'Pragmatic Team Lead'],
  actions: [
    {
      type: ActionType.INSTALL,
      feature: 'vibeatlas',
      description: 'Install extension',
      expectedOutcome: 'Extension installed successfully',
    },
    {
      type: ActionType.CONFIGURE,
      feature: 'tryMode',
      description: 'Enable try mode',
      expectedOutcome: 'Try mode activated',
    },
    {
      type: ActionType.USE_FEATURE,
      feature: 'contextPreview',
      description: 'First context preview',
      expectedOutcome: 'Immediate value recognized',
    },
    {
      type: ActionType.USE_FEATURE,
      feature: 'dashboard',
      description: 'Check metrics',
      expectedOutcome: 'Sees productivity gains',
    },
    {
      type: ActionType.SHARE,
      feature: 'dashboard',
      description: 'Share with team',
      expectedOutcome: 'Team engagement',
    },
  ],
  expectedDuration: 600,
  successCriteria: ['All actions completed', 'Low frustration', 'High delight', 'Referral likely'],
  failureCriteria: ['Any action failed', 'High frustration', 'Churn'],
};

/**
 * Friction scenario - user encounters problems
 */
export const frictionScenario: TestScenario = {
  id: 'friction-001',
  name: 'High Friction Path',
  description: 'User encounters multiple friction points',
  targetPersonas: ['Skeptical Developer', 'Budget-Conscious Developer'],
  actions: [
    {
      type: ActionType.INSTALL,
      feature: 'vibeatlas',
      description: 'Install with hesitation',
      expectedOutcome: 'Installation unclear',
    },
    {
      type: ActionType.CONFIGURE,
      feature: 'tryMode',
      description: 'Confused by try mode limits',
      expectedOutcome: 'Token limit unclear',
    },
    {
      type: ActionType.USE_FEATURE,
      feature: 'tokenCounter',
      description: 'Warning appears too late',
      expectedOutcome: 'Frustrated by surprise',
    },
    {
      type: ActionType.SEEK_HELP,
      feature: 'vibeatlas',
      description: 'Look for documentation',
      expectedOutcome: 'Documentation helps',
    },
  ],
  expectedDuration: 900,
  successCriteria: ['User continues despite friction', 'Documentation helpful', 'Moderate satisfaction'],
  failureCriteria: ['User churns', 'Cannot find help', 'Frustration too high'],
};

/**
 * Power user scenario - advanced usage
 */
export const powerUserScenario: TestScenario = {
  id: 'power-user-001',
  name: 'Power User Journey',
  description: 'Expert user explores advanced features',
  targetPersonas: ['Power User'],
  actions: [
    {
      type: ActionType.INSTALL,
      feature: 'vibeatlas',
      description: 'Quick installation',
      expectedOutcome: 'Fast setup',
    },
    {
      type: ActionType.CUSTOMIZE,
      feature: 'contextPreview',
      description: 'Customize preview position',
      expectedOutcome: 'Personalized experience',
    },
    {
      type: ActionType.USE_FEATURE,
      feature: 'dashboard',
      description: 'Analyze advanced metrics',
      expectedOutcome: 'Deep insights',
    },
    {
      type: ActionType.USE_FEATURE,
      feature: 'dashboard',
      description: 'Export data',
      expectedOutcome: 'Data exported for analysis',
    },
    {
      type: ActionType.SHARE,
      feature: 'dashboard',
      description: 'Share insights',
      expectedOutcome: 'Team impressed',
    },
  ],
  expectedDuration: 450,
  successCriteria: ['All features used', 'High satisfaction', 'Becomes evangelist'],
  failureCriteria: ['Missing advanced features', 'Limited customization'],
};

/**
 * Churn scenario - user leaves
 */
export const churnScenario: TestScenario = {
  id: 'churn-001',
  name: 'Churn Path',
  description: 'User encounters dealbreakers and churns',
  targetPersonas: ['Skeptical Developer', 'Budget-Conscious Developer'],
  actions: [
    {
      type: ActionType.INSTALL,
      feature: 'vibeatlas',
      description: 'Reluctant installation',
      expectedOutcome: 'Low confidence',
    },
    {
      type: ActionType.CONFIGURE,
      feature: 'tryMode',
      description: 'Try mode confusing',
      expectedOutcome: 'Frustration builds',
    },
    {
      type: ActionType.USE_FEATURE,
      feature: 'tokenCounter',
      description: 'Unexpected token usage',
      expectedOutcome: 'Trust broken',
    },
    {
      type: ActionType.UNINSTALL,
      feature: 'vibeatlas',
      description: 'Uninstall due to frustration',
      expectedOutcome: 'User churned',
    },
  ],
  expectedDuration: 300,
  successCriteria: [],
  failureCriteria: ['User churned', 'Negative feedback', 'Referral unlikely'],
};

/**
 * Team collaboration scenario
 */
export const teamCollaborationScenario: TestScenario = {
  id: 'team-collab-001',
  name: 'Team Collaboration',
  description: 'Team lead shares value with team',
  targetPersonas: ['Pragmatic Team Lead'],
  actions: [
    {
      type: ActionType.INSTALL,
      feature: 'vibeatlas',
      description: 'Team lead installs',
      expectedOutcome: 'Evaluating for team',
    },
    {
      type: ActionType.USE_FEATURE,
      feature: 'dashboard',
      description: 'Review team metrics',
      expectedOutcome: 'Sees team potential',
    },
    {
      type: ActionType.SHARE,
      feature: 'dashboard',
      description: 'Share with team',
      expectedOutcome: 'Team interested',
    },
    {
      type: ActionType.USE_FEATURE,
      feature: 'dashboard',
      description: 'Export for stakeholders',
      expectedOutcome: 'ROI demonstrated',
    },
  ],
  expectedDuration: 720,
  successCriteria: ['Team adoption', 'Stakeholder buy-in', 'Continued usage'],
  failureCriteria: ['Team not interested', 'Poor metrics', 'No sharing features'],
};

/**
 * Get all scenarios
 */
export function getAllScenarios(): TestScenario[] {
  return [happyPathScenario, frictionScenario, powerUserScenario, churnScenario, teamCollaborationScenario];
}

/**
 * Get scenarios for persona
 */
export function getScenariosForPersona(persona: PersonaProfile): TestScenario[] {
  const allScenarios = getAllScenarios();
  return allScenarios.filter((scenario) => scenario.targetPersonas.includes(persona.archetype) === true);
}

/**
 * Get scenario by id
 */
export function getScenarioById(id: string): TestScenario | undefined {
  const allScenarios = getAllScenarios();
  return allScenarios.find((scenario) => scenario.id === id);
}
