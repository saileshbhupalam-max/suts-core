/**
 * Emotion Taxonomy - Detailed emotion detection for sentiment analysis
 * Provides 18 emotion labels across 5 categories
 */

/**
 * Emotion categories from negative to positive
 */
export enum EmotionCategory {
  Negative = 'negative',
  NeutralNegative = 'neutral-negative',
  Neutral = 'neutral',
  NeutralPositive = 'neutral-positive',
  Positive = 'positive'
}

/**
 * Granular emotion labels (18 emotions across 5 categories)
 */
export type EmotionLabel =
  // Negative emotions
  | 'frustrated'
  | 'angry'
  | 'disappointed'
  | 'annoyed'
  // Neutral-negative emotions
  | 'confused'
  | 'overwhelmed'
  | 'anxious'
  | 'skeptical'
  // Neutral emotions
  | 'indifferent'
  | 'curious'
  | 'uncertain'
  // Neutral-positive emotions
  | 'hopeful'
  | 'interested'
  | 'satisfied'
  // Positive emotions
  | 'excited'
  | 'delighted'
  | 'grateful'
  | 'impressed';

/**
 * Emotion score with intensity
 */
export interface EmotionScore {
  /** Emotion label */
  label: EmotionLabel;

  /** Emotion category */
  category: EmotionCategory;

  /** Intensity of emotion (0-1) */
  intensity: number;
}

/**
 * Emotion taxonomy mapping labels to categories
 */
export const EMOTION_TAXONOMY: Record<EmotionLabel, EmotionCategory> = {
  // Negative
  frustrated: EmotionCategory.Negative,
  angry: EmotionCategory.Negative,
  disappointed: EmotionCategory.Negative,
  annoyed: EmotionCategory.Negative,

  // Neutral-negative
  confused: EmotionCategory.NeutralNegative,
  overwhelmed: EmotionCategory.NeutralNegative,
  anxious: EmotionCategory.NeutralNegative,
  skeptical: EmotionCategory.NeutralNegative,

  // Neutral
  indifferent: EmotionCategory.Neutral,
  curious: EmotionCategory.Neutral,
  uncertain: EmotionCategory.Neutral,

  // Neutral-positive
  hopeful: EmotionCategory.NeutralPositive,
  interested: EmotionCategory.NeutralPositive,
  satisfied: EmotionCategory.NeutralPositive,

  // Positive
  excited: EmotionCategory.Positive,
  delighted: EmotionCategory.Positive,
  grateful: EmotionCategory.Positive,
  impressed: EmotionCategory.Positive
};

/**
 * All valid emotion labels
 */
export const EMOTION_LABELS: EmotionLabel[] = Object.keys(EMOTION_TAXONOMY) as EmotionLabel[];

/**
 * Gets emotion category for a label
 *
 * @param label - Emotion label
 * @returns Emotion category
 */
export function getEmotionCategory(label: EmotionLabel): EmotionCategory {
  return EMOTION_TAXONOMY[label];
}

/**
 * Gets all emotions in a category
 *
 * @param category - Emotion category
 * @returns Array of emotion labels in that category
 */
export function getEmotionsByCategory(category: EmotionCategory): EmotionLabel[] {
  return EMOTION_LABELS.filter((label) => EMOTION_TAXONOMY[label] === category);
}

/**
 * Checks if label is a valid emotion
 *
 * @param label - Label to check
 * @returns True if label is valid
 */
export function isValidEmotion(label: string): label is EmotionLabel {
  return EMOTION_LABELS.includes(label as EmotionLabel);
}

/**
 * Creates emotion score from label and intensity
 *
 * @param label - Emotion label
 * @param intensity - Intensity (0-1)
 * @returns EmotionScore object
 */
export function createEmotionScore(
  label: EmotionLabel,
  intensity: number
): EmotionScore {
  if (intensity < 0 || intensity > 1) {
    throw new Error(`Invalid emotion intensity: ${intensity}. Must be between 0 and 1.`);
  }

  return {
    label,
    category: getEmotionCategory(label),
    intensity
  };
}

/**
 * Gets emotions by category from a list of emotion scores
 *
 * @param emotions - Array of emotion scores
 * @param category - Category to filter by
 * @returns Filtered array of emotion scores
 */
export function filterEmotionsByCategory(
  emotions: EmotionScore[],
  category: EmotionCategory
): EmotionScore[] {
  return emotions.filter((e) => e.category === category);
}

/**
 * Gets top N emotions by intensity
 *
 * @param emotions - Array of emotion scores
 * @param n - Number of top emotions to return
 * @returns Top N emotions sorted by intensity (descending)
 */
export function getTopEmotions(emotions: EmotionScore[], n: number): EmotionScore[] {
  return [...emotions]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, n);
}
