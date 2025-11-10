/**
 * Performance benchmarks for analysis engine
 */

import { AnalysisEngine } from '../AnalysisEngine';
import { createLargeEventBatch } from '../test-utils';

describe('Performance Benchmarks', () => {
  describe('analyzeFriction performance', () => {
    it('should analyze 100K events in less than 10 seconds', () => {
      const engine = new AnalysisEngine();
      const events = createLargeEventBatch(100000);

      const startTime = Date.now();
      engine.analyzeFriction(events);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000);
    }, 15000); // 15 second timeout

    it('should analyze 10K events quickly', () => {
      const engine = new AnalysisEngine();
      const events = createLargeEventBatch(10000);

      const startTime = Date.now();
      engine.analyzeFriction(events);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('analyzeValue performance', () => {
    it('should analyze 100K events in less than 10 seconds', () => {
      const engine = new AnalysisEngine();
      const events = createLargeEventBatch(100000);

      const startTime = Date.now();
      engine.analyzeValue(events);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000);
    }, 15000);

    it('should analyze 10K events quickly', () => {
      const engine = new AnalysisEngine();
      const events = createLargeEventBatch(10000);

      const startTime = Date.now();
      engine.analyzeValue(events);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('analyzeChurn performance', () => {
    it('should analyze 100K events in less than 10 seconds', () => {
      const engine = new AnalysisEngine();
      const events = createLargeEventBatch(100000);

      const startTime = Date.now();
      engine.analyzeChurn(events);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000);
    }, 15000);

    it('should analyze 10K events quickly', () => {
      const engine = new AnalysisEngine();
      const events = createLargeEventBatch(10000);

      const startTime = Date.now();
      engine.analyzeChurn(events);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('analyzeFunnel performance', () => {
    it('should analyze 100K events in less than 10 seconds', () => {
      const engine = new AnalysisEngine();
      const events = createLargeEventBatch(100000);
      const steps = ['install', 'configure', 'use_feature', 'customize', 'share'];

      const startTime = Date.now();
      engine.analyzeFunnel(events, steps);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000);
    }, 15000);
  });

  describe('memory efficiency', () => {
    it('should handle large batches without excessive memory', () => {
      const engine = new AnalysisEngine();
      const events = createLargeEventBatch(50000);

      // Should not throw out of memory
      expect(() => engine.analyzeFriction(events)).not.toThrow();
      expect(() => engine.analyzeValue(events)).not.toThrow();
      expect(() => engine.analyzeChurn(events)).not.toThrow();
    });
  });
});
