/**
 * RGS Sentiment Analysis Package
 *
 * Claude-powered sentiment and emotion detection for developer feedback
 */

// Main analyzer
export { SentimentAnalyzer } from './analyzer';
export type { SentimentAnalyzerConfig } from './analyzer';

// Cache
export { SentimentCache } from './cache';
export type { SentimentResult, SentimentCacheOptions } from './cache';

// Emotions
export {
  VALID_EMOTIONS,
  EMOTION_SENTIMENT_MAP,
  isValidEmotion,
  validateEmotions,
  extractEmotions,
  getEmotionSentiment,
} from './emotions';
export type { Emotion } from './emotions';

// Prompts
export {
  SENTIMENT_PROMPT,
  BATCH_SENTIMENT_PROMPT,
  formatSentimentPrompt,
  formatBatchSentimentPrompt,
} from './prompts';
