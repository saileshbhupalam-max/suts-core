/**
 * RGS Reporter - Type Definitions
 *
 * Core types for report generation.
 */

import { WebSignal, Theme, SentimentAnalysis } from '@rgs/core';

/**
 * Metadata about the report generation
 */
export interface ReportMetadata {
  /**
   * When the data was scraped
   */
  readonly scrapedAt: Date;

  /**
   * List of sources used for scraping
   */
  readonly sources: string[];

  /**
   * Total number of signals processed
   */
  readonly totalSignals: number;

  /**
   * When the report was generated
   */
  readonly generatedAt: Date;

  /**
   * Version of the report format
   */
  readonly version: string;
}

/**
 * Summary statistics for the report
 */
export interface InsightSummary {
  /**
   * Total number of signals analyzed
   */
  readonly totalSignals: number;

  /**
   * Average sentiment score across all signals
   */
  readonly avgSentiment: number;

  /**
   * Top themes identified
   */
  readonly topThemes: CategorizedTheme[];

  /**
   * Pain points identified from signals
   */
  readonly painPoints: CategorizedTheme[];

  /**
   * Desires and wants expressed in signals
   */
  readonly desires: CategorizedTheme[];

  /**
   * Sentiment distribution counts
   */
  readonly sentimentDistribution: {
    readonly positive: number;
    readonly neutral: number;
    readonly negative: number;
  };
}

/**
 * Theme with category annotation
 */
export interface CategorizedTheme extends Theme {
  /**
   * Category of the theme (pain, desire, neutral)
   */
  readonly category: 'pain' | 'desire' | 'neutral';

  /**
   * Average sentiment for this theme
   */
  readonly sentiment: number;
}

/**
 * Data structure for report generation
 */
export interface ReportData {
  /**
   * Web signals to include in the report
   */
  readonly signals: WebSignal[];

  /**
   * Sentiment analysis results
   */
  readonly sentiment: SentimentAnalysis;

  /**
   * Identified themes with categories
   */
  readonly themes: CategorizedTheme[];

  /**
   * Report metadata
   */
  readonly metadata: ReportMetadata;
}

/**
 * Report format options
 */
export type ReportFormat = 'json' | 'markdown' | 'both';

/**
 * Options for report generation
 */
export interface ReportOptions {
  /**
   * Output format(s) for the report
   */
  readonly format: ReportFormat;

  /**
   * Directory to write the report files
   */
  readonly outputDir: string;

  /**
   * Include raw signal data in the report
   * @default false
   */
  readonly includeRawData?: boolean;

  /**
   * Maximum number of themes to include
   * @default 10
   */
  readonly maxThemes?: number;

  /**
   * Minimum frequency for themes to be included
   * @default 1
   */
  readonly minThemeFrequency?: number;
}

/**
 * Result of report generation
 */
export interface ReportResult {
  /**
   * Paths to the generated report files
   */
  readonly filePaths: string[];

  /**
   * Summary of the generated report
   */
  readonly summary: InsightSummary;

  /**
   * When the report was generated
   */
  readonly generatedAt: Date;
}

/**
 * Interface for report formatters
 */
export interface ReportFormatter {
  /**
   * Format the report data
   */
  format(data: ReportData, options: ReportOptions): string;

  /**
   * Get the file extension for this format
   */
  getExtension(): string;
}
