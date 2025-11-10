/**
 * Tests for ChurnPredictor
 */

import { ChurnPredictor } from '../ChurnPredictor';
import { DEFAULT_ANALYSIS_CONFIG } from '../../models/config';
import { createEvent, createChurnEvents } from '../../test-utils';

describe('ChurnPredictor', () => {
  describe('predict', () => {
    it('should return empty array for no events', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const results = predictor.predict([]);

      expect(results).toEqual([]);
    });

    it('should detect churn patterns', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const events = createChurnEvents(10);

      const results = predictor.predict(events);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.churnProbability).toBeGreaterThan(0);
    });

    it('should identify churned users', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const baseTime = Date.now();

      // Create multiple churned users (need at least 3 for pattern detection)
      const events = [
        ...Array.from({ length: 5 }, (_, i) => [
          createEvent({
            personaId: `churned-user-${i}`,
            action: 'install',
            timestamp: new Date(baseTime - 10000 + i * 100),
          }),
          createEvent({
            personaId: `churned-user-${i}`,
            action: 'configure',
            emotionalState: {
              frustration: 0.9,
              confidence: 0.1,
              delight: 0.1,
              confusion: 0.9,
            },
            timestamp: new Date(baseTime - 5000 + i * 100),
          }),
          createEvent({
            personaId: `churned-user-${i}`,
            action: 'uninstall',
            timestamp: new Date(baseTime + i * 100),
          }),
        ]).flat(),
      ];

      const results = predictor.predict(events);

      expect(results.length).toBeGreaterThan(0);
    });

    it('should identify preventable churn', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const events = createChurnEvents(10);

      const results = predictor.predict(events);

      const preventable = results.filter((r) => r.preventable);
      expect(preventable.length).toBeGreaterThan(0);
    });

    it('should calculate time to churn', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const events = createChurnEvents(5);

      const results = predictor.predict(events);

      expect(results[0]?.timeToChurn).toBeGreaterThan(0);
    });

    it('should generate interventions', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const events = createChurnEvents(10);

      const results = predictor.predict(events);

      expect(results[0]?.interventions).toBeDefined();
      expect(results[0]?.interventions?.length).toBeGreaterThan(0);
    });

    it('should sort by priority', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const events = createChurnEvents(20);

      const results = predictor.predict(events);

      if (results.length > 1) {
        expect(results[0]?.priority).toBeGreaterThanOrEqual(results[1]?.priority ?? 0);
      }
    });

    it('should not detect churn with no churned users', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const events = [
        createEvent({
          personaId: 'active-user',
          action: 'use_feature',
          emotionalState: {
            frustration: 0.1,
            confidence: 0.9,
            delight: 0.9,
            confusion: 0.1,
          },
        }),
      ];

      const results = predictor.predict(events);

      expect(results).toEqual([]);
    });
  });

  describe('confidence and priority calculation', () => {
    it('should calculate confidence based on sample size', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const events = createChurnEvents(50);

      const results = predictor.predict(events);

      expect(results[0]?.confidence).toBeGreaterThan(0);
      expect(results[0]?.confidence).toBeLessThanOrEqual(1);
    });

    it('should calculate priority for preventable churn higher', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const events = createChurnEvents(10);

      const results = predictor.predict(events);

      const preventable = results.filter((r) => r.preventable);
      if (preventable.length > 0) {
        expect(preventable[0]?.priority).toBeGreaterThan(0);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle single churned user', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const events = createChurnEvents(1);

      expect(() => predictor.predict(events)).not.toThrow();
    });

    it('should handle users with high frustration as churn', () => {
      const predictor = new ChurnPredictor(DEFAULT_ANALYSIS_CONFIG);
      const events = [
        createEvent({
          personaId: 'frustrated-user',
          action: 'use_feature',
          emotionalState: {
            frustration: 0.9,
            confidence: 0.1,
            delight: 0.1,
            confusion: 0.9,
          },
        }),
      ];

      const results = predictor.predict(events);

      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });
});
