/**
 * RGS Enhanced Sentiment Analysis
 * 5-point scale sentiment analysis with detailed emotion detection
 *
 * @packageDocumentation
 */

// Core exports
export { EnhancedSentimentAnalyzer, AnalyzerConfig } from './analyzer';
export { SentimentAggregator } from './aggregator';
export { SentimentCache } from './cache';

// Types and schemas
export {
  EnhancedSentiment,
  EmotionScore,
  AggregatedSentiment,
  EnhancedSentimentSchema,
  EmotionScoreSchema
} from './types';

// Scales
export {
  SentimentScale,
  scaleToScore,
  scoreToScale,
  getScaleDescription,
  isValidScale
} from './scales';

// Emotions
export {
  EmotionLabel,
  EmotionCategory,
  EMOTION_TAXONOMY,
  EMOTION_LABELS,
  getEmotionCategory,
  getEmotionsByCategory,
  isValidEmotion,
  createEmotionScore,
  filterEmotionsByCategory,
  getTopEmotions
} from './emotions';

// Prompts
export { ENHANCED_SENTIMENT_PROMPT, formatPrompt } from './prompts';
