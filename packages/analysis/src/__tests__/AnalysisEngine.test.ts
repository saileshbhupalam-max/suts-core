/**
 * Tests for AnalysisEngine
 */

import { AnalysisEngine } from '../AnalysisEngine';
import {
  createEvent,
  createFrictionEvents,
  createValueEvents,
  createChurnEvents,
  createFunnelEvents,
} from '../test-utils';

describe('AnalysisEngine', () => {
  describe('constructor', () => {
    it('should create engine with default config', () => {
      const engine = new AnalysisEngine();
      const config = engine.getConfig();

      expect(config.minFrictionFrequency).toBe(5);
      expect(config.minFrustrationLevel).toBe(0.6);
      expect(config.minDelightLevel).toBe(0.7);
    });

    it('should create engine with custom config', () => {
      const engine = new AnalysisEngine({
        minFrictionFrequency: 10,
        minFrustrationLevel: 0.8,
      });

      const config = engine.getConfig();

      expect(config.minFrictionFrequency).toBe(10);
      expect(config.minFrustrationLevel).toBe(0.8);
      expect(config.minDelightLevel).toBe(0.7); // default
    });
  });

  describe('analyzeFriction', () => {
    it('should return empty array for no events', () => {
      const engine = new AnalysisEngine();
      const results = engine.analyzeFriction([]);

      expect(results).toEqual([]);
    });

    it('should detect friction points', () => {
      const engine = new AnalysisEngine({
        minFrictionFrequency: 5,
        minFrustrationLevel: 0.6,
      });

      const events = createFrictionEvents(10, 'configure');
      const results = engine.analyzeFriction(events);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.location.action).toBe('configure');
      expect(results[0]?.avgFrustration).toBeGreaterThan(0.6);
      expect(results[0]?.priority).toBeGreaterThan(0);
      expect(results[0]?.confidence).toBeGreaterThan(0);
    });

    it('should prioritize friction points correctly', () => {
      const engine = new AnalysisEngine();

      // Create clear priority difference: more events AND more users for major friction
      const majorFrictionEvents = Array.from({ length: 40 }, (_, i) =>
        createEvent({
          personaId: `major-user-${i % 20}`, // 20 unique users
          action: 'major_friction',
          emotionalState: {
            frustration: 0.9,
            confidence: 0.1,
            delight: 0.1,
            confusion: 0.8,
          },
          timestamp: new Date(Date.now() + i * 1000),
        })
      );

      const minorFrictionEvents = Array.from({ length: 10 }, (_, i) =>
        createEvent({
          personaId: `minor-user-${i % 5}`, // 5 unique users
          action: 'minor_friction',
          emotionalState: {
            frustration: 0.7,
            confidence: 0.3,
            delight: 0.2,
            confusion: 0.6,
          },
          timestamp: new Date(Date.now() + i * 1000),
        })
      );

      const events = [...majorFrictionEvents, ...minorFrictionEvents];
      const results = engine.analyzeFriction(events);

      expect(results.length).toBeGreaterThan(0);
      // First result should be major friction (more events = higher priority)
      expect(results[0]?.location.action).toBe('major_friction');
    });

    it('should not detect friction below threshold', () => {
      const engine = new AnalysisEngine({
        minFrictionFrequency: 100,
      });

      const events = createFrictionEvents(10, 'configure');
      const results = engine.analyzeFriction(events);

      expect(results).toEqual([]);
    });
  });

  describe('analyzeValue', () => {
    it('should return empty array for no events', () => {
      const engine = new AnalysisEngine();
      const results = engine.analyzeValue([]);

      expect(results).toEqual([]);
    });

    it('should detect value moments', () => {
      const engine = new AnalysisEngine({
        minDelightLevel: 0.7,
      });

      const events = createValueEvents(10, 'share');
      const results = engine.analyzeValue(events);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.action).toBe('share');
      expect(results[0]?.delightScore).toBeGreaterThan(0.7);
      expect(results[0]?.priority).toBeGreaterThan(0);
      expect(results[0]?.confidence).toBeGreaterThan(0);
    });

    it('should prioritize value moments correctly', () => {
      const engine = new AnalysisEngine();

      const events = [
        ...createValueEvents(20, 'major_value'),
        ...createValueEvents(5, 'minor_value'),
      ];

      const results = engine.analyzeValue(events);

      expect(results.length).toBeGreaterThan(0);
      // First result should be major value (more events = higher priority)
      expect(results[0]?.action).toBe('major_value');
    });
  });

  describe('analyzeChurn', () => {
    it('should return empty array for no events', () => {
      const engine = new AnalysisEngine();
      const results = engine.analyzeChurn([]);

      expect(results).toEqual([]);
    });

    it('should detect churn drivers', () => {
      const engine = new AnalysisEngine();

      const events = createChurnEvents(10);
      const results = engine.analyzeChurn(events);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.churnProbability).toBeGreaterThan(0);
      expect(results[0]?.priority).toBeGreaterThan(0);
      expect(results[0]?.confidence).toBeGreaterThan(0);
    });

    it('should identify preventable churn', () => {
      const engine = new AnalysisEngine();

      const events = createChurnEvents(10);
      const results = engine.analyzeChurn(events);

      const preventable = results.filter((r) => r.preventable);
      expect(preventable.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeFunnel', () => {
    it('should return empty funnel for no events', () => {
      const engine = new AnalysisEngine();
      const results = engine.analyzeFunnel([], []);

      expect(results.steps).toEqual([]);
      expect(results.overallConversion).toBe(0);
      expect(results.totalUsers).toBe(0);
    });

    it('should analyze funnel with perfect conversion', () => {
      const engine = new AnalysisEngine();

      const steps = ['install', 'configure', 'use_feature'];
      const events = createFunnelEvents(100, steps, [0, 0, 0]);

      const results = engine.analyzeFunnel(events, steps);

      expect(results.steps.length).toBe(3);
      expect(results.overallConversion).toBeGreaterThan(0.9);
      expect(results.totalUsers).toBe(100);
    });

    it('should detect funnel dropoffs', () => {
      const engine = new AnalysisEngine();

      const steps = ['install', 'configure', 'use_feature'];
      const events = createFunnelEvents(100, steps, [0, 0.5, 0.3]);

      const results = engine.analyzeFunnel(events, steps);

      expect(results.steps.length).toBe(3);
      expect(results.biggestDropoff).toBeDefined();
      expect(results.biggestDropoff?.step).toBe('configure');
      expect(results.biggestDropoff?.rate).toBeGreaterThan(0.4);
    });

    it('should generate recommendations for poor funnel', () => {
      const engine = new AnalysisEngine();

      const steps = ['install', 'configure'];
      const events = createFunnelEvents(100, steps, [0, 0.8]);

      const results = engine.analyzeFunnel(events, steps);

      expect(results.recommendations).toBeDefined();
      expect(results.recommendations?.length).toBeGreaterThan(0);
    });

    it('should calculate conversion rates correctly', () => {
      const engine = new AnalysisEngine();

      const steps = ['step1', 'step2', 'step3'];
      const events = createFunnelEvents(100, steps, [0.2, 0.3, 0.1]);

      const results = engine.analyzeFunnel(events, steps);

      expect(results.steps[0]?.conversionRate).toBeGreaterThan(0.7);
      expect(results.steps[1]?.conversionRate).toBeGreaterThan(0.6);
    });
  });

  describe('edge cases', () => {
    it('should handle single event', () => {
      const engine = new AnalysisEngine();
      const events = [createEvent()];

      expect(() => engine.analyzeFriction(events)).not.toThrow();
      expect(() => engine.analyzeValue(events)).not.toThrow();
      expect(() => engine.analyzeChurn(events)).not.toThrow();
    });

    it('should handle events from single user', () => {
      const engine = new AnalysisEngine();
      const events = createFrictionEvents(10, 'test').map((e) => ({
        ...e,
        personaId: 'single-user',
      }));

      const results = engine.analyzeFriction(events);
      expect(results).toBeDefined();
    });

    it('should handle events with missing emotional state', () => {
      const engine = new AnalysisEngine();
      const events = [
        createEvent({
          emotionalState: {
            frustration: 0,
            confidence: 0,
            delight: 0,
            confusion: 0,
          },
        }),
      ];

      expect(() => engine.analyzeFriction(events)).not.toThrow();
    });
  });
});
