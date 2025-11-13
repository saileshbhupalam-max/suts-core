/**
 * RGS Analysis - Signal Filters
 *
 * Provides filtering capabilities for web signals based on:
 * - Quality score
 * - Source type
 * - Date range
 * - Keywords
 */

import { WebSignal } from '@rgs/core/models/signal';
import { SourceType } from '@rgs/core/models/source';
import { QualityScorer } from './quality';

/**
 * Filter web signals based on various criteria
 */
export class SignalFilter {
  private readonly qualityScorer: QualityScorer;

  constructor() {
    this.qualityScorer = new QualityScorer();
  }

  /**
   * Filter signals by minimum quality score
   *
   * @param signals - Signals to filter
   * @param minScore - Minimum quality score (0-1), defaults to 0.6
   * @returns Filtered signals meeting minimum quality threshold
   */
  filterByQuality(signals: WebSignal[], minScore: number = 0.6): WebSignal[] {
    return signals.filter((signal) => {
      const score = this.qualityScorer.score(signal);
      return score.overall >= minScore;
    });
  }

  /**
   * Filter signals by source type
   *
   * @param signals - Signals to filter
   * @param sources - Array of allowed source types
   * @returns Filtered signals from specified sources
   */
  filterBySource(signals: WebSignal[], sources: SourceType[]): WebSignal[] {
    return signals.filter((signal) => sources.includes(signal.source));
  }

  /**
   * Filter signals by date range
   *
   * @param signals - Signals to filter
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns Filtered signals within date range
   */
  filterByDateRange(signals: WebSignal[], startDate: Date, endDate: Date): WebSignal[] {
    return signals.filter(
      (signal) => signal.timestamp >= startDate && signal.timestamp <= endDate
    );
  }

  /**
   * Filter signals by keywords
   *
   * @param signals - Signals to filter
   * @param keywords - Array of keywords to search for
   * @param mode - Match mode: 'any' (OR) or 'all' (AND), defaults to 'any'
   * @returns Filtered signals matching keyword criteria
   */
  filterByKeywords(
    signals: WebSignal[],
    keywords: string[],
    mode: 'any' | 'all' = 'any'
  ): WebSignal[] {
    return signals.filter((signal) => {
      const content = signal.content.toLowerCase();

      if (mode === 'any') {
        // Match if ANY keyword is found (OR)
        return keywords.some((keyword) => content.includes(keyword.toLowerCase()));
      } else {
        // Match if ALL keywords are found (AND)
        return keywords.every((keyword) => content.includes(keyword.toLowerCase()));
      }
    });
  }

  /**
   * Apply multiple filters in sequence
   *
   * @param signals - Signals to filter
   * @param options - Filter options
   * @returns Filtered signals
   */
  applyFilters(
    signals: WebSignal[],
    options: {
      minQuality?: number;
      sources?: SourceType[];
      dateRange?: { start: Date; end: Date };
      keywords?: { terms: string[]; mode?: 'any' | 'all' };
    }
  ): WebSignal[] {
    let filtered = signals;

    // Apply quality filter
    if (options.minQuality !== undefined) {
      filtered = this.filterByQuality(filtered, options.minQuality);
    }

    // Apply source filter
    if (options.sources !== undefined) {
      filtered = this.filterBySource(filtered, options.sources);
    }

    // Apply date range filter
    if (options.dateRange !== undefined) {
      filtered = this.filterByDateRange(
        filtered,
        options.dateRange.start,
        options.dateRange.end
      );
    }

    // Apply keyword filter
    if (options.keywords !== undefined) {
      filtered = this.filterByKeywords(
        filtered,
        options.keywords.terms,
        options.keywords.mode
      );
    }

    return filtered;
  }
}
