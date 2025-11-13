/**
 * Tests for Pipeline Stages
 */

import {
  SCRAPE_STAGE,
  SENTIMENT_STAGE,
  THEMES_STAGE,
  createStage,
  type ScrapeConfig,
} from '../src/stages';
import { createPipelineContext } from '../src/context';
import type { WebSignal } from '@rgs/core/models/signal';

describe('Pipeline Stages', () => {
  describe('SCRAPE_STAGE', () => {
    it('should have correct name', () => {
      expect(SCRAPE_STAGE.name).toBe('scrape');
    });

    it('should execute with valid config', async () => {
      const config: ScrapeConfig = {
        sources: ['reddit'],
        subreddits: ['vscode'],
        maxSignals: 5,
      };
      const context = createPipelineContext();

      const result = await SCRAPE_STAGE.execute(config, context);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      expect(context.signals).toBe(result);
      expect(context.metadata['scrapeConfig']).toBe(config);
    });

    it('should generate signals with correct structure', async () => {
      const config: ScrapeConfig = {
        sources: ['reddit'],
        maxSignals: 3,
      };
      const context = createPipelineContext();

      const result = await SCRAPE_STAGE.execute(config, context);

      result.forEach((signal) => {
        expect(signal).toHaveProperty('id');
        expect(signal).toHaveProperty('source');
        expect(signal).toHaveProperty('content');
        expect(signal).toHaveProperty('author');
        expect(signal).toHaveProperty('timestamp');
        expect(signal).toHaveProperty('url');
        expect(signal).toHaveProperty('metadata');
        expect(signal.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should throw error if no sources specified', async () => {
      const config: ScrapeConfig = {
        sources: [],
      };
      const context = createPipelineContext();

      await expect(SCRAPE_STAGE.execute(config, context)).rejects.toThrow(
        'At least one source must be specified'
      );
    });

    it('should use default maxSignals if not provided', async () => {
      const config: ScrapeConfig = {
        sources: ['reddit'],
      };
      const context = createPipelineContext();

      const result = await SCRAPE_STAGE.execute(config, context);

      expect(result.length).toBe(10); // Default
    });

    it('should validate output correctly', () => {
      const validOutput: WebSignal[] = [
        {
          id: 'test-1',
          source: 'reddit',
          content: 'test',
          author: 'user1',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
        },
      ];

      expect(SCRAPE_STAGE.validate?.(validOutput)).toBe(true);
      expect(SCRAPE_STAGE.validate?.([])).toBe(false);
    });

    it('should handle errors with onError', async () => {
      const context = createPipelineContext();
      const error = new Error('Scrape failed');

      await SCRAPE_STAGE.onError?.(error, context);

      expect(context.metadata['scrapeError']).toBe('Scrape failed');
    });
  });

  describe('SENTIMENT_STAGE', () => {
    it('should have correct name', () => {
      expect(SENTIMENT_STAGE.name).toBe('sentiment');
    });

    it('should execute with valid signals', async () => {
      const signals: WebSignal[] = [
        {
          id: 'signal-1',
          source: 'reddit',
          content: 'test content',
          author: 'user1',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
        },
      ];
      const context = createPipelineContext();

      const result = await SENTIMENT_STAGE.execute(signals, context);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(context.sentiments).toBeDefined();
      expect(context.metadata['sentimentCount']).toBe(1);
    });

    it('should generate sentiment results with correct structure', async () => {
      const signals: WebSignal[] = [
        {
          id: 'signal-1',
          source: 'reddit',
          content: 'test',
          author: 'user1',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
        },
      ];
      const context = createPipelineContext();

      const result = await SENTIMENT_STAGE.execute(signals, context);

      result.forEach((sentiment) => {
        expect(sentiment).toHaveProperty('signalId');
        expect(sentiment).toHaveProperty('score');
        expect(sentiment).toHaveProperty('confidence');
        expect(sentiment).toHaveProperty('label');
        expect(sentiment.score).toBeGreaterThanOrEqual(-1);
        expect(sentiment.score).toBeLessThanOrEqual(1);
        expect(sentiment.confidence).toBeGreaterThanOrEqual(0);
        expect(sentiment.confidence).toBeLessThanOrEqual(1);
        expect(['positive', 'negative', 'neutral']).toContain(sentiment.label);
      });
    });

    it('should throw error if no signals provided', async () => {
      const context = createPipelineContext();

      await expect(SENTIMENT_STAGE.execute([], context)).rejects.toThrow('No signals to analyze');
    });

    it('should validate output correctly', () => {
      const validOutput = [
        {
          signalId: 'signal-1',
          score: 0.5,
          confidence: 0.8,
          label: 'positive' as const,
        },
      ];

      expect(SENTIMENT_STAGE.validate?.(validOutput)).toBe(true);

      const invalidScore = [
        {
          signalId: 'signal-1',
          score: 5, // Invalid: > 1
          confidence: 0.8,
          label: 'positive' as const,
        },
      ];
      expect(SENTIMENT_STAGE.validate?.(invalidScore)).toBe(false);

      const invalidConfidence = [
        {
          signalId: 'signal-1',
          score: 0.5,
          confidence: 1.5, // Invalid: > 1
          label: 'positive' as const,
        },
      ];
      expect(SENTIMENT_STAGE.validate?.(invalidConfidence)).toBe(false);
    });

    it('should handle errors with onError', async () => {
      const context = createPipelineContext();
      const error = new Error('Sentiment analysis failed');

      await SENTIMENT_STAGE.onError?.(error, context);

      expect(context.metadata['sentimentError']).toBe('Sentiment analysis failed');
    });
  });

  describe('THEMES_STAGE', () => {
    it('should have correct name', () => {
      expect(THEMES_STAGE.name).toBe('themes');
    });

    it('should execute with valid signals', async () => {
      const signals: WebSignal[] = [
        {
          id: 'signal-1',
          source: 'reddit',
          content: 'test content',
          author: 'user1',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
        },
      ];
      const context = createPipelineContext();

      const result = await THEMES_STAGE.execute(signals, context);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(context.themes).toBe(result);
      expect(context.metadata['themeCount']).toBe(result.length);
    });

    it('should generate themes with correct structure', async () => {
      const signals: WebSignal[] = [
        {
          id: 'signal-1',
          source: 'reddit',
          content: 'test',
          author: 'user1',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
        },
      ];
      const context = createPipelineContext();

      const result = await THEMES_STAGE.execute(signals, context);

      result.forEach((theme) => {
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('confidence');
        expect(theme).toHaveProperty('keywords');
        expect(theme).toHaveProperty('frequency');
        expect(typeof theme.name).toBe('string');
        expect(Array.isArray(theme.keywords)).toBe(true);
        expect(theme.confidence).toBeGreaterThanOrEqual(0);
        expect(theme.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should throw error if no signals provided', async () => {
      const context = createPipelineContext();

      await expect(THEMES_STAGE.execute([], context)).rejects.toThrow('No signals to analyze');
    });

    it('should validate output correctly', () => {
      const validOutput = [
        {
          name: 'Performance',
          confidence: 0.85,
          keywords: ['speed', 'fast'],
          frequency: 10,
        },
      ];

      expect(THEMES_STAGE.validate?.(validOutput)).toBe(true);

      const invalidConfidence = [
        {
          name: 'Performance',
          confidence: 1.5, // Invalid: > 1
          keywords: ['speed'],
          frequency: 10,
        },
      ];
      expect(THEMES_STAGE.validate?.(invalidConfidence)).toBe(false);

      const invalidKeywords = [
        {
          name: 'Performance',
          confidence: 0.85,
          keywords: 'not an array', // Invalid: not an array
          frequency: 10,
        },
      ];
      expect(THEMES_STAGE.validate?.(invalidKeywords as never)).toBe(false);
    });

    it('should handle errors with onError', async () => {
      const context = createPipelineContext();
      const error = new Error('Theme extraction failed');

      await THEMES_STAGE.onError?.(error, context);

      expect(context.metadata['themesError']).toBe('Theme extraction failed');
    });
  });

  describe('createStage', () => {
    it('should create a custom stage', async () => {
      const stage = createStage<number, number>('multiply', async (input) => {
        return input * 2;
      });

      expect(stage.name).toBe('multiply');

      const context = createPipelineContext();
      const result = await stage.execute(5, context);

      expect(result).toBe(10);
    });

    it('should create a stage that accesses context', async () => {
      const stage = createStage<number, number>('with-context', async (input, context) => {
        context.metadata['processed'] = true;
        return input;
      });

      const context = createPipelineContext();
      await stage.execute(5, context);

      expect(context.metadata['processed']).toBe(true);
    });

    it('should create async stage', async () => {
      const stage = createStage<number, number>('async-stage', async (input) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return input * 2;
      });

      const context = createPipelineContext();
      const result = await stage.execute(5, context);

      expect(result).toBe(10);
    });
  });
});
