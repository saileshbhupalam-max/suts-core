/**
 * RGS Sentiment Analyzer Module
 *
 * Claude-powered sentiment analysis with emotion detection
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { RateLimiter, RateLimiterOptions } from '@rgs/utils';
import { ScraperError, RateLimitError } from '@rgs/utils';
import { Logger } from '@rgs/utils';
import { SentimentCache, type SentimentResult } from './cache';
import {
  validateEmotions,
  extractEmotions,
  type Emotion,
} from './emotions';
import { formatSentimentPrompt, formatBatchSentimentPrompt } from './prompts';

/**
 * Configuration options for SentimentAnalyzer
 */
export interface SentimentAnalyzerConfig {
  /** Anthropic API key */
  apiKey: string;
  /** Claude model to use (default: claude-sonnet-4-20250514) */
  model?: string;
  /** Max tokens for response (default: 500) */
  maxTokens?: number;
  /** Temperature for response (default: 0.3) */
  temperature?: number;
  /** Batch size for batch analysis (default: 10) */
  batchSize?: number;
  /** Enable caching (default: true) */
  cacheEnabled?: boolean;
  /** Max cache entries (default: 10000) */
  maxCacheEntries?: number;
  /** Requests per minute for rate limiting (default: 50) */
  requestsPerMinute?: number;
  /** Logger instance */
  logger?: Logger;
}

/**
 * Zod schema for Claude's sentiment response
 */
const SentimentResponseSchema = z.object({
  score: z.number().min(-1).max(1),
  magnitude: z.number().min(0).max(1),
  emotions: z.array(z.string()),
  reasoning: z.string().optional(),
});

/**
 * Zod schema for batch sentiment response
 */
const BatchSentimentResponseSchema = z.array(SentimentResponseSchema);

/**
 * Claude-powered sentiment analyzer with emotion detection
 *
 * Features:
 * - Sentiment scoring from -1 (negative) to +1 (positive)
 * - Magnitude scoring from 0 (neutral) to 1 (strong)
 * - Emotion detection (12 emotion types)
 * - LRU caching to avoid re-analysis
 * - Rate limiting with circuit breaker
 * - Batch processing support
 * - Retry logic for transient failures
 */
export class SentimentAnalyzer {
  private readonly claude: Anthropic;
  private readonly cache: SentimentCache;
  private readonly rateLimiter: RateLimiter;
  private readonly config: Required<
    Omit<SentimentAnalyzerConfig, 'apiKey' | 'logger'>
  >;
  private readonly logger: Logger | undefined;

  /**
   * Creates a new SentimentAnalyzer instance
   */
  constructor(config: SentimentAnalyzerConfig) {
    // Validate API key
    if (config.apiKey.trim() === '') {
      throw new Error('Anthropic API key is required');
    }

    // Initialize Claude client
    this.claude = new Anthropic({
      apiKey: config.apiKey,
    });

    // Set configuration with defaults
    this.config = {
      model: config.model ?? 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens ?? 500,
      temperature: config.temperature ?? 0.3,
      batchSize: config.batchSize ?? 10,
      cacheEnabled: config.cacheEnabled ?? true,
      maxCacheEntries: config.maxCacheEntries ?? 10000,
      requestsPerMinute: config.requestsPerMinute ?? 50,
    };

    // Initialize cache
    this.cache = new SentimentCache({
      enabled: this.config.cacheEnabled,
      maxEntries: this.config.maxCacheEntries,
    });

    // Initialize rate limiter
    const rateLimiterOptions: RateLimiterOptions = {
      requestsPerMinute: this.config.requestsPerMinute,
    };

    if (config.logger !== undefined) {
      rateLimiterOptions.logger = config.logger;
      this.logger = config.logger;
    }

    this.rateLimiter = new RateLimiter(rateLimiterOptions);
  }

  /**
   * Analyzes sentiment of a single text
   *
   * @param content - The text to analyze
   * @returns Sentiment analysis result
   */
  async analyze(content: string): Promise<SentimentResult> {
    // Validate input
    if (content.trim() === '') {
      throw new Error('Content cannot be empty');
    }

    // Check cache first
    const cached = this.cache.get(content);
    if (cached !== undefined) {
      this.logger?.debug('Cache hit for sentiment analysis', {
        contentLength: content.length,
      });
      return cached;
    }

    this.logger?.debug('Cache miss, calling Claude API', {
      contentLength: content.length,
    });

    // Call Claude API with rate limiting
    const result = await this.rateLimiter.execute(async () => {
      return this.callClaudeAPI(content);
    });

    // Cache the result
    this.cache.set(content, result);

    return result;
  }

  /**
   * Analyzes sentiment of multiple texts in batches
   *
   * @param contents - Array of texts to analyze
   * @returns Array of sentiment analysis results
   */
  async analyzeBatch(contents: string[]): Promise<SentimentResult[]> {
    if (contents.length === 0) {
      return [];
    }

    const results: SentimentResult[] = [];

    // Process in batches
    for (let i = 0; i < contents.length; i += this.config.batchSize) {
      const batch = contents.slice(i, i + this.config.batchSize);

      // Check which items are cached
      const uncachedIndices: number[] = [];
      const uncachedContents: string[] = [];

      for (let j = 0; j < batch.length; j++) {
        const content = batch[j];
        if (content === undefined) {
          continue;
        }

        const cached = this.cache.get(content);
        if (cached !== undefined) {
          results[i + j] = cached;
        } else {
          uncachedIndices.push(i + j);
          uncachedContents.push(content);
        }
      }

      // If all cached, continue to next batch
      if (uncachedContents.length === 0) {
        continue;
      }

      // Analyze uncached items as a batch
      const batchResults = await this.rateLimiter.execute(async () => {
        return this.callClaudeBatchAPI(uncachedContents);
      });

      // Store results in correct positions and cache them
      for (let j = 0; j < uncachedIndices.length; j++) {
        const index = uncachedIndices[j];
        const result = batchResults[j];
        const content = uncachedContents[j];

        if (index !== undefined && result !== undefined && content !== undefined) {
          results[index] = result;
          this.cache.set(content, result);
        }
      }
    }

    return results;
  }

  /**
   * Calls Claude API for single text analysis
   */
  private async callClaudeAPI(content: string): Promise<SentimentResult> {
    try {
      const prompt = formatSentimentPrompt(content);

      const response = await this.claude.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text from response
      const textContent = response.content.find(
        (block): block is Anthropic.ContentBlock & { type: 'text' } => block.type === 'text'
      );

      if (textContent === undefined || textContent.type !== 'text') {
        throw new ScraperError(
          'No text content in Claude response',
          'sentiment',
          false
        );
      }

      // Parse JSON response
      const parsed = this.parseClaudeResponse(textContent.text);

      // Validate and extract emotions
      const validEmotions = validateEmotions(parsed.emotions);
      const emotions =
        validEmotions.length > 0
          ? validEmotions
          : extractEmotions(content, parsed.score);

      const result: SentimentResult = {
        score: parsed.score,
        magnitude: parsed.magnitude,
        emotions,
        confidence: this.calculateConfidence(
          parsed.score,
          parsed.magnitude,
          emotions
        ),
      };

      if (parsed.reasoning !== undefined) {
        result.reasoning = parsed.reasoning;
      }

      return result;
    } catch (error) {
      return this.handleAPIError(error);
    }
  }

  /**
   * Calls Claude API for batch text analysis
   */
  private async callClaudeBatchAPI(
    contents: string[]
  ): Promise<SentimentResult[]> {
    try {
      const prompt = formatBatchSentimentPrompt(contents);

      const response = await this.claude.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens * contents.length,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text from response
      const textContent = response.content.find(
        (block): block is Anthropic.ContentBlock & { type: 'text' } => block.type === 'text'
      );

      if (textContent === undefined || textContent.type !== 'text') {
        throw new ScraperError(
          'No text content in Claude response',
          'sentiment',
          false
        );
      }

      // Parse JSON array response
      const parsed = this.parseBatchClaudeResponse(textContent.text);

      // Validate and map results
      return parsed.map((item: z.infer<typeof SentimentResponseSchema>, index: number): SentimentResult => {
        const content = contents[index];
        if (content === undefined) {
          throw new ScraperError(
            'Content index mismatch in batch response',
            'sentiment',
            false
          );
        }

        const validEmotions = validateEmotions(item.emotions);
        const emotions =
          validEmotions.length > 0
            ? validEmotions
            : extractEmotions(content, item.score);

        const result: SentimentResult = {
          score: item.score,
          magnitude: item.magnitude,
          emotions,
          confidence: this.calculateConfidence(
            item.score,
            item.magnitude,
            emotions
          ),
        };

        if (item.reasoning !== undefined) {
          result.reasoning = item.reasoning;
        }

        return result;
      });
    } catch (error) {
      return this.handleAPIError(error);
    }
  }

  /**
   * Parses Claude's JSON response
   */
  private parseClaudeResponse(response: string): z.infer<
    typeof SentimentResponseSchema
  > {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed: unknown = JSON.parse(cleaned);
      return SentimentResponseSchema.parse(parsed);
    } catch (error) {
      throw new ScraperError(
        `Failed to parse Claude response: ${error instanceof Error ? error.message : String(error)}`,
        'sentiment',
        false,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Parses Claude's batch JSON response
   */
  private parseBatchClaudeResponse(
    response: string
  ): z.infer<typeof BatchSentimentResponseSchema> {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed: unknown = JSON.parse(cleaned);
      return BatchSentimentResponseSchema.parse(parsed);
    } catch (error) {
      throw new ScraperError(
        `Failed to parse Claude batch response: ${error instanceof Error ? error.message : String(error)}`,
        'sentiment',
        false,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Calculates confidence score based on sentiment metrics
   */
  private calculateConfidence(
    score: number,
    magnitude: number,
    emotions: Emotion[]
  ): number {
    // Higher magnitude = higher confidence
    let confidence = magnitude;

    // Strong sentiment (close to -1 or +1) = higher confidence
    const absoluteScore = Math.abs(score);
    confidence = (confidence + absoluteScore) / 2;

    // More emotions = slightly lower confidence (mixed signals)
    if (emotions.length > 2) {
      confidence *= 0.9;
    }

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Handles API errors with appropriate error types and retry logic
   */
  private handleAPIError(error: unknown): never {
    // Handle Anthropic SDK errors
    if (error instanceof Anthropic.APIError) {
      const apiError = error;

      // Rate limit error (429)
      if (apiError.status === 429) {
        throw new RateLimitError(
          'Anthropic API rate limit exceeded',
          'sentiment',
          undefined,
          apiError
        );
      }

      // Overloaded error (529)
      if (apiError.status === 529) {
        throw new ScraperError(
          'Claude API is overloaded',
          'sentiment',
          true,
          apiError
        );
      }

      // Authentication error (401)
      if (apiError.status === 401) {
        throw new ScraperError(
          'Invalid Anthropic API key',
          'sentiment',
          false,
          apiError
        );
      }

      // Other API errors
      throw new ScraperError(
        `Claude API error: ${apiError.message}`,
        'sentiment',
        apiError.status !== undefined && apiError.status >= 500,
        apiError
      );
    }

    // Handle network errors
    if (error instanceof Error && error.message.includes('network')) {
      throw new ScraperError(
        'Network error calling Claude API',
        'sentiment',
        true,
        error
      );
    }

    // Unknown error
    throw new ScraperError(
      'Sentiment analysis failed',
      'sentiment',
      false,
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): {
    size: number;
    maxEntries: number;
    enabled: boolean;
    utilizationPercent: number;
  } {
    return this.cache.getStats();
  }

  /**
   * Clears the sentiment cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
