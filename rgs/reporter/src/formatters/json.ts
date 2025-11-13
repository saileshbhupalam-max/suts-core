/**
 * RGS Reporter - JSON Formatter
 *
 * Formats report data as structured JSON.
 */

import {
  ReportData,
  ReportOptions,
  ReportFormatter,
  InsightSummary,
  CategorizedTheme,
} from '../types';

/**
 * JSON report structure
 */
interface JSONReport {
  readonly version: string;
  readonly generatedAt: string;
  readonly summary: InsightSummary;
  readonly themes: CategorizedTheme[];
  readonly sentiment: {
    readonly overall: number;
    readonly distribution: {
      readonly positive: number;
      readonly neutral: number;
      readonly negative: number;
    };
    readonly positiveSignals: string[];
    readonly negativeSignals: string[];
  };
  readonly metadata: {
    readonly scrapedAt: string;
    readonly sources: string[];
    readonly totalSignals: number;
  };
  readonly signals?: Array<{
    readonly id: string;
    readonly source: string;
    readonly content: string;
    readonly author?: string | undefined;
    readonly timestamp: string;
    readonly url: string;
    readonly sentiment?: number | undefined;
    readonly themes?: string[] | undefined;
  }>;
}

/**
 * Formats report data as JSON
 */
export class JSONFormatter implements ReportFormatter {
  /**
   * Format the report data as JSON
   */
  public format(data: ReportData, options: ReportOptions): string {
    const summary = this.generateSummary(data, options);
    const report = this.buildReport(data, summary, options);
    return JSON.stringify(report, null, 2);
  }

  /**
   * Get the file extension for JSON format
   */
  public getExtension(): string {
    return 'json';
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
    const signalsWithSentiment = data.signals.filter((signal) => signal.sentiment !== undefined);

    if (signalsWithSentiment.length === 0) {
      return 0;
    }

    const sum = signalsWithSentiment.reduce((acc, signal) => acc + (signal.sentiment ?? 0), 0);

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
    const signalsWithSentiment = data.signals.filter((signal) => signal.sentiment !== undefined);

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
  private filterThemes(themes: CategorizedTheme[], options: ReportOptions): CategorizedTheme[] {
    const minFrequency = options.minThemeFrequency ?? 1;

    return themes
      .filter((theme) => theme.frequency >= minFrequency)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Build the complete JSON report structure
   */
  private buildReport(
    data: ReportData,
    summary: InsightSummary,
    options: ReportOptions
  ): JSONReport {
    const baseReport: JSONReport = {
      version: data.metadata.version,
      generatedAt: data.metadata.generatedAt.toISOString(),
      summary,
      themes: this.filterThemes(data.themes, options),
      sentiment: {
        overall: data.sentiment.overall,
        distribution: data.sentiment.distribution,
        positiveSignals: data.sentiment.positiveSignals,
        negativeSignals: data.sentiment.negativeSignals,
      },
      metadata: {
        scrapedAt: data.metadata.scrapedAt.toISOString(),
        sources: data.metadata.sources,
        totalSignals: data.metadata.totalSignals,
      },
    };

    // Optionally include raw signal data
    if (options.includeRawData === true) {
      return {
        ...baseReport,
        signals: data.signals.map((signal) => ({
          id: signal.id,
          source: signal.source,
          content: signal.content,
          author: signal.author,
          timestamp: signal.timestamp.toISOString(),
          url: signal.url,
          sentiment: signal.sentiment,
          themes: signal.themes,
        })),
      };
    }

    return baseReport;
  }
}
