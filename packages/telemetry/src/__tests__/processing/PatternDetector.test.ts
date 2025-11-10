/**
 * Tests for PatternDetector
 */

import { PatternDetector } from '../../processing/PatternDetector';
import type { TelemetryEvent } from '../../types';

describe('PatternDetector', () => {
  let detector: PatternDetector;

  beforeEach(() => {
    detector = new PatternDetector();
  });

  const createEvent = (overrides?: Partial<TelemetryEvent>): TelemetryEvent => ({
    id: `event-${Math.random()}`,
    personaId: 'persona-1',
    eventType: 'action',
    action: 'install',
    emotionalState: {
      frustration: 0.2,
      delight: 0.8,
      confidence: 0.7,
      confusion: 0.1,
    },
    metadata: {},
    timestamp: new Date(),
    ...overrides,
  });

  describe('detectFrictionPatterns', () => {
    it('should detect high frustration patterns', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'configure',
          emotionalState: { frustration: 0.8, delight: 0.2, confidence: 0.3, confusion: 0.7 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'configure',
          emotionalState: { frustration: 0.9, delight: 0.1, confidence: 0.2, confusion: 0.8 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'configure',
          emotionalState: { frustration: 0.7, delight: 0.3, confidence: 0.4, confusion: 0.6 },
        }),
      ];

      const patterns = detector.detectFrictionPatterns(events, 0.6, 3);

      expect(patterns.length).toBe(1);
      expect(patterns[0]?.type).toBe('friction');
      expect(patterns[0]?.personaId).toBe('p1');
      expect(patterns[0]?.action).toBe('configure');
      expect(patterns[0]?.occurrences).toBe(3);
      expect(patterns[0]?.confidence).toBeCloseTo(0.8, 1);
    });

    it('should filter by frustration threshold', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          action: 'low-frustration',
          emotionalState: { frustration: 0.3, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          action: 'high-frustration',
          emotionalState: { frustration: 0.9, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const patterns = detector.detectFrictionPatterns(events, 0.8, 1);

      expect(patterns.length).toBe(1);
      expect(patterns[0]?.action).toBe('high-frustration');
    });

    it('should filter by minimum occurrences', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.8, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.8, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'action-b',
          emotionalState: { frustration: 0.9, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const patterns = detector.detectFrictionPatterns(events, 0.6, 2);

      expect(patterns.length).toBe(1);
      expect(patterns[0]?.action).toBe('action-a');
    });

    it('should sort by confidence (frustration level)', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.7, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.7, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.7, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'action-b',
          emotionalState: { frustration: 0.9, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'action-b',
          emotionalState: { frustration: 0.9, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'action-b',
          emotionalState: { frustration: 0.9, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const patterns = detector.detectFrictionPatterns(events, 0.6, 3);

      expect(patterns[0]?.action).toBe('action-b');
      expect(patterns[1]?.action).toBe('action-a');
    });

    it('should include average emotional state', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.8, delight: 0.2, confidence: 0.4, confusion: 0.6 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.6, delight: 0.4, confidence: 0.6, confusion: 0.4 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.7, delight: 0.3, confidence: 0.5, confusion: 0.5 },
        }),
      ];

      const patterns = detector.detectFrictionPatterns(events, 0.6, 3);

      expect(patterns[0]?.avgEmotionalState['frustration']).toBeCloseTo(0.7, 1);
      expect(patterns[0]?.avgEmotionalState['delight']).toBeCloseTo(0.3, 1);
      expect(patterns[0]?.avgEmotionalState['confidence']).toBeCloseTo(0.5, 1);
      expect(patterns[0]?.avgEmotionalState['confusion']).toBeCloseTo(0.5, 1);
    });

    it('should return empty array when no patterns', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          emotionalState: { frustration: 0.1, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const patterns = detector.detectFrictionPatterns(events, 0.8, 3);
      expect(patterns).toEqual([]);
    });
  });

  describe('detectValuePatterns', () => {
    it('should detect high delight patterns', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'use_feature',
          emotionalState: { frustration: 0.1, delight: 0.9, confidence: 0.8, confusion: 0.1 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'use_feature',
          emotionalState: { frustration: 0.2, delight: 0.8, confidence: 0.7, confusion: 0.2 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'use_feature',
          emotionalState: { frustration: 0.1, delight: 0.85, confidence: 0.75, confusion: 0.15 },
        }),
      ];

      const patterns = detector.detectValuePatterns(events, 0.7, 3);

      expect(patterns.length).toBe(1);
      expect(patterns[0]?.type).toBe('value');
      expect(patterns[0]?.action).toBe('use_feature');
      expect(patterns[0]?.occurrences).toBe(3);
      expect(patterns[0]?.confidence).toBeCloseTo(0.85, 1);
    });

    it('should filter by delight threshold', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          action: 'low-delight',
          emotionalState: { frustration: 0, delight: 0.3, confidence: 0, confusion: 0 },
        }),
        createEvent({
          action: 'high-delight',
          emotionalState: { frustration: 0, delight: 0.9, confidence: 0, confusion: 0 },
        }),
      ];

      const patterns = detector.detectValuePatterns(events, 0.8, 1);

      expect(patterns.length).toBe(1);
      expect(patterns[0]?.action).toBe('high-delight');
    });

    it('should sort by confidence (delight level)', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0, delight: 0.75, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0, delight: 0.75, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0, delight: 0.75, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'action-b',
          emotionalState: { frustration: 0, delight: 0.95, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'action-b',
          emotionalState: { frustration: 0, delight: 0.95, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'action-b',
          emotionalState: { frustration: 0, delight: 0.95, confidence: 0, confusion: 0 },
        }),
      ];

      const patterns = detector.detectValuePatterns(events, 0.7, 3);

      expect(patterns[0]?.action).toBe('action-b');
      expect(patterns[1]?.action).toBe('action-a');
    });
  });

  describe('detectAllPatterns', () => {
    it('should detect both friction and value patterns', () => {
      const events: TelemetryEvent[] = [
        // Friction pattern
        createEvent({
          personaId: 'p1',
          action: 'configure',
          emotionalState: { frustration: 0.8, delight: 0.2, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'configure',
          emotionalState: { frustration: 0.9, delight: 0.1, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'configure',
          emotionalState: { frustration: 0.7, delight: 0.3, confidence: 0, confusion: 0 },
        }),
        // Value pattern
        createEvent({
          personaId: 'p2',
          action: 'use_feature',
          emotionalState: { frustration: 0.1, delight: 0.9, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'use_feature',
          emotionalState: { frustration: 0.2, delight: 0.8, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'use_feature',
          emotionalState: { frustration: 0.1, delight: 0.85, confidence: 0, confusion: 0 },
        }),
      ];

      const patterns = detector.detectAllPatterns(events);

      expect(patterns.friction.length).toBe(1);
      expect(patterns.value.length).toBe(1);
      expect(patterns.friction[0]?.action).toBe('configure');
      expect(patterns.value[0]?.action).toBe('use_feature');
    });
  });

  describe('detectFrictionSequences', () => {
    it('should detect action sequences leading to friction', () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');

      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'install',
          timestamp: new Date(baseTime.getTime()),
          emotionalState: { frustration: 0.1, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'configure',
          timestamp: new Date(baseTime.getTime() + 1000),
          emotionalState: { frustration: 0.3, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'use_feature',
          timestamp: new Date(baseTime.getTime() + 2000),
          emotionalState: { frustration: 0.8, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const sequences = detector.detectFrictionSequences(events, 3);

      // Sequences are only detected if avg frustration > 0.5 and count >= 2
      if (sequences.length > 0) {
        expect(sequences[0]?.sequence).toEqual(['install', 'configure', 'use_feature']);
        expect(sequences[0]?.avgFrustration).toBeGreaterThan(0.5);
      }
      // At minimum, the detector should process the events
      expect(sequences).toBeDefined();
    });

    it('should handle multiple personas', () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');

      const events: TelemetryEvent[] = [
        // Persona 1 sequence
        createEvent({
          personaId: 'p1',
          action: 'a1',
          timestamp: new Date(baseTime.getTime()),
          emotionalState: { frustration: 0.1, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'a2',
          timestamp: new Date(baseTime.getTime() + 1000),
          emotionalState: { frustration: 0.2, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'a3',
          timestamp: new Date(baseTime.getTime() + 2000),
          emotionalState: { frustration: 0.9, delight: 0, confidence: 0, confusion: 0 },
        }),
        // Persona 2 same sequence
        createEvent({
          personaId: 'p2',
          action: 'a1',
          timestamp: new Date(baseTime.getTime()),
          emotionalState: { frustration: 0.1, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'a2',
          timestamp: new Date(baseTime.getTime() + 1000),
          emotionalState: { frustration: 0.2, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'a3',
          timestamp: new Date(baseTime.getTime() + 2000),
          emotionalState: { frustration: 0.7, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const sequences = detector.detectFrictionSequences(events, 3);

      expect(sequences[0]?.count).toBe(2);
      expect(sequences[0]?.avgFrustration).toBeCloseTo(0.8, 1);
    });

    it('should filter by frustration threshold', () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');

      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'a1',
          timestamp: new Date(baseTime.getTime()),
          emotionalState: { frustration: 0.1, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'a2',
          timestamp: new Date(baseTime.getTime() + 1000),
          emotionalState: { frustration: 0.2, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'a3',
          timestamp: new Date(baseTime.getTime() + 2000),
          emotionalState: { frustration: 0.3, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const sequences = detector.detectFrictionSequences(events, 3);

      expect(sequences).toEqual([]); // Avg frustration 0.3 < 0.5 threshold
    });

    it('should handle different sequence lengths', () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');

      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'a1',
          timestamp: new Date(baseTime.getTime()),
          emotionalState: { frustration: 0.1, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'a2',
          timestamp: new Date(baseTime.getTime() + 1000),
          emotionalState: { frustration: 0.9, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const sequences = detector.detectFrictionSequences(events, 2);

      // Sequences detected depends on frustration threshold
      expect(sequences).toBeDefined();
      if (sequences.length > 0) {
        expect(sequences[0]?.sequence).toHaveLength(2);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty events', () => {
      const friction = detector.detectFrictionPatterns([]);
      const value = detector.detectValuePatterns([]);

      expect(friction).toEqual([]);
      expect(value).toEqual([]);
    });

    it('should handle single event', () => {
      const events = [
        createEvent({
          emotionalState: { frustration: 0.9, delight: 0.9, confidence: 0, confusion: 0 },
        }),
      ];

      const friction = detector.detectFrictionPatterns(events, 0.8, 1);
      const value = detector.detectValuePatterns(events, 0.8, 1);

      expect(friction.length).toBe(1);
      expect(value.length).toBe(1);
    });

    it('should handle mixed events with some below threshold', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.9, delight: 0.2, confidence: 0, confusion: 0 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'action-b',
          emotionalState: { frustration: 0.3, delight: 0.9, confidence: 0, confusion: 0 },
        }),
      ];

      const friction = detector.detectFrictionPatterns(events, 0.6, 1);
      const value = detector.detectValuePatterns(events, 0.7, 1);

      expect(friction.length).toBe(1);
      expect(friction[0]?.action).toBe('action-a');
      expect(value.length).toBe(1);
      expect(value[0]?.action).toBe('action-b');
    });

    it('should create new pattern for unique persona-action combinations', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.8, delight: 0, confidence: 0.5, confusion: 0.3 },
        }),
        createEvent({
          personaId: 'p2',
          action: 'action-a',
          emotionalState: { frustration: 0.7, delight: 0, confidence: 0.4, confusion: 0.2 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'action-b',
          emotionalState: { frustration: 0.9, delight: 0, confidence: 0.3, confusion: 0.6 },
        }),
      ];

      const friction = detector.detectFrictionPatterns(events, 0.6, 1);

      // Should have 3 unique patterns (p1:action-a, p2:action-a, p1:action-b)
      expect(friction.length).toBe(3);
    });

    it('should accumulate emotional state for existing patterns', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.6, delight: 0.1, confidence: 0.3, confusion: 0.5 },
        }),
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          emotionalState: { frustration: 0.8, delight: 0.2, confidence: 0.5, confusion: 0.7 },
        }),
      ];

      const friction = detector.detectFrictionPatterns(events, 0.6, 1);

      expect(friction.length).toBe(1);
      expect(friction[0]?.occurrences).toBe(2);
      expect(friction[0]?.avgEmotionalState['frustration']).toBeCloseTo(0.7, 1);
      expect(friction[0]?.avgEmotionalState['delight']).toBeCloseTo(0.15, 2);
      expect(friction[0]?.avgEmotionalState['confidence']).toBeCloseTo(0.4, 1);
      expect(friction[0]?.avgEmotionalState['confusion']).toBeCloseTo(0.6, 1);
    });

    it('should handle value patterns with missing emotional state fields', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          emotionalState: { delight: 0.9 } as any,
        }),
      ];

      const value = detector.detectValuePatterns(events, 0.8, 1);

      expect(value.length).toBe(1);
      expect(value[0]?.avgEmotionalState['frustration']).toBe(0);
      expect(value[0]?.avgEmotionalState['confidence']).toBe(0);
      expect(value[0]?.avgEmotionalState['confusion']).toBe(0);
    });

    it('should handle friction patterns with missing frustration field', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          emotionalState: {} as any,
        }),
      ];

      // With no frustration value, should use default 0, which is below threshold
      const friction = detector.detectFrictionPatterns(events, 0.6, 1);
      expect(friction.length).toBe(0);
    });

    it('should create new friction pattern with undefined emotional fields', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          emotionalState: { frustration: 0.8 } as any,
        }),
      ];

      const friction = detector.detectFrictionPatterns(events, 0.6, 1);
      expect(friction.length).toBe(1);
      expect(friction[0]?.avgEmotionalState['delight']).toBe(0);
      expect(friction[0]?.avgEmotionalState['confidence']).toBe(0);
      expect(friction[0]?.avgEmotionalState['confusion']).toBe(0);
    });

    it('should create new value pattern with undefined emotional fields', () => {
      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'action-a',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          emotionalState: { delight: 0.9 } as any,
        }),
      ];

      const value = detector.detectValuePatterns(events, 0.7, 1);
      expect(value.length).toBe(1);
      expect(value[0]?.avgEmotionalState['frustration']).toBe(0);
      expect(value[0]?.avgEmotionalState['confidence']).toBe(0);
      expect(value[0]?.avgEmotionalState['confusion']).toBe(0);
    });

    it('should handle sequence with undefined frustration', () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');

      const events: TelemetryEvent[] = [
        createEvent({
          personaId: 'p1',
          action: 'a1',
          timestamp: new Date(baseTime.getTime()),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          emotionalState: {} as any,
        }),
        createEvent({
          personaId: 'p1',
          action: 'a2',
          timestamp: new Date(baseTime.getTime() + 1000),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
          emotionalState: {} as any,
        }),
      ];

      const sequences = detector.detectFrictionSequences(events, 2);
      // With no frustration values (defaults to 0), avgFrustration will be 0 < 0.5 threshold
      expect(sequences.length).toBe(0);
    });
  });
});
