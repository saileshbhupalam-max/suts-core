/**
 * Time-step simulation loop with parallel persona processing
 */

import type { PersonaProfile } from '@suts/persona';
import type { SimulationEvent, EmotionalState } from '@suts/core';
import { ActionType } from '@suts/core';
import type { ProductState } from './types';
import { PersonaState, StateTransitionMachine } from './state/StateTransitions';
import { ActionProcessor, type PersonaAction } from './state/ActionProcessor';
import { EventGenerator, type EventContext } from './state/EventGenerator';
import { ProbabilityEngine } from './behavior/ProbabilityEngine';
import { FrustrationTracker } from './behavior/FrustrationTracker';
import { DelightTracker } from './behavior/DelightTracker';
import { DecisionMaker } from './behavior/DecisionMaker';
import { randomUUID } from 'node:crypto';

/**
 * Progress callback for monitoring simulation
 */
export type ProgressCallback = (progress: SimulationProgress) => void;

/**
 * Progress information
 */
export interface SimulationProgress {
  currentDay: number;
  totalDays: number;
  personasProcessed: number;
  totalPersonas: number;
  eventsGenerated: number;
}

/**
 * Persona simulation state
 */
export interface PersonaSimulationState {
  personaId: string;
  currentState: PersonaState;
  emotionalState: EmotionalState;
  events: SimulationEvent[];
  daysSinceLastAction: number;
  totalActions: number;
  consecutiveActions: number;
  lastActionDay: number;
}

/**
 * Configuration for simulation loop
 */
export interface SimulationLoopConfig {
  seed: number;
  batchSize: number;
  maxActionsPerDay: number;
  apiKey?: string;
  model?: string;
}

/**
 * Result of a simulation run
 */
export interface SimulationLoopResult {
  personaStates: Map<string, PersonaSimulationState>;
  allEvents: SimulationEvent[];
  finalDay: number;
}

/**
 * Simulation loop implementation
 */
export class SimulationLoop {
  private config: SimulationLoopConfig;
  private probabilityEngine: ProbabilityEngine;
  private stateTransitionMachine: StateTransitionMachine;
  private actionProcessor: ActionProcessor;
  private eventGenerator: EventGenerator;
  private frustrationTracker: FrustrationTracker;
  private delightTracker: DelightTracker;
  private decisionMaker: DecisionMaker;

  private paused = false;
  private stopped = false;

  constructor(config: SimulationLoopConfig) {
    this.config = config;
    this.probabilityEngine = new ProbabilityEngine(config.seed);
    this.stateTransitionMachine = new StateTransitionMachine();
    this.actionProcessor = new ActionProcessor();
    this.eventGenerator = new EventGenerator();
    this.frustrationTracker = new FrustrationTracker();
    this.delightTracker = new DelightTracker();

    const decisionConfig: any = {};
    if (config.apiKey !== undefined) {
      decisionConfig.apiKey = config.apiKey;
    }
    if (config.model !== undefined) {
      decisionConfig.model = config.model;
    }
    this.decisionMaker = new DecisionMaker(Object.keys(decisionConfig).length > 0 ? decisionConfig : undefined);
  }

  /**
   * Run simulation for given personas and days
   */
  async run(
    personas: PersonaProfile[],
    product: ProductState,
    days: number,
    onProgress?: ProgressCallback
  ): Promise<SimulationLoopResult> {
    // Initialize persona states
    const personaStates = this.initializePersonaStates(personas);
    const allEvents: SimulationEvent[] = [];

    // Time-step iteration
    for (let day = 1; day <= days; day++) {
      if (this.stopped) {
        break;
      }

      while (this.paused) {
        await new Promise<void>((resolve) => {
          const timer: NodeJS.Timeout = setTimeout(() => resolve(), 100);
          void timer;
        });
      }

      // Process personas in batches
      await this.processDayInBatches(
        day,
        personas,
        personaStates,
        product,
        allEvents
      );

      // Report progress
      if (onProgress) {
        onProgress({
          currentDay: day,
          totalDays: days,
          personasProcessed: personas.length,
          totalPersonas: personas.length,
          eventsGenerated: allEvents.length,
        });
      }
    }

    return {
      personaStates,
      allEvents,
      finalDay: days,
    };
  }

  /**
   * Process a single day for all personas in batches
   */
  private async processDayInBatches(
    day: number,
    personas: PersonaProfile[],
    personaStates: Map<string, PersonaSimulationState>,
    product: ProductState,
    allEvents: SimulationEvent[]
  ): Promise<void> {
    const batchSize = this.config.batchSize;

    for (let i = 0; i < personas.length; i += batchSize) {
      const batch = personas.slice(i, i + batchSize);

      // Process batch in parallel
      await Promise.all(
        batch.map((persona) =>
          this.processPersonaDay(day, persona, personaStates, product, allEvents)
        )
      );
    }
  }

  /**
   * Process a single persona for one day
   */
  private async processPersonaDay(
    day: number,
    _persona: PersonaProfile,
    personaStates: Map<string, PersonaSimulationState>,
    product: ProductState,
    allEvents: SimulationEvent[]
  ): Promise<void> {
    const state = personaStates.get(persona.id)!;

    // Skip if churned
    if (state.currentState === PersonaState.CHURNED) {
      return;
    }

    // Update time-based trackers
    this.updateTimeBasedState(state, day);

    // Check for state transitions based on time
    this.checkTimeBasedTransitions(state, persona);

    // Determine number of actions for this day
    const numActions = this.determineActionsForDay(state, persona);

    // Process each action
    for (let i = 0; i < numActions; i++) {
// @ts-expect-error - Defensive runtime check
      if (state.currentState === PersonaState.CHURNED) {
        break;
      }

      await this.processAction(day, persona, state, product, allEvents);
    }
  }

  /**
   * Process a single action for a persona
   */
  private async processAction(
    day: number,
    _persona: PersonaProfile,
    state: PersonaSimulationState,
    product: ProductState,
    allEvents: SimulationEvent[]
  ): Promise<void> {
    const sessionId = randomUUID();

    // Decide next action
    const decision = await this.decisionMaker.decide({
      persona,
      productState: product,
      emotionalState: state.emotionalState,
      currentDay: day,
      previousActions: this.getPreviousActions(state),
      availableActions: this.getAvailableActions(state.currentState),
    });

    // Create action
    const baseAction: PersonaAction = {
      type: decision.action,
      timestamp: new Date(),
      personaId: persona.id,
      success: this.determineActionSuccess(decision, persona, product),
      duration: this.probabilityEngine.getRNG().nextInt(1, 30),
    };

    const action: PersonaAction = {
      ...baseAction,
      ...(decision.target !== undefined && { target: decision.target }),
      ...(decision.parameters !== undefined && { parameters: decision.parameters }),
      ...(decision.reasoning !== undefined && { reasoning: decision.reasoning }),
    };

    // Process action
    const result = this.actionProcessor.processAction(
      action,
      persona,
      product,
      state.emotionalState
    );

    // Update trackers
    if (result.action.success) {
      this.frustrationTracker.recordSuccess(persona.id);
      if (
        result.emotionalImpact.delight &&
        result.emotionalImpact.delight > 0.5
      ) {
        this.delightTracker.recordDelight(
          persona.id,
          result.emotionalImpact.delight,
          action.type,
          'feature',
          action.timestamp,
          persona
        );
      }
    } else {
      this.frustrationTracker.recordFrustration(
        persona.id,
        0.2,
        `Failed to ${action.type}`,
        true,
        action.timestamp
      );
    }

    // Update emotional state
    state.emotionalState = {
      ...state.emotionalState,
      ...result.emotionalImpact,
    };

    state.emotionalState = this.frustrationTracker.updateEmotionalState(
      persona.id,
      state.emotionalState
    );

    state.emotionalState = this.delightTracker.updateEmotionalState(
      persona.id,
      state.emotionalState
    );

    // Generate events
    const eventContext: EventContext = {
      personaId: persona.id,
      day,
      sessionId,
      emotionalState: state.emotionalState,
    };

    const events = this.eventGenerator.generateEventsFromResult(
      result,
      eventContext
    );

    state.events.push(...events);
    allEvents.push(...events);

    // Update state counters
    state.totalActions++;
    state.lastActionDay = day;
    if (result.action.success) {
      state.consecutiveActions++;
    } else {
      state.consecutiveActions = 0;
    }

    // Check for state transitions
    this.checkActionBasedTransitions(state, persona, day);
  }

  /**
   * Initialize persona states
   */
  private initializePersonaStates(
    personas: PersonaProfile[]
  ): Map<string, PersonaSimulationState> {
    const states = new Map<string, PersonaSimulationState>();

    for (const persona of personas) {
      this.frustrationTracker.initializePersona(persona.id, persona);
      this.delightTracker.initializePersona(persona.id, persona);

      states.set(persona.id, {
        personaId: persona.id,
        currentState: PersonaState.NEW,
        emotionalState: {
          frustration: 0,
          confidence: persona.confidenceScore || 0.5,
          delight: 0,
          confusion: 0,
        },
        events: [],
        daysSinceLastAction: 0,
        totalActions: 0,
        consecutiveActions: 0,
        lastActionDay: 0,
      });
    }

    return states;
  }

  /**
   * Update time-based state
   */
  private updateTimeBasedState(state: PersonaSimulationState, day: number): void {
    if (state.lastActionDay > 0) {
      state.daysSinceLastAction = day - state.lastActionDay;
    }

    this.frustrationTracker.updateOverTime(state.personaId, 24 * 60);
    this.delightTracker.updateOverTime(state.personaId, 1);
  }

  /**
   * Check for time-based state transitions
   */
  private checkTimeBasedTransitions(
    state: PersonaSimulationState,
    __persona: PersonaProfile
  ): void {
    const newState = this.stateTransitionMachine.evaluateTransitions({
      currentState: state.currentState,
      frustrationLevel: state.emotionalState.frustration,
      delightLevel: state.emotionalState.delight,
      consecutiveActions: state.consecutiveActions,
      daysSinceLastAction: state.daysSinceLastAction,
      totalActions: state.totalActions,
      currentDay: 0, // Not used for time-based transitions
    });

    if (newState) {
      state.currentState = newState;
    }
  }

  /**
   * Check for action-based state transitions
   */
  private checkActionBasedTransitions(
    state: PersonaSimulationState,
    __persona: PersonaProfile,
    day: number
  ): void {
    const newState = this.stateTransitionMachine.evaluateTransitions({
      currentState: state.currentState,
      frustrationLevel: state.emotionalState.frustration,
      delightLevel: state.emotionalState.delight,
      consecutiveActions: state.consecutiveActions,
      daysSinceLastAction: state.daysSinceLastAction,
      totalActions: state.totalActions,
      currentDay: day,
    });

    if (newState) {
      state.currentState = newState;
    }
  }

  /**
   * Determine number of actions for the day
   */
  private determineActionsForDay(
    state: PersonaSimulationState,
    _persona: PersonaProfile
  ): number {
    if (state.currentState === PersonaState.NEW) {
      return 1; // First action only
    }

    // Base on persona patience and current emotional state
    const baseActions = this.config.maxActionsPerDay;
    const multiplier = persona.patienceLevel * (1 - state.emotionalState.frustration);

    return Math.max(1, Math.floor(baseActions * multiplier));
  }

  /**
   * Determine if action succeeds
   */
  private determineActionSuccess(
    decision: { action: ActionType; confidence: number },
    _persona: PersonaProfile,
    _product: ProductState
  ): boolean {
    let probability = decision.confidence;

    // Adjust based on experience
    if (persona.experienceLevel === 'Expert') {
      probability += 0.15;
    } else if (persona.experienceLevel === 'Novice') {
      probability -= 0.1;
    }

    return this.probabilityEngine.occurs(Math.max(0.1, Math.min(0.95, probability)));
  }

  /**
   * Get previous actions for context
   */
  private getPreviousActions(state: PersonaSimulationState): string[] {
    return state.events
      .filter((e) => e.eventType === 'action')
      .slice(-5)
      .map((e) => e.action || 'unknown');
  }

  /**
   * Get available actions based on state
   */
  private getAvailableActions(state: PersonaState): ActionType[] {
    const allActions: ActionType[] = [
      ActionType.INSTALL,
      ActionType.CONFIGURE,
      ActionType.USE_FEATURE,
      ActionType.READ_DOCS,
      ActionType.SEEK_HELP,
      ActionType.CUSTOMIZE,
      ActionType.SHARE,
      ActionType.UNINSTALL,
    ];

    if (state === PersonaState.NEW) {
      return [ActionType.INSTALL, ActionType.READ_DOCS];
    }

    return allActions;
  }

  /**
   * Pause simulation
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume simulation
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * Stop simulation
   */
  stop(): void {
    this.stopped = true;
  }

  /**
   * Check if simulation is paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Check if simulation is stopped
   */
  isStopped(): boolean {
    return this.stopped;
  }
}
