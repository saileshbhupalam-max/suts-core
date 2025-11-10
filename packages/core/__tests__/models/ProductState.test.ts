/**
 * Tests for ProductState model
 */

import { describe, it, expect } from '@jest/globals';
import {
  ProductStateSchema,
  FeatureFlagSchema,
  UIElementSchema,
  validateProductState,
  safeValidateProductState,
  productStateToDescription,
  type ProductState,
  type FeatureFlag,
  type UIElement,
} from '../../src/models/ProductState';

describe('FeatureFlagSchema', () => {
  it('should validate simple boolean flag', () => {
    const flag: FeatureFlag = {
      enabled: true,
    };

    const result = FeatureFlagSchema.safeParse(flag);
    expect(result.success).toBe(true);
  });

  it('should validate flag with all fields', () => {
    const flag: FeatureFlag = {
      enabled: true,
      description: 'New feature',
      rolloutPercentage: 50,
    };

    const result = FeatureFlagSchema.safeParse(flag);
    expect(result.success).toBe(true);
  });

  it('should reject rollout percentage out of range', () => {
    const invalid = {
      enabled: true,
      rolloutPercentage: 150,
    };

    const result = FeatureFlagSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject negative rollout percentage', () => {
    const invalid = {
      enabled: true,
      rolloutPercentage: -10,
    };

    const result = FeatureFlagSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('UIElementSchema', () => {
  it('should validate UI element', () => {
    const element: UIElement = {
      type: 'button',
      visible: true,
      properties: {},
    };

    const result = UIElementSchema.safeParse(element);
    expect(result.success).toBe(true);
  });

  it('should allow default properties', () => {
    const element = {
      type: 'input',
      visible: false,
    };

    const result = UIElementSchema.safeParse(element);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.properties).toEqual({});
    }
  });

  it('should validate complex properties', () => {
    const element: UIElement = {
      type: 'modal',
      visible: true,
      properties: {
        width: 500,
        height: 300,
        title: 'Confirm Action',
        buttons: ['OK', 'Cancel'],
      },
    };

    const result = UIElementSchema.safeParse(element);
    expect(result.success).toBe(true);
  });
});

describe('ProductStateSchema', () => {
  const validState: ProductState = {
    version: '1.0.0',
    features: {},
    uiElements: {},
    config: {},
    userData: {},
    environment: 'development',
    metadata: {},
  };

  describe('valid state', () => {
    it('should validate minimal product state', () => {
      const result = ProductStateSchema.safeParse(validState);
      expect(result.success).toBe(true);
    });

    it('should validate with boolean features', () => {
      const state = {
        ...validState,
        features: {
          darkMode: true,
          betaFeatures: false,
        },
      };

      const result = ProductStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should validate with feature flag objects', () => {
      const state = {
        ...validState,
        features: {
          newUI: {
            enabled: true,
            description: 'New user interface',
            rolloutPercentage: 25,
          },
        },
      };

      const result = ProductStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should validate mixed feature types', () => {
      const state = {
        ...validState,
        features: {
          simpleFeature: true,
          advancedFeature: {
            enabled: false,
            description: 'Coming soon',
          },
        },
      };

      const result = ProductStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should validate with UI elements', () => {
      const state = {
        ...validState,
        uiElements: {
          loginButton: {
            type: 'button',
            visible: true,
            properties: { color: 'blue' },
          },
        },
      };

      const result = ProductStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should validate with performance metrics', () => {
      const state = {
        ...validState,
        performance: {
          loadTimeMs: 1500,
          responseTimeMs: 200,
          errorRate: 0.01,
        },
      };

      const result = ProductStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should validate with build info', () => {
      const state = {
        ...validState,
        buildNumber: 'build-1234',
        releaseDate: '2025-01-10T12:00:00.000Z',
      };

      const result = ProductStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });
  });

  describe('required fields', () => {
    it('should reject missing version', () => {
      const invalid = { ...validState, version: '' };
      const result = ProductStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('environment validation', () => {
    it('should validate all environments', () => {
      const environments: Array<'development' | 'staging' | 'production'> = [
        'development',
        'staging',
        'production',
      ];

      for (const environment of environments) {
        const state = { ...validState, environment };
        const result = ProductStateSchema.safeParse(state);
        expect(result.success).toBe(true);
      }
    });

    it('should default to development', () => {
      const state = { ...validState, environment: undefined };
      const result = ProductStateSchema.safeParse(state);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.environment).toBe('development');
      }
    });

    it('should reject invalid environment', () => {
      const invalid = { ...validState, environment: 'testing' };
      const result = ProductStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('performance metrics validation', () => {
    it('should reject negative load time', () => {
      const invalid = {
        ...validState,
        performance: {
          loadTimeMs: -1,
        },
      };

      const result = ProductStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject negative response time', () => {
      const invalid = {
        ...validState,
        performance: {
          responseTimeMs: -100,
        },
      };

      const result = ProductStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject error rate out of range', () => {
      const invalid = {
        ...validState,
        performance: {
          errorRate: 1.5,
        },
      };

      const result = ProductStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('default values', () => {
    it('should apply all defaults', () => {
      const minimal = {
        version: '1.0.0',
      };

      const result = ProductStateSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.features).toEqual({});
        expect(result.data.uiElements).toEqual({});
        expect(result.data.config).toEqual({});
        expect(result.data.userData).toEqual({});
        expect(result.data.environment).toBe('development');
        expect(result.data.metadata).toEqual({});
      }
    });
  });
});

describe('validateProductState', () => {
  const validState: ProductState = {
    version: '1.0.0',
    features: { feature1: true },
    uiElements: {},
    config: {},
    userData: {},
    environment: 'production',
    metadata: {},
  };

  it('should return validated state for valid data', () => {
    const result = validateProductState(validState);
    expect(result).toEqual(validState);
  });

  it('should throw error for invalid data', () => {
    const invalid = { ...validState, version: '' };
    expect(() => validateProductState(invalid)).toThrow();
  });
});

describe('safeValidateProductState', () => {
  const validState: ProductState = {
    version: '2.0.0',
    features: {},
    uiElements: {},
    config: {},
    userData: {},
    environment: 'staging',
    metadata: {},
  };

  it('should return success for valid data', () => {
    const result = safeValidateProductState(validState);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validState);
    }
  });

  it('should return error for invalid data', () => {
    const invalid = { ...validState, environment: 'invalid' };
    const result = safeValidateProductState(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

describe('productStateToDescription', () => {
  it('should describe state with boolean features', () => {
    const state: ProductState = {
      version: '1.0.0',
      features: {
        darkMode: true,
        betaFeatures: false,
        advancedSettings: true,
      },
      uiElements: {},
      config: {},
      userData: {},
      environment: 'development',
      metadata: {},
    };

    const description = productStateToDescription(state);
    expect(description).toContain('1.0.0');
    expect(description).toContain('darkMode');
    expect(description).toContain('advancedSettings');
    expect(description).not.toContain('betaFeatures');
  });

  it('should describe state with feature flag objects', () => {
    const state: ProductState = {
      version: '2.0.0',
      features: {
        newFeature: {
          enabled: true,
          description: 'New feature',
        },
        disabledFeature: {
          enabled: false,
          description: 'Disabled',
        },
      },
      uiElements: {},
      config: {},
      userData: {},
      environment: 'development',
      metadata: {},
    };

    const description = productStateToDescription(state);
    expect(description).toContain('2.0.0');
    expect(description).toContain('newFeature');
    expect(description).not.toContain('disabledFeature');
  });

  it('should handle empty features', () => {
    const state: ProductState = {
      version: '1.0.0',
      features: {},
      uiElements: {},
      config: {},
      userData: {},
      environment: 'development',
      metadata: {},
    };

    const description = productStateToDescription(state);
    expect(description).toContain('1.0.0');
    expect(description).toContain('none');
  });

  it('should handle mixed feature types', () => {
    const state: ProductState = {
      version: '1.5.0',
      features: {
        simple: true,
        complex: {
          enabled: true,
        },
        disabled: false,
      },
      uiElements: {},
      config: {},
      userData: {},
      environment: 'development',
      metadata: {},
    };

    const description = productStateToDescription(state);
    expect(description).toContain('1.5.0');
    expect(description).toContain('simple');
    expect(description).toContain('complex');
    expect(description).not.toContain('disabled');
  });
});
