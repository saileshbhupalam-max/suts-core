/**
 * RGS Analysis - Keyword Clustering
 *
 * Groups similar keywords together using similarity metrics.
 */

import { KeywordCluster } from './types';

/**
 * Configuration for keyword clustering
 */
export interface ClustererConfig {
  /**
   * Minimum similarity score to join a cluster (0-1)
   */
  readonly similarityThreshold: number;

  /**
   * Whether to use stemming for similarity
   */
  readonly useStemming: boolean;

  /**
   * Minimum cluster size to keep
   */
  readonly minClusterSize: number;
}

/**
 * Default clustering configuration
 */
export const DEFAULT_CLUSTERER_CONFIG: ClustererConfig = {
  similarityThreshold: 0.7,
  useStemming: true,
  minClusterSize: 1,
};

/**
 * Keyword clustering engine
 */
export class KeywordClusterer {
  constructor(private readonly config: ClustererConfig = DEFAULT_CLUSTERER_CONFIG) {}

  /**
   * Cluster keywords by similarity
   */
  cluster(keywords: readonly string[]): KeywordCluster[] {
    if (keywords.length === 0) {
      return [];
    }

    // Normalize keywords
    const normalized = keywords.map((k) => this.normalize(k));

    // Build clusters
    const clusters = new Map<string, Set<string>>();

    for (let i = 0; i < normalized.length; i++) {
      const keyword = normalized[i];
      const original = keywords[i];

      if (keyword === undefined || original === undefined) {
        continue;
      }

      // Find best matching cluster
      let bestCluster: string | undefined;
      let bestScore = 0;

      for (const [representative, members] of clusters) {
        const score = this.calculateSimilarity(keyword, Array.from(members));
        if (score > bestScore && score >= this.config.similarityThreshold) {
          bestCluster = representative;
          bestScore = score;
        }
      }

      // Add to existing cluster or create new one
      if (bestCluster !== undefined) {
        const cluster = clusters.get(bestCluster);
        if (cluster !== undefined) {
          cluster.add(original);
        }
      } else {
        clusters.set(original, new Set([original]));
      }
    }

    // Convert to KeywordCluster array
    const result: KeywordCluster[] = [];

    for (const [representative, members] of clusters) {
      const cluster: KeywordCluster = {
        representative,
        keywords: Array.from(members).sort(),
        similarity: this.calculateClusterSimilarity(Array.from(members)),
      };

      // Only include clusters meeting minimum size
      if (cluster.keywords.length >= this.config.minClusterSize) {
        result.push(cluster);
      }
    }

    // Sort by cluster size (descending)
    return result.sort((a, b) => b.keywords.length - a.keywords.length);
  }

  /**
   * Calculate similarity between a keyword and cluster members
   */
  private calculateSimilarity(keyword: string, clusterMembers: readonly string[]): number {
    if (clusterMembers.length === 0) {
      return 0;
    }

    const normalized = this.normalize(keyword);
    const scores = clusterMembers.map((member) => {
      const memberNorm = this.normalize(member);
      return this.stringSimilarity(normalized, memberNorm);
    });

    // Return average similarity
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
  }

  /**
   * Calculate internal similarity of a cluster
   */
  private calculateClusterSimilarity(members: readonly string[]): number {
    if (members.length <= 1) {
      return 1.0;
    }

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < members.length; i++) {
      const member1 = members[i];
      if (member1 === undefined) {
        continue;
      }

      for (let j = i + 1; j < members.length; j++) {
        const member2 = members[j];
        if (member2 === undefined) {
          continue;
        }

        const norm1 = this.normalize(member1);
        const norm2 = this.normalize(member2);
        totalSimilarity += this.stringSimilarity(norm1, norm2);
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 1.0;
  }

  /**
   * Calculate similarity between two strings
   */
  private stringSimilarity(str1: string, str2: string): number {
    // Exact match
    if (str1 === str2) {
      return 1.0;
    }

    // Substring match
    if (str1.includes(str2) || str2.includes(str1)) {
      return 0.8;
    }

    // Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(str1, str2);
    const maxLen = Math.max(str1.length, str2.length);

    if (maxLen === 0) {
      return 1.0;
    }

    return 1 - distance / maxLen;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Create distance matrix
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= m; i++) {
      const row = dp[i];
      if (row !== undefined) {
        row[0] = i;
      }
    }
    for (let j = 0; j <= n; j++) {
      const row = dp[0];
      if (row !== undefined) {
        row[j] = j;
      }
    }

    // Fill matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const char1 = str1[i - 1];
        const char2 = str2[j - 1];
        const cost = char1 === char2 ? 0 : 1;

        const row = dp[i];
        const prevRow = dp[i - 1];
        const prevRowPrev = prevRow?.[j - 1];
        const prevRowCurr = prevRow?.[j];
        const currRowPrev = row?.[j - 1];

        if (
          row !== undefined &&
          prevRowPrev !== undefined &&
          prevRowCurr !== undefined &&
          currRowPrev !== undefined
        ) {
          row[j] = Math.min(
            prevRowCurr + 1, // deletion
            currRowPrev + 1, // insertion
            prevRowPrev + cost // substitution
          );
        }
      }
    }

    const lastRow = dp[m];
    return lastRow !== undefined ? (lastRow[n] ?? 0) : 0;
  }

  /**
   * Normalize keyword for comparison
   */
  private normalize(keyword: string): string {
    let normalized = keyword.toLowerCase().trim();

    if (this.config.useStemming) {
      normalized = this.simpleStem(normalized);
    }

    return normalized;
  }

  /**
   * Simple stemming algorithm (removes common suffixes)
   */
  private simpleStem(word: string): string {
    // Remove common suffixes
    const suffixes = ['ing', 'ed', 'ly', 's', 'es', 'ies'];

    for (const suffix of suffixes) {
      if (word.endsWith(suffix) && word.length > suffix.length + 2) {
        return word.slice(0, -suffix.length);
      }
    }

    return word;
  }

  /**
   * Merge small clusters into larger ones
   */
  mergeClusters(clusters: readonly KeywordCluster[], maxClusters: number): KeywordCluster[] {
    if (clusters.length <= maxClusters) {
      return [...clusters];
    }

    // Sort by size (largest first)
    const sorted = [...clusters].sort((a, b) => b.keywords.length - a.keywords.length);

    // Keep largest clusters, merge small ones
    const result = sorted.slice(0, maxClusters - 1);
    const toMerge = sorted.slice(maxClusters - 1);

    // Merge remaining into "other" cluster
    if (toMerge.length > 0) {
      const allKeywords = toMerge.flatMap((c) => c.keywords);
      const merged: KeywordCluster = {
        representative: 'other',
        keywords: Array.from(new Set(allKeywords)).sort(),
        similarity: 0.5,
      };
      result.push(merged);
    }

    return result;
  }
}
