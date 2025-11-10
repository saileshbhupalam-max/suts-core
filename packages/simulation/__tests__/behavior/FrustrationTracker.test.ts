/**
 * Tests for FrustrationTracker
 */

import { FrustrationTracker } from '../../src/behavior/FrustrationTracker';
import type { PersonaProfile } from '@suts/persona';

describe('FrustrationTracker', () => {
  let tracker: FrustrationTracker;
  let mockPersona: PersonaProfile;

  beforeEach(() => {
    tracker = new FrustrationTracker();
    mockPersona = {
      id: 'persona-1',
      archetype: 'Developer',
      role: 'Backend Engineer',
      experienceLevel: 'Intermediate',
      companySize: 'Startup',
      techStack: ['Node.js', 'TypeScript'],
      painPoints: ['Slow deployment'],
      goals: ['Faster development'],
      fears: ['Breaking production'],
      values: ['Reliability'],
      riskTolerance: 0.5,
      patienceLevel: 0.6,
      techAdoption: 'Early adopter',
      learningStyle: 'Trial-error',
      evaluationCriteria: ['Performance'],
      dealBreakers: ['No documentation'],
      delightTriggers: ['Fast setup'],
      referralTriggers: ['Great DX'],
      typicalWorkflow: 'Agile',
      timeAvailability: '2 hours/day',
      collaborationStyle: 'Team',
      state: {},
      history: [],
      confidenceScore: 0.7,
      lastUpdated: '2024-01-01',
      source: 'test',
    };
  });

  it('should initialize persona state', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const state = tracker.getState(mockPersona.id);
    expect(state.level).toBe(0);
    expect(state.events).toEqual([]);
    expect(state.consecutiveFailures).toBe(0);
    expect(state.timeSinceLastSuccess).toBe(0);
    expect(state.recoveryRate).toBeGreaterThan(0);
  });

  it('should throw error when accessing uninitialized persona', () => {
    expect(() => tracker.getState('unknown')).toThrow(
      'Persona unknown not initialized'
    );
  });

  it('should record frustration event', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordFrustration(mockPersona.id, 0.3, 'Test failed', true, timestamp);

    const state = tracker.getState(mockPersona.id);
    expect(state.level).toBeGreaterThan(0);
    expect(state.events.length).toBe(1);
    expect(state.events[0]!.reason).toBe('Test failed');
    expect(state.consecutiveFailures).toBe(1);
  });

  it('should increase frustration with consecutive failures', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordFrustration(mockPersona.id, 0.2, 'Fail 1', true, timestamp);
    const level1 = tracker.getFrustrationLevel(mockPersona.id);

    tracker.recordFrustration(mockPersona.id, 0.2, 'Fail 2', true, timestamp);
    const level2 = tracker.getFrustrationLevel(mockPersona.id);

    expect(level2).toBeGreaterThan(level1);
  });

  it('should record success and reduce frustration', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordFrustration(mockPersona.id, 0.5, 'Failed', true, timestamp);
    const levelBefore = tracker.getFrustrationLevel(mockPersona.id);

    tracker.recordSuccess(mockPersona.id);
    const levelAfter = tracker.getFrustrationLevel(mockPersona.id);

    expect(levelAfter).toBeLessThan(levelBefore);

    const state = tracker.getState(mockPersona.id);
    expect(state.consecutiveFailures).toBe(0);
    expect(state.timeSinceLastSuccess).toBe(0);
  });

  it('should update frustration over time (natural decay)', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordFrustration(mockPersona.id, 0.5, 'Failed', true, timestamp);
    const levelBefore = tracker.getFrustrationLevel(mockPersona.id);

    // Simulate 1 day passing
    tracker.updateOverTime(mockPersona.id, 24 * 60);
    const levelAfter = tracker.getFrustrationLevel(mockPersona.id);

    expect(levelAfter).toBeLessThan(levelBefore);
  });

  it('should check frustration threshold', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    expect(tracker.hasReachedThreshold(mockPersona.id, 0.8)).toBe(false);

    const timestamp = new Date();
    tracker.recordFrustration(mockPersona.id, 0.9, 'High frustration', true, timestamp);

    expect(tracker.hasReachedThreshold(mockPersona.id, 0.8)).toBe(true);
  });

  it('should get recent frustration events', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    for (let i = 0; i < 5; i++) {
      tracker.recordFrustration(
        mockPersona.id,
        0.1,
        `Event ${i}`,
        true,
        timestamp
      );
    }

    const recent = tracker.getRecentEvents(mockPersona.id, 3);
    expect(recent.length).toBe(3);
    expect(recent[2]!.reason).toBe('Event 4');
  });

  it('should update emotional state with frustration', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordFrustration(mockPersona.id, 0.6, 'Failed', true, timestamp);

    const emotionalState = {
      frustration: 0,
      confidence: 0.5,
      delight: 0.5,
      confusion: 0.3,
    };

    const updated = tracker.updateEmotionalState(mockPersona.id, emotionalState);
    expect(updated.frustration).toBeGreaterThan(emotionalState.frustration);
  });

  it('should reset frustration state', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordFrustration(mockPersona.id, 0.7, 'Failed', true, timestamp);

    tracker.reset(mockPersona.id);

    const state = tracker.getState(mockPersona.id);
    expect(state.level).toBe(0);
    expect(state.events).toEqual([]);
    expect(state.consecutiveFailures).toBe(0);
  });

  it('should cap frustration at maximum level', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    for (let i = 0; i < 10; i++) {
      tracker.recordFrustration(mockPersona.id, 0.5, 'Failed', true, timestamp);
    }

    const level = tracker.getFrustrationLevel(mockPersona.id);
    expect(level).toBeLessThanOrEqual(1.0);
  });

  it('should calculate different recovery rates for different personas', () => {
    const patientPersona = { ...mockPersona, patienceLevel: 0.9 };
    const impatientPersona = { ...mockPersona, id: 'persona-2', patienceLevel: 0.1 };

    tracker.initializePersona(patientPersona.id, patientPersona);
    tracker.initializePersona(impatientPersona.id, impatientPersona);

    const patientState = tracker.getState(patientPersona.id);
    const impatientState = tracker.getState(impatientPersona.id);

    expect(patientState.recoveryRate).toBeGreaterThan(impatientState.recoveryRate);
  });
});
