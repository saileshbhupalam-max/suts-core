/**
 * Tests for EventGenerator
 */

import { EventGenerator, type EventContext } from '../../src/state/EventGenerator';
import { ActionType } from '@suts/core';
import { type PersonaAction, type ActionResult } from '../../src/state/ActionProcessor';

describe('EventGenerator', () => {
  let generator: EventGenerator;
  let mockContext: EventContext;

  beforeEach(() => {
    generator = new EventGenerator();

    mockContext = {
      personaId: 'persona-1',
      day: 3,
      sessionId: 'session-123',
      emotionalState: {
        frustration: 0.3,
        confidence: 0.7,
        delight: 0.5,
        confusion: 0.2,
      },
    };
  });

  it('should generate action event', () => {
    const action: PersonaAction = {
      type: ActionType.USE_FEATURE,
      timestamp: new Date(),
      personaId: mockContext.personaId,
      target: 'feature1',
      parameters: { param1: 'value1' },
      success: true,
      duration: 10,
      reasoning: 'Testing feature',
    };

    const event = generator.generateActionEvent(action, mockContext);

    expect(event.id).toBeDefined();
    expect(event.personaId).toBe(mockContext.personaId);
    expect(event.eventType).toBe('action');
    expect(event.action).toBe(ActionType.USE_FEATURE);
    expect(event.timestamp).toBe(action.timestamp);
    expect(event.context['sessionId']).toBe(mockContext.sessionId);
    expect(event.context['day']).toBe(mockContext.day);
    expect(event.context['success']).toBe(true);
    expect(event.reasoning).toBe('Testing feature');
  });

  it('should generate observation event', () => {
    const observation = 'User struggled with configuration';
    const timestamp = new Date();

    const event = generator.generateObservationEvent(
      observation,
      mockContext,
      timestamp
    );

    expect(event.id).toBeDefined();
    expect(event.personaId).toBe(mockContext.personaId);
    expect(event.eventType).toBe('observation');
    expect(event.context['observation']).toBe(observation);
    expect(event.timestamp).toBe(timestamp);
  });

  it('should generate decision event', () => {
    const decision = 'CONFIGURE';
    const reasoning = 'Need to set up the tool';
    const timestamp = new Date();

    const event = generator.generateDecisionEvent(
      decision,
      reasoning,
      mockContext,
      timestamp
    );

    expect(event.id).toBeDefined();
    expect(event.personaId).toBe(mockContext.personaId);
    expect(event.eventType).toBe('decision');
    expect(event.action).toBe(decision);
    expect(event.reasoning).toBe(reasoning);
    expect(event.timestamp).toBe(timestamp);
  });

  it('should generate emotion event', () => {
    const emotionalState = {
      frustration: 0.8,
      confidence: 0.3,
      delight: 0.1,
      confusion: 0.7,
    };
    const trigger = 'Failed to install';
    const timestamp = new Date();

    const event = generator.generateEmotionEvent(
      emotionalState,
      trigger,
      mockContext,
      timestamp
    );

    expect(event.id).toBeDefined();
    expect(event.personaId).toBe(mockContext.personaId);
    expect(event.eventType).toBe('emotion');
    expect(event.emotionalState).toEqual(emotionalState);
    expect(event.context['trigger']).toBe(trigger);
    expect(event.timestamp).toBe(timestamp);
  });

  it('should generate multiple events from action result', () => {
    const action: PersonaAction = {
      type: ActionType.CONFIGURE,
      timestamp: new Date(),
      personaId: mockContext.personaId,
      success: false,
      duration: 15,
    };

    const result: ActionResult = {
      action,
      emotionalImpact: {
        frustration: 0.3,
        confidence: -0.15,
        confusion: 0.2,
      },
      stateChanges: {},
      observations: ['Failed to configure', 'Error message unclear'],
    };

    const events = generator.generateEventsFromResult(result, mockContext);

    // Should have action event + observation events
    expect(events.length).toBeGreaterThanOrEqual(3);

    const actionEvents = events.filter((e) => e.eventType === 'action');
    expect(actionEvents.length).toBe(1);

    const observationEvents = events.filter((e) => e.eventType === 'observation');
    expect(observationEvents.length).toBe(2);
  });

  it('should generate emotion event for significant emotional change', () => {
    const action: PersonaAction = {
      type: ActionType.USE_FEATURE,
      timestamp: new Date(),
      personaId: mockContext.personaId,
      success: true,
      duration: 10,
    };

    const result: ActionResult = {
      action,
      emotionalImpact: {
        delight: 0.5, // Significant change
        confidence: 0.1,
      },
      stateChanges: {},
      observations: ['Great experience'],
    };

    const events = generator.generateEventsFromResult(result, mockContext);

    const emotionEvents = events.filter((e) => e.eventType === 'emotion');
    expect(emotionEvents.length).toBe(1);
  });

  it('should not generate emotion event for minor emotional change', () => {
    const action: PersonaAction = {
      type: ActionType.READ_DOCS,
      timestamp: new Date(),
      personaId: mockContext.personaId,
      success: true,
      duration: 5,
    };

    const result: ActionResult = {
      action,
      emotionalImpact: {
        confidence: 0.05, // Minor change
        confusion: -0.05,
      },
      stateChanges: {},
      observations: [],
    };

    const events = generator.generateEventsFromResult(result, mockContext);

    const emotionEvents = events.filter((e) => e.eventType === 'emotion');
    expect(emotionEvents.length).toBe(0);
  });

  it('should include emotional state in all events', () => {
    const action: PersonaAction = {
      type: ActionType.INSTALL,
      timestamp: new Date(),
      personaId: mockContext.personaId,
      success: true,
      duration: 8,
    };

    const event = generator.generateActionEvent(action, mockContext);

    expect(event.emotionalState).toEqual(mockContext.emotionalState);
  });

  it('should generate unique event IDs', () => {
    const action: PersonaAction = {
      type: ActionType.USE_FEATURE,
      timestamp: new Date(),
      personaId: mockContext.personaId,
      success: true,
      duration: 10,
    };

    const event1 = generator.generateActionEvent(action, mockContext);
    const event2 = generator.generateActionEvent(action, mockContext);

    expect(event1.id).not.toBe(event2.id);
  });
});
