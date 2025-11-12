/**
 * RGS Reporter - Report Generator
 *
 * Main class for generating insights reports.
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { z } from 'zod';
import { ReportData, ReportOptions, ReportResult, InsightSummary } from './types';
import { JSONFormatter } from './formatters/json';
import { MarkdownFormatter } from './formatters/markdown';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * Validation schemas
 */
const ReportDataSchema = z.object({
  signals: z.array(z.any()),
  sentiment: z.object({
    overall: z.number().min(-1).max(1),
    distribution: z.object({
      positive: z.number().min(0).max(1),
      neutral: z.number().min(0).max(1),
      negative: z.number().min(0).max(1),
    }),
    positiveSignals: z.array(z.string()),
    negativeSignals: z.array(z.string()),
  }),
  themes: z.array(
    z.object({
      name: z.string(),
      confidence: z.number().min(0).max(1),
      frequency: z.number().min(0),
      keywords: z.array(z.string()),
      category: z.enum(['pain', 'desire', 'neutral']),
      sentiment: z.number().min(-1).max(1),
    })
  ),
  metadata: z.object({
    scrapedAt: z.date(),
    sources: z.array(z.string()),
    totalSignals: z.number().min(0),
    generatedAt: z.date(),
    version: z.string(),
  }),
});

const ReportOptionsSchema = z.object({
  format: z.enum(['json', 'markdown', 'both']),
  outputDir: z.string(),
  includeRawData: z.boolean().optional(),
  maxThemes: z.number().min(1).optional(),
  minThemeFrequency: z.number().min(0).optional(),
});

/**
 * Report generation errors
 */
export class ReportGenerationError extends Error {
  public override readonly cause?: Error | undefined;

  constructor(message: string, cause?: Error | undefined) {
    super(message);
    this.name = 'ReportGenerationError';
    this.cause = cause;
  }
}

/**
 * Main report generator class
 */
export class ReportGenerator {
  private readonly jsonFormatter: JSONFormatter;
  private readonly markdownFormatter: MarkdownFormatter;

  constructor() {
    this.jsonFormatter = new JSONFormatter();
    this.markdownFormatter = new MarkdownFormatter();
  }

  /**
   * Generate report(s) based on the provided data and options
   */
  public async generate(data: ReportData, options: ReportOptions): Promise<ReportResult> {
    try {
      // Validate inputs
      this.validateData(data);
      this.validateOptions(options);

      // Ensure output directory exists
      await this.ensureOutputDirectory(options.outputDir);

      // Generate reports based on format
      const filePaths: string[] = [];

      if (options.format === 'json' || options.format === 'both') {
        const jsonPath = await this.generateJSON(data, options);
        filePaths.push(jsonPath);
      }

      if (options.format === 'markdown' || options.format === 'both') {
        const mdPath = await this.generateMarkdown(data, options);
        filePaths.push(mdPath);
      }

      // Generate summary for result
      const summary = this.generateSummary(data, options);

      return {
        filePaths,
        summary,
        generatedAt: data.metadata.generatedAt,
      };
    } catch (error) {
      if (error instanceof ReportGenerationError) {
        throw error;
      }
      throw new ReportGenerationError(
        'Failed to generate report',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate report data
   */
  private validateData(data: ReportData): void {
    try {
      ReportDataSchema.parse(data);

      // Additional validation
      if (data.signals.length === 0) {
        throw new Error('Report data must contain at least one signal');
      }

      if (data.themes.length === 0) {
        throw new Error('Report data must contain at least one theme');
      }

      // Validate sentiment distribution sums to ~1.0
      const { positive, neutral, negative } = data.sentiment.distribution;
      const sum = positive + neutral + negative;
      if (Math.abs(sum - 1.0) > 0.01) {
        throw new Error(
          `Sentiment distribution must sum to 1.0, got ${sum.toFixed(2)}`
        );
      }
    } catch (error) {
      throw new ReportGenerationError(
        'Invalid report data',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate report options
   */
  private validateOptions(options: ReportOptions): void {
    try {
      ReportOptionsSchema.parse(options);

      if (options.outputDir.length === 0) {
        throw new Error('Output directory cannot be empty');
      }

      if (options.maxThemes !== undefined && options.maxThemes < 1) {
        throw new Error('maxThemes must be at least 1');
      }

      if (options.minThemeFrequency !== undefined && options.minThemeFrequency < 0) {
        throw new Error('minThemeFrequency cannot be negative');
      }
    } catch (error) {
      throw new ReportGenerationError(
        'Invalid report options',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(outputDir: string): Promise<void> {
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (error) {
      throw new ReportGenerationError(
        `Failed to create output directory: ${outputDir}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate JSON report
   */
  private async generateJSON(data: ReportData, options: ReportOptions): Promise<string> {
    try {
      const content = this.jsonFormatter.format(data, options);
      const fileName = 'insights.json';
      const filePath = path.join(options.outputDir, fileName);

      await writeFile(filePath, content, 'utf-8');

      return filePath;
    } catch (error) {
      throw new ReportGenerationError(
        'Failed to generate JSON report',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate Markdown report
   */
  private async generateMarkdown(
    data: ReportData,
    options: ReportOptions
  ): Promise<string> {
    try {
      const content = this.markdownFormatter.format(data, options);
      const fileName = 'INSIGHTS.md';
      const filePath = path.join(options.outputDir, fileName);

      await writeFile(filePath, content, 'utf-8');

      return filePath;
    } catch (error) {
      throw new ReportGenerationError(
        'Failed to generate Markdown report',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(data: ReportData, options: ReportOptions): InsightSummary {
    const avgSentiment = this.calculateAverageSentiment(data);
    const filteredThemes = this.filterThemes(data.themes, options);

    const painPoints = filteredThemes.filter((theme) => theme.category === 'pain');
    const desires = filteredThemes.filter((theme) => theme.category === 'desire');

    // Calculate sentiment distribution
    const sentimentDistribution = this.calculateSentimentDistribution(data);

    return {
      totalSignals: data.signals.length,
      avgSentiment,
      topThemes: filteredThemes.slice(0, options.maxThemes ?? 10),
      painPoints,
      desires,
      sentimentDistribution,
    };
  }

  /**
   * Calculate average sentiment across all signals
   */
  private calculateAverageSentiment(data: ReportData): number {
    const signalsWithSentiment = data.signals.filter(
      (signal) => signal.sentiment !== undefined
    );

    if (signalsWithSentiment.length === 0) {
      return 0;
    }

    const sum = signalsWithSentiment.reduce(
      (acc, signal) => acc + (signal.sentiment ?? 0),
      0
    );

    return Math.round((sum / signalsWithSentiment.length) * 100) / 100;
  }

  /**
   * Calculate sentiment distribution counts
   */
  private calculateSentimentDistribution(data: ReportData): {
    positive: number;
    neutral: number;
    negative: number;
  } {
    const signalsWithSentiment = data.signals.filter(
      (signal) => signal.sentiment !== undefined
    );

    if (signalsWithSentiment.length === 0) {
      return { positive: 0, neutral: 0, negative: 0 };
    }

    let positive = 0;
    let neutral = 0;
    let negative = 0;

    for (const signal of signalsWithSentiment) {
      const sentiment = signal.sentiment ?? 0;
      if (sentiment > 0.1) {
        positive++;
      } else if (sentiment < -0.1) {
        negative++;
      } else {
        neutral++;
      }
    }

    return { positive, neutral, negative };
  }

  /**
   * Filter themes based on options
   */
  private filterThemes(
    themes: ReportData['themes'],
    options: ReportOptions
  ): ReportData['themes'] {
    const minFrequency = options.minThemeFrequency ?? 1;

    return themes
      .filter((theme) => theme.frequency >= minFrequency)
      .sort((a, b) => b.frequency - a.frequency);
  }
}
