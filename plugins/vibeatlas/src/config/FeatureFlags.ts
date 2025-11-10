/**
 * Feature flags for VibeAtlas
 */

/**
 * Feature flag configuration
 */
export interface FeatureFlags {
  tryMode: boolean;
  tokenCounter: boolean;
  contextPreview: boolean;
  dashboard: boolean;
  shareFeature: boolean;
  exportFeature: boolean;
  advancedMetrics: boolean;
}

/**
 * Default feature flags
 */
export const defaultFeatureFlags: FeatureFlags = {
  tryMode: true,
  tokenCounter: true,
  contextPreview: true,
  dashboard: true,
  shareFeature: true,
  exportFeature: true,
  advancedMetrics: false,
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  feature: keyof FeatureFlags,
  flags: FeatureFlags = defaultFeatureFlags
): boolean {
  return flags[feature] === true;
}

/**
 * Get enabled features
 */
export function getEnabledFeatures(
  flags: FeatureFlags = defaultFeatureFlags
): string[] {
  return Object.entries(flags)
    .filter(([, enabled]) => enabled === true)
    .map(([feature]) => feature);
}
