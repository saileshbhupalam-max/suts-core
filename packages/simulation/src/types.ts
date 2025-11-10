/**
 * Simulation-related types
 */

import type { SimulationEvent } from '@suts/core';

/**
 * A single simulation session
 */
export interface SimulationSession {
  id: string;
  personaId: string;
  sessionNumber: number;
  startTime: Date;
  endTime?: Date;
  events: SimulationEvent[];
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
