/**
 * Time series analyzer for telemetry data
 */

import type { TelemetryEvent, TimeSeriesDataPoint } from '../types';

/**
 * Analyzes telemetry events over time
 */
export class TimeSeriesAnalyzer {
  /**
   * Generate time series data for a specific metric
   * @param events - Array of telemetry events
   * @param metric - Metric name from emotional state (frustration, delight, confidence, confusion)
   * @param bucketSizeMs - Time bucket size in milliseconds (default: 1 hour)
   * @returns Array of time series data points
   */
  generateTimeSeries(
    events: TelemetryEvent[],
    metric: 'frustration' | 'delight' | 'confidence' | 'confusion',
    bucketSizeMs: number = 60 * 60 * 1000 // 1 hour default
  ): TimeSeriesDataPoint[] {
    if (events.length === 0) {
      return [];
    }

    // Group events by time bucket
    const buckets = new Map<
      number,
      { total: number; count: number; events: TelemetryEvent[] }
    >();

    events.forEach((event) => {
      const bucketKey = Math.floor(event.timestamp.getTime() / bucketSizeMs);
      const value = event.emotionalState[metric] ?? 0;

      const existing = buckets.get(bucketKey);
      if (existing !== undefined) {
        existing.total += value;
        existing.count++;
        existing.events.push(event);
      } else {
        buckets.set(bucketKey, {
          total: value,
          count: 1,
          events: [event],
        });
      }
    });

    // Convert to time series data points
    const dataPoints: TimeSeriesDataPoint[] = [];
    buckets.forEach((data, bucketKey) => {
      const timestamp = new Date(bucketKey * bucketSizeMs);
      const value = data.total / data.count;
      dataPoints.push({
        timestamp,
        value,
        metadata: {
          eventCount: data.count,
          bucketSizeMs,
        },
      });
    });

    return dataPoints.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Calculate moving average for a time series
   * @param dataPoints - Time series data points
   * @param windowSize - Window size for moving average
   * @returns Array of data points with moving average
   */
  calculateMovingAverage(
    dataPoints: TimeSeriesDataPoint[],
    windowSize: number
  ): TimeSeriesDataPoint[] {
    if (dataPoints.length === 0 || windowSize < 1) {
      return [];
    }

    const result: TimeSeriesDataPoint[] = [];

    for (let i = 0; i < dataPoints.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = dataPoints.slice(start, i + 1);
      const avg = window.reduce((sum, dp) => sum + dp.value, 0) / window.length;

      result.push({
        timestamp: dataPoints[i]!.timestamp,
        value: avg,
        metadata: {
          windowSize,
          originalValue: dataPoints[i]!.value,
        },
      });
    }

    return result;
  }

  /**
   * Detect trends in time series data
   * @param dataPoints - Time series data points
   * @returns Trend information (increasing, decreasing, or stable)
   */
  detectTrend(dataPoints: TimeSeriesDataPoint[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    slope: number;
    confidence: number;
  } {
    if (dataPoints.length < 2) {
      return { trend: 'stable', slope: 0, confidence: 0 };
    }

    // Calculate linear regression slope
    const n = dataPoints.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    dataPoints.forEach((point, index) => {
      sumX += index;
      sumY += point.value;
      sumXY += index * point.value;
      sumX2 += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Calculate R-squared for confidence
    const meanY = sumY / n;
    let ssTotal = 0;
    let ssResidual = 0;

    dataPoints.forEach((point, index) => {
      const predicted = slope * index + (sumY - slope * sumX) / n;
      ssTotal += (point.value - meanY) ** 2;
      ssResidual += (point.value - predicted) ** 2;
    });

    const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;
    const confidence = Math.max(0, Math.min(1, rSquared));

    // Determine trend direction
    const threshold = 0.01;
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < threshold) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return { trend, slope, confidence };
  }

  /**
   * Detect anomalies in time series data using standard deviation
   * @param dataPoints - Time series data points
   * @param threshold - Number of standard deviations for anomaly detection (default: 2)
   * @returns Array of anomalous data points
   */
  detectAnomalies(
    dataPoints: TimeSeriesDataPoint[],
    threshold: number = 2
  ): TimeSeriesDataPoint[] {
    if (dataPoints.length < 3) {
      return [];
    }

    // Calculate mean and standard deviation
    const mean =
      dataPoints.reduce((sum, dp) => sum + dp.value, 0) / dataPoints.length;
    const variance =
      dataPoints.reduce((sum, dp) => sum + (dp.value - mean) ** 2, 0) /
      dataPoints.length;
    const stdDev = Math.sqrt(variance);

    // Find anomalies
    const anomalies: TimeSeriesDataPoint[] = [];
    dataPoints.forEach((point) => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          ...point,
          metadata: {
            ...point.metadata,
            zScore,
            mean,
            stdDev,
          },
        });
      }
    });

    return anomalies;
  }

  /**
   * Calculate event rate over time
   * @param events - Array of telemetry events
   * @param bucketSizeMs - Time bucket size in milliseconds
   * @returns Array of data points with event counts
   */
  calculateEventRate(
    events: TelemetryEvent[],
    bucketSizeMs: number
  ): TimeSeriesDataPoint[] {
    if (events.length === 0) {
      return [];
    }

    const buckets = new Map<number, number>();

    events.forEach((event) => {
      const bucketKey = Math.floor(event.timestamp.getTime() / bucketSizeMs);
      buckets.set(bucketKey, (buckets.get(bucketKey) ?? 0) + 1);
    });

    const dataPoints: TimeSeriesDataPoint[] = [];
    buckets.forEach((count, bucketKey) => {
      const timestamp = new Date(bucketKey * bucketSizeMs);
      dataPoints.push({
        timestamp,
        value: count,
        metadata: {
          bucketSizeMs,
          eventCount: count,
        },
      });
    });

    return dataPoints.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Compare two time series
   * @param series1 - First time series
   * @param series2 - Second time series
   * @returns Comparison metrics
   */
  compareTimeSeries(
    series1: TimeSeriesDataPoint[],
    series2: TimeSeriesDataPoint[]
  ): {
    correlation: number;
    avgDifference: number;
    maxDifference: number;
  } {
    if (series1.length === 0 || series2.length === 0) {
      return { correlation: 0, avgDifference: 0, maxDifference: 0 };
    }

    const minLength = Math.min(series1.length, series2.length);
    const s1 = series1.slice(0, minLength);
    const s2 = series2.slice(0, minLength);

    // Calculate means
    const mean1 = s1.reduce((sum, dp) => sum + dp.value, 0) / minLength;
    const mean2 = s2.reduce((sum, dp) => sum + dp.value, 0) / minLength;

    // Calculate correlation
    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;
    let totalDiff = 0;
    let maxDiff = 0;

    for (let i = 0; i < minLength; i++) {
      const diff1 = s1[i]!.value - mean1;
      const diff2 = s2[i]!.value - mean2;
      const absDiff = Math.abs(s1[i]!.value - s2[i]!.value);

      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
      totalDiff += absDiff;
      maxDiff = Math.max(maxDiff, absDiff);
    }

    const correlation =
      denom1 === 0 || denom2 === 0
        ? 0
        : numerator / Math.sqrt(denom1 * denom2);

    return {
      correlation,
      avgDifference: totalDiff / minLength,
      maxDifference: maxDiff,
    };
  }
}
