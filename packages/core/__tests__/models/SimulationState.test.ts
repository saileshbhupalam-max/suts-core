/**
 * Tests for SimulationState model
 */

import { describe, it, expect } from '@jest/globals';
import {
  SimulationStateSchema,
  validateSimulationState,
  safeValidateSimulationState,
  type SimulationState,
} from '../../src/models/SimulationState';

describe('SimulationStateSchema', () => {
  const validState: SimulationState = {
    id: 'sim-001',
    configId: 'config-001',
    status: 'running',
    startTime: '2025-01-10T12:00:00.000Z',
    lastUpdateTime: '2025-01-10T12:30:00.000Z',
    currentSession: 5,
    totalSessions: 30,
    completedSessions: 4,
    activePersonaIds: ['persona-001', 'persona-002'],
    churnedPersonaIds: [],
    totalPersonas: 10,
    metrics: {
      totalEvents: 100,
      totalActions: 50,
      averageFrustration: 0.3,
      averageDelight: 0.7,
      averageConfidence: 0.6,
      averageConfusion: 0.2,
      retentionRate: 0.9,
      referralCount: 5,
    },
    errors: [],
    metadata: {},
  };

  describe('valid state', () => {
    it('should validate correct simulation state', () => {
      const result = SimulationStateSchema.safeParse(validState);
      expect(result.success).toBe(true);
    });

    it('should allow optional fields', () => {
      const minimalState = {
        ...validState,
        endTime: undefined,
        churnedPersonaIds: undefined,
        errors: undefined,
        metadata: undefined,
      };

      const result = SimulationStateSchema.safeParse(minimalState);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.churnedPersonaIds).toEqual([]);
        expect(result.data.errors).toEqual([]);
        expect(result.data.metadata).toEqual({});
      }
    });

    it('should accept endTime when provided', () => {
      const completedState = {
        ...validState,
        status: 'completed' as const,
        endTime: '2025-01-10T13:00:00.000Z',
      };

      const result = SimulationStateSchema.safeParse(completedState);
      expect(result.success).toBe(true);
    });
  });

  describe('status validation', () => {
    it('should validate all status values', () => {
      const statuses: Array<'pending' | 'running' | 'paused' | 'completed' | 'failed'> = [
        'pending',
        'running',
        'paused',
        'completed',
        'failed',
      ];

      for (const status of statuses) {
        const state = { ...validState, status };
        const result = SimulationStateSchema.safeParse(state);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const invalid = { ...validState, status: 'unknown' };
      const result = SimulationStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('required fields', () => {
    it('should reject missing id', () => {
      const invalid = { ...validState, id: '' };
      const result = SimulationStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject missing configId', () => {
      const invalid = { ...validState, configId: '' };
      const result = SimulationStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject negative session numbers', () => {
      const invalid = { ...validState, currentSession: -1 };
      const result = SimulationStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject total sessions less than 1', () => {
      const invalid = { ...validState, totalSessions: 0 };
      const result = SimulationStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('metrics validation', () => {
    it('should validate metrics with default values', () => {
      const state = {
        ...validState,
        metrics: {},
      };

      const result = SimulationStateSchema.safeParse(state);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metrics.totalEvents).toBe(0);
        expect(result.data.metrics.averageFrustration).toBe(0.5);
      }
    });

    it('should reject metrics out of range', () => {
      const invalid = {
        ...validState,
        metrics: {
          ...validState.metrics,
          averageFrustration: 1.5,
        },
      };

      const result = SimulationStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject negative event counts', () => {
      const invalid = {
        ...validState,
        metrics: {
          ...validState.metrics,
          totalEvents: -1,
        },
      };

      const result = SimulationStateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should validate all emotional metrics in range 0-1', () => {
      const metrics = {
        totalEvents: 0,
        totalActions: 0,
        averageFrustration: 0,
        averageDelight: 1,
        averageConfidence: 0.5,
        averageConfusion: 1,
        retentionRate: 1,
        referralCount: 0,
      };

      const state = { ...validState, metrics };
      const result = SimulationStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });
  });

  describe('error tracking', () => {
    it('should validate errors with all fields', () => {
      const state = {
        ...validState,
        errors: [
          {
            timestamp: '2025-01-10T12:00:00.000Z',
            personaId: 'persona-001',
            error: 'Simulation failed',
            stack: 'Error: Simulation failed\n  at ...',
          },
        ],
      };

      const result = SimulationStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('should allow optional fields in errors', () => {
      const state = {
        ...validState,
        errors: [
          {
            timestamp: '2025-01-10T12:00:00.000Z',
            error: 'General error',
          },
        ],
      };

      const result = SimulationStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });
  });

  describe('datetime validation', () => {
    it('should validate ISO 8601 datetime strings', () => {
      const validDates = [
        '2025-01-10T12:00:00.000Z',
        '2025-01-10T12:00:00Z',
        '2025-01-10T12:00:00.123Z',
      ];

      for (const date of validDates) {
        const state = { ...validState, startTime: date, lastUpdateTime: date };
        const result = SimulationStateSchema.safeParse(state);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid datetime strings', () => {
      const invalidDates = ['2025-01-10', '2025/01/10', 'invalid', ''];

      for (const date of invalidDates) {
        const state = { ...validState, startTime: date };
        const result = SimulationStateSchema.safeParse(state);
        expect(result.success).toBe(false);
      }
    });
  });
});

describe('validateSimulationState', () => {
  const validState: SimulationState = {
    id: 'sim-001',
    configId: 'config-001',
    status: 'running',
    startTime: '2025-01-10T12:00:00.000Z',
    lastUpdateTime: '2025-01-10T12:30:00.000Z',
    currentSession: 1,
    totalSessions: 10,
    completedSessions: 0,
    activePersonaIds: ['persona-001'],
    churnedPersonaIds: [],
    totalPersonas: 1,
    metrics: {
      totalEvents: 0,
      totalActions: 0,
      averageFrustration: 0.5,
      averageDelight: 0.5,
      averageConfidence: 0.5,
      averageConfusion: 0.5,
      retentionRate: 1,
      referralCount: 0,
    },
    errors: [],
    metadata: {},
  };

  it('should return validated state for valid data', () => {
    const result = validateSimulationState(validState);
    expect(result).toEqual(validState);
  });

  it('should throw error for invalid data', () => {
    const invalid = { ...validState, id: '' };
    expect(() => validateSimulationState(invalid)).toThrow();
  });
});

describe('safeValidateSimulationState', () => {
  const validState: SimulationState = {
    id: 'sim-001',
    configId: 'config-001',
    status: 'pending',
    startTime: '2025-01-10T12:00:00.000Z',
    lastUpdateTime: '2025-01-10T12:00:00.000Z',
    currentSession: 0,
    totalSessions: 30,
    completedSessions: 0,
    activePersonaIds: [],
    churnedPersonaIds: [],
    totalPersonas: 10,
    metrics: {
      totalEvents: 0,
      totalActions: 0,
      averageFrustration: 0.5,
      averageDelight: 0.5,
      averageConfidence: 0.5,
      averageConfusion: 0.5,
      retentionRate: 1,
      referralCount: 0,
    },
    errors: [],
    metadata: {},
  };

  it('should return success for valid data', () => {
    const result = safeValidateSimulationState(validState);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validState);
    }
  });

  it('should return error for invalid data', () => {
    const invalid = { ...validState, status: 'invalid' };
    const result = safeValidateSimulationState(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
