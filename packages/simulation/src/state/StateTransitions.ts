/**
 * State transitions for persona lifecycle in simulation
 */

/**
 * Valid persona states during simulation
 */
export enum PersonaState {
  NEW = 'new',
  ACTIVE = 'active',
  RETAINED = 'retained',
  CHURNED = 'churned',
}

/**
 * Transition events that trigger state changes
 */
export enum TransitionEvent {
  FIRST_ACTION = 'first_action',
  CONTINUED_USE = 'continued_use',
  POSITIVE_EXPERIENCE = 'positive_experience',
  NEGATIVE_EXPERIENCE = 'negative_experience',
  FRUSTRATION_THRESHOLD = 'frustration_threshold',
  DELIGHT_THRESHOLD = 'delight_threshold',
  INACTIVITY = 'inactivity',
}

/**
 * Valid state transition definition
 */
export interface StateTransition {
  from: PersonaState;
  to: PersonaState;
  event: TransitionEvent;
  condition?: (context: TransitionContext) => boolean;
}

/**
 * Context for evaluating state transitions
 */
export interface TransitionContext {
  currentState: PersonaState;
  frustrationLevel: number;
  delightLevel: number;
  consecutiveActions: number;
  daysSinceLastAction: number;
  totalActions: number;
  currentDay: number;
}

/**
 * State transition machine for persona lifecycle
 */
export class StateTransitionMachine {
  private transitions: StateTransition[] = [
    {
      from: PersonaState.NEW,
      to: PersonaState.ACTIVE,
      event: TransitionEvent.FIRST_ACTION,
    },
    {
      from: PersonaState.ACTIVE,
      to: PersonaState.RETAINED,
      event: TransitionEvent.POSITIVE_EXPERIENCE,
      condition: (ctx) => ctx.consecutiveActions >= 3 && ctx.delightLevel > 0.6,
    },
    {
      from: PersonaState.ACTIVE,
      to: PersonaState.RETAINED,
      event: TransitionEvent.CONTINUED_USE,
      condition: (ctx) => ctx.totalActions >= 5 && ctx.frustrationLevel < 0.3,
    },
    {
      from: PersonaState.ACTIVE,
      to: PersonaState.CHURNED,
      event: TransitionEvent.FRUSTRATION_THRESHOLD,
      condition: (ctx) => ctx.frustrationLevel >= 0.8,
    },
    {
      from: PersonaState.ACTIVE,
      to: PersonaState.CHURNED,
      event: TransitionEvent.INACTIVITY,
      condition: (ctx) => ctx.daysSinceLastAction >= 3,
    },
    {
      from: PersonaState.RETAINED,
      to: PersonaState.CHURNED,
      event: TransitionEvent.FRUSTRATION_THRESHOLD,
      condition: (ctx) => ctx.frustrationLevel >= 0.9,
    },
    {
      from: PersonaState.RETAINED,
      to: PersonaState.CHURNED,
      event: TransitionEvent.INACTIVITY,
      condition: (ctx) => ctx.daysSinceLastAction >= 5,
    },
  ];

  /**
   * Get valid transitions from a given state
   */
  getValidTransitions(state: PersonaState): StateTransition[] {
    return this.transitions.filter((t) => t.from === state);
  }

  /**
   * Check if a transition is valid
   */
  canTransition(
    from: PersonaState,
    to: PersonaState,
    event: TransitionEvent,
    context: TransitionContext
  ): boolean {
    const transition = this.transitions.find(
      (t) => t.from === from && t.to === to && t.event === event
    );

    if (!transition) {
      return false;
    }

    if (transition.condition) {
      return transition.condition(context);
    }

    return true;
  }

  /**
   * Execute a state transition
   */
  transition(
    from: PersonaState,
    to: PersonaState,
    event: TransitionEvent,
    context: TransitionContext
  ): PersonaState {
    if (!this.canTransition(from, to, event, context)) {
      throw new Error(
        `Invalid transition from ${from} to ${to} with event ${event}`
      );
    }

    return to;
  }

  /**
   * Evaluate all possible transitions for current context
   */
  evaluateTransitions(context: TransitionContext): PersonaState | null {
    const validTransitions = this.getValidTransitions(context.currentState);

    for (const transition of validTransitions) {
      if (!transition.condition || transition.condition(context)) {
        return transition.to;
      }
    }

    return null;
  }
}
