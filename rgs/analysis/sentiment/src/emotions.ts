/**
 * RGS Emotion Detection Module
 *
 * Defines emotion types and extraction logic for sentiment analysis
 */

/**
 * Supported emotion types for developer feedback
 */
export type Emotion =
  // Negative emotions
  | 'frustrated'
  | 'angry'
  | 'disappointed'
  // Neutral-negative emotions
  | 'confused'
  | 'overwhelmed'
  | 'anxious'
  // Neutral-positive emotions
  | 'curious'
  | 'hopeful'
  | 'interested'
  // Positive emotions
  | 'excited'
  | 'delighted'
  | 'grateful';

/**
 * All valid emotion labels
 */
export const VALID_EMOTIONS: ReadonlyArray<Emotion> = [
  'frustrated',
  'angry',
  'disappointed',
  'confused',
  'overwhelmed',
  'anxious',
  'curious',
  'hopeful',
  'interested',
  'excited',
  'delighted',
  'grateful',
] as const;

/**
 * Emotion to sentiment score mapping
 * Used for validation and fallback emotion detection
 */
export const EMOTION_SENTIMENT_MAP: Record<Emotion, number> = {
  // Negative emotions: -1.0 to -0.6
  frustrated: -0.8,
  angry: -1.0,
  disappointed: -0.7,
  // Neutral-negative: -0.5 to -0.2
  confused: -0.4,
  overwhelmed: -0.5,
  anxious: -0.6,
  // Neutral-positive: 0.2 to 0.5
  curious: 0.3,
  hopeful: 0.4,
  interested: 0.3,
  // Positive: 0.6 to 1.0
  excited: 0.8,
  delighted: 1.0,
  grateful: 0.9,
};

/**
 * Validates if a string is a valid emotion label
 */
export function isValidEmotion(emotion: string): emotion is Emotion {
  return VALID_EMOTIONS.includes(emotion as Emotion);
}

/**
 * Filters and validates emotion array from Claude API response
 */
export function validateEmotions(emotions: string[]): Emotion[] {
  return emotions.filter(isValidEmotion);
}

/**
 * Extracts emotions from text based on sentiment score
 * Used as fallback if Claude doesn't provide valid emotions
 */
export function extractEmotions(text: string, sentiment: number): Emotion[] {
  const emotions: Emotion[] = [];

  // Normalize text for keyword matching
  const lowerText = text.toLowerCase();

  // Negative emotions (sentiment < -0.5)
  if (sentiment < -0.5) {
    if (lowerText.includes('angry') || lowerText.includes('furious')) {
      emotions.push('angry');
    }
    if (
      lowerText.includes('frustrat') ||
      lowerText.includes('annoying') ||
      lowerText.includes('annoyed')
    ) {
      emotions.push('frustrated');
    }
    if (
      lowerText.includes('disappoint') ||
      lowerText.includes('let down')
    ) {
      emotions.push('disappointed');
    }
  }

  // Neutral-negative emotions (sentiment -0.5 to 0)
  if (sentiment >= -0.5 && sentiment < 0) {
    if (lowerText.includes('confus') || lowerText.includes('unclear')) {
      emotions.push('confused');
    }
    if (
      lowerText.includes('overwhelm') ||
      lowerText.includes('too much') ||
      lowerText.includes('complex')
    ) {
      emotions.push('overwhelmed');
    }
    if (lowerText.includes('anxious') || lowerText.includes('worried')) {
      emotions.push('anxious');
    }
  }

  // Neutral-positive emotions (sentiment 0 to 0.5)
  if (sentiment >= 0 && sentiment < 0.5) {
    if (
      lowerText.includes('curious') ||
      lowerText.includes('interested') ||
      lowerText.includes('wonder')
    ) {
      emotions.push('curious');
    }
    if (lowerText.includes('hope') || lowerText.includes('optimistic')) {
      emotions.push('hopeful');
    }
  }

  // Positive emotions (sentiment >= 0.5)
  if (sentiment >= 0.5) {
    if (
      lowerText.includes('excit') ||
      lowerText.includes('amazing') ||
      lowerText.includes('awesome')
    ) {
      emotions.push('excited');
    }
    if (
      lowerText.includes('delight') ||
      lowerText.includes('love') ||
      lowerText.includes('perfect')
    ) {
      emotions.push('delighted');
    }
    if (
      lowerText.includes('grateful') ||
      lowerText.includes('thank') ||
      lowerText.includes('appreciate')
    ) {
      emotions.push('grateful');
    }
  }

  // If no emotions detected, use default based on sentiment
  if (emotions.length === 0) {
    if (sentiment < -0.5) {
      emotions.push('frustrated');
    } else if (sentiment >= -0.5 && sentiment < 0) {
      emotions.push('confused');
    } else if (sentiment >= 0 && sentiment < 0.5) {
      emotions.push('interested');
    } else {
      emotions.push('excited');
    }
  }

  // Remove duplicates and return
  return [...new Set(emotions)];
}

/**
 * Gets the average sentiment score for a set of emotions
 */
export function getEmotionSentiment(emotions: Emotion[]): number {
  if (emotions.length === 0) {
    return 0;
  }

  const sum = emotions.reduce((acc, emotion) => {
    return acc + EMOTION_SENTIMENT_MAP[emotion];
  }, 0);

  return sum / emotions.length;
}
