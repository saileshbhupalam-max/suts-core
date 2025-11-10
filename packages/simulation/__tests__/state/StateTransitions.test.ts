/**
 * Tests for StateTransitions
 */

import {
  StateTransitionMachine,
  PersonaState,
  TransitionEvent,
  type TransitionContext,
} from '../../src/state/StateTransitions';

describe('StateTransitionMachine', () => {
  let machine: StateTransitionMachine;

  beforeEach(() => {
    machine = new StateTransitionMachine();
  });

  describe('getValidTransitions', () => {
    it('should return transitions from NEW state', () => {
      const transitions = machine.getValidTransitions(PersonaState.NEW);
      expect(transitions.length).toBeGreaterThan(0);
      expect(transitions.every((t) => t.from === PersonaState.NEW)).toBe(true);
    });

    it('should return transitions from ACTIVE state', () => {
      const transitions = machine.getValidTransitions(PersonaState.ACTIVE);
      expect(transitions.length).toBeGreaterThan(0);
      expect(transitions.every((t) => t.from === PersonaState.ACTIVE)).toBe(true);
    });

    it('should return transitions from RETAINED state', () => {
      const transitions = machine.getValidTransitions(PersonaState.RETAINED);
      expect(transitions.length).toBeGreaterThan(0);
      expect(transitions.every((t) => t.from === PersonaState.RETAINED)).toBe(true);
    });

    it('should return empty array for CHURNED state', () => {
      const transitions = machine.getValidTransitions(PersonaState.CHURNED);
      expect(transitions.length).toBe(0);
    });
  });

  describe('canTransition', () => {
    it('should allow NEW -> ACTIVE on FIRST_ACTION', () => {
      const context: TransitionContext = {
        currentState: PersonaState.NEW,
        frustrationLevel: 0,
        delightLevel: 0,
        consecutiveActions: 0,
        daysSinceLastAction: 0,
        totalActions: 0,
        currentDay: 1,
      };

      const canTransition = machine.canTransition(
        PersonaState.NEW,
        PersonaState.ACTIVE,
        TransitionEvent.FIRST_ACTION,
        context
      );

      expect(canTransition).toBe(true);
    });

    it('should allow ACTIVE -> RETAINED on POSITIVE_EXPERIENCE with conditions', () => {
      const context: TransitionContext = {
        currentState: PersonaState.ACTIVE,
        frustrationLevel: 0.2,
        delightLevel: 0.7,
        consecutiveActions: 4,
        daysSinceLastAction: 0,
        totalActions: 5,
        currentDay: 3,
      };

      const canTransition = machine.canTransition(
        PersonaState.ACTIVE,
        PersonaState.RETAINED,
        TransitionEvent.POSITIVE_EXPERIENCE,
        context
      );

      expect(canTransition).toBe(true);
    });

    it('should reject ACTIVE -> RETAINED on POSITIVE_EXPERIENCE without conditions', () => {
      const context: TransitionContext = {
        currentState: PersonaState.ACTIVE,
        frustrationLevel: 0.2,
        delightLevel: 0.3,
        consecutiveActions: 1,
        daysSinceLastAction: 0,
        totalActions: 2,
        currentDay: 1,
      };

      const canTransition = machine.canTransition(
        PersonaState.ACTIVE,
        PersonaState.RETAINED,
        TransitionEvent.POSITIVE_EXPERIENCE,
        context
      );

      expect(canTransition).toBe(false);
    });

    it('should allow ACTIVE -> CHURNED on FRUSTRATION_THRESHOLD', () => {
      const context: TransitionContext = {
        currentState: PersonaState.ACTIVE,
        frustrationLevel: 0.9,
        delightLevel: 0,
        consecutiveActions: 0,
        daysSinceLastAction: 0,
        totalActions: 3,
        currentDay: 2,
      };

      const canTransition = machine.canTransition(
        PersonaState.ACTIVE,
        PersonaState.CHURNED,
        TransitionEvent.FRUSTRATION_THRESHOLD,
        context
      );

      expect(canTransition).toBe(true);
    });

    it('should allow ACTIVE -> CHURNED on INACTIVITY', () => {
      const context: TransitionContext = {
        currentState: PersonaState.ACTIVE,
        frustrationLevel: 0.3,
        delightLevel: 0.2,
        consecutiveActions: 0,
        daysSinceLastAction: 5,
        totalActions: 2,
        currentDay: 7,
      };

      const canTransition = machine.canTransition(
        PersonaState.ACTIVE,
        PersonaState.CHURNED,
        TransitionEvent.INACTIVITY,
        context
      );

      expect(canTransition).toBe(true);
    });

    it('should reject invalid transitions', () => {
      const context: TransitionContext = {
        currentState: PersonaState.NEW,
        frustrationLevel: 0,
        delightLevel: 0,
        consecutiveActions: 0,
        daysSinceLastAction: 0,
        totalActions: 0,
        currentDay: 1,
      };

      const canTransition = machine.canTransition(
        PersonaState.NEW,
        PersonaState.CHURNED,
        TransitionEvent.FRUSTRATION_THRESHOLD,
        context
      );

      expect(canTransition).toBe(false);
    });
  });

  describe('transition', () => {
    it('should execute valid transition', () => {
      const context: TransitionContext = {
        currentState: PersonaState.NEW,
        frustrationLevel: 0,
        delightLevel: 0,
        consecutiveActions: 0,
        daysSinceLastAction: 0,
        totalActions: 0,
        currentDay: 1,
      };

      const newState = machine.transition(
        PersonaState.NEW,
        PersonaState.ACTIVE,
        TransitionEvent.FIRST_ACTION,
        context
      );

      expect(newState).toBe(PersonaState.ACTIVE);
    });

    it('should throw error for invalid transition', () => {
      const context: TransitionContext = {
        currentState: PersonaState.NEW,
        frustrationLevel: 0,
        delightLevel: 0,
        consecutiveActions: 0,
        daysSinceLastAction: 0,
        totalActions: 0,
        currentDay: 1,
      };

      expect(() =>
        machine.transition(
          PersonaState.NEW,
          PersonaState.CHURNED,
          TransitionEvent.FRUSTRATION_THRESHOLD,
          context
        )
      ).toThrow('Invalid transition');
    });
  });

  describe('evaluateTransitions', () => {
    it('should return null when no transitions apply', () => {
      const context: TransitionContext = {
        currentState: PersonaState.ACTIVE,
        frustrationLevel: 0.3,
        delightLevel: 0.3,
        consecutiveActions: 1,
        daysSinceLastAction: 0,
        totalActions: 2,
        currentDay: 1,
      };

      const newState = machine.evaluateTransitions(context);
      expect(newState).toBeNull();
    });

    it('should return RETAINED when conditions met', () => {
      const context: TransitionContext = {
        currentState: PersonaState.ACTIVE,
        frustrationLevel: 0.1,
        delightLevel: 0.8,
        consecutiveActions: 5,
        daysSinceLastAction: 0,
        totalActions: 6,
        currentDay: 3,
      };

      const newState = machine.evaluateTransitions(context);
      expect(newState).toBe(PersonaState.RETAINED);
    });

    it('should return CHURNED when frustration threshold met', () => {
      const context: TransitionContext = {
        currentState: PersonaState.ACTIVE,
        frustrationLevel: 0.85,
        delightLevel: 0.1,
        consecutiveActions: 0,
        daysSinceLastAction: 0,
        totalActions: 3,
        currentDay: 2,
      };

      const newState = machine.evaluateTransitions(context);
      expect(newState).toBe(PersonaState.CHURNED);
    });

    it('should return CHURNED when inactivity threshold met', () => {
      const context: TransitionContext = {
        currentState: PersonaState.ACTIVE,
        frustrationLevel: 0.2,
        delightLevel: 0.2,
        consecutiveActions: 0,
        daysSinceLastAction: 4,
        totalActions: 2,
        currentDay: 6,
      };

      const newState = machine.evaluateTransitions(context);
      expect(newState).toBe(PersonaState.CHURNED);
    });
  });

  describe('State transition paths', () => {
    it('should support full lifecycle: NEW -> ACTIVE -> RETAINED', () => {
      const context1: TransitionContext = {
        currentState: PersonaState.NEW,
        frustrationLevel: 0,
        delightLevel: 0,
        consecutiveActions: 0,
        daysSinceLastAction: 0,
        totalActions: 0,
        currentDay: 1,
      };

      const active = machine.transition(
        PersonaState.NEW,
        PersonaState.ACTIVE,
        TransitionEvent.FIRST_ACTION,
        context1
      );

      expect(active).toBe(PersonaState.ACTIVE);

      const context2: TransitionContext = {
        currentState: PersonaState.ACTIVE,
        frustrationLevel: 0.1,
        delightLevel: 0.8,
        consecutiveActions: 4,
        daysSinceLastAction: 0,
        totalActions: 6,
        currentDay: 3,
      };

      const retained = machine.transition(
        PersonaState.ACTIVE,
        PersonaState.RETAINED,
        TransitionEvent.POSITIVE_EXPERIENCE,
        context2
      );

      expect(retained).toBe(PersonaState.RETAINED);
    });

    it('should support churn path: NEW -> ACTIVE -> CHURNED', () => {
      const context1: TransitionContext = {
        currentState: PersonaState.NEW,
        frustrationLevel: 0,
        delightLevel: 0,
        consecutiveActions: 0,
        daysSinceLastAction: 0,
        totalActions: 0,
        currentDay: 1,
      };

      const active = machine.transition(
        PersonaState.NEW,
        PersonaState.ACTIVE,
        TransitionEvent.FIRST_ACTION,
        context1
      );

      expect(active).toBe(PersonaState.ACTIVE);

      const context2: TransitionContext = {
        currentState: PersonaState.ACTIVE,
        frustrationLevel: 0.95,
        delightLevel: 0,
        consecutiveActions: 0,
        daysSinceLastAction: 0,
        totalActions: 3,
        currentDay: 2,
      };

      const churned = machine.transition(
        PersonaState.ACTIVE,
        PersonaState.CHURNED,
        TransitionEvent.FRUSTRATION_THRESHOLD,
        context2
      );

      expect(churned).toBe(PersonaState.CHURNED);
    });
  });
});
