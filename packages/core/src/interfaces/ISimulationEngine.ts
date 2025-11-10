/**
 * ISimulationEngine Interface
 * Defines contract for running simulations with personas
 */

import { PersonaProfile, SimulationState, TelemetryEvent, ProductState } from '../models/index';

/**
 * Configuration for simulation execution
 */
export interface SimulationConfig {
  /**
   * Unique identifier for this simulation
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Description of what is being tested
   */
  description: string;

  /**
   * Personas to simulate
   */
  personas: PersonaProfile[];

  /**
   * Product state to test
   */
  productState: ProductState;

  /**
   * Number of sessions to simulate (e.g., days)
   * @default 30
   */
  numSessions?: number;

  /**
   * Time compression factor (1 = real-time, 10 = 10x faster)
   * @default 1
   */
  timeCompression?: number;

  /**
   * Maximum parallel simulations
   * @default 50
   */
  maxParallel?: number;

  /**
   * Calibration data from real users (optional)
   */
  calibrationData?: Record<string, unknown>;

  /**
   * Additional configuration
   */
  metadata?: Record<string, unknown>;
}

/**
 * Result of a simulation run
 */
export interface SimulationResult {
  /**
   * Simulation identifier
   */
  simulationId: string;

  /**
   * Final state of simulation
   */
  state: SimulationState;

  /**
   * All events that occurred
   */
  events: TelemetryEvent[];

  /**
   * Summary metrics
   */
  summary: {
    totalUsers: number;
    totalSessions: number;
    avgSessionsPerUser: number;
    retentionRate: number;
    churnRate: number;
    referralRate: number;
  };

  /**
   * Execution metadata
   */
  metadata: {
    startTime: string;
    endTime: string;
    durationMs: number;
    successfulSimulations: number;
    failedSimulations: number;
    errors: Array<{ personaId: string; error: string }>;
  };
}

/**
 * Callback for simulation progress updates
 */
export type SimulationProgressCallback = (progress: {
  completedSessions: number;
  totalSessions: number;
  percentComplete: number;
  currentPhase: string;
}) => void;

/**
 * Callback for simulation events
 */
export type SimulationEventCallback = (event: TelemetryEvent) => void;

/**
 * ISimulationEngine Interface
 * Execute user journey simulations with LLM-based agents
 */
export interface ISimulationEngine {
  /**
   * Run a simulation with configured personas and product state
   *
   * @param config - Simulation configuration
   * @returns Promise resolving to simulation results
   * @throws Error if simulation fails
   *
   * @example
   * ```typescript
   * const result = await engine.runSimulation({
   *   id: 'sim-001',
   *   name: 'Test Feature X',
   *   description: 'Testing new onboarding flow',
   *   personas: personas,
   *   productState: productState,
   *   numSessions: 30
   * });
   * console.log(`Retention: ${result.summary.retentionRate}`);
   * ```
   */
  runSimulation(config: SimulationConfig): Promise<SimulationResult>;

  /**
   * Run simulation for a single persona
   *
   * @param persona - Persona to simulate
   * @param productState - Product state to test
   * @param numSessions - Number of sessions
   * @returns Promise resolving to persona's journey
   * @throws Error if simulation fails
   */
  simulatePersonaJourney(
    persona: PersonaProfile,
    productState: ProductState,
    numSessions: number
  ): Promise<{
    personaId: string;
    events: TelemetryEvent[];
    outcome: 'continued' | 'churned' | 'referred';
  }>;

  /**
   * Pause an ongoing simulation
   *
   * @param simulationId - Simulation to pause
   * @returns Promise resolving when paused
   * @throws Error if simulation not found or cannot be paused
   */
  pauseSimulation(simulationId: string): Promise<void>;

  /**
   * Resume a paused simulation
   *
   * @param simulationId - Simulation to resume
   * @returns Promise resolving when resumed
   * @throws Error if simulation not found or cannot be resumed
   */
  resumeSimulation(simulationId: string): Promise<void>;

  /**
   * Cancel a running simulation
   *
   * @param simulationId - Simulation to cancel
   * @returns Promise resolving when cancelled
   * @throws Error if simulation not found
   */
  cancelSimulation(simulationId: string): Promise<void>;

  /**
   * Get current state of a simulation
   *
   * @param simulationId - Simulation identifier
   * @returns Promise resolving to current state
   * @throws Error if simulation not found
   */
  getSimulationState(simulationId: string): Promise<SimulationState>;

  /**
   * Register callback for progress updates
   *
   * @param simulationId - Simulation to monitor
   * @param callback - Callback function
   */
  onProgress(simulationId: string, callback: SimulationProgressCallback): void;

  /**
   * Register callback for simulation events
   *
   * @param simulationId - Simulation to monitor
   * @param callback - Callback function
   */
  onEvent(simulationId: string, callback: SimulationEventCallback): void;
}
