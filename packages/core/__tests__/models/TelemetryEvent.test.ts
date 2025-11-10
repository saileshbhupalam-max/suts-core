/**
 * Tests for TelemetryEvent model
 */

import { describe, it, expect } from '@jest/globals';
import {
  TelemetryEventSchema,
  EmotionalStateSchema,
  EventTypeSchema,
  validateTelemetryEvent,
  safeValidateTelemetryEvent,
  type TelemetryEvent,
  type EmotionalState,
} from '../../src/models/TelemetryEvent';

describe('EmotionalStateSchema', () => {
  it('should validate correct emotional state', () => {
    const state: EmotionalState = {
      frustration: 0.5,
      confidence: 0.7,
      delight: 0.8,
      confusion: 0.2,
    };

    const result = EmotionalStateSchema.safeParse(state);
    expect(result.success).toBe(true);
  });

  it('should reject values out of range', () => {
    const invalid = {
      frustration: 1.5,
      confidence: 0.5,
      delight: 0.5,
      confusion: 0.5,
    };

    const result = EmotionalStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject negative values', () => {
    const invalid = {
      frustration: -0.1,
      confidence: 0.5,
      delight: 0.5,
      confusion: 0.5,
    };

    const result = EmotionalStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('EventTypeSchema', () => {
  it('should validate all event types', () => {
    const types = ['action', 'observation', 'decision', 'emotion', 'error', 'milestone'];

    for (const type of types) {
      const result = EventTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid event types', () => {
    const result = EventTypeSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('TelemetryEventSchema', () => {
  const validEvent: TelemetryEvent = {
    id: 'evt-001',
    personaId: 'persona-001',
    simulationId: 'sim-001',
    sessionNumber: 1,
    timestamp: '2025-01-10T12:00:00.000Z',
    eventType: 'action',
    context: {},
    metadata: {},
    tags: [],
  };

  it('should validate correct telemetry event', () => {
    const result = TelemetryEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it('should allow optional fields', () => {
    const eventWithOptional: TelemetryEvent = {
      ...validEvent,
      action: 'install',
      reasoning: 'User wants to try the tool',
      emotionalState: {
        frustration: 0.3,
        confidence: 0.6,
        delight: 0.4,
        confusion: 0.2,
      },
      productVersion: '1.0.0',
      featureUsed: 'installation',
      elapsedTimeMs: 1500,
    };

    const result = TelemetryEventSchema.safeParse(eventWithOptional);
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const invalid = { ...validEvent, id: '' };
    const result = TelemetryEventSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid session number', () => {
    const invalid = { ...validEvent, sessionNumber: 0 };
    const result = TelemetryEventSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject negative elapsed time', () => {
    const invalid = { ...validEvent, elapsedTimeMs: -1 };
    const result = TelemetryEventSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should validate with defaults', () => {
    const minimal = {
      id: 'evt-001',
      personaId: 'persona-001',
      simulationId: 'sim-001',
      sessionNumber: 1,
      timestamp: '2025-01-10T12:00:00.000Z',
      eventType: 'action',
    };

    const result = TelemetryEventSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.context).toEqual({});
      expect(result.data.metadata).toEqual({});
      expect(result.data.tags).toEqual([]);
    }
  });
});

describe('validateTelemetryEvent', () => {
  const validEvent: TelemetryEvent = {
    id: 'evt-001',
    personaId: 'persona-001',
    simulationId: 'sim-001',
    sessionNumber: 1,
    timestamp: '2025-01-10T12:00:00.000Z',
    eventType: 'action',
    context: {},
    metadata: {},
    tags: [],
  };

  it('should return validated event for valid data', () => {
    const result = validateTelemetryEvent(validEvent);
    expect(result).toEqual(validEvent);
  });

  it('should throw error for invalid data', () => {
    const invalid = { ...validEvent, id: '' };
    expect(() => validateTelemetryEvent(invalid)).toThrow();
  });
});

describe('safeValidateTelemetryEvent', () => {
  const validEvent: TelemetryEvent = {
    id: 'evt-001',
    personaId: 'persona-001',
    simulationId: 'sim-001',
    sessionNumber: 1,
    timestamp: '2025-01-10T12:00:00.000Z',
    eventType: 'action',
    context: {},
    metadata: {},
    tags: [],
  };

  it('should return success for valid data', () => {
    const result = safeValidateTelemetryEvent(validEvent);
    expect(result.success).toBe(true);
  });

  it('should return error for invalid data', () => {
    const invalid = { ...validEvent, sessionNumber: -1 };
    const result = safeValidateTelemetryEvent(invalid);
    expect(result.success).toBe(false);
  });
});
