/**
 * Tests for test data modules
 */

import {
  getAllPersonaTemplates,
  getPersonaByArchetype,
  skepticalDev,
  earlyAdopter,
  pragmaticLead,
  budgetConscious,
  powerUser,
} from '../testdata/PersonaTemplates';
import {
  getAllScenarios,
  getScenariosForPersona,
  getScenarioById,
  happyPathScenario,
  frictionScenario,
  powerUserScenario,
  churnScenario,
  teamCollaborationScenario,
} from '../testdata/ScenarioLibrary';
import {
  getAllExpectedOutcomes,
  getExpectedOutcome,
  validateMetrics,
  identifyRedFlags,
  calculateOutcomeQuality,
  generateRecommendations,
  earlyAdopterHappyPath,
  skepticalDevFriction,
} from '../testdata/ExpectedOutcomes';

describe('PersonaTemplates', () => {
  it('should have all persona templates defined', () => {
    expect(skepticalDev).toBeDefined();
    expect(earlyAdopter).toBeDefined();
    expect(pragmaticLead).toBeDefined();
    expect(budgetConscious).toBeDefined();
    expect(powerUser).toBeDefined();
  });

  it('should have valid persona properties', () => {
    expect(skepticalDev.id).toBeDefined();
    expect(skepticalDev.archetype).toBe('Skeptical Developer');
    expect(skepticalDev.experienceLevel).toBe('Expert');
    expect(skepticalDev.riskTolerance).toBeGreaterThanOrEqual(0);
    expect(skepticalDev.riskTolerance).toBeLessThanOrEqual(1);
  });

  it('should have different personas', () => {
    expect(earlyAdopter.archetype).not.toBe(skepticalDev.archetype);
    expect(powerUser.experienceLevel).toBe('Expert');
    expect(budgetConscious.experienceLevel).toBe('Novice');
  });

  it('should get all persona templates', () => {
    const templates = getAllPersonaTemplates();

    expect(templates.length).toBe(5);
    expect(templates).toContain(skepticalDev);
    expect(templates).toContain(earlyAdopter);
  });

  it('should get persona by archetype', () => {
    const persona = getPersonaByArchetype('Early Adopter');

    expect(persona).toBeDefined();
    expect(persona?.id).toBe(earlyAdopter.id);
  });

  it('should return undefined for unknown archetype', () => {
    const persona = getPersonaByArchetype('Unknown Archetype');

    expect(persona).toBeUndefined();
  });

  it('should have valid dealbreakers and delight triggers', () => {
    expect(skepticalDev.dealBreakers.length).toBeGreaterThan(0);
    expect(earlyAdopter.delightTriggers.length).toBeGreaterThan(0);
    expect(pragmaticLead.referralTriggers.length).toBeGreaterThan(0);
  });
});

describe('ScenarioLibrary', () => {
  it('should have all scenarios defined', () => {
    expect(happyPathScenario).toBeDefined();
    expect(frictionScenario).toBeDefined();
    expect(powerUserScenario).toBeDefined();
    expect(churnScenario).toBeDefined();
    expect(teamCollaborationScenario).toBeDefined();
  });

  it('should have valid scenario properties', () => {
    expect(happyPathScenario.id).toBeDefined();
    expect(happyPathScenario.name).toBeDefined();
    expect(happyPathScenario.actions.length).toBeGreaterThan(0);
    expect(happyPathScenario.successCriteria.length).toBeGreaterThan(0);
  });

  it('should have different scenarios', () => {
    expect(happyPathScenario.id).not.toBe(frictionScenario.id);
    expect(powerUserScenario.targetPersonas).toContain('Power User');
  });

  it('should get all scenarios', () => {
    const scenarios = getAllScenarios();

    expect(scenarios.length).toBe(5);
    expect(scenarios).toContain(happyPathScenario);
    expect(scenarios).toContain(churnScenario);
  });

  it('should get scenarios for persona', () => {
    const scenarios = getScenariosForPersona(earlyAdopter);

    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios.every((s) => s.targetPersonas.includes(earlyAdopter.archetype))).toBe(true);
  });

  it('should get scenario by id', () => {
    const scenario = getScenarioById('happy-path-001');

    expect(scenario).toBeDefined();
    expect(scenario?.id).toBe(happyPathScenario.id);
  });

  it('should return undefined for unknown scenario id', () => {
    const scenario = getScenarioById('unknown-scenario');

    expect(scenario).toBeUndefined();
  });

  it('should have valid actions in scenarios', () => {
    expect(happyPathScenario.actions.every((a) => a.type)).toBe(true);
    expect(happyPathScenario.actions.every((a) => a.feature)).toBe(true);
    expect(happyPathScenario.actions.every((a) => a.description)).toBe(true);
  });
});

describe('ExpectedOutcomes', () => {
  it('should have all expected outcomes defined', () => {
    expect(earlyAdopterHappyPath).toBeDefined();
    expect(skepticalDevFriction).toBeDefined();
  });

  it('should have valid outcome properties', () => {
    expect(earlyAdopterHappyPath.scenario).toBeDefined();
    expect(earlyAdopterHappyPath.persona).toBeDefined();
    expect(earlyAdopterHappyPath.expectedMetrics).toBeDefined();
    expect(earlyAdopterHappyPath.expectedBehavior.length).toBeGreaterThan(0);
  });

  it('should have different outcomes', () => {
    expect(earlyAdopterHappyPath.scenario).not.toBe(skepticalDevFriction.scenario);
    expect(earlyAdopterHappyPath.expectedMetrics.delightScore).toBeGreaterThan(
      skepticalDevFriction.expectedMetrics.delightScore
    );
  });

  it('should get all expected outcomes', () => {
    const outcomes = getAllExpectedOutcomes();

    expect(outcomes.length).toBeGreaterThan(0);
    expect(outcomes).toContain(earlyAdopterHappyPath);
  });

  it('should get expected outcome for scenario and persona', () => {
    const outcome = getExpectedOutcome('happy-path-001', 'Early Adopter');

    expect(outcome).toBeDefined();
    expect(outcome?.scenario).toBe('happy-path-001');
    expect(outcome?.persona).toBe('Early Adopter');
  });

  it('should validate metrics within tolerance', () => {
    const actual = {
      onboardingCompletion: 0.95,
      timeToFirstValue: 180,
      frustrationScore: 0.1,
      delightScore: 0.85,
      churnProbability: 0.05,
      referralProbability: 0.8,
    };

    const result = validateMetrics(actual, earlyAdopterHappyPath, 0.25);

    expect(result.deviations).toBeDefined();
    expect(Array.isArray(result.deviations)).toBe(true);
  });

  it('should validate metrics outside tolerance', () => {
    const actual = {
      onboardingCompletion: 0.5,
      timeToFirstValue: 500,
      delightScore: 0.3,
    };

    const result = validateMetrics(actual, earlyAdopterHappyPath, 0.2);

    expect(result.passed).toBe(false);
    expect(result.deviations.length).toBeGreaterThan(0);
  });

  it('should identify red flags in behavior', () => {
    const behavior = ['Slow adoption', 'High friction', 'No sharing'];
    const redFlags = identifyRedFlags(behavior, earlyAdopterHappyPath);

    expect(redFlags.hasRedFlags).toBe(true);
    expect(redFlags.flags.length).toBeGreaterThan(0);
  });

  it('should not identify red flags in good behavior', () => {
    const behavior = ['Quick installation', 'Feature discovery', 'Team sharing'];
    const redFlags = identifyRedFlags(behavior, earlyAdopterHappyPath);

    expect(redFlags.hasRedFlags).toBe(false);
  });

  it('should calculate outcome quality score', () => {
    const metrics = {
      onboardingCompletion: 0.93,
      timeToFirstValue: 190,
      frustrationScore: 0.12,
      delightScore: 0.83,
      churnProbability: 0.07,
      referralProbability: 0.75,
    };
    const behavior = ['Quick installation', 'Eager exploration', 'Feature discovery'];

    const quality = calculateOutcomeQuality(metrics, behavior, earlyAdopterHappyPath);

    expect(quality.score).toBeGreaterThan(0);
    expect(quality.score).toBeLessThanOrEqual(1);
    expect(quality.metricScore).toBeDefined();
    expect(quality.behaviorScore).toBeDefined();
  });

  it('should generate recommendations for poor outcomes', () => {
    const metrics = {
      onboardingCompletion: 0.5,
      delightScore: 0.3,
      churnProbability: 0.6,
    };
    const behavior = ['Hesitant installation', 'High friction'];

    const recommendations = generateRecommendations(metrics, behavior, earlyAdopterHappyPath);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some((r) => r.includes('Improve'))).toBe(true);
  });

  it('should generate no recommendations for good outcomes', () => {
    const metrics = {
      onboardingCompletion: 0.95,
      timeToFirstValue: 180,
      frustrationScore: 0.1,
      delightScore: 0.85,
      churnProbability: 0.05,
      referralProbability: 0.8,
    };
    const behavior = ['Quick installation', 'Eager exploration', 'Feature discovery', 'Team sharing', 'Evangelist'];

    const recommendations = generateRecommendations(metrics, behavior, earlyAdopterHappyPath);

    expect(recommendations.length).toBe(0);
  });

  it('should handle missing expected outcome', () => {
    const outcome = getExpectedOutcome('unknown-scenario', 'unknown-persona');

    expect(outcome).toBeUndefined();
  });
});
