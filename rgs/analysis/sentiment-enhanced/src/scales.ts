/**
 * 5-Point Sentiment Scale
 * Maps traditional -1 to +1 scoring to granular 1-5 scale
 */

/**
 * Five-point sentiment scale for granular analysis
 *
 * @enum {number}
 */
export enum SentimentScale {
  /** Very negative sentiment: "Terrible, unusable" */
  VeryNegative = 1,

  /** Negative sentiment: "Frustrating, problematic" */
  Negative = 2,

  /** Neutral sentiment: "It's okay, mixed feelings" */
  Neutral = 3,

  /** Positive sentiment: "Good, helpful" */
  Positive = 4,

  /** Very positive sentiment: "Amazing, love it" */
  VeryPositive = 5
}

/**
 * Maps sentiment scale (1-5) to score (-1 to +1) for backward compatibility
 *
 * @param scale - Sentiment scale value (1-5)
 * @returns Score value between -1.0 and +1.0
 */
export function scaleToScore(scale: SentimentScale): number {
  switch (scale) {
    case SentimentScale.VeryNegative:
      return -1.0;
    case SentimentScale.Negative:
      return -0.5;
    case SentimentScale.Neutral:
      return 0.0;
    case SentimentScale.Positive:
      return 0.5;
    case SentimentScale.VeryPositive:
      return 1.0;
  }
}

/**
 * Maps score (-1 to +1) to sentiment scale (1-5)
 *
 * @param score - Score value between -1.0 and +1.0
 * @returns Sentiment scale value (1-5)
 */
export function scoreToScale(score: number): SentimentScale {
  if (score <= -0.75) {
    return SentimentScale.VeryNegative;
  } else if (score <= -0.25) {
    return SentimentScale.Negative;
  } else if (score <= 0.25) {
    return SentimentScale.Neutral;
  } else if (score <= 0.75) {
    return SentimentScale.Positive;
  } else {
    return SentimentScale.VeryPositive;
  }
}

/**
 * Gets descriptive label for sentiment scale
 *
 * @param scale - Sentiment scale value (1-5)
 * @returns Human-readable description
 */
export function getScaleDescription(scale: SentimentScale): string {
  switch (scale) {
    case SentimentScale.VeryNegative:
      return 'Very Negative';
    case SentimentScale.Negative:
      return 'Negative';
    case SentimentScale.Neutral:
      return 'Neutral';
    case SentimentScale.Positive:
      return 'Positive';
    case SentimentScale.VeryPositive:
      return 'Very Positive';
  }
}

/**
 * Checks if scale value is valid
 *
 * @param value - Value to check
 * @returns True if value is a valid SentimentScale
 */
export function isValidScale(value: number): value is SentimentScale {
  return value >= 1 && value <= 5 && Number.isInteger(value);
}
