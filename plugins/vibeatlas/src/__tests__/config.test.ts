/**
 * Tests for configuration modules
 */

import { getConfig, defaultConfig } from '../config/VibeAtlasConfig';
import {
  defaultFeatureFlags,
  isFeatureEnabled,
  getEnabledFeatures,
  type FeatureFlags,
} from '../config/FeatureFlags';
import { defaultThresholds, evaluateMetrics, type MetricThresholds } from '../config/MetricThresholds';

describe('VibeAtlasConfig', () => {
  it('should return default configuration', () => {
    const config = getConfig();

    expect(config.productName).toBe('VibeAtlas');
    expect(config.version).toBe('1.0.0');
    expect(config.features.tryMode).toBe(true);
    expect(config.limits.tryModeTokens).toBe(100000);
  });

  it('should have all required configuration properties', () => {
    expect(defaultConfig.productName).toBeDefined();
    expect(defaultConfig.version).toBeDefined();
    expect(defaultConfig.features).toBeDefined();
    expect(defaultConfig.limits).toBeDefined();
    expect(defaultConfig.defaults).toBeDefined();
  });
});

describe('FeatureFlags', () => {
  it('should have all features enabled by default', () => {
    expect(defaultFeatureFlags.tryMode).toBe(true);
    expect(defaultFeatureFlags.tokenCounter).toBe(true);
    expect(defaultFeatureFlags.contextPreview).toBe(true);
    expect(defaultFeatureFlags.dashboard).toBe(true);
  });

  it('should check if feature is enabled', () => {
    expect(isFeatureEnabled('tryMode')).toBe(true);
    expect(isFeatureEnabled('tokenCounter')).toBe(true);
  });

  it('should check feature with custom flags', () => {
    const customFlags: FeatureFlags = {
      ...defaultFeatureFlags,
      tryMode: false,
    };

    expect(isFeatureEnabled('tryMode', customFlags)).toBe(false);
    expect(isFeatureEnabled('tokenCounter', customFlags)).toBe(true);
  });

  it('should get enabled features', () => {
    const enabled = getEnabledFeatures();

    expect(enabled).toContain('tryMode');
    expect(enabled).toContain('tokenCounter');
    expect(enabled).toContain('contextPreview');
    expect(enabled).toContain('dashboard');
  });

  it('should filter disabled features', () => {
    const customFlags: FeatureFlags = {
      ...defaultFeatureFlags,
      tryMode: false,
      advancedMetrics: false,
    };

    const enabled = getEnabledFeatures(customFlags);

    expect(enabled).not.toContain('tryMode');
    expect(enabled).not.toContain('advancedMetrics');
    expect(enabled).toContain('tokenCounter');
  });
});

describe('MetricThresholds', () => {
  it('should have default thresholds defined', () => {
    expect(defaultThresholds.onboarding).toBeDefined();
    expect(defaultThresholds.engagement).toBeDefined();
    expect(defaultThresholds.satisfaction).toBeDefined();
    expect(defaultThresholds.adoption).toBeDefined();
  });

  it('should evaluate GO decision for good metrics', () => {
    const metrics = {
      onboardingCompletionRate: 0.85,
      onboardingTimeToFirstValue: 200,
      onboardingFrustrationScore: 0.2,
      dailyActiveUsers: 0.5,
      sessionDuration: 700,
      delightScore: 0.7,
      nps: 40,
      churnRate: 0.15,
      featureDiscovery: 0.85,
      featureUsage: 0.6,
    };

    const result = evaluateMetrics(metrics);

    expect(result.decision).toBe('GO');
    expect(result.score).toBeGreaterThan(0.8);
  });

  it('should evaluate NO-GO decision for poor metrics', () => {
    const metrics = {
      onboardingCompletionRate: 0.4,
      onboardingTimeToFirstValue: 800,
      onboardingFrustrationScore: 0.7,
      dailyActiveUsers: 0.2,
      sessionDuration: 300,
      delightScore: 0.3,
      nps: 10,
      churnRate: 0.5,
    };

    const result = evaluateMetrics(metrics);

    expect(result.decision).toBe('NO-GO');
    expect(result.score).toBeLessThan(0.6);
  });

  it('should evaluate CAUTION decision for mixed metrics', () => {
    const metrics = {
      onboardingCompletionRate: 0.68,
      onboardingTimeToFirstValue: 320,
      onboardingFrustrationScore: 0.32,
      dailyActiveUsers: 0.38,
      sessionDuration: 580,
      delightScore: 0.58,
      nps: 28,
      churnRate: 0.22,
      featureDiscovery: 0.7,
      featureUsage: 0.48,
    };

    const result = evaluateMetrics(metrics);

    expect(['CAUTION', 'GO', 'NO-GO']).toContain(result.decision);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('should identify failed metrics', () => {
    const metrics = {
      onboardingCompletionRate: 0.5,
      delightScore: 0.4,
    };

    const result = evaluateMetrics(metrics);

    expect(result.failedMetrics.length).toBeGreaterThan(0);
    expect(result.failedMetrics).toContain('onboarding.completionRate');
    expect(result.failedMetrics).toContain('satisfaction.delightScore');
  });

  it('should provide recommendations for failed metrics', () => {
    const metrics = {
      onboardingCompletionRate: 0.5,
      delightScore: 0.4,
    };

    const result = evaluateMetrics(metrics);

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.some((r) => r.includes('onboarding.completionRate'))).toBe(true);
  });

  it('should handle custom thresholds', () => {
    const customThresholds: MetricThresholds = {
      ...defaultThresholds,
      onboarding: {
        completionRate: 0.9,
        timeToFirstValue: 200,
        frustrationScore: 0.2,
      },
    };

    const metrics = {
      onboardingCompletionRate: 0.85,
    };

    const result = evaluateMetrics(metrics, customThresholds);

    expect(result.failedMetrics).toContain('onboarding.completionRate');
  });
});
