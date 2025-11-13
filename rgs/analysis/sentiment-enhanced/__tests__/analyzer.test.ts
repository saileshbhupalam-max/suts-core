/**
 * Tests for enhanced sentiment analyzer
 */

import { EnhancedSentimentAnalyzer, AnalyzerConfig } from '../src/analyzer';
import { SentimentScale } from '../src/scales';
import { ValidationError } from '@rgs/utils/errors';

// Mock Anthropic
const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate
    }
  }));
});

describe('EnhancedSentimentAnalyzer', () => {
  let analyzer: EnhancedSentimentAnalyzer;

  const validConfig: AnalyzerConfig = {
    apiKey: 'test-api-key',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 500,
    temperature: 0.3,
    enableCache: true
  };

  const mockValidResponse = {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          scale: 4,
          magnitude: 0.8,
          emotions: [
            { label: 'excited', intensity: 0.9 },
            { label: 'hopeful', intensity: 0.6 }
          ],
          confidence: 0.85,
          reasoning: 'The text expresses enthusiasm and optimism'
        })
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue(mockValidResponse);
    analyzer = new EnhancedSentimentAnalyzer(validConfig);
  });

  describe('constructor', () => {
    it('should create analyzer with valid config', () => {
      expect(() => new EnhancedSentimentAnalyzer(validConfig)).not.toThrow();
    });

    it('should throw error for empty API key', () => {
      expect(() =>
        new EnhancedSentimentAnalyzer({ ...validConfig, apiKey: '' })
      ).toThrow('API key is required');
    });

    it('should throw error for undefined API key', () => {
      expect(() =>
        new EnhancedSentimentAnalyzer({ ...validConfig, apiKey: undefined as any })
      ).toThrow('API key is required');
    });

    it('should use default values for optional config', () => {
      const minimalConfig = { apiKey: 'test-key' };
      expect(() => new EnhancedSentimentAnalyzer(minimalConfig)).not.toThrow();
    });

    it('should initialize cache when enabled', () => {
      const analyzer = new EnhancedSentimentAnalyzer({
        ...validConfig,
        enableCache: true
      });
      expect(analyzer.getCacheStats()).toBeDefined();
    });

    it('should not initialize cache when disabled', () => {
      const analyzer = new EnhancedSentimentAnalyzer({
        ...validConfig,
        enableCache: false
      });
      expect(analyzer.getCacheStats()).toBeUndefined();
    });
  });

  describe('analyze', () => {
    it('should analyze sentiment successfully', async () => {
      const result = await analyzer.analyze('This is great!');

      expect(result.scale).toBe(SentimentScale.Positive);
      expect(result.score).toBe(0.5);
      expect(result.magnitude).toBe(0.8);
      expect(result.emotions).toHaveLength(2);
      expect(result.emotions[0]?.label).toBe('excited');
      expect(result.confidence).toBe(0.85);
      expect(result.reasoning).toBe('The text expresses enthusiasm and optimism');
    });

    it('should throw error for empty content', async () => {
      await expect(analyzer.analyze('')).rejects.toThrow(ValidationError);
      await expect(analyzer.analyze('   ')).rejects.toThrow(ValidationError);
    });

    it('should call Claude with correct parameters', async () => {
      await analyzer.analyze('Test content');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          temperature: 0.3,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Test content')
            })
          ])
        })
      );
    });

    it('should use cache for repeated content', async () => {
      const content = 'Same content';

      await analyzer.analyze(content);
      await analyzer.analyze(content);

      // Should only call Claude once due to caching
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should handle markdown-wrapped JSON response', async () => {
      const markdownResponse = {
        content: [
          {
            type: 'text',
            text: '```json\n' + mockValidResponse.content[0]?.text + '\n```'
          }
        ]
      };

      mockCreate.mockResolvedValue(markdownResponse);

      const result = await analyzer.analyze('Test');
      expect(result.scale).toBe(SentimentScale.Positive);
    });

    it('should map scale to score correctly', async () => {
      const testCases = [
        { scale: 1, expectedScore: -1.0 },
        { scale: 2, expectedScore: -0.5 },
        { scale: 3, expectedScore: 0.0 },
        { scale: 4, expectedScore: 0.5 },
        { scale: 5, expectedScore: 1.0 }
      ];

      for (const testCase of testCases) {
        const response = {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                scale: testCase.scale,
                magnitude: 0.8,
                emotions: [{ label: 'curious', intensity: 0.5 }],
                confidence: 0.9,
                reasoning: 'Test'
              })
            }
          ]
        };

        mockCreate.mockResolvedValue(response);
        const result = await analyzer.analyze(`Test ${testCase.scale}`);
        expect(result.score).toBe(testCase.expectedScore);
      }
    });

    it('should validate emotion labels', async () => {
      const invalidResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              scale: 4,
              magnitude: 0.8,
              emotions: [{ label: 'invalid_emotion', intensity: 0.9 }],
              confidence: 0.85,
              reasoning: 'Test'
            })
          }
        ]
      };

      mockCreate.mockResolvedValue(invalidResponse);

      await expect(analyzer.analyze('Test')).rejects.toThrow(ValidationError);
    });

    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));

      await expect(analyzer.analyze('Test')).rejects.toThrow(ValidationError);
    });

    it('should handle invalid JSON response', async () => {
      const invalidJsonResponse = {
        content: [
          {
            type: 'text',
            text: 'Not valid JSON'
          }
        ]
      };

      mockCreate.mockResolvedValue(invalidJsonResponse);

      await expect(analyzer.analyze('Test')).rejects.toThrow(ValidationError);
    });

    it('should handle missing response content', async () => {
      const emptyResponse = {
        content: []
      };

      mockCreate.mockResolvedValue(emptyResponse);

      await expect(analyzer.analyze('Test')).rejects.toThrow(ValidationError);
    });

    it('should add emotion categories to parsed emotions', async () => {
      const result = await analyzer.analyze('Test');

      expect(result.emotions[0]?.category).toBeDefined();
      expect(result.emotions[0]?.label).toBe('excited');
      expect(result.emotions[0]?.intensity).toBe(0.9);
    });
  });

  describe('analyzeBatch', () => {
    it('should analyze multiple contents', async () => {
      const contents = ['Content 1', 'Content 2', 'Content 3'];

      const results = await analyzer.analyzeBatch(contents);

      expect(results).toHaveLength(3);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should return empty array for empty input', async () => {
      const results = await analyzer.analyzeBatch([]);

      expect(results).toHaveLength(0);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should continue on individual failures', async () => {
      // Mock console.error to suppress error output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const contents = ['Good content', '', 'Another good content'];

      const results = await analyzer.analyzeBatch(contents);

      // Should have 2 results (skipping the empty string)
      expect(results).toHaveLength(2);

      consoleErrorSpy.mockRestore();
    });

    it('should use cache across batch items', async () => {
      const contents = ['Same', 'Same', 'Different'];

      await analyzer.analyzeBatch(contents);

      // Should call Claude only twice (once for "Same", once for "Different")
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache operations', () => {
    it('should return cache stats when cache is enabled', () => {
      const stats = analyzer.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats?.size).toBe(0);
      expect(stats?.capacity).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      await analyzer.analyze('Test content');
      expect(analyzer.getCacheStats()?.size).toBe(1);

      analyzer.clearCache();
      expect(analyzer.getCacheStats()?.size).toBe(0);
    });

    it('should return undefined stats when cache is disabled', () => {
      const noCacheAnalyzer = new EnhancedSentimentAnalyzer({
        ...validConfig,
        enableCache: false
      });

      expect(noCacheAnalyzer.getCacheStats()).toBeUndefined();
    });
  });
});
