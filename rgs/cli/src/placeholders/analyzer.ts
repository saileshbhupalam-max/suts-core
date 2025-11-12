/**
 * RGS CLI - Placeholder Analyzer
 *
 * Temporary implementation until real analyzers are merged.
 */

import {
  WebSignal,
  Insight,
  Theme,
  SentimentAnalysis,
  LanguagePatterns,
  createTheme,
  createSentimentAnalysis,
  createInsight,
} from '@rgs/core';

/**
 * Placeholder interface for sentiment analysis
 */
export interface IAnalyzer {
  /**
   * Analyze sentiment across signals
   */
  analyzeSentiment(signals: WebSignal[]): Promise<SentimentAnalysis>;

  /**
   * Extract themes from signals
   */
  extractThemes(signals: WebSignal[]): Promise<Theme[]>;

  /**
   * Extract language patterns
   */
  extractLanguagePatterns(signals: WebSignal[]): Promise<LanguagePatterns>;

  /**
   * Generate complete insight from signals
   */
  generateInsight(signals: WebSignal[]): Promise<Insight>;
}

/**
 * Mock analyzer for CLI testing and placeholder functionality
 */
export class MockAnalyzer implements IAnalyzer {
  async analyzeSentiment(signals: WebSignal[]): Promise<SentimentAnalysis> {
    if (signals.length === 0) {
      return createSentimentAnalysis({
        overall: 0,
        distribution: {
          positive: 0,
          neutral: 0,
          negative: 0,
        },
        positiveSignals: [],
        negativeSignals: [],
      });
    }

    // Calculate sentiment from signals
    const sentimentScores = signals
      .map((s) => s.sentiment ?? 0)
      .filter((s) => s !== 0);

    const overall = sentimentScores.length > 0
      ? sentimentScores.reduce((sum, s) => sum + s, 0) / sentimentScores.length
      : 0;

    // Calculate distribution
    const positive = signals.filter((s) => (s.sentiment ?? 0) > 0.2).length / signals.length;
    const negative = signals.filter((s) => (s.sentiment ?? 0) < -0.2).length / signals.length;
    const neutral = 1 - positive - negative;

    // Find top positive and negative signals
    const sortedByPositive = [...signals].sort((a, b) => (b.sentiment ?? 0) - (a.sentiment ?? 0));
    const sortedByNegative = [...signals].sort((a, b) => (a.sentiment ?? 0) - (b.sentiment ?? 0));

    return createSentimentAnalysis({
      overall,
      distribution: {
        positive,
        neutral,
        negative,
      },
      positiveSignals: sortedByPositive.slice(0, 3).map((s) => s.id),
      negativeSignals: sortedByNegative.slice(0, 3).map((s) => s.id),
    });
  }

  async extractThemes(signals: WebSignal[]): Promise<Theme[]> {
    if (signals.length === 0) {
      return [];
    }

    // Extract themes from signal themes
    const themeMap = new Map<string, number>();
    signals.forEach((signal) => {
      signal.themes?.forEach((theme) => {
        themeMap.set(theme, (themeMap.get(theme) ?? 0) + 1);
      });
    });

    // Convert to Theme objects
    const themes: Theme[] = [];
    themeMap.forEach((frequency, name) => {
      themes.push(
        createTheme({
          name,
          confidence: Math.min(frequency / signals.length, 1),
          frequency,
          keywords: [name, 'related', 'term'],
        })
      );
    });

    // Sort by frequency and return top themes
    return themes.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  }

  async extractLanguagePatterns(signals: WebSignal[]): Promise<LanguagePatterns> {
    if (signals.length === 0) {
      return {
        commonPhrases: [],
        tone: 'neutral',
        frequentTerms: {},
        emotionalIndicators: [],
      };
    }

    // Extract basic language patterns
    const words = signals
      .map((s) => s.content.toLowerCase().split(/\s+/))
      .flat();

    const wordFreq: Record<string, number> = {};
    words.forEach((word) => {
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] ?? 0) + 1;
      }
    });

    // Get top frequent terms
    const topTerms = Object.entries(wordFreq)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .reduce((acc, [word, count]) => {
        acc[word] = count;
        return acc;
      }, {} as Record<string, number>);

    return {
      commonPhrases: ['mock phrase 1', 'mock phrase 2'],
      tone: 'casual',
      frequentTerms: topTerms,
      emotionalIndicators: ['excited', 'frustrated', 'hopeful'],
    };
  }

  async generateInsight(signals: WebSignal[]): Promise<Insight> {
    const [sentiment, themes, languagePatterns] = await Promise.all([
      this.analyzeSentiment(signals),
      this.extractThemes(signals),
      this.extractLanguagePatterns(signals),
    ]);

    return createInsight({
      themes,
      sentiment,
      painPoints: [
        'Mock pain point 1: Performance issues',
        'Mock pain point 2: Complex UI',
      ],
      desires: [
        'Mock desire 1: Better documentation',
        'Mock desire 2: More features',
      ],
      language: languagePatterns,
      confidence: Math.min(signals.length / 100, 1),
    });
  }
}

/**
 * Factory function to create an analyzer
 */
export function createAnalyzer(): IAnalyzer {
  return new MockAnalyzer();
}
