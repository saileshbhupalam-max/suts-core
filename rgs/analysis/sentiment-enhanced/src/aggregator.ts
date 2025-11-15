/**
 * Sentiment Aggregator
 * Aggregates multiple sentiment analyses into summary statistics
 */

import { EnhancedSentiment, AggregatedSentiment } from './types';
import { SentimentScale } from './scales';
import { EmotionLabel } from './emotions';

/**
 * Aggregates sentiment analyses across multiple signals
 */
export class SentimentAggregator {
  /**
   * Aggregates multiple sentiment analyses
   *
   * @param sentiments - Array of sentiment analyses
   * @returns Aggregated sentiment statistics
   */
  aggregate(sentiments: EnhancedSentiment[]): AggregatedSentiment {
    if (sentiments.length === 0) {
      return this.createEmptyAggregation();
    }

    // Calculate distributions
    const scaleDistribution = this.calculateScaleDistribution(sentiments);
    const emotionDistribution = this.calculateEmotionDistribution(sentiments);

    // Calculate averages
    const avgScore = this.average(sentiments.map((s) => s.score));
    const avgMagnitude = this.average(sentiments.map((s) => s.magnitude));
    const avgConfidence = this.average(sentiments.map((s) => s.confidence));

    // Determine overall sentiment
    const overall = this.determineOverall(scaleDistribution);

    // Get top emotions
    const topEmotions = this.getTopEmotions(emotionDistribution, 5);

    return {
      overall,
      avgScore,
      avgMagnitude,
      avgConfidence,
      scaleDistribution,
      emotionDistribution,
      topEmotions,
      total: sentiments.length
    };
  }

  /**
   * Calculates scale distribution
   *
   * @param sentiments - Array of sentiments
   * @returns Map of scale to count
   */
  private calculateScaleDistribution(
    sentiments: EnhancedSentiment[]
  ): Map<SentimentScale, number> {
    const dist = new Map<SentimentScale, number>();

    // Initialize all scales to 0
    for (let scale = 1; scale <= 5; scale++) {
      dist.set(scale as SentimentScale, 0);
    }

    // Count occurrences
    for (const s of sentiments) {
      const count = dist.get(s.scale) ?? 0;
      dist.set(s.scale, count + 1);
    }

    return dist;
  }

  /**
   * Calculates emotion distribution
   *
   * @param sentiments - Array of sentiments
   * @returns Map of emotion label to count
   */
  private calculateEmotionDistribution(
    sentiments: EnhancedSentiment[]
  ): Map<EmotionLabel, number> {
    const dist = new Map<EmotionLabel, number>();

    for (const s of sentiments) {
      for (const emotion of s.emotions) {
        const label = emotion.label;
        const count = dist.get(label) ?? 0;
        dist.set(label, count + 1);
      }
    }

    return dist;
  }

  /**
   * Determines overall sentiment from distribution
   *
   * @param dist - Scale distribution
   * @returns Overall sentiment scale
   */
  private determineOverall(dist: Map<SentimentScale, number>): SentimentScale {
    let maxCount = 0;
    let mode = SentimentScale.Neutral;

    for (const [scale, count] of dist) {
      if (count > maxCount) {
        maxCount = count;
        mode = scale;
      }
    }

    return mode;
  }

  /**
   * Gets top N emotions by frequency
   *
   * @param dist - Emotion distribution
   * @param n - Number of top emotions to return
   * @returns Top N emotions
   */
  private getTopEmotions(
    dist: Map<EmotionLabel, number>,
    n: number
  ): Array<{ label: EmotionLabel; count: number }> {
    const emotions = Array.from(dist.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);

    return emotions;
  }

  /**
   * Calculates average of numbers
   *
   * @param values - Array of numbers
   * @returns Average value
   */
  private average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Creates empty aggregation for no data
   *
   * @returns Empty aggregated sentiment
   */
  private createEmptyAggregation(): AggregatedSentiment {
    const scaleDistribution = new Map<SentimentScale, number>();
    for (let scale = 1; scale <= 5; scale++) {
      scaleDistribution.set(scale as SentimentScale, 0);
    }

    return {
      overall: SentimentScale.Neutral,
      avgScore: 0,
      avgMagnitude: 0,
      avgConfidence: 0,
      scaleDistribution,
      emotionDistribution: new Map(),
      topEmotions: [],
      total: 0
    };
  }

  /**
   * Filters sentiments by scale
   *
   * @param sentiments - Array of sentiments
   * @param scales - Scales to filter by
   * @returns Filtered sentiments
   */
  filterByScale(
    sentiments: EnhancedSentiment[],
    scales: SentimentScale[]
  ): EnhancedSentiment[] {
    return sentiments.filter((s) => scales.includes(s.scale));
  }

  /**
   * Filters sentiments by emotion
   *
   * @param sentiments - Array of sentiments
   * @param emotions - Emotions to filter by
   * @returns Filtered sentiments
   */
  filterByEmotion(
    sentiments: EnhancedSentiment[],
    emotions: EmotionLabel[]
  ): EnhancedSentiment[] {
    return sentiments.filter((s) =>
      s.emotions.some((e) => emotions.includes(e.label))
    );
  }

  /**
   * Filters sentiments by minimum confidence
   *
   * @param sentiments - Array of sentiments
   * @param minConfidence - Minimum confidence threshold (0-1)
   * @returns Filtered sentiments
   */
  filterByConfidence(
    sentiments: EnhancedSentiment[],
    minConfidence: number
  ): EnhancedSentiment[] {
    return sentiments.filter((s) => s.confidence >= minConfidence);
  }
}
