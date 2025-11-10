/**
 * ProductState Data Model
 * Represents the configuration of a product being tested
 */

import { z } from 'zod';

/**
 * Feature flag schema
 */
export const FeatureFlagSchema = z.object({
  enabled: z.boolean(),
  description: z.string().optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
});

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

/**
 * UI element schema
 */
export const UIElementSchema = z.object({
  type: z.string().min(1),
  visible: z.boolean(),
  properties: z.record(z.unknown()).default({}),
});

export type UIElement = z.infer<typeof UIElementSchema>;

/**
 * Zod schema for ProductState
 * Represents current state of product being tested
 */
export const ProductStateSchema = z.object({
  // Version
  version: z.string().min(1, 'Version is required'),
  buildNumber: z.string().optional(),
  releaseDate: z.string().datetime().optional(),

  // Features
  features: z.record(z.union([z.boolean(), FeatureFlagSchema])).default({}),

  // UI Elements
  uiElements: z.record(UIElementSchema).default({}),

  // Configuration
  config: z.record(z.unknown()).default({}),

  // User Data (accumulated during simulation)
  userData: z.record(z.unknown()).default({}),

  // Performance
  performance: z.object({
    loadTimeMs: z.number().int().min(0).optional(),
    responseTimeMs: z.number().int().min(0).optional(),
    errorRate: z.number().min(0).max(1).optional(),
  }).optional(),

  // Metadata
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  metadata: z.record(z.unknown()).default({}),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type ProductState = z.infer<typeof ProductStateSchema>;

/**
 * Validate and parse product state data
 * @param data - Raw product state to validate
 * @returns Validated ProductState
 * @throws ZodError if validation fails
 */
export function validateProductState(data: unknown): ProductState {
  return ProductStateSchema.parse(data);
}

/**
 * Safely validate product state data without throwing
 * @param data - Raw product state to validate
 * @returns Validation result with data or error
 */
export function safeValidateProductState(data: unknown): z.SafeParseReturnType<unknown, ProductState> {
  return ProductStateSchema.safeParse(data);
}

/**
 * Convert product state to natural language description
 * @param state - Product state to describe
 * @returns Human-readable description
 */
export function productStateToDescription(state: ProductState): string {
  const featureList = Object.entries(state.features)
    .filter(([, value]) => {
      if (typeof value === 'boolean') {
return value;
}
      if (typeof value === 'object' && value !== null && 'enabled' in value) {
        return value.enabled;
      }
      return false;
    })
    .map(([key]) => key)
    .join(', ');

  return `Product version ${state.version} with features: ${featureList || 'none'}`;
}
