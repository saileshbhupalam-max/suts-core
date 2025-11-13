/**
 * RGS Reporter - Markdown Formatter
 *
 * Formats report data as human-readable Markdown.
 */

import {
  ReportData,
  ReportOptions,
  ReportFormatter,
  InsightSummary,
  CategorizedTheme,
} from '../types';

/**
 * Formats report data as Markdown
 */
export class MarkdownFormatter implements ReportFormatter {
  /**
   * Format the report data as Markdown
   */
  public format(data: ReportData, options: ReportOptions): string {
    const summary = this.generateSummary(data, options);
    const sections: string[] = [];

    // Header
    sections.push(this.formatHeader(data));

    // Summary section
    sections.push(this.formatSummary(summary, data));

    // Top Themes section
    sections.push(this.formatTopThemes(summary.topThemes));

    // Pain Points section
    if (summary.painPoints.length > 0) {
      sections.push(this.formatPainPoints(summary.painPoints));
    }

    // Desires section
    if (summary.desires.length > 0) {
      sections.push(this.formatDesires(summary.desires));
    }

    // Sentiment Analysis section
    sections.push(this.formatSentimentAnalysis(data, summary));

    // Metadata section
    sections.push(this.formatMetadata(data));

    return sections.join('\n\n');
  }

  /**
   * Get the file extension for Markdown format
   */
  public getExtension(): string {
    return 'md';
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
   * Format the report header
   */
  private formatHeader(data: ReportData): string {
    return `# RGS Insights Report

**Generated:** ${data.metadata.generatedAt.toISOString().split('T')[0]}
**Version:** ${data.metadata.version}`;
  }

  /**
   * Format the summary section
   */
  private formatSummary(summary: InsightSummary, data: ReportData): string {
    const sentimentLabel = this.formatSentimentLabel(summary.avgSentiment);

    return `## Summary

- **Total Signals:** ${summary.totalSignals}
- **Average Sentiment:** ${this.formatSentimentScore(summary.avgSentiment)} (${sentimentLabel})
- **Sources:** ${data.metadata.sources.join(', ')}
- **Scraped:** ${data.metadata.scrapedAt.toISOString().split('T')[0]}
- **Top Themes:** ${summary.topThemes.length}
- **Pain Points:** ${summary.painPoints.length}
- **Desires:** ${summary.desires.length}`;
  }

  /**
   * Format sentiment score with sign
   */
  private formatSentimentScore(score: number): string {
    const sign = score >= 0 ? '+' : '';
    return `${sign}${score.toFixed(2)}`;
  }

  /**
   * Format sentiment label
   */
  private formatSentimentLabel(score: number): string {
    if (score > 0.5) {
      return 'very positive';
    } else if (score > 0.1) {
      return 'slightly positive';
    } else if (score < -0.5) {
      return 'very negative';
    } else if (score < -0.1) {
      return 'slightly negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * Format top themes section
   */
  private formatTopThemes(themes: CategorizedTheme[]): string {
    if (themes.length === 0) {
      return '## Top Themes\n\nNo themes identified.';
    }

    const lines = ['## Top Themes', ''];

    for (let i = 0; i < themes.length; i++) {
      const theme = themes[i];
      if (theme === undefined) {
        continue;
      }
      const keywords = theme.keywords.join(', ');
      const sentimentIcon = this.getSentimentIcon(theme.sentiment);

      lines.push(
        `${i + 1}. **${theme.name}** ${sentimentIcon} (${theme.frequency} mentions, ${this.formatSentimentScore(theme.sentiment)} sentiment)`
      );
      lines.push(`   - Keywords: ${keywords}`);
      lines.push(`   - Category: ${this.formatCategory(theme.category)}`);
      lines.push('');
    }

    return lines.join('\n').trimEnd();
  }

  /**
   * Get sentiment icon
   */
  private getSentimentIcon(sentiment: number): string {
    if (sentiment > 0.1) {
      return '✅';
    } else if (sentiment < -0.1) {
      return '❌';
    } else {
      return '➖';
    }
  }

  /**
   * Format category label
   */
  private formatCategory(category: 'pain' | 'desire' | 'neutral'): string {
    switch (category) {
      case 'pain':
        return 'Pain point';
      case 'desire':
        return 'Desire';
      case 'neutral':
        return 'Neutral';
    }
  }

  /**
   * Format pain points section
   */
  private formatPainPoints(painPoints: CategorizedTheme[]): string {
    const lines = ['## Pain Points', ''];

    for (const theme of painPoints) {
      lines.push(
        `- **${theme.name}** (${theme.frequency} mentions, ${this.formatSentimentScore(theme.sentiment)} sentiment)`
      );
    }

    return lines.join('\n');
  }

  /**
   * Format desires section
   */
  private formatDesires(desires: CategorizedTheme[]): string {
    const lines = ['## Desires', ''];

    for (const theme of desires) {
      lines.push(
        `- **${theme.name}** (${theme.frequency} mentions, ${this.formatSentimentScore(theme.sentiment)} sentiment)`
      );
    }

    return lines.join('\n');
  }

  /**
   * Format sentiment analysis section
   */
  private formatSentimentAnalysis(data: ReportData, summary: InsightSummary): string {
    const lines = ['## Sentiment Analysis', ''];

    lines.push(`**Overall Sentiment:** ${this.formatSentimentScore(data.sentiment.overall)}`);
    lines.push('');

    lines.push('**Distribution:**');
    lines.push(
      `- Positive: ${summary.sentimentDistribution.positive} (${this.calculatePercentage(summary.sentimentDistribution.positive, summary.totalSignals)}%)`
    );
    lines.push(
      `- Neutral: ${summary.sentimentDistribution.neutral} (${this.calculatePercentage(summary.sentimentDistribution.neutral, summary.totalSignals)}%)`
    );
    lines.push(
      `- Negative: ${summary.sentimentDistribution.negative} (${this.calculatePercentage(summary.sentimentDistribution.negative, summary.totalSignals)}%)`
    );
    lines.push('');

    if (data.sentiment.positiveSignals.length > 0) {
      lines.push('**Top Positive Signals:**');
      for (const signal of data.sentiment.positiveSignals.slice(0, 3)) {
        lines.push(`- ${signal}`);
      }
      lines.push('');
    }

    if (data.sentiment.negativeSignals.length > 0) {
      lines.push('**Top Negative Signals:**');
      for (const signal of data.sentiment.negativeSignals.slice(0, 3)) {
        lines.push(`- ${signal}`);
      }
      lines.push('');
    }

    return lines.join('\n').trimEnd();
  }

  /**
   * Calculate percentage
   */
  private calculatePercentage(count: number, total: number): number {
    if (total === 0) {
      return 0;
    }
    return Math.round((count / total) * 100);
  }

  /**
   * Format metadata section
   */
  private formatMetadata(data: ReportData): string {
    return `## Metadata

- **Total Signals Processed:** ${data.metadata.totalSignals}
- **Data Sources:** ${data.metadata.sources.join(', ')}
- **Scraped At:** ${data.metadata.scrapedAt.toISOString()}
- **Generated At:** ${data.metadata.generatedAt.toISOString()}
- **Report Version:** ${data.metadata.version}`;
  }
}
