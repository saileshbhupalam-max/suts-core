/**
 * Enhanced Sentiment Analyzer
 * Analyzes sentiment using Claude with 5-point scale and emotion detection
 */

import Anthropic from '@anthropic-ai/sdk';
import { EnhancedSentiment, EnhancedSentimentSchema } from './types';
import { SentimentCache } from './cache';
import { formatPrompt } from './prompts';
import { scaleToScore, SentimentScale } from './scales';
import { getEmotionCategory, isValidEmotion } from './emotions';
import { ValidationError } from '@rgs/utils/errors';

/**
 * Configuration for EnhancedSentimentAnalyzer
 */
export interface AnalyzerConfig {
  /** Anthropic API key */
  apiKey: string;

  /** Claude model to use (default: claude-sonnet-4-20250514) */
  model?: string;

  /** Maximum tokens for response (default: 500) */
  maxTokens?: number;

  /** Temperature for generation (default: 0.3) */
  temperature?: number;

  /** Enable caching (default: true) */
  enableCache?: boolean;

  /** Cache max entries (default: 1000) */
  cacheMaxEntries?: number;

  /** Cache TTL in ms (default: 24 hours) */
  cacheTtlMs?: number;
}

/**
 * Enhanced Sentiment Analyzer using Claude
 */
export class EnhancedSentimentAnalyzer {
  private readonly claude: Anthropic;
  private readonly cache: SentimentCache | undefined;
  private readonly config: Required<Omit<AnalyzerConfig, 'apiKey' | 'enableCache' | 'cacheMaxEntries' | 'cacheTtlMs'>>;

  /**
   * Creates a new EnhancedSentimentAnalyzer
   *
   * @param config - Analyzer configuration
   */
  constructor(config: AnalyzerConfig) {
    if (config.apiKey === undefined || config.apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }

    this.claude = new Anthropic({
      apiKey: config.apiKey
    });

    this.config = {
      model: config.model ?? 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens ?? 500,
      temperature: config.temperature ?? 0.3
    };

    // Initialize cache if enabled
    const enableCache = config.enableCache ?? true;
    if (enableCache) {
      this.cache = new SentimentCache(
        config.cacheMaxEntries ?? 1000,
        config.cacheTtlMs ?? 24 * 60 * 60 * 1000
      );
    }
  }

  /**
   * Analyzes sentiment of given content
   *
   * @param content - Text content to analyze
   * @returns Enhanced sentiment analysis
   */
  async analyze(content: string): Promise<EnhancedSentiment> {
    if (content === undefined || content.trim().length === 0) {
      throw new ValidationError('Content cannot be empty', 'sentiment-analyzer');
    }

    // Check cache first
    if (this.cache !== undefined) {
      const cached = this.cache.get(content);
      if (cached !== undefined) {
        return cached;
      }
    }

    // Call Claude for analysis
    try {
      const result = await this.callClaude(content);
      const sentiment = this.parseResponse(result);

      // Cache result
      if (this.cache !== undefined) {
        this.cache.set(content, sentiment);
      }

      return sentiment;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Failed to analyze sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'sentiment-analyzer',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Analyzes sentiment for multiple content items
   *
   * @param contents - Array of content to analyze
   * @returns Array of sentiment analyses
   */
  async analyzeBatch(contents: string[]): Promise<EnhancedSentiment[]> {
    if (contents.length === 0) {
      return [];
    }

    const results: EnhancedSentiment[] = [];

    for (const content of contents) {
      try {
        const sentiment = await this.analyze(content);
        results.push(sentiment);
      } catch (error) {
        // Log error but continue with batch
        console.error(`Failed to analyze content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Could push a default "unknown" sentiment here if needed
      }
    }

    return results;
  }

  /**
   * Calls Claude API for sentiment analysis
   *
   * @param content - Content to analyze
   * @returns Raw response text
   */
  private async callClaude(content: string): Promise<string> {
    const prompt = formatPrompt(content);

    const response = await this.claude.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const firstContent = response.content[0];
    if (firstContent === undefined || firstContent.type !== 'text') {
      throw new ValidationError('Invalid response format from Claude', 'sentiment-analyzer');
    }

    return firstContent.text;
  }

  /**
   * Parses Claude response into EnhancedSentiment
   *
   * @param text - Response text from Claude
   * @returns Parsed sentiment
   */
  private parseResponse(text: string): EnhancedSentiment {
    try {
      // Strip markdown code blocks if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Parse JSON
      const parsed: unknown = JSON.parse(cleaned);

      // Validate with zod
      const validated = EnhancedSentimentSchema.parse(parsed);

      // Enhance emotions with categories
      const emotions = validated.emotions.map((e) => {
        const emotionLabel = e.label;
        if (typeof emotionLabel !== 'string' || !isValidEmotion(emotionLabel)) {
          throw new ValidationError(
            `Invalid emotion label: ${String(emotionLabel)}`,
            'sentiment-analyzer'
          );
        }
        return {
          label: emotionLabel,
          category: getEmotionCategory(emotionLabel),
          intensity: e.intensity
        };
      });

      // Map scale to score
      const score = scaleToScore(validated.scale as SentimentScale);

      return {
        scale: validated.scale as SentimentScale,
        score,
        magnitude: validated.magnitude,
        emotions,
        confidence: validated.confidence,
        reasoning: validated.reasoning
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(
        `Failed to parse sentiment response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'sentiment-analyzer',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Gets cache statistics (if cache is enabled)
   *
   * @returns Cache stats or undefined if cache is disabled
   */
  getCacheStats(): { size: number; capacity: number } | undefined {
    return this.cache?.getStats();
  }

  /**
   * Clears the cache (if enabled)
   */
  clearCache(): void {
    this.cache?.clear();
  }
}
