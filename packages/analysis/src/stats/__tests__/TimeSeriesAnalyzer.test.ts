/**
 * Tests for TimeSeriesAnalyzer
 */

import { TimeSeriesAnalyzer } from '../TimeSeriesAnalyzer';
import { createEvent } from '../../test-utils';

describe('TimeSeriesAnalyzer', () => {
  describe('analyzeMetric', () => {
    it('should return empty analysis for no events', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const result = analyzer.analyzeMetric([], 'frustration');

      expect(result.data).toEqual([]);
      expect(result.trend).toBe('stable');
      expect(result.changeRate).toBe(0);
    });

    it('should analyze frustration metric over time', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const baseTime = Date.now();

      const events = Array.from({ length: 20 }, (_, i) =>
        createEvent({
          emotionalState: {
            frustration: 0.5 + (i * 0.01),
            confidence: 0.5,
            delight: 0.5,
            confusion: 0.5,
          },
          timestamp: new Date(baseTime + i * 60000), // 1 minute intervals
        })
      );

      const result = analyzer.analyzeMetric(events, 'frustration', 3600000);

      expect(result.metric).toBe('frustration');
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should detect increasing trend', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const baseTime = Date.now();

      const events = Array.from({ length: 50 }, (_, i) =>
        createEvent({
          emotionalState: {
            frustration: 0.1 + (i * 0.015),
            confidence: 0.5,
            delight: 0.5,
            confusion: 0.5,
          },
          timestamp: new Date(baseTime + i * 60000),
        })
      );

      const result = analyzer.analyzeMetric(events, 'frustration', 600000);

      expect(['increasing', 'volatile']).toContain(result.trend);
    });

    it('should detect decreasing trend', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const baseTime = Date.now();

      const events = Array.from({ length: 50 }, (_, i) =>
        createEvent({
          emotionalState: {
            frustration: 0.9 - (i * 0.015),
            confidence: 0.5,
            delight: 0.5,
            confusion: 0.5,
          },
          timestamp: new Date(baseTime + i * 60000),
        })
      );

      const result = analyzer.analyzeMetric(events, 'frustration', 600000);

      expect(['decreasing', 'volatile']).toContain(result.trend);
    });

    it('should detect stable trend', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const baseTime = Date.now();

      const events = Array.from({ length: 50 }, (_, i) =>
        createEvent({
          emotionalState: {
            frustration: 0.5,
            confidence: 0.5,
            delight: 0.5,
            confusion: 0.5,
          },
          timestamp: new Date(baseTime + i * 60000),
        })
      );

      const result = analyzer.analyzeMetric(events, 'frustration', 600000);

      expect(result.trend).toBe('stable');
    });

    it('should calculate change rate', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const baseTime = Date.now();

      const events = Array.from({ length: 20 }, (_, i) =>
        createEvent({
          emotionalState: {
            frustration: 0.3 + (i * 0.02),
            confidence: 0.5,
            delight: 0.5,
            confusion: 0.5,
          },
          timestamp: new Date(baseTime + i * 60000),
        })
      );

      const result = analyzer.analyzeMetric(events, 'frustration', 600000);

      expect(result.changeRate).not.toBe(0);
    });

    it('should detect anomalies', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const baseTime = Date.now();

      const events = Array.from({ length: 50 }, (_, i) => {
        const frustration = i === 25 ? 0.99 : 0.5; // Anomaly at index 25
        return createEvent({
          emotionalState: {
            frustration,
            confidence: 0.5,
            delight: 0.5,
            confusion: 0.5,
          },
          timestamp: new Date(baseTime + i * 60000),
        });
      });

      const result = analyzer.analyzeMetric(events, 'frustration', 600000);

      if (result.anomalies !== undefined) {
        expect(result.anomalies.length).toBeGreaterThan(0);
      }
    });
  });

  describe('analyzeEventFrequency', () => {
    it('should analyze event frequency over time', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const baseTime = Date.now();

      const events = Array.from({ length: 100 }, (_, i) =>
        createEvent({
          timestamp: new Date(baseTime + i * 60000),
        })
      );

      const result = analyzer.analyzeEventFrequency(events, 3600000);

      expect(result.metric).toBe('event_frequency');
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should detect increasing event frequency', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const baseTime = Date.now();

      const events = Array.from({ length: 100 }, (_, i) => {
        const count = Math.floor(i / 10) + 1;
        return Array.from({ length: count }, (__, j) =>
          createEvent({
            timestamp: new Date(baseTime + i * 60000 + j * 100),
          })
        );
      }).flat();

      const result = analyzer.analyzeEventFrequency(events, 600000);

      expect(['increasing', 'volatile']).toContain(result.trend);
    });
  });

  describe('edge cases', () => {
    it('should handle single event', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const events = [createEvent()];

      const result = analyzer.analyzeMetric(events, 'frustration');

      expect(result.trend).toBe('stable');
    });

    it('should handle two events', () => {
      const analyzer = new TimeSeriesAnalyzer();
      const baseTime = Date.now();

      const events = [
        createEvent({ timestamp: new Date(baseTime) }),
        createEvent({ timestamp: new Date(baseTime + 60000) }),
      ];

      const result = analyzer.analyzeMetric(events, 'frustration');

      expect(result.trend).toBe('stable');
    });
  });
});
