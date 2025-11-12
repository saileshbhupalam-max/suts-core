/**
 * Tests for sentiment analyzer module
 */

import Anthropic from '@anthropic-ai/sdk';
import { ScraperError, RateLimitError } from '@rgs/utils';
import { SentimentAnalyzer } from '../src/analyzer';
import type { SentimentAnalyzerConfig } from '../src/analyzer';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk');

describe('SentimentAnalyzer', () => {
  let mockClaudeCreate: jest.Mock;
  let analyzer: SentimentAnalyzer;

  const defaultConfig: SentimentAnalyzerConfig = {
    apiKey: 'test-api-key',
    requestsPerMinute: 1000, // High rate limit for tests
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock for Claude API
    mockClaudeCreate = jest.fn();
    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => {
      return {
        messages: {
          create: mockClaudeCreate,
        },
      } as unknown as Anthropic;
    });

    analyzer = new SentimentAnalyzer(defaultConfig);
  });

  describe('constructor', () => {
    it('should create analyzer with default config', () => {
      const analyzer = new SentimentAnalyzer({ apiKey: 'test-key' });
      expect(analyzer).toBeInstanceOf(SentimentAnalyzer);
    });

    it('should throw error for empty API key', () => {
      expect(() => new SentimentAnalyzer({ apiKey: '' })).toThrow('Anthropic API key is required');
    });

    it('should use custom configuration', () => {
      const customConfig: SentimentAnalyzerConfig = {
        apiKey: 'test-key',
        model: 'claude-3-opus-20240229',
        maxTokens: 1000,
        temperature: 0.5,
        batchSize: 5,
        cacheEnabled: false,
      };

      const analyzer = new SentimentAnalyzer(customConfig);
      expect(analyzer).toBeInstanceOf(SentimentAnalyzer);
    });
  });

  describe('analyze', () => {
    it('should analyze sentiment successfully', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.8,
              magnitude: 0.9,
              emotions: ['excited', 'delighted'],
              reasoning: 'Very positive feedback',
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const result = await analyzer.analyze('This is amazing!');

      expect(result.score).toBe(0.8);
      expect(result.magnitude).toBe(0.9);
      expect(result.emotions).toEqual(['excited', 'delighted']);
      expect(result.confidence).toBeGreaterThan(0);
      expect(mockClaudeCreate).toHaveBeenCalledTimes(1);
    });

    it('should return sentiment score between -1 and 1', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: -0.7,
              magnitude: 0.8,
              emotions: ['frustrated'],
              reasoning: 'Negative feedback',
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const result = await analyzer.analyze('This is terrible!');

      expect(result.score).toBeGreaterThanOrEqual(-1);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should detect emotions correctly', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: -0.6,
              magnitude: 0.7,
              emotions: ['frustrated', 'disappointed'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const result = await analyzer.analyze('This bug is frustrating!');

      expect(result.emotions).toContain('frustrated');
      expect(result.emotions.length).toBeGreaterThan(0);
    });

    it('should cache results', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.5,
              magnitude: 0.6,
              emotions: ['hopeful'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const content = 'Test content';

      // First call - should hit API
      await analyzer.analyze(content);
      expect(mockClaudeCreate).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await analyzer.analyze(content);
      expect(mockClaudeCreate).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should throw error for empty content', async () => {
      await expect(analyzer.analyze('')).rejects.toThrow('Content cannot be empty');
    });

    it('should handle JSON response with markdown code blocks', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: '```json\n{"score": 0.7, "magnitude": 0.8, "emotions": ["excited"]}\n```',
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const result = await analyzer.analyze('Great feature!');

      expect(result.score).toBe(0.7);
      expect(result.magnitude).toBe(0.8);
    });

    it('should use fallback emotions if Claude returns invalid emotions', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.8,
              magnitude: 0.9,
              emotions: ['invalid', 'happy', 'unknown'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const result = await analyzer.analyze('This is great!');

      // Should fall back to extractEmotions
      expect(result.emotions.length).toBeGreaterThan(0);
      expect(result.emotions.every((e) => typeof e === 'string')).toBe(true);
    });

    it('should calculate confidence correctly', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.9,
              magnitude: 0.95,
              emotions: ['delighted'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const result = await analyzer.analyze('Perfect!');

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('analyzeBatch', () => {
    it('should analyze batch of texts', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              { score: 0.8, magnitude: 0.9, emotions: ['excited'] },
              { score: -0.6, magnitude: 0.7, emotions: ['frustrated'] },
            ]),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const results = await analyzer.analyzeBatch(['This is great!', 'This is bad!']);

      expect(results).toHaveLength(2);
      expect(results[0]?.score).toBe(0.8);
      expect(results[1]?.score).toBe(-0.6);
    });

    it('should return empty array for empty input', async () => {
      const results = await analyzer.analyzeBatch([]);
      expect(results).toEqual([]);
      expect(mockClaudeCreate).not.toHaveBeenCalled();
    });

    it('should process in batches based on batchSize', async () => {
      const analyzer = new SentimentAnalyzer({
        ...defaultConfig,
        batchSize: 2,
      });

      const mockResponse1 = {
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              { score: 0.5, magnitude: 0.5, emotions: ['interested'] },
              { score: 0.6, magnitude: 0.6, emotions: ['hopeful'] },
            ]),
          },
        ],
      };

      const mockResponse2 = {
        content: [
          {
            type: 'text',
            text: JSON.stringify([{ score: 0.7, magnitude: 0.7, emotions: ['excited'] }]),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      // 3 items with batch size 2 should result in 2 API calls
      await analyzer.analyzeBatch(['text1', 'text2', 'text3']);

      expect(mockClaudeCreate).toHaveBeenCalledTimes(2);
    });

    it('should use cached results in batch analysis', async () => {
      const mockResponse1 = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.7,
              magnitude: 0.8,
              emotions: ['excited'],
            }),
          },
        ],
      };

      const mockResponse2 = {
        content: [
          {
            type: 'text',
            text: JSON.stringify([{ score: 0.5, magnitude: 0.6, emotions: ['hopeful'] }]),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const content1 = 'Test 1';
      const content2 = 'Test 2';

      // Cache first content
      await analyzer.analyze(content1);
      expect(mockClaudeCreate).toHaveBeenCalledTimes(1);

      // Batch analyze with cached and new content
      await analyzer.analyzeBatch([content1, content2]);

      // Should only call API once more for content2
      expect(mockClaudeCreate).toHaveBeenCalledTimes(2);
    });

    it('should skip undefined content items in batch', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify([{ score: 0.7, magnitude: 0.8, emotions: ['excited'] }]),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      // Batch with undefined items
      const results = await analyzer.analyzeBatch([
        'Test 1',
        undefined as unknown as string,
        'Test 2',
      ]);

      // Should only return results for defined items
      expect(results).toHaveLength(1);
      expect(results[0]?.score).toBe(0.7);
    });

    it('should skip batches where all items are cached', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.7,
              magnitude: 0.8,
              emotions: ['excited'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const content = 'Test content';

      // Cache the content
      await analyzer.analyze(content);
      const initialCalls = mockClaudeCreate.mock.calls.length;

      // Analyze batch with only cached content
      const results = await analyzer.analyzeBatch([content]);

      // Should not make additional API calls
      expect(mockClaudeCreate).toHaveBeenCalledTimes(initialCalls);
      expect(results).toHaveLength(1);
      expect(results[0]?.score).toBe(0.7);
    });

    it('should handle response with reasoning field', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.8,
              magnitude: 0.9,
              emotions: ['excited'],
              reasoning: 'The text expresses strong positive emotions',
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const result = await analyzer.analyze('Test with reasoning');

      expect(result.reasoning).toBe('The text expresses strong positive emotions');
    });

    it('should handle markdown blocks without json prefix', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: '```\n{"score":0.8,"magnitude":0.9,"emotions":["excited"]}\n```',
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const result = await analyzer.analyze('Test');

      expect(result.score).toBe(0.8);
    });

    it('should handle batch markdown blocks without json prefix', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: '```\n[{"score":0.8,"magnitude":0.9,"emotions":["excited"]}]\n```',
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const results = await analyzer.analyzeBatch(['Test']);

      expect(results).toHaveLength(1);
      expect(results[0]?.score).toBe(0.8);
    });
  });

  describe('error handling', () => {
    it('should throw error when Claude response has no text content', async () => {
      const mockResponse = {
        content: [
          {
            type: 'tool_use',
            id: 'some-id',
            name: 'some-tool',
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      await expect(analyzer.analyze('Test')).rejects.toThrow(ScraperError);
    });

    it('should throw error on content index mismatch in batch', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            // Return array with more items than input - causes index mismatch
            text: JSON.stringify([
              { score: 0.7, magnitude: 0.8, emotions: ['excited'] },
              { score: 0.6, magnitude: 0.7, emotions: ['hopeful'] },
            ]),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      // Only provide 1 item but response has 2 - will cause mismatch
      await expect(analyzer.analyzeBatch(['Test'])).rejects.toThrow(ScraperError);
    });

    it('should handle rate limit errors (429)', async () => {
      const error = new Anthropic.APIError(
        429,
        { error: { message: 'Rate limit exceeded' } },
        'Rate limit exceeded',
        new Headers()
      );
      Object.defineProperty(error, 'status', { value: 429 });

      mockClaudeCreate.mockRejectedValue(error);

      await expect(analyzer.analyze('Test')).rejects.toThrow(RateLimitError);
    });

    it('should handle overloaded errors (529)', async () => {
      const error = new Anthropic.APIError(
        529,
        { error: { message: 'Overloaded' } },
        'Overloaded',
        new Headers()
      );
      Object.defineProperty(error, 'status', { value: 529 });

      mockClaudeCreate.mockRejectedValue(error);

      await expect(analyzer.analyze('Test')).rejects.toThrow(ScraperError);
    });

    it('should handle authentication errors (401)', async () => {
      const error = new Anthropic.APIError(
        401,
        { error: { message: 'Invalid API key' } },
        'Invalid API key',
        new Headers()
      );
      Object.defineProperty(error, 'status', { value: 401 });

      mockClaudeCreate.mockRejectedValue(error);

      await expect(analyzer.analyze('Test')).rejects.toThrow(ScraperError);
    });

    it('should handle invalid JSON responses', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      await expect(analyzer.analyze('Test')).rejects.toThrow(ScraperError);
    });

    it('should handle missing text content in response', async () => {
      const mockResponse = {
        content: [
          {
            type: 'image',
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      await expect(analyzer.analyze('Test')).rejects.toThrow(ScraperError);
    });

    it('should handle invalid score range in response', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 2.0, // Invalid: > 1
              magnitude: 0.8,
              emotions: ['excited'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      await expect(analyzer.analyze('Test')).rejects.toThrow();
    });

    it('should handle invalid magnitude range in response', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.5,
              magnitude: -0.1, // Invalid: < 0
              emotions: ['interested'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      await expect(analyzer.analyze('Test')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const error = new Error('network error occurred');
      mockClaudeCreate.mockRejectedValue(error);

      await expect(analyzer.analyze('Test')).rejects.toThrow(ScraperError);
    });

    it('should handle 500 server errors as retryable', async () => {
      const error = new Anthropic.APIError(
        500,
        { error: { message: 'Internal server error' } },
        'Internal server error',
        new Headers()
      );
      Object.defineProperty(error, 'status', { value: 500 });

      mockClaudeCreate.mockRejectedValue(error);

      await expect(analyzer.analyze('Test')).rejects.toThrow(ScraperError);
    });

    it('should handle 400 client errors as non-retryable', async () => {
      const error = new Anthropic.APIError(
        400,
        { error: { message: 'Bad request' } },
        'Bad request',
        new Headers()
      );
      Object.defineProperty(error, 'status', { value: 400 });

      mockClaudeCreate.mockRejectedValue(error);

      await expect(analyzer.analyze('Test')).rejects.toThrow(ScraperError);
    });

    it('should handle batch parsing errors', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'Invalid batch JSON',
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      await expect(analyzer.analyzeBatch(['test1', 'test2'])).rejects.toThrow(ScraperError);
    });
  });

  describe('cache management', () => {
    it('should get cache statistics', () => {
      const stats = analyzer.getCacheStats();
      expect(stats.size).toBeDefined();
      expect(stats.maxEntries).toBeDefined();
      expect(stats.enabled).toBeDefined();
      expect(stats.utilizationPercent).toBeDefined();
    });

    it('should clear cache', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.5,
              magnitude: 0.6,
              emotions: ['interested'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      // Add to cache
      await analyzer.analyze('Test');
      expect(analyzer.getCacheStats().size).toBe(1);

      // Clear cache
      analyzer.clearCache();
      expect(analyzer.getCacheStats().size).toBe(0);

      // Should call API again after cache clear
      await analyzer.analyze('Test');
      expect(mockClaudeCreate).toHaveBeenCalledTimes(2);
    });

    it('should respect cacheEnabled setting', async () => {
      const analyzer = new SentimentAnalyzer({
        ...defaultConfig,
        cacheEnabled: false,
      });

      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.5,
              magnitude: 0.6,
              emotions: ['interested'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const content = 'Test';

      // Should call API twice even with same content (no caching)
      await analyzer.analyze(content);
      await analyzer.analyze(content);

      expect(mockClaudeCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('configuration', () => {
    it('should use custom model', () => {
      const analyzer = new SentimentAnalyzer({
        apiKey: 'test-key',
        model: 'claude-3-opus-20240229',
      });

      expect(analyzer).toBeInstanceOf(SentimentAnalyzer);
    });

    it('should use custom maxTokens', () => {
      const analyzer = new SentimentAnalyzer({
        apiKey: 'test-key',
        maxTokens: 1000,
      });

      expect(analyzer).toBeInstanceOf(SentimentAnalyzer);
    });

    it('should use custom temperature', () => {
      const analyzer = new SentimentAnalyzer({
        apiKey: 'test-key',
        temperature: 0.5,
      });

      expect(analyzer).toBeInstanceOf(SentimentAnalyzer);
    });

    it('should use custom batchSize', () => {
      const analyzer = new SentimentAnalyzer({
        apiKey: 'test-key',
        batchSize: 5,
      });

      expect(analyzer).toBeInstanceOf(SentimentAnalyzer);
    });
  });

  describe('integration scenarios', () => {
    it('should handle mixed sentiment analysis', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.2,
              magnitude: 0.6,
              emotions: ['hopeful', 'confused'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const result = await analyzer.analyze(
        'This feature could be good but I am not sure how to use it.'
      );

      expect(result.score).toBeGreaterThan(-1);
      expect(result.score).toBeLessThan(1);
      expect(result.emotions.length).toBeGreaterThan(0);
    });

    it('should handle strongly negative feedback', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: -0.95,
              magnitude: 0.98,
              emotions: ['angry', 'frustrated'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const result = await analyzer.analyze(
        'This is absolutely terrible! I am furious about this bug!'
      );

      expect(result.score).toBeLessThan(-0.5);
      expect(result.magnitude).toBeGreaterThan(0.9);
    });

    it('should handle strongly positive feedback', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              score: 0.95,
              magnitude: 0.98,
              emotions: ['delighted', 'excited', 'grateful'],
            }),
          },
        ],
      };

      mockClaudeCreate.mockResolvedValue(mockResponse);

      const result = await analyzer.analyze(
        'This is amazing! I love this feature! Thank you so much!'
      );

      expect(result.score).toBeGreaterThan(0.5);
      expect(result.magnitude).toBeGreaterThan(0.9);
    });
  });
});
