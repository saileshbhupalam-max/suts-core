/**
 * Pipeline Stage Definitions
 *
 * Provides predefined stages for common RGS workflows:
 * - Scraping web signals from various sources
 * - Analyzing sentiment
 * - Extracting themes
 */

import type { WebSignal } from '@rgs/core/models/signal';
import type { Theme } from '@rgs/core/models/insight';
import type { SourceType } from '@rgs/core/models/source';
import type { PipelineStage } from './orchestrator';
import type { PipelineContext } from './context';

/**
 * Scrape configuration input
 */
export interface ScrapeConfig {
  /**
   * Data sources to scrape (e.g., 'reddit', 'twitter')
   */
  sources: string[];

  /**
   * Subreddits to scrape (for Reddit source)
   */
  subreddits?: string[];

  /**
   * Maximum number of signals to collect
   */
  maxSignals?: number;

  /**
   * Time range for scraping (in hours)
   */
  timeRangeHours?: number;
}

/**
 * Sentiment analysis result
 */
export interface SentimentResult {
  /**
   * Signal ID this sentiment relates to
   */
  signalId: string;

  /**
   * Sentiment score (-1 to 1)
   */
  score: number;

  /**
   * Confidence level (0 to 1)
   */
  confidence: number;

  /**
   * Sentiment label (positive, negative, neutral)
   */
  label: 'positive' | 'negative' | 'neutral';
}

/**
 * SCRAPE STAGE
 *
 * Scrapes web signals from configured sources.
 * This is a placeholder implementation that returns mock data.
 * In production, this would coordinate multiple scrapers.
 */
export const SCRAPE_STAGE: PipelineStage<ScrapeConfig, WebSignal[]> = {
  name: 'scrape',

  async execute(config: ScrapeConfig, context: PipelineContext): Promise<WebSignal[]> {
    // Placeholder implementation
    // TODO: Replace with actual scraper coordination

    // Validate config
    if (config.sources.length === 0) {
      throw new Error('At least one source must be specified');
    }

    // Simulate scraping delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate mock signals based on config
    const signals: WebSignal[] = [];
    const maxSignals = config.maxSignals ?? 10;

    for (let i = 0; i < maxSignals; i++) {
      const sourceType = config.sources[0] ?? 'reddit';
      signals.push({
        id: `signal-${i}`,
        source: sourceType as SourceType,
        content: `Mock signal content ${i}`,
        author: `user${i}`,
        timestamp: new Date(),
        url: `https://example.com/signal-${i}`,
        metadata: {
          subreddit: config.subreddits?.[0] ?? 'vscode',
          score: Math.floor(Math.random() * 100),
        },
      });
    }

    // Store signals in context
    context.signals = signals;
    context.metadata['scrapeConfig'] = config;

    return signals;
  },

  validate(output: WebSignal[]): boolean {
    return Array.isArray(output) && output.length > 0;
  },

  // eslint-disable-next-line @typescript-eslint/require-await
  async onError(error: Error, context: PipelineContext): Promise<void> {
    context.metadata['scrapeError'] = error.message;
  },
};

/**
 * SENTIMENT STAGE
 *
 * Analyzes sentiment for collected web signals.
 * This is a placeholder implementation that returns mock sentiment data.
 * In production, this would use an LLM or sentiment analysis library.
 */
export const SENTIMENT_STAGE: PipelineStage<WebSignal[], SentimentResult[]> = {
  name: 'sentiment',

  async execute(signals: WebSignal[], context: PipelineContext): Promise<SentimentResult[]> {
    // Placeholder implementation
    // TODO: Replace with actual sentiment analysis

    if (signals.length === 0) {
      throw new Error('No signals to analyze');
    }

    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate mock sentiment results
    const results: SentimentResult[] = signals.map((signal) => {
      const score = Math.random() * 2 - 1; // -1 to 1
      let label: 'positive' | 'negative' | 'neutral';

      if (score > 0.3) {
        label = 'positive';
      } else if (score < -0.3) {
        label = 'negative';
      } else {
        label = 'neutral';
      }

      return {
        signalId: signal.id,
        score,
        confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
        label,
      };
    });

    // Store sentiments in context
    context.sentiments = results;
    context.metadata['sentimentCount'] = results.length;

    return results;
  },

  validate(output: SentimentResult[]): boolean {
    return (
      Array.isArray(output) &&
      output.every(
        (r) =>
          typeof r.signalId === 'string' &&
          typeof r.score === 'number' &&
          r.score >= -1 &&
          r.score <= 1 &&
          typeof r.confidence === 'number' &&
          r.confidence >= 0 &&
          r.confidence <= 1
      )
    );
  },

  // eslint-disable-next-line @typescript-eslint/require-await
  async onError(error: Error, context: PipelineContext): Promise<void> {
    context.metadata['sentimentError'] = error.message;
  },
};

/**
 * THEMES STAGE
 *
 * Extracts common themes from web signals.
 * This is a placeholder implementation that returns mock theme data.
 * In production, this would use LLM-based theme extraction.
 */
export const THEMES_STAGE: PipelineStage<WebSignal[], Theme[]> = {
  name: 'themes',

  async execute(signals: WebSignal[], context: PipelineContext): Promise<Theme[]> {
    // Placeholder implementation
    // TODO: Replace with actual theme extraction

    if (signals.length === 0) {
      throw new Error('No signals to analyze');
    }

    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate mock themes
    const themes: Theme[] = [
      {
        name: 'Performance',
        confidence: 0.85,
        keywords: ['speed', 'fast', 'slow', 'performance'],
        frequency: Math.floor(signals.length * 0.4),
      },
      {
        name: 'User Experience',
        confidence: 0.78,
        keywords: ['ui', 'ux', 'interface', 'design'],
        frequency: Math.floor(signals.length * 0.3),
      },
      {
        name: 'Bugs',
        confidence: 0.92,
        keywords: ['bug', 'error', 'issue', 'crash'],
        frequency: Math.floor(signals.length * 0.25),
      },
    ];

    // Store themes in context
    context.themes = themes;
    context.metadata['themeCount'] = themes.length;

    return themes;
  },

  validate(output: Theme[]): boolean {
    return (
      Array.isArray(output) &&
      output.every(
        (t) =>
          typeof t.name === 'string' &&
          typeof t.confidence === 'number' &&
          t.confidence >= 0 &&
          t.confidence <= 1 &&
          Array.isArray(t.keywords) &&
          typeof t.frequency === 'number'
      )
    );
  },

  // eslint-disable-next-line @typescript-eslint/require-await
  async onError(error: Error, context: PipelineContext): Promise<void> {
    context.metadata['themesError'] = error.message;
  },
};

/**
 * Creates a custom stage from a simple function
 *
 * @param name - Stage name
 * @param executeFn - Execution function
 * @returns Pipeline stage
 */
export function createStage<TInput, TOutput>(
  name: string,
  executeFn: (input: TInput, context: PipelineContext) => Promise<TOutput>
): PipelineStage<TInput, TOutput> {
  return {
    name,
    execute: executeFn,
  };
}
