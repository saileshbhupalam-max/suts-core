/**
 * RGS Analysis - Deduplicator
 *
 * Multi-pass deduplication for web signals:
 * 1. Exact content match (fast path)
 * 2. High similarity (>90%)
 * 3. Medium similarity (>85%)
 *
 * Selects canonical signals based on quality scores.
 */

import { WebSignal } from '@rgs/core/models/signal';
import { SimilarityCalculator } from './similarity';
import { QualityScorer } from './quality';

/**
 * Result of deduplication process
 */
export interface DeduplicationResult {
  /**
   * Unique signals (canonical representatives)
   */
  unique: WebSignal[];

  /**
   * Map of canonical signal IDs to their duplicates
   */
  duplicates: Map<string, WebSignal[]>;

  /**
   * Deduplication statistics
   */
  stats: {
    /**
     * Total number of input signals
     */
    total: number;

    /**
     * Number of unique signals
     */
    unique: number;

    /**
     * Number of duplicate signals removed
     */
    duplicates: number;

    /**
     * Deduplication rate (percentage)
     */
    dedupeRate: number;
  };
}

/**
 * Multi-pass deduplication for web signals
 */
export class Deduplicator {
  private readonly similarityCalculator: SimilarityCalculator;
  private readonly qualityScorer: QualityScorer;
  private readonly similarityThreshold: number;

  /**
   * Create a new deduplicator
   *
   * @param similarityThreshold - Threshold for considering signals as duplicates (default: 0.85)
   */
  constructor(similarityThreshold: number = 0.85) {
    this.similarityCalculator = new SimilarityCalculator();
    this.qualityScorer = new QualityScorer();
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Deduplicate signals using multi-pass strategy
   *
   * @param signals - Signals to deduplicate
   * @returns Deduplication result with unique signals and statistics
   */
  deduplicate(signals: WebSignal[]): DeduplicationResult {
    if (signals.length === 0) {
      return {
        unique: [],
        duplicates: new Map(),
        stats: {
          total: 0,
          unique: 0,
          duplicates: 0,
          dedupeRate: 0,
        },
      };
    }

    // Pass 1: Exact match (fast)
    const exactGroups = this.groupByExactContent(signals);

    // Pass 2: High similarity (>90%)
    const remaining = signals.filter((s) => !this.isInGroups(s, exactGroups));
    const highSimGroups = this.groupBySimilarity(remaining, 0.9);

    // Pass 3: Medium similarity (>threshold)
    const remaining2 = remaining.filter((s) => !this.isInGroups(s, highSimGroups));
    const mediumSimGroups = this.groupBySimilarity(remaining2, this.similarityThreshold);

    // Merge all groups
    const allGroups = this.mergeGroups([exactGroups, highSimGroups, mediumSimGroups]);

    // Select canonical from each group
    const uniqueSignals: WebSignal[] = [];
    const duplicateMap = new Map<string, WebSignal[]>();

    for (const group of allGroups.values()) {
      const canonical = this.selectCanonical(group);
      uniqueSignals.push(canonical);

      // Store duplicates (excluding canonical)
      const duplicates = group.filter((s) => s.id !== canonical.id);
      if (duplicates.length > 0) {
        duplicateMap.set(canonical.id, duplicates);
      }
    }

    return {
      unique: uniqueSignals,
      duplicates: duplicateMap,
      stats: this.calculateStats(signals.length, uniqueSignals.length),
    };
  }

  /**
   * Group signals by exact content match
   *
   * @param signals - Signals to group
   * @returns Map of content hash to signal group
   */
  private groupByExactContent(signals: WebSignal[]): Map<string, WebSignal[]> {
    const groups = new Map<string, WebSignal[]>();

    for (const signal of signals) {
      const normalized = this.normalizeContent(signal.content);
      const existing = groups.get(normalized);

      if (existing !== undefined) {
        existing.push(signal);
      } else {
        groups.set(normalized, [signal]);
      }
    }

    return groups;
  }

  /**
   * Group signals by similarity threshold
   *
   * @param signals - Signals to group
   * @param threshold - Similarity threshold (0-1)
   * @returns Map of representative signal ID to group
   */
  private groupBySimilarity(signals: WebSignal[], threshold: number): Map<string, WebSignal[]> {
    const groups = new Map<string, WebSignal[]>();
    const processed = new Set<string>();

    for (let i = 0; i < signals.length; i++) {
      const signal1 = signals[i];
      if (signal1 === undefined || processed.has(signal1.id)) {
        continue;
      }

      const group: WebSignal[] = [signal1];
      processed.add(signal1.id);

      // Find similar signals
      for (let j = i + 1; j < signals.length; j++) {
        const signal2 = signals[j];
        if (signal2 === undefined || processed.has(signal2.id)) {
          continue;
        }

        const similarity = this.similarityCalculator.similarity(
          signal1.content,
          signal2.content
        );

        if (similarity >= threshold) {
          group.push(signal2);
          processed.add(signal2.id);
        }
      }

      groups.set(signal1.id, group);
    }

    return groups;
  }

  /**
   * Select canonical signal from a group (highest quality)
   *
   * @param group - Group of similar signals
   * @returns Canonical signal
   */
  private selectCanonical(group: WebSignal[]): WebSignal {
    if (group.length === 1) {
      return group[0]!;
    }

    // Score all signals and pick highest
    let bestSignal = group[0]!;
    let bestScore = this.qualityScorer.score(bestSignal).overall;

    for (let i = 1; i < group.length; i++) {
      const signal = group[i]!;
      const score = this.qualityScorer.score(signal).overall;

      if (score > bestScore) {
        bestSignal = signal;
        bestScore = score;
      }
    }

    return bestSignal;
  }

  /**
   * Check if a signal is already in any of the groups
   *
   * @param signal - Signal to check
   * @param groups - Map of groups
   * @returns True if signal is in any group
   */
  private isInGroups(signal: WebSignal, groups: Map<string, WebSignal[]>): boolean {
    for (const group of groups.values()) {
      if (group.some((s) => s.id === signal.id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Merge multiple group maps
   *
   * @param groupMaps - Array of group maps to merge
   * @returns Merged group map
   */
  private mergeGroups(groupMaps: Map<string, WebSignal[]>[]): Map<string, WebSignal[]> {
    const merged = new Map<string, WebSignal[]>();
    let counter = 0;

    for (const groups of groupMaps) {
      for (const group of groups.values()) {
        if (group.length > 0) {
          merged.set(`group-${counter++}`, group);
        }
      }
    }

    return merged;
  }

  /**
   * Normalize content for exact matching
   *
   * @param content - Content to normalize
   * @returns Normalized content
   */
  private normalizeContent(content: string): string {
    return content.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Calculate deduplication statistics
   *
   * @param total - Total number of signals
   * @param unique - Number of unique signals
   * @returns Statistics object
   */
  private calculateStats(
    total: number,
    unique: number
  ): {
    total: number;
    unique: number;
    duplicates: number;
    dedupeRate: number;
  } {
    const duplicates = total - unique;
    const dedupeRate = total > 0 ? (duplicates / total) * 100 : 0;

    return {
      total,
      unique,
      duplicates,
      dedupeRate,
    };
  }
}
