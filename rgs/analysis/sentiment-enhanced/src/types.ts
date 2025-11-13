/**
 * Type definitions for enhanced sentiment analysis
 */

import { z } from 'zod';
import { SentimentScale } from './scales';
import { EmotionLabel, EmotionCategory } from './emotions';

/**
 * Emotion with intensity
 */
export interface EmotionScore {
  /** Emotion label */
  label: EmotionLabel;

  /** Emotion category */
  category?: EmotionCategory;

  /** Intensity (0-1) */
  intensity: number;
}

/**
 * Enhanced sentiment analysis result
 */
export interface EnhancedSentiment {
  /** 5-point sentiment scale (1-5) */
  scale: SentimentScale;

  /** Score for backward compatibility (-1 to +1) */
  score: number;

  /** Magnitude/strength of sentiment (0-1) */
  magnitude: number;

  /** Detected emotions with intensity */
  emotions: EmotionScore[];

  /** Confidence in analysis (0-1) */
  confidence: number;

  /** Brief reasoning for the analysis */
  reasoning: string;
}

/**
 * Aggregated sentiment across multiple signals
 */
export interface AggregatedSentiment {
  /** Overall sentiment scale */
  overall: SentimentScale;

  /** Average score (-1 to +1) */
  avgScore: number;

  /** Average magnitude (0-1) */
  avgMagnitude: number;

  /** Average confidence (0-1) */
  avgConfidence: number;

  /** Distribution across scales */
  scaleDistribution: Map<SentimentScale, number>;

  /** Distribution of emotions */
  emotionDistribution: Map<EmotionLabel, number>;

  /** Top emotions detected */
  topEmotions: Array<{ label: EmotionLabel; count: number }>;

  /** Total number of sentiments analyzed */
  total: number;
}

/**
 * Zod schema for emotion validation
 */
export const EmotionScoreSchema = z.object({
  label: z.string(),
  intensity: z.number().min(0).max(1)
});

/**
 * Zod schema for enhanced sentiment validation
 */
export const EnhancedSentimentSchema = z.object({
  scale: z.number().int().min(1).max(5),
  magnitude: z.number().min(0).max(1),
  emotions: z.array(EmotionScoreSchema).min(1).max(3),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1)
});
