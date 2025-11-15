/**
 * RGS Analysis - Quality Scorer
 *
 * Scores web signals based on multiple quality factors:
 * - Content length
 * - Metadata richness
 * - Engagement metrics (likes, upvotes, reactions)
 * - Recency
 * - Author authority
 */

import { WebSignal } from '@rgs/core/models/signal';

/**
 * Quality score with breakdown by factor
 */
export interface QualityScore {
  /**
   * Overall quality score (0-1)
   */
  overall: number;

  /**
   * Breakdown of individual quality factors
   */
  breakdown: {
    /**
     * Content length score (0-1)
     */
    length: number;

    /**
     * Metadata richness score (0-1)
     */
    metadata: number;

    /**
     * Engagement score (0-1)
     */
    engagement: number;

    /**
     * Recency score (0-1)
     */
    recency: number;

    /**
     * Author authority score (0-1)
     */
    authority: number;
  };
}

/**
 * Calculates quality scores for web signals
 */
export class QualityScorer {
  /**
   * Score a web signal based on multiple quality factors
   *
   * @param signal - Signal to score
   * @returns Quality score with breakdown
   */
  score(signal: WebSignal): QualityScore {
    const length = this.scoreLength(signal.content);
    const metadata = this.scoreMetadata(signal.metadata);
    const engagement = this.scoreEngagement(signal);
    const recency = this.scoreRecency(signal.timestamp);
    const authority = this.scoreAuthority(signal);

    // Weighted average of quality factors
    const overall =
      0.2 * length +
      0.15 * metadata +
      0.3 * engagement +
      0.15 * recency +
      0.2 * authority;

    return {
      overall,
      breakdown: {
        length,
        metadata,
        engagement,
        recency,
        authority,
      },
    };
  }

  /**
   * Score content length
   *
   * @param content - Content to score
   * @returns Length score (0-1)
   */
  private scoreLength(content: string): number {
    const len = content.length;

    // Too short (<50 chars) = 0.2
    if (len < 50) {
      return 0.2;
    }

    // Too long (>2000 chars) = 0.8
    if (len > 2000) {
      return 0.8;
    }

    // Sweet spot (100-500 chars) = 1.0
    if (len >= 100 && len <= 500) {
      return 1.0;
    }

    // Between short and sweet spot (50-100 chars) = 0.6
    if (len < 100) {
      return 0.6;
    }

    // Between sweet spot and too long (500-2000 chars) = 0.9
    return 0.9;
  }

  /**
   * Score metadata richness
   *
   * @param metadata - Metadata to score
   * @returns Metadata score (0-1)
   */
  private scoreMetadata(metadata: Record<string, unknown>): number {
    const keys = Object.keys(metadata);

    // More metadata = higher score
    // Cap at 10 metadata fields for max score
    return Math.min(keys.length / 10, 1.0);
  }

  /**
   * Score engagement based on source-specific metrics
   *
   * @param signal - Signal to score
   * @returns Engagement score (0-1)
   */
  private scoreEngagement(signal: WebSignal): number {
    switch (signal.source) {
      case 'reddit':
        return this.scoreRedditEngagement(signal);
      case 'twitter':
        return this.scoreTwitterEngagement(signal);
      case 'github':
        return this.scoreGithubEngagement(signal);
      case 'hackernews':
        return this.scoreHackerNewsEngagement(signal);
      default:
        return 0.5; // Neutral score for unknown sources
    }
  }

  /**
   * Score Reddit engagement (upvotes/score)
   *
   * @param signal - Reddit signal
   * @returns Engagement score (0-1)
   */
  private scoreRedditEngagement(signal: WebSignal): number {
    const score = (signal.metadata['score'] as number) ?? 0;

    // Normalize to 0-1 range (100 upvotes = 1.0)
    return Math.min(score / 100, 1.0);
  }

  /**
   * Score Twitter engagement (likes)
   *
   * @param signal - Twitter signal
   * @returns Engagement score (0-1)
   */
  private scoreTwitterEngagement(signal: WebSignal): number {
    const likes = (signal.metadata['likeCount'] as number) ?? 0;

    // Normalize to 0-1 range (50 likes = 1.0)
    return Math.min(likes / 50, 1.0);
  }

  /**
   * Score GitHub engagement (reactions)
   *
   * @param signal - GitHub signal
   * @returns Engagement score (0-1)
   */
  private scoreGithubEngagement(signal: WebSignal): number {
    const reactions = signal.metadata['reactions'] as
      | {
          plusOne?: number;
          heart?: number;
          hooray?: number;
          rocket?: number;
          eyes?: number;
        }
      | undefined;

    if (reactions === undefined) {
      return 0.5;
    }

    const total =
      (reactions.plusOne ?? 0) +
      (reactions.heart ?? 0) +
      (reactions.hooray ?? 0) +
      (reactions.rocket ?? 0) +
      (reactions.eyes ?? 0);

    // Normalize to 0-1 range (20 reactions = 1.0)
    return Math.min(total / 20, 1.0);
  }

  /**
   * Score Hacker News engagement (points)
   *
   * @param signal - Hacker News signal
   * @returns Engagement score (0-1)
   */
  private scoreHackerNewsEngagement(signal: WebSignal): number {
    const points = (signal.metadata['points'] as number) ?? 0;

    // Normalize to 0-1 range (50 points = 1.0)
    return Math.min(points / 50, 1.0);
  }

  /**
   * Score recency based on timestamp
   *
   * @param timestamp - Timestamp to score
   * @returns Recency score (0-1)
   */
  private scoreRecency(timestamp: Date): number {
    const ageMs = Date.now() - timestamp.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // Recent (0-7 days) = 1.0
    if (ageDays <= 7) {
      return 1.0;
    }

    // Medium (7-30 days) = 0.8
    if (ageDays <= 30) {
      return 0.8;
    }

    // Old (30-90 days) = 0.6
    if (ageDays <= 90) {
      return 0.6;
    }

    // Very old (>90 days) = 0.4
    return 0.4;
  }

  /**
   * Score author authority
   *
   * @param signal - Signal to score
   * @returns Authority score (0-1)
   */
  private scoreAuthority(signal: WebSignal): number {
    // Placeholder: Could check author karma, followers, etc.
    // For now, return neutral score if author is present, lower if not
    return signal.author !== undefined ? 0.7 : 0.5;
  }
}
