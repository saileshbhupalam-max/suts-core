/**
 * SUTS Simulation package - Simulation engine for user journeys
 */

export { SimulationEngine } from './engine';
export { SimulationLoop } from './SimulationLoop';

// State management
export {
  StateTransitionMachine,
  PersonaState,
  TransitionEvent,
  type StateTransition,
  type TransitionContext,
} from './state/StateTransitions';

export {
  ActionProcessor,
  type PersonaAction,
  type ActionResult,
  type ActionProcessorConfig,
} from './state/ActionProcessor';

export {
  EventGenerator,
  type EventContext,
} from './state/EventGenerator';

// Behavior
export {
  ProbabilityEngine,
  SeededRandom,
  type WeightedChoice,
} from './behavior/ProbabilityEngine';

export {
  FrustrationTracker,
  type FrustrationEvent,
  type FrustrationState,
} from './behavior/FrustrationTracker';

export {
  DelightTracker,
  type DelightMoment,
  type DelightState,
} from './behavior/DelightTracker';

export {
  DecisionMaker,
  type DecisionContext,
  type Decision,
  type DecisionMakerConfig,
} from './behavior/DecisionMaker';

// Types
export type {
  SimulationSession,
  ProductState,
  SimulationEngineConfig,
  SimulationState,
  PersonaStateSnapshot,
} from './types';

export type {
  ProgressCallback,
  SimulationProgress,
  PersonaSimulationState,
  SimulationLoopConfig,
  SimulationLoopResult,
} from './SimulationLoop';
