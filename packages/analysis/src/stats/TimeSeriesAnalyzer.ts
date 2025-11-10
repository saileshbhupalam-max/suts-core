/**
 * Time series analysis - analyzes trends over time
 */

import { TelemetryEvent } from '@suts/telemetry';
import { TimeSeriesAnalysis, TimeSeriesDataPoint } from '../models';

/**
 * Analyzes time series data
 */
export class TimeSeriesAnalyzer {
  constructor() {} // eslint-disable-line @typescript-eslint/no-unused-vars

  /**
   * Analyzes metric trends over time
   * @param events - Telemetry events to analyze
   * @param metric - Metric to analyze
   * @param intervalMs - Time interval for aggregation (default: 1 hour)
   * @returns Time series analysis
   */
  analyzeMetric(
    events: TelemetryEvent[],
    metric: 'frustration' | 'delight' | 'confidence' | 'confusion',
    intervalMs: number = 3600000
  ): TimeSeriesAnalysis {
    if (events.length === 0) {
      return {
        metric,
        data: [],
        trend: 'stable',
        changeRate: 0,
      };
    }

    // Sort events by timestamp
    const sortedEvents = events.slice().sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Group events by time interval
    const dataPoints = this.aggregateByInterval(sortedEvents, metric, intervalMs);

    // Analyze trend
    const trend = this.determineTrend(dataPoints);
    const changeRate = this.calculateChangeRate(dataPoints);

    // Detect anomalies
    const anomalies = this.detectAnomalies(dataPoints);

    return {
      metric,
      data: dataPoints,
      trend,
      changeRate,
      anomalies: anomalies.length > 0 ? anomalies : undefined,
    };
  }

  /**
   * Aggregates events by time interval
   */
  private aggregateByInterval(
    events: TelemetryEvent[],
    metric: 'frustration' | 'delight' | 'confidence' | 'confusion',
    intervalMs: number
  ): TimeSeriesDataPoint[] {
    if (events.length === 0) {
      return [];
    }

    const dataPoints: TimeSeriesDataPoint[] = [];

    const firstTimestamp = events[0]?.timestamp.getTime() ?? 0;
    const lastTimestamp = events[events.length - 1]?.timestamp.getTime() ?? 0;

    // Create time buckets
    for (let time = firstTimestamp; time <= lastTimestamp; time += intervalMs) {
      const bucketEvents = events.filter((e) => {
        const eventTime = e.timestamp.getTime();
        return eventTime >= time && eventTime < time + intervalMs;
      });

      if (bucketEvents.length > 0) {
        const avgValue = bucketEvents.reduce((sum, e) => {
          return sum + (e.emotionalState[metric] ?? 0);
        }, 0) / bucketEvents.length;

        dataPoints.push({
          timestamp: new Date(time),
          value: avgValue,
        });
      }
    }

    return dataPoints;
  }

  /**
   * Determines trend direction
   */
  private determineTrend(
    dataPoints: TimeSeriesDataPoint[]
  ): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
    if (dataPoints.length < 3) {
      return 'stable';
    }

    // Calculate linear regression slope
    const n = dataPoints.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      const dataPoint = dataPoints[i];
      if (dataPoint !== undefined) {
        const x = i;
        const y = dataPoint.value;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      }
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Calculate variance to detect volatility
    const mean = sumY / n;
    const variance = dataPoints.reduce((sum, dp) => {
      return sum + Math.pow(dp.value - mean, 2);
    }, 0) / n;

    const stdDev = Math.sqrt(variance);

    // Determine trend
    if (stdDev > 0.3) {
      return 'volatile';
    } else if (slope > 0.02) {
      return 'increasing';
    } else if (slope < -0.02) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * Calculates rate of change
   */
  private calculateChangeRate(dataPoints: TimeSeriesDataPoint[]): number {
    if (dataPoints.length < 2) {
      return 0;
    }

    const firstPoint = dataPoints[0];
    const lastPoint = dataPoints[dataPoints.length - 1];

    if (firstPoint === undefined || lastPoint === undefined || firstPoint.value === 0) {
      return 0;
    }

    return (lastPoint.value - firstPoint.value) / firstPoint.value;
  }

  /**
   * Detects anomalies in the time series
   */
  private detectAnomalies(
    dataPoints: TimeSeriesDataPoint[]
  ): Array<{
    timestamp: Date;
    value: number;
    expectedValue: number;
    deviation: number;
  }> {
    if (dataPoints.length < 5) {
      return [];
    }

    const anomalies: Array<{
      timestamp: Date;
      value: number;
      expectedValue: number;
      deviation: number;
    }> = [];

    // Calculate mean and standard deviation
    const values = dataPoints.map((dp) => dp.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect points beyond 2 standard deviations
    for (const dataPoint of dataPoints) {
      const deviation = Math.abs(dataPoint.value - mean);
      if (deviation > 2 * stdDev) {
        anomalies.push({
          timestamp: dataPoint.timestamp,
          value: dataPoint.value,
          expectedValue: mean,
          deviation,
        });
      }
    }

    return anomalies;
  }

  /**
   * Analyzes event frequency over time
   * @param events - Telemetry events to analyze
   * @param intervalMs - Time interval for aggregation (default: 1 hour)
   * @returns Time series analysis of event frequency
   */
  analyzeEventFrequency(
    events: TelemetryEvent[],
    intervalMs: number = 3600000
  ): TimeSeriesAnalysis {
    if (events.length === 0) {
      return {
        metric: 'event_frequency',
        data: [],
        trend: 'stable',
        changeRate: 0,
      };
    }

    // Sort events by timestamp
    const sortedEvents = events.slice().sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    const firstTimestamp = sortedEvents[0]?.timestamp.getTime() ?? 0;
    const lastTimestamp = sortedEvents[sortedEvents.length - 1]?.timestamp.getTime() ?? 0;

    const dataPoints: TimeSeriesDataPoint[] = [];

    // Create time buckets
    for (let time = firstTimestamp; time <= lastTimestamp; time += intervalMs) {
      const count = sortedEvents.filter((e) => {
        const eventTime = e.timestamp.getTime();
        return eventTime >= time && eventTime < time + intervalMs;
      }).length;

      dataPoints.push({
        timestamp: new Date(time),
        value: count,
      });
    }

    // Analyze trend
    const trend = this.determineTrend(dataPoints);
    const changeRate = this.calculateChangeRate(dataPoints);

    // Detect anomalies
    const anomalies = this.detectAnomalies(dataPoints);

    return {
      metric: 'event_frequency',
      data: dataPoints,
      trend,
      changeRate,
      anomalies: anomalies.length > 0 ? anomalies : undefined,
    };
  }
}
