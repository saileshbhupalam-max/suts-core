/**
 * IProductAdapter Interface
 * Defines contract for product-specific integrations
 * Allows SUTS to interact with actual products or product simulations
 */

import { ProductState } from '../models/index';

/**
 * Action to be performed in the product
 */
export interface ProductAction {
  /**
   * Type of action
   */
  type: string;

  /**
   * Parameters for the action
   */
  parameters: Record<string, unknown>;

  /**
   * Context in which action is performed
   */
  context?: Record<string, unknown>;
}

/**
 * Response from product after action
 */
export interface ProductResponse {
  /**
   * Whether action succeeded
   */
  success: boolean;

  /**
   * Result data from action
   */
  data?: unknown;

  /**
   * Error message if failed
   */
  error?: string;

  /**
   * Updated product state after action
   */
  newState?: Partial<ProductState>;

  /**
   * Observable changes (for UI feedback)
   */
  observations?: string[];

  /**
   * Performance metrics
   */
  performance?: {
    executionTimeMs: number;
    memoryUsedMb?: number;
  };
}

/**
 * Configuration for product adapter
 */
export interface ProductAdapterConfig {
  /**
   * Product identifier
   */
  productId: string;

  /**
   * Product version
   */
  version: string;

  /**
   * Connection configuration
   */
  connection?: {
    /**
     * API endpoint (if remote)
     */
    apiUrl?: string;

    /**
     * Authentication credentials
     */
    credentials?: Record<string, string>;

    /**
     * Timeout in milliseconds
     */
    timeoutMs?: number;
  };

  /**
   * Simulation mode (if not using real product)
   */
  simulationMode?: boolean;

  /**
   * Additional configuration
   */
  options?: Record<string, unknown>;
}

/**
 * IProductAdapter Interface
 * Product-specific interface for SUTS integration
 * Implement this interface to connect SUTS to your product
 */
export interface IProductAdapter {
  /**
   * Initialize connection to product
   *
   * @param config - Configuration for connection
   * @returns Promise resolving when initialized
   * @throws Error if initialization fails
   */
  initialize(config: ProductAdapterConfig): Promise<void>;

  /**
   * Get current product state
   *
   * @returns Promise resolving to current product state
   * @throws Error if retrieval fails
   */
  getProductState(): Promise<ProductState>;

  /**
   * Execute an action in the product
   *
   * @param action - Action to execute
   * @returns Promise resolving to product response
   * @throws Error if action fails
   *
   * @example
   * ```typescript
   * const response = await adapter.executeAction({
   *   type: 'install',
   *   parameters: { version: '1.0.0' }
   * });
   * if (response.success) {
   *   console.log('Installation successful');
   * }
   * ```
   */
  executeAction(action: ProductAction): Promise<ProductResponse>;

  /**
   * Simulate product response (for testing without real product)
   *
   * @param action - Action to simulate
   * @param currentState - Current product state
   * @returns Promise resolving to simulated response
   */
  simulateAction(action: ProductAction, currentState: ProductState): Promise<ProductResponse>;

  /**
   * Reset product to initial state
   *
   * @returns Promise resolving when reset complete
   * @throws Error if reset fails
   */
  reset(): Promise<void>;

  /**
   * Validate that product is in expected state
   *
   * @param expectedState - Expected product state
   * @returns Promise resolving to validation result
   */
  validateState(expectedState: Partial<ProductState>): Promise<{
    valid: boolean;
    differences: Record<string, { expected: unknown; actual: unknown }>;
  }>;

  /**
   * Get available actions for current product state
   *
   * @returns Promise resolving to list of available actions
   */
  getAvailableActions(): Promise<string[]>;

  /**
   * Clean up and close connection
   *
   * @returns Promise resolving when cleanup complete
   */
  cleanup(): Promise<void>;

  /**
   * Check if product is healthy and responding
   *
   * @returns Promise resolving to health status
   */
  healthCheck(): Promise<{
    healthy: boolean;
    latencyMs: number;
    message?: string;
  }>;
}
