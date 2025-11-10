/**
 * Tests for TimeSeriesAnalyzer
 */

import { TimeSeriesAnalyzer } from '../../processing/TimeSeriesAnalyzer';
import type { TelemetryEvent, TimeSeriesDataPoint } from '../../types';

describe('TimeSeriesAnalyzer', () => {
  let analyzer: TimeSeriesAnalyzer;

  beforeEach(() => {
    analyzer = new TimeSeriesAnalyzer();
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

  describe('generateTimeSeries', () => {
    it('should generate time series for a metric', () => {
      const hourInMs = 60 * 60 * 1000;
      const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

      const events: TelemetryEvent[] = [
        createEvent({
          timestamp: new Date(baseTime),
          emotionalState: { frustration: 0.3, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          timestamp: new Date(baseTime + hourInMs),
          emotionalState: { frustration: 0.5, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          timestamp: new Date(baseTime + hourInMs * 2),
          emotionalState: { frustration: 0.7, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const series = analyzer.generateTimeSeries(events, 'frustration', hourInMs);

      expect(series.length).toBe(3);
      expect(series[0]?.value).toBeCloseTo(0.3, 2);
      expect(series[1]?.value).toBeCloseTo(0.5, 2);
      expect(series[2]?.value).toBeCloseTo(0.7, 2);
    });

    it('should aggregate events in the same bucket', () => {
      const hourInMs = 60 * 60 * 1000;
      const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

      const events: TelemetryEvent[] = [
        createEvent({
          timestamp: new Date(baseTime),
          emotionalState: { delight: 0.6, frustration: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          timestamp: new Date(baseTime + 1000),
          emotionalState: { delight: 0.8, frustration: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const series = analyzer.generateTimeSeries(events, 'delight', hourInMs);

      expect(series.length).toBe(1);
      expect(series[0]?.value).toBeCloseTo(0.7, 2); // Average of 0.6 and 0.8
    });

    it('should sort by timestamp', () => {
      const hourInMs = 60 * 60 * 1000;
      const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

      const events: TelemetryEvent[] = [
        createEvent({
          timestamp: new Date(baseTime + hourInMs * 2),
          emotionalState: { frustration: 0.7, delight: 0, confidence: 0, confusion: 0 },
        }),
        createEvent({
          timestamp: new Date(baseTime),
          emotionalState: { frustration: 0.3, delight: 0, confidence: 0, confusion: 0 },
        }),
      ];

      const series = analyzer.generateTimeSeries(events, 'frustration', hourInMs);

      expect(series[0]?.value).toBeCloseTo(0.3, 2);
      expect(series[1]?.value).toBeCloseTo(0.7, 2);
    });

    it('should include metadata', () => {
      const events = [createEvent()];
      const series = analyzer.generateTimeSeries(events, 'frustration');

      expect(series[0]?.metadata?.['eventCount']).toBe(1);
      expect(series[0]?.metadata?.['bucketSizeMs']).toBeDefined();
    });

    it('should handle empty events', () => {
      const series = analyzer.generateTimeSeries([], 'frustration');
      expect(series).toEqual([]);
    });

    it('should handle different metrics', () => {
      const events = [
        createEvent({
          emotionalState: { frustration: 0.1, delight: 0.9, confidence: 0.8, confusion: 0.2 },
        }),
      ];

      const frustration = analyzer.generateTimeSeries(events, 'frustration');
      const delight = analyzer.generateTimeSeries(events, 'delight');
      const confidence = analyzer.generateTimeSeries(events, 'confidence');
      const confusion = analyzer.generateTimeSeries(events, 'confusion');

      expect(frustration[0]?.value).toBeCloseTo(0.1, 2);
      expect(delight[0]?.value).toBeCloseTo(0.9, 2);
      expect(confidence[0]?.value).toBeCloseTo(0.8, 2);
      expect(confusion[0]?.value).toBeCloseTo(0.2, 2);
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate moving average', () => {
      const dataPoints: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 1 },
        { timestamp: new Date('2024-01-02'), value: 2 },
        { timestamp: new Date('2024-01-03'), value: 3 },
        { timestamp: new Date('2024-01-04'), value: 4 },
      ];

      const ma = analyzer.calculateMovingAverage(dataPoints, 2);

      expect(ma.length).toBe(4);
      expect(ma[0]?.value).toBeCloseTo(1, 2); // Only 1 value
      expect(ma[1]?.value).toBeCloseTo(1.5, 2); // (1+2)/2
      expect(ma[2]?.value).toBeCloseTo(2.5, 2); // (2+3)/2
      expect(ma[3]?.value).toBeCloseTo(3.5, 2); // (3+4)/2
    });

    it('should include original value in metadata', () => {
      const dataPoints: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 10 },
      ];

      const ma = analyzer.calculateMovingAverage(dataPoints, 2);

      expect(ma[0]?.metadata?.['originalValue']).toBe(10);
    });

    it('should handle empty data points', () => {
      const ma = analyzer.calculateMovingAverage([], 2);
      expect(ma).toEqual([]);
    });

    it('should handle window size of 1', () => {
      const dataPoints: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 5 },
        { timestamp: new Date('2024-01-02'), value: 10 },
      ];

      const ma = analyzer.calculateMovingAverage(dataPoints, 1);

      expect(ma[0]?.value).toBe(5);
      expect(ma[1]?.value).toBe(10);
    });
  });

  describe('detectTrend', () => {
    it('should detect increasing trend', () => {
      const dataPoints: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 1 },
        { timestamp: new Date('2024-01-02'), value: 2 },
        { timestamp: new Date('2024-01-03'), value: 3 },
        { timestamp: new Date('2024-01-04'), value: 4 },
      ];

      const trend = analyzer.detectTrend(dataPoints);

      expect(trend.trend).toBe('increasing');
      expect(trend.slope).toBeGreaterThan(0);
      expect(trend.confidence).toBeGreaterThan(0.9);
    });

    it('should detect decreasing trend', () => {
      const dataPoints: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 4 },
        { timestamp: new Date('2024-01-02'), value: 3 },
        { timestamp: new Date('2024-01-03'), value: 2 },
        { timestamp: new Date('2024-01-04'), value: 1 },
      ];

      const trend = analyzer.detectTrend(dataPoints);

      expect(trend.trend).toBe('decreasing');
      expect(trend.slope).toBeLessThan(0);
      expect(trend.confidence).toBeGreaterThan(0.9);
    });

    it('should detect stable trend', () => {
      const dataPoints: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 5 },
        { timestamp: new Date('2024-01-02'), value: 5.001 },
        { timestamp: new Date('2024-01-03'), value: 4.999 },
        { timestamp: new Date('2024-01-04'), value: 5 },
      ];

      const trend = analyzer.detectTrend(dataPoints);

      expect(trend.trend).toBe('stable');
      expect(Math.abs(trend.slope)).toBeLessThan(0.01);
    });

    it('should handle empty data points', () => {
      const trend = analyzer.detectTrend([]);

      expect(trend.trend).toBe('stable');
      expect(trend.slope).toBe(0);
      expect(trend.confidence).toBe(0);
    });

    it('should handle single data point', () => {
      const dataPoints: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 5 },
      ];

      const trend = analyzer.detectTrend(dataPoints);

      expect(trend.trend).toBe('stable');
      expect(trend.slope).toBe(0);
      expect(trend.confidence).toBe(0);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies', () => {
      const dataPoints: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 5 },
        { timestamp: new Date('2024-01-02'), value: 5 },
        { timestamp: new Date('2024-01-03'), value: 5 },
        { timestamp: new Date('2024-01-04'), value: 50 }, // Extreme anomaly
        { timestamp: new Date('2024-01-05'), value: 5 },
        { timestamp: new Date('2024-01-06'), value: 5 },
      ];

      const anomalies = analyzer.detectAnomalies(dataPoints, 1.5);

      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      expect(anomalies.some((a) => a.value === 50)).toBe(true);
    });

    it('should include z-score in metadata', () => {
      const dataPoints: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 10 },
        { timestamp: new Date('2024-01-02'), value: 10 },
        { timestamp: new Date('2024-01-03'), value: 10 },
        { timestamp: new Date('2024-01-04'), value: 10 },
        { timestamp: new Date('2024-01-05'), value: 100 }, // Clear anomaly
      ];

      const anomalies = analyzer.detectAnomalies(dataPoints, 1.5);

      expect(anomalies.length).toBeGreaterThan(0);
      if (anomalies.length > 0) {
        expect(anomalies[0]?.metadata?.['zScore']).toBeDefined();
        expect(anomalies[0]?.metadata?.['mean']).toBeDefined();
        expect(anomalies[0]?.metadata?.['stdDev']).toBeDefined();
      }
    });

    it('should handle different thresholds', () => {
      const dataPoints: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 5 },
        { timestamp: new Date('2024-01-02'), value: 5 },
        { timestamp: new Date('2024-01-03'), value: 8 },
      ];

      const strict = analyzer.detectAnomalies(dataPoints, 1);
      const lenient = analyzer.detectAnomalies(dataPoints, 3);

      expect(strict.length).toBeGreaterThanOrEqual(lenient.length);
    });

    it('should handle empty data points', () => {
      const anomalies = analyzer.detectAnomalies([]);
      expect(anomalies).toEqual([]);
    });

    it('should handle insufficient data points', () => {
      const dataPoints: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 5 },
        { timestamp: new Date('2024-01-02'), value: 5 },
      ];

      const anomalies = analyzer.detectAnomalies(dataPoints);
      expect(anomalies).toEqual([]);
    });
  });

  describe('calculateEventRate', () => {
    it('should calculate event rate over time', () => {
      const hourInMs = 60 * 60 * 1000;
      const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

      const events: TelemetryEvent[] = [
        createEvent({ timestamp: new Date(baseTime) }),
        createEvent({ timestamp: new Date(baseTime + 1000) }),
        createEvent({ timestamp: new Date(baseTime + hourInMs) }),
      ];

      const rate = analyzer.calculateEventRate(events, hourInMs);

      expect(rate.length).toBe(2);
      expect(rate[0]?.value).toBe(2); // 2 events in first hour
      expect(rate[1]?.value).toBe(1); // 1 event in second hour
    });

    it('should sort by timestamp', () => {
      const hourInMs = 60 * 60 * 1000;
      const baseTime = new Date('2024-01-01T00:00:00Z').getTime();

      const events: TelemetryEvent[] = [
        createEvent({ timestamp: new Date(baseTime + hourInMs) }),
        createEvent({ timestamp: new Date(baseTime) }),
      ];

      const rate = analyzer.calculateEventRate(events, hourInMs);

      expect(rate[0]?.timestamp.getTime()).toBeLessThan(rate[1]!.timestamp.getTime());
    });

    it('should handle empty events', () => {
      const rate = analyzer.calculateEventRate([], 1000);
      expect(rate).toEqual([]);
    });
  });

  describe('compareTimeSeries', () => {
    it('should calculate correlation', () => {
      const series1: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 1 },
        { timestamp: new Date('2024-01-02'), value: 2 },
        { timestamp: new Date('2024-01-03'), value: 3 },
      ];

      const series2: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 2 },
        { timestamp: new Date('2024-01-02'), value: 4 },
        { timestamp: new Date('2024-01-03'), value: 6 },
      ];

      const comparison = analyzer.compareTimeSeries(series1, series2);

      expect(comparison.correlation).toBeCloseTo(1, 2); // Perfect correlation
    });

    it('should calculate average difference', () => {
      const series1: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 1 },
        { timestamp: new Date('2024-01-02'), value: 2 },
      ];

      const series2: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 3 },
        { timestamp: new Date('2024-01-02'), value: 4 },
      ];

      const comparison = analyzer.compareTimeSeries(series1, series2);

      expect(comparison.avgDifference).toBeCloseTo(2, 2);
    });

    it('should calculate max difference', () => {
      const series1: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 1 },
        { timestamp: new Date('2024-01-02'), value: 2 },
      ];

      const series2: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 2 },
        { timestamp: new Date('2024-01-02'), value: 7 },
      ];

      const comparison = analyzer.compareTimeSeries(series1, series2);

      expect(comparison.maxDifference).toBeCloseTo(5, 2);
    });

    it('should handle different lengths', () => {
      const series1: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 1 },
        { timestamp: new Date('2024-01-02'), value: 2 },
        { timestamp: new Date('2024-01-03'), value: 3 },
      ];

      const series2: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 1 },
      ];

      const comparison = analyzer.compareTimeSeries(series1, series2);

      expect(comparison).toBeDefined();
    });

    it('should handle empty series', () => {
      const comparison = analyzer.compareTimeSeries([], []);

      expect(comparison.correlation).toBe(0);
      expect(comparison.avgDifference).toBe(0);
      expect(comparison.maxDifference).toBe(0);
    });

    it('should handle negative correlation', () => {
      const series1: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 1 },
        { timestamp: new Date('2024-01-02'), value: 2 },
        { timestamp: new Date('2024-01-03'), value: 3 },
      ];

      const series2: TimeSeriesDataPoint[] = [
        { timestamp: new Date('2024-01-01'), value: 3 },
        { timestamp: new Date('2024-01-02'), value: 2 },
        { timestamp: new Date('2024-01-03'), value: 1 },
      ];

      const comparison = analyzer.compareTimeSeries(series1, series2);

      expect(comparison.correlation).toBeLessThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle events with missing emotional state values', () => {
      const events: TelemetryEvent[] = [
        createEvent({ emotionalState: {} as any }),
      ];

      const series = analyzer.generateTimeSeries(events, 'frustration');
      expect(series[0]?.value).toBe(0);
    });

    it('should handle large datasets', () => {
      const events = Array.from({ length: 10000 }, (_, i) =>
        createEvent({
          timestamp: new Date(2024, 0, 1, i),
          emotionalState: { frustration: 0.5, delight: 0, confidence: 0, confusion: 0 },
        })
      );

      const series = analyzer.generateTimeSeries(events, 'frustration');
      expect(series.length).toBeGreaterThan(0);
    });
  });
});
