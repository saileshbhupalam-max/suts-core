/**
 * Tests for DelightTracker
 */

import { DelightTracker } from '../../src/behavior/DelightTracker';
import { ActionType } from '@suts/core';
import type { PersonaProfile } from '@suts/persona';

describe('DelightTracker', () => {
  let tracker: DelightTracker;
  let mockPersona: PersonaProfile;

  beforeEach(() => {
    tracker = new DelightTracker();
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
      delightTriggers: ['Fast setup', 'Great UX'],
      referralTriggers: ['Excellent performance'],
      typicalWorkflow: 'Agile',
      timeAvailability: '2 hours/day',
      collaborationStyle: 'Community-driven',
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
    expect(state.moments).toEqual([]);
    expect(state.peakDelight).toBe(0);
    expect(state.sustainedDelightDays).toBe(0);
    expect(state.referralLikelihood).toBe(0);
  });

  it('should throw error when accessing uninitialized persona', () => {
    expect(() => tracker.getState('unknown')).toThrow(
      'Persona unknown not initialized'
    );
  });

  it('should record delight moment', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordDelight(
      mockPersona.id,
      0.7,
      'Fast setup',
      'feature',
      timestamp,
      mockPersona
    );

    const state = tracker.getState(mockPersona.id);
    expect(state.level).toBeGreaterThan(0);
    expect(state.moments.length).toBe(1);
    expect(state.moments[0].trigger).toBe('Fast setup');
  });

  it('should amplify delight for personal triggers', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();

    // Record delight with personal trigger
    tracker.recordDelight(
      mockPersona.id,
      0.5,
      'Fast setup',
      'feature',
      timestamp,
      mockPersona
    );
    const levelWithTrigger = tracker.getDelightLevel(mockPersona.id);

    // Reset and record with non-personal trigger
    tracker.reset(mockPersona.id);
    tracker.recordDelight(
      mockPersona.id,
      0.5,
      'Some feature',
      'feature',
      timestamp,
      mockPersona
    );
    const levelWithoutTrigger = tracker.getDelightLevel(mockPersona.id);

    expect(levelWithTrigger).toBeGreaterThan(levelWithoutTrigger);
  });

  it('should update peak delight', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordDelight(
      mockPersona.id,
      0.5,
      'Feature 1',
      'feature',
      timestamp,
      mockPersona
    );

    tracker.recordDelight(
      mockPersona.id,
      0.3,
      'Feature 2',
      'feature',
      timestamp,
      mockPersona
    );

    const state = tracker.getState(mockPersona.id);
    expect(state.peakDelight).toBeGreaterThanOrEqual(state.level);
  });

  it('should update delight over time (natural decay)', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordDelight(
      mockPersona.id,
      0.8,
      'Great feature',
      'feature',
      timestamp,
      mockPersona
    );
    const levelBefore = tracker.getDelightLevel(mockPersona.id);

    // Simulate 1 day passing
    tracker.updateOverTime(mockPersona.id, 1);
    const levelAfter = tracker.getDelightLevel(mockPersona.id);

    expect(levelAfter).toBeLessThan(levelBefore);
  });

  it('should track sustained delight days', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordDelight(
      mockPersona.id,
      0.9,
      'Great feature',
      'feature',
      timestamp,
      mockPersona
    );

    // Simulate days passing with sustained delight
    tracker.updateOverTime(mockPersona.id, 1);
    tracker.updateOverTime(mockPersona.id, 1);

    const state = tracker.getState(mockPersona.id);
    expect(state.sustainedDelightDays).toBeGreaterThan(0);
  });

  it('should reset sustained delight when level drops', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordDelight(
      mockPersona.id,
      0.9,
      'Great feature',
      'feature',
      timestamp,
      mockPersona
    );

    tracker.updateOverTime(mockPersona.id, 1);

    // Let delight decay below threshold
    tracker.updateOverTime(mockPersona.id, 5);

    const state = tracker.getState(mockPersona.id);
    expect(state.sustainedDelightDays).toBe(0);
  });

  it('should check if likely to refer', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    expect(tracker.isLikelyToRefer(mockPersona.id)).toBe(false);

    const timestamp = new Date();
    tracker.recordDelight(
      mockPersona.id,
      0.9,
      'Excellent',
      'feature',
      timestamp,
      mockPersona
    );
    tracker.recordDelight(
      mockPersona.id,
      0.9,
      'Amazing',
      'feature',
      timestamp,
      mockPersona
    );
    tracker.recordDelight(
      mockPersona.id,
      0.9,
      'Perfect',
      'feature',
      timestamp,
      mockPersona
    );

    expect(tracker.isLikelyToRefer(mockPersona.id)).toBe(true);
  });

  it('should get recent delight moments', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    for (let i = 0; i < 5; i++) {
      tracker.recordDelight(
        mockPersona.id,
        0.5,
        `Moment ${i}`,
        'feature',
        timestamp,
        mockPersona
      );
    }

    const recent = tracker.getRecentMoments(mockPersona.id, 3);
    expect(recent.length).toBe(3);
    expect(recent[2].trigger).toBe('Moment 4');
  });

  it('should get moments by category', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordDelight(
      mockPersona.id,
      0.5,
      'Feature 1',
      'feature',
      timestamp,
      mockPersona
    );
    tracker.recordDelight(
      mockPersona.id,
      0.5,
      'Fast',
      'performance',
      timestamp,
      mockPersona
    );
    tracker.recordDelight(
      mockPersona.id,
      0.5,
      'Feature 2',
      'feature',
      timestamp,
      mockPersona
    );

    const featureMoments = tracker.getMomentsByCategory(mockPersona.id, 'feature');
    expect(featureMoments.length).toBe(2);

    const perfMoments = tracker.getMomentsByCategory(mockPersona.id, 'performance');
    expect(perfMoments.length).toBe(1);
  });

  it('should update emotional state with delight', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordDelight(
      mockPersona.id,
      0.8,
      'Great',
      'feature',
      timestamp,
      mockPersona
    );

    const emotionalState = {
      frustration: 0.2,
      confidence: 0.5,
      delight: 0,
      confusion: 0.3,
    };

    const updated = tracker.updateEmotionalState(mockPersona.id, emotionalState);
    expect(updated.delight).toBeGreaterThan(emotionalState.delight);
  });

  it('should check delight threshold', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    expect(tracker.hasReachedThreshold(mockPersona.id, 0.8)).toBe(false);

    const timestamp = new Date();
    tracker.recordDelight(
      mockPersona.id,
      0.9,
      'Excellent',
      'feature',
      timestamp,
      mockPersona
    );

    expect(tracker.hasReachedThreshold(mockPersona.id, 0.8)).toBe(true);
  });

  it('should reset delight state', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    tracker.recordDelight(
      mockPersona.id,
      0.8,
      'Great',
      'feature',
      timestamp,
      mockPersona
    );

    tracker.reset(mockPersona.id);

    const state = tracker.getState(mockPersona.id);
    expect(state.level).toBe(0);
    expect(state.moments).toEqual([]);
    expect(state.peakDelight).toBe(0);
    expect(state.referralLikelihood).toBe(0);
  });

  it('should cap delight at maximum level', () => {
    tracker.initializePersona(mockPersona.id, mockPersona);

    const timestamp = new Date();
    for (let i = 0; i < 10; i++) {
      tracker.recordDelight(
        mockPersona.id,
        0.9,
        'Great',
        'feature',
        timestamp,
        mockPersona
      );
    }

    const level = tracker.getDelightLevel(mockPersona.id);
    expect(level).toBeLessThanOrEqual(1.0);
  });
});
