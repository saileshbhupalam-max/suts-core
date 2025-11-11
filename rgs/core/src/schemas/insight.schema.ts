/**
 * RGS Core - Insight Zod Schemas
 *
 * Zod validation schemas for insight data.
 */

import { z } from 'zod';

/**
 * Schema for confidence scores (0 to 1)
 */
export const ConfidenceSchema = z.number().min(0).max(1);

/**
 * Schema for Theme
 */
export const ThemeSchema = z.object({
  name: z.string().min(1),
  confidence: ConfidenceSchema,
  frequency: z.number().nonnegative(),
  keywords: z.array(z.string()),
});

/**
 * Schema for SentimentAnalysis
 */
export const SentimentAnalysisSchema = z.object({
  overall: z.number().min(-1).max(1),
  distribution: z.object({
    positive: z.number().min(0).max(1),
    neutral: z.number().min(0).max(1),
    negative: z.number().min(0).max(1),
  }),
  positiveSignals: z.array(z.string()),
  negativeSignals: z.array(z.string()),
});

/**
 * Schema for LanguagePatterns
 */
export const LanguagePatternsSchema = z.object({
  commonPhrases: z.array(z.string()),
  tone: z.string(),
  frequentTerms: z.record(z.number()),
  emotionalIndicators: z.array(z.string()),
});

/**
 * Schema for Insight
 */
export const InsightSchema = z.object({
  themes: z.array(ThemeSchema),
  sentiment: SentimentAnalysisSchema,
  painPoints: z.array(z.string()),
  desires: z.array(z.string()),
  language: LanguagePatternsSchema,
  confidence: ConfidenceSchema,
});

/**
 * Type inference from schemas
 */
export type ThemeSchemaType = z.infer<typeof ThemeSchema>;
export type SentimentAnalysisSchemaType = z.infer<typeof SentimentAnalysisSchema>;
export type LanguagePatternsSchemaType = z.infer<typeof LanguagePatternsSchema>;
export type InsightSchemaType = z.infer<typeof InsightSchema>;
