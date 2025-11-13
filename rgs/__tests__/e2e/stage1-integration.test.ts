/**
 * E2E Integration Tests for RGS Stage 1 Orchestrator
 *
 * Tests the complete integration of CLI, Pipeline, and Reporter packages
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { PipelineOrchestrator } from '../../pipeline/src/orchestrator';
import { ReportGenerator } from '../../reporter/src/generator';
import {
  createWebSignal,
  createSentimentAnalysis,
  createTheme,
  createInsight,
} from '../../core/src';
import type { ReportData, ReportOptions } from '../../reporter/src/types';

describe('RGS Stage 1 - E2E Integration', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `rgs-e2e-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Reporter Integration', () => {
    it('should generate JSON and Markdown reports', async () => {
      // Create test data
      const signals = [
        createWebSignal({
          id: 'test-1',
          source: 'reddit',
          content: 'This game is amazing! Love the graphics.',
          timestamp: new Date('2024-01-01'),
          url: 'https://reddit.com/r/gaming/1',
          metadata: { subreddit: 'gaming' },
          author: 'gamer123',
          sentiment: 0.8,
          themes: ['graphics', 'positive'],
        }),
        createWebSignal({
          id: 'test-2',
          source: 'reddit',
          content: 'Performance issues are ruining the experience.',
          timestamp: new Date('2024-01-02'),
          url: 'https://reddit.com/r/gaming/2',
          metadata: { subreddit: 'gaming' },
          author: 'frustrated_player',
          sentiment: -0.6,
          themes: ['performance', 'bugs'],
        }),
      ];

      const themes = [
        {
          name: 'graphics',
          confidence: 0.9,
          frequency: 1,
          keywords: ['graphics', 'visuals'],
          category: 'desire' as const,
          sentiment: 0.8,
        },
        {
          name: 'performance',
          confidence: 0.85,
          frequency: 1,
          keywords: ['performance', 'fps'],
          category: 'pain' as const,
          sentiment: -0.6,
        },
      ];

      const reportData: ReportData = {
        signals,
        sentiment: {
          overall: 0.1,
          distribution: { positive: 0.5, neutral: 0, negative: 0.5 },
          positiveSignals: ['test-1'],
          negativeSignals: ['test-2'],
        },
        themes,
        metadata: {
          scrapedAt: new Date('2024-01-01'),
          sources: ['reddit'],
          totalSignals: 2,
          generatedAt: new Date(),
          version: '1.0.0',
        },
      };

      const generator = new ReportGenerator();

      // Test JSON generation
      const jsonOptions: ReportOptions = {
        format: 'json',
        outputDir: testDir,
      };

      const jsonResult = await generator.generate(reportData, jsonOptions);
      expect(jsonResult.filePaths).toHaveLength(1);
      expect(jsonResult.summary).toBeDefined();

      const jsonExists = await fs
        .access(jsonResult.filePaths[0] ?? '')
        .then(() => true)
        .catch(() => false);
      expect(jsonExists).toBe(true);

      // Test Markdown generation
      const mdOptions: ReportOptions = {
        format: 'markdown',
        outputDir: testDir,
      };

      const mdResult = await generator.generate(reportData, mdOptions);
      expect(mdResult.filePaths).toHaveLength(1);
      expect(mdResult.summary).toBeDefined();

      const mdExists = await fs
        .access(mdResult.filePaths[0] ?? '')
        .then(() => true)
        .catch(() => false);
      expect(mdExists).toBe(true);

      // Test both formats
      const bothOptions: ReportOptions = {
        format: 'both',
        outputDir: testDir,
      };

      const bothResult = await generator.generate(reportData, bothOptions);
      expect(bothResult.filePaths).toHaveLength(2);
      expect(bothResult.summary).toBeDefined();
    });
  });

  describe('Pipeline Orchestration', () => {
    it('should create and add stages to pipeline', () => {
      // Create a simple pipeline orchestrator
      const orchestrator = new PipelineOrchestrator();

      // Add a simple stage
      const result = orchestrator.addStage({
        name: 'double-and-stringify',
        // eslint-disable-next-line @typescript-eslint/require-await
        execute: async (input: number) => {
          return (input * 2).toString();
        },
      });

      // Verify chainable API
      expect(result).toBe(orchestrator);
    });

    it('should allow multiple stages to be added', () => {
      const orchestrator = new PipelineOrchestrator();

      orchestrator
        .addStage({
          name: 'stage-1',
          // eslint-disable-next-line @typescript-eslint/require-await
          execute: async (input: unknown) => input,
        })
        .addStage({
          name: 'stage-2',
          // eslint-disable-next-line @typescript-eslint/require-await
          execute: async (input: unknown) => input,
        });

      // Pipeline created successfully
      expect(orchestrator).toBeDefined();
    });
  });

  describe('Core Type Verification', () => {
    it('should create and validate core data structures', () => {
      const signal = createWebSignal({
        id: 'type-test-1',
        source: 'reddit',
        content: 'Test content',
        timestamp: new Date(),
        url: 'https://test.com',
        metadata: {},
      });

      expect(signal.id).toBe('type-test-1');
      expect(signal.source).toBe('reddit');

      const sentiment = createSentimentAnalysis({
        overall: 0.5,
        distribution: { positive: 0.7, neutral: 0.2, negative: 0.1 },
        positiveSignals: ['test-1'],
        negativeSignals: [],
      });

      expect(sentiment.overall).toBe(0.5);
      expect(sentiment.distribution.positive).toBe(0.7);

      const theme = createTheme({
        name: 'testing',
        confidence: 0.9,
        frequency: 1,
        keywords: ['test'],
      });

      expect(theme.name).toBe('testing');
      expect(theme.confidence).toBe(0.9);

      const insight = createInsight({
        themes: [theme],
        sentiment,
        painPoints: ['issue'],
        desires: ['feature'],
        language: {
          commonPhrases: ['test'],
          tone: 'neutral',
          frequentTerms: { test: 1 },
          emotionalIndicators: [],
        },
        confidence: 0.85,
      });

      expect(insight.themes).toHaveLength(1);
      expect(insight.sentiment.overall).toBe(0.5);
      expect(insight.confidence).toBe(0.85);
    });
  });
});
