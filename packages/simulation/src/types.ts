/**
 * Simulation-related types
 */

import type { SimulationEvent, ProductState } from '@suts/core';

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
  events: SimulationEvent[];
  outcome?: 'continued' | 'churned' | 'referred' | 'frustrated' | 'delighted';
  summary?: string;
}
