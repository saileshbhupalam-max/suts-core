/**
 * Simulation-related types
 */

import type { TelemetryEvent, ProductState } from '@suts/core';
import type { PersonaState } from './state/StateTransitions';

export type { ProductState };

/**
 * A single simulation session
 */
export interface SimulationSession {
  id: string;
  personaId: string;
  sessionNumber: number;
  startTime: Date;
  endTime?: Date;
  events: TelemetryEvent[];
  outcome?: 'continued' | 'churned' | 'referred' | 'frustrated' | 'delighted';
  summary?: string;
}

/**
 * Configuration for simulation engine
 */
export interface SimulationEngineConfig {
  seed: number;
  batchSize?: number;
  maxActionsPerDay?: number;
  apiKey?: string;
  model?: string;
}

/**
 * Overall simulation state
 */
export interface SimulationState {
  personas: PersonaStateSnapshot[];
  events: TelemetryEvent[];
  metadata: {
    totalDays: number;
    totalPersonas: number;
    totalEvents: number;
    startedAt: Date;
    completedAt: Date;
    seed: number;
  };
}

/**
 * Snapshot of a persona's state at end of simulation
 */
export interface PersonaStateSnapshot {
  personaId: string;
  finalState: PersonaState;
  totalActions: number;
  frustrationLevel: number;
  delightLevel: number;
  confidenceLevel: number;
  confusionLevel: number;
  events: TelemetryEvent[];
}
