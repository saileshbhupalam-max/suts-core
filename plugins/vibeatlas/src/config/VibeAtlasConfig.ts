/**
 * VibeAtlas product configuration
 */

/**
 * VibeAtlas configuration interface
 */
export interface VibeAtlasConfig {
  productName: string;
  version: string;
  features: {
    tryMode: boolean;
    tokenCounter: boolean;
    contextPreview: boolean;
    dashboard: boolean;
  };
  limits: {
    tryModeTokens: number;
    tryModeDurationDays: number;
    maxContextSize: number;
  };
  defaults: {
    enableTelemetry: boolean;
    showOnboarding: boolean;
  };
}

/**
 * Default VibeAtlas configuration
 */
export const defaultConfig: VibeAtlasConfig = {
  productName: 'VibeAtlas',
  version: '1.0.0',
  features: {
    tryMode: true,
    tokenCounter: true,
    contextPreview: true,
    dashboard: true,
  },
  limits: {
    tryModeTokens: 100000,
    tryModeDurationDays: 14,
    maxContextSize: 200000,
  },
  defaults: {
    enableTelemetry: true,
    showOnboarding: true,
  },
};

/**
 * Get VibeAtlas configuration
 */
export function getConfig(): VibeAtlasConfig {
  return { ...defaultConfig };
}
