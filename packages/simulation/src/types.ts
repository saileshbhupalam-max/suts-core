/**
 * Simulation-related types
 */

import type { TelemetryEvent } from '@suts/core';
import type { PersonaState } from './state/StateTransitions';

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
 * Product state being tested
 */
export interface ProductState {
  features: Record<string, boolean>;
  uiElements: Record<string, Record<string, unknown>>;
  data: Record<string, unknown>;
  version: string;
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
