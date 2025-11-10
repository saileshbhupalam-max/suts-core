/**
 * Simulation engine implementation
 */

import type { PersonaProfile } from '@suts/persona';
import type {
  SimulationEngineConfig,
  SimulationState,
  ProductState,
  PersonaStateSnapshot,
} from './types';
import {
  SimulationLoop,
  type ProgressCallback,
} from './SimulationLoop';

/**
 * Main simulation engine for running persona simulations
 */
export class SimulationEngine {
  private config: SimulationEngineConfig;

  /**
   * Create a new simulation engine
   * @param config - Configuration for the simulation
   */
  constructor(config: SimulationEngineConfig) {
    this.config = config;
    this.config.batchSize = config.batchSize ?? 10;
    this.config.maxActionsPerDay = config.maxActionsPerDay ?? 5;

    if (this.config.seed === undefined) {
      throw new Error('Seed is required for deterministic simulation');
    }
  }

  /**
   * Run simulation for given personas and days
   * @param personas - Array of persona profiles to simulate
   * @param product - Product state being tested
   * @param days - Number of days to simulate
   * @param onProgress - Optional progress callback
   * @returns Complete simulation state
   */
  async run(
    personas: PersonaProfile[],
    product: ProductState,
    days: number,
    onProgress?: ProgressCallback
  ): Promise<SimulationState> {
    if (personas.length === 0) {
      throw new Error('At least one persona is required');
    }

    if (days <= 0) {
      throw new Error('Days must be positive');
    }

    const startedAt = new Date();

    // Create and run simulation loop
    const loopConfig: { seed: number; batchSize: number; maxActionsPerDay: number; apiKey?: string; model?: string } = {
      seed: this.config.seed,
      batchSize: this.config.batchSize!,
      maxActionsPerDay: this.config.maxActionsPerDay!,
    };
    if (this.config.apiKey !== undefined) {
      loopConfig.apiKey = this.config.apiKey;
    }
    if (this.config.model !== undefined) {
      loopConfig.model = this.config.model;
    }
    const loop = new SimulationLoop(loopConfig);

    const result = await loop.run(personas, product, days, onProgress);

    const completedAt = new Date();

    // Convert to SimulationState
    const personaSnapshots: PersonaStateSnapshot[] = [];

    for (const [personaId, state] of result.personaStates.entries()) {
      personaSnapshots.push({
        personaId,
        finalState: state.currentState,
        totalActions: state.totalActions,
        frustrationLevel: state.emotionalState.frustration,
        delightLevel: state.emotionalState.delight,
        confidenceLevel: state.emotionalState.confidence,
        confusionLevel: state.emotionalState.confusion,
        events: state.events,
      });
    }

    return {
      personas: personaSnapshots,
      events: result.allEvents,
      metadata: {
        totalDays: days,
        totalPersonas: personas.length,
        totalEvents: result.allEvents.length,
        startedAt,
        completedAt,
        seed: this.config.seed,
      },
    };
  }

  /**
   * Get configuration
   */
  getConfig(): SimulationEngineConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SimulationEngineConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
