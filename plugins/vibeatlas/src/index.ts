/**
 * SUTS VibeAtlas Plugin
 * Product adapter for VibeAtlas VS Code extension
 */

export * from './VibeAtlasAdapter';
export * from './config/VibeAtlasConfig';
export * from './config/FeatureFlags';
export * from './config/MetricThresholds';
export * from './features/TryModeFeature';
export * from './features/TokenCounterFeature';
export * from './features/ContextPreviewFeature';
export * from './features/DashboardFeature';
export * from './scenarios/OnboardingScenario';
export * from './scenarios/DailyUsageScenario';
export * from './scenarios/FrictionScenario';
export {
  getDelightMoments,
  identifyLikelyDelights,
  getDelightActions,
  simulateDelightEncounter,
  calculateReferralProbability,
} from './scenarios/DelightScenario';
export type { DelightMoment } from './scenarios/DelightScenario';
export * from './telemetry/EventMapper';
export {
  calculateOnboardingCompletionRate,
  calculateTimeToFirstValue,
  calculateFeatureAdoptionRate,
  calculateAverageSessionDuration,
  calculateFrictionScore,
  calculateChurnRate,
  calculateReferralRate,
  calculateNPS,
  calculateAllMetrics,
  calculatePersonaMetrics,
  calculateAggregatedMetrics,
} from './telemetry/MetricCalculator';
export type { MetricResult } from './telemetry/MetricCalculator';
export * from './testdata/PersonaTemplates';
export * from './testdata/ScenarioLibrary';
export * from './testdata/ExpectedOutcomes';
