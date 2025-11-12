/**
 * Tests for theme extractor
 */

import Anthropic from '@anthropic-ai/sdk';
import { createWebSignal } from '@rgs/core';
import { Logger, LogLevel } from '@rgs/utils';
import { ThemeExtractor, createThemeExtractor } from '../src/extractor';
import { KeywordClusterer } from '../src/clusterer';
import { DEFAULT_EXTRACTION_CONFIG } from '../src/types';

// Mock Anthropic
jest.mock('@anthropic-ai/sdk');

describe('ThemeExtractor', () => {
  let mockClaude: jest.Mocked<Anthropic>;
  let mockCreate: jest.Mock;
  let clusterer: KeywordClusterer;
  let logger: Logger;

  const createSignal = (content: string, id: string): ReturnType<typeof createWebSignal> => {
    return createWebSignal({
      id,
      source: 'reddit',
      content,
      timestamp: new Date(),
      url: `https://reddit.com/r/test/${id}`,
      metadata: {},
    });
  };

  const mockClaudeResponse = (themes: unknown): void => {
    const responseText = JSON.stringify(themes);

    void mockCreate.mockResolvedValue({
      id: 'msg_test',
      type: 'message',
      role: 'assistant',
      model: 'claude-3-5-sonnet-20241022',
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
    } as Anthropic.Message);
  };

  beforeEach(() => {
    mockCreate = jest.fn();
    mockClaude = {
      messages: {
        create: mockCreate,
      },
    } as unknown as jest.Mocked<Anthropic>;

    clusterer = new KeywordClusterer();
    logger = new Logger({ minLevel: LogLevel.ERROR });
  });

  describe('extract', () => {
    it('should return empty array for no signals', async () => {
      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract([]);

      expect(result).toEqual([]);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should extract themes from signals', async () => {
      const signals = [
        createSignal('The pricing is too expensive for small teams', 'signal-1'),
        createSignal('Token costs are getting out of hand', 'signal-2'),
      ];

      const mockThemes = [
        {
          theme: 'High pricing concerns',
          keywords: ['expensive', 'costly', 'pricing'],
          category: 'pain',
          examples: ['The pricing is too expensive'],
        },
      ];

      mockClaudeResponse(mockThemes);

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.name).toBe('High pricing concerns');
      expect(result[0]?.category).toBe('pain');
      expect(result[0]?.keywords).toContain('expensive');
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should categorize pain points correctly', async () => {
      const signals = [createSignal('This is frustrating to use', 'signal-1')];

      const mockThemes = [
        {
          theme: 'Usability issues',
          keywords: ['frustrating', 'difficult'],
          category: 'pain',
          examples: ['This is frustrating to use'],
        },
      ];

      mockClaudeResponse(mockThemes);

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      expect(result[0]?.category).toBe('pain');
      expect(result[0]?.sentiment).toBeLessThan(0);
    });

    it('should categorize desires correctly', async () => {
      const signals = [createSignal('I wish it had dark mode', 'signal-1')];

      const mockThemes = [
        {
          theme: 'Dark mode request',
          keywords: ['dark mode', 'theme'],
          category: 'desire',
          examples: ['I wish it had dark mode'],
        },
      ];

      mockClaudeResponse(mockThemes);

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      expect(result[0]?.category).toBe('desire');
      expect(result[0]?.sentiment).toBeGreaterThan(0);
    });

    it('should categorize feature requests correctly', async () => {
      const signals = [createSignal('Please add export functionality', 'signal-1')];

      const mockThemes = [
        {
          theme: 'Export feature',
          keywords: ['export', 'download'],
          category: 'feature',
          examples: ['Please add export functionality'],
        },
      ];

      mockClaudeResponse(mockThemes);

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      expect(result[0]?.category).toBe('feature');
    });

    it('should rank themes by frequency', async () => {
      const signals = [
        createSignal('Pricing is too high', 'signal-1'),
        createSignal('Costs are expensive', 'signal-2'),
        createSignal('Dark mode would be nice', 'signal-3'),
      ];

      const mockThemes = [
        {
          theme: 'High pricing',
          keywords: ['pricing', 'costs'],
          category: 'pain',
          examples: ['Pricing is too high'],
        },
        {
          theme: 'High pricing',
          keywords: ['expensive'],
          category: 'pain',
          examples: ['Costs are expensive'],
        },
        {
          theme: 'Dark mode',
          keywords: ['dark mode'],
          category: 'desire',
          examples: ['Dark mode would be nice'],
        },
      ];

      mockClaudeResponse(mockThemes);

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      // High pricing should be ranked higher due to frequency
      expect(result[0]?.name).toBe('High pricing');
      expect(result[0]?.frequency).toBe(2);
    });

    it('should include example quotes', async () => {
      const signals = [createSignal('The UI is confusing', 'signal-1')];

      const mockThemes = [
        {
          theme: 'UI confusion',
          keywords: ['ui', 'confusing'],
          category: 'pain',
          examples: ['The UI is confusing'],
        },
      ];

      mockClaudeResponse(mockThemes);

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      expect(result[0]?.examples).toContain('The UI is confusing');
    });

    it('should filter themes by minimum frequency', async () => {
      const signals = [createSignal('Test signal', 'signal-1')];

      const mockThemes = [
        {
          theme: 'Rare theme',
          keywords: ['rare'],
          category: 'pain',
          examples: ['Rare example'],
        },
      ];

      mockClaudeResponse(mockThemes);

      const config = {
        ...DEFAULT_EXTRACTION_CONFIG,
        minFrequency: 5,
      };

      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      // Theme with frequency 1 should be filtered out
      expect(result).toEqual([]);
    });

    it('should filter themes by minimum confidence', async () => {
      const signals = [createSignal('Test signal', 'signal-1')];

      const mockThemes = [
        {
          theme: 'Low confidence theme',
          keywords: ['test'],
          category: 'pain',
          examples: ['Test example'],
        },
      ];

      mockClaudeResponse(mockThemes);

      const config = {
        ...DEFAULT_EXTRACTION_CONFIG,
        minFrequency: 1,
        minConfidence: 0.9,
        includeLowConfidence: false,
      };

      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      // Low confidence themes should be filtered out
      expect(result.every((theme) => theme.confidence >= 0.9)).toBe(true);
    });

    it('should handle Claude API errors gracefully', async () => {
      const signals = [createSignal('Test signal', 'signal-1')];

      void mockCreate.mockRejectedValue(new Error('API Error'));

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);

      // Should return empty array when API fails
      const result = await extractor.extract(signals);
      expect(result).toEqual([]);
    });

    it('should handle invalid JSON responses', async () => {
      const signals = [createSignal('Test signal', 'signal-1')];

      void mockCreate.mockResolvedValue({
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'text',
            text: 'Invalid JSON',
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      } as Anthropic.Message);

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      // Should return empty array on parse error
      expect(result).toEqual([]);
    });

    it('should handle markdown-wrapped JSON responses', async () => {
      const signals = [createSignal('Test signal', 'signal-1')];

      const mockThemes = [
        {
          theme: 'Test theme',
          keywords: ['test'],
          category: 'pain',
          examples: ['Test example'],
        },
      ];

      const wrappedJson = '```json\n' + JSON.stringify(mockThemes) + '\n```';

      void mockCreate.mockResolvedValue({
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'text',
            text: wrappedJson,
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      } as Anthropic.Message);

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should batch large signal sets', async () => {
      const signals = Array.from({ length: 100 }, (_, i) =>
        createSignal(`Signal ${i}`, `signal-${i}`)
      );

      mockClaudeResponse([]);

      const config = {
        ...DEFAULT_EXTRACTION_CONFIG,
        batchSize: 25,
      };

      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      await extractor.extract(signals);

      // Should have made 4 API calls (100 / 25)
      expect(mockCreate).toHaveBeenCalledTimes(4);
    });

    it('should limit examples per theme', async () => {
      const signals = Array.from({ length: 10 }, (_, i) =>
        createSignal(`Similar issue ${i}`, `signal-${i}`)
      );

      const mockThemes = Array.from({ length: 10 }, (_, i) => ({
        theme: 'Common issue',
        keywords: ['issue'],
        category: 'pain' as const,
        examples: [`Similar issue ${i}`],
      }));

      mockClaudeResponse(mockThemes);

      const config = {
        ...DEFAULT_EXTRACTION_CONFIG,
        maxExamples: 3,
      };

      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      expect(result[0]?.examples.length).toBeLessThanOrEqual(3);
    });

    it('should calculate confidence scores', async () => {
      const signals = [createSignal('Test signal', 'signal-1')];

      const mockThemes = [
        {
          theme: 'Test theme',
          keywords: ['test', 'example', 'sample'],
          category: 'pain',
          examples: ['Test example'],
        },
      ];

      mockClaudeResponse(mockThemes);

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      expect(result[0]?.confidence).toBeGreaterThanOrEqual(0);
      expect(result[0]?.confidence).toBeLessThanOrEqual(1);
    });

    it('should generate unique theme IDs', async () => {
      const signals = [createSignal('Test 1', 'signal-1'), createSignal('Test 2', 'signal-2')];

      const mockThemes = [
        {
          theme: 'Theme A',
          keywords: ['a'],
          category: 'pain',
          examples: ['Example A'],
        },
        {
          theme: 'Theme B',
          keywords: ['b'],
          category: 'pain',
          examples: ['Example B'],
        },
      ];

      mockClaudeResponse(mockThemes);

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      const ids = result.map((t) => t.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should merge duplicate themes', async () => {
      const signals = [createSignal('Test 1', 'signal-1'), createSignal('Test 2', 'signal-2')];

      const mockThemes = [
        {
          theme: 'Duplicate Theme',
          keywords: ['a'],
          category: 'pain',
          examples: ['Example 1'],
        },
        {
          theme: 'Duplicate Theme',
          keywords: ['b'],
          category: 'pain',
          examples: ['Example 2'],
        },
      ];

      mockClaudeResponse(mockThemes);

      const config = { ...DEFAULT_EXTRACTION_CONFIG, minFrequency: 1, includeLowConfidence: true };
      const extractor = new ThemeExtractor(mockClaude, clusterer, config, logger);
      const result = await extractor.extract(signals);

      // Should merge into single theme
      const duplicateThemes = result.filter((t) => t.name === 'Duplicate Theme');
      expect(duplicateThemes).toHaveLength(1);
      expect(duplicateThemes[0]?.frequency).toBe(2);
    });
  });

  describe('createThemeExtractor', () => {
    it('should create extractor with default config', () => {
      const extractor = createThemeExtractor(mockClaude, clusterer);
      expect(extractor).toBeInstanceOf(ThemeExtractor);
    });

    it('should create extractor with custom config', () => {
      const extractor = createThemeExtractor(mockClaude, clusterer, {
        minFrequency: 5,
        minConfidence: 0.8,
      });
      expect(extractor).toBeInstanceOf(ThemeExtractor);
    });

    it('should create extractor with custom logger', () => {
      const customLogger = new Logger({ minLevel: LogLevel.DEBUG });
      const extractor = createThemeExtractor(mockClaude, clusterer, undefined, customLogger);
      expect(extractor).toBeInstanceOf(ThemeExtractor);
    });
  });
});
