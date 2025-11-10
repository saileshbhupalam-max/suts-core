/**
 * Insight prioritization - ranks insights by impact
 */

import { Insight } from '../models';
import { AnalysisConfig } from '../models/config';

/**
 * Prioritizes insights based on impact, effort, and confidence
 */
export class InsightPrioritizer {
  constructor(private readonly config: AnalysisConfig) {}

  /**
   * Prioritizes a list of insights
   * @param insights - Insights to prioritize
   * @returns Prioritized insights sorted by priority score
   */
  prioritize(insights: Insight[]): Insight[] {
    if (insights.length === 0) {
      return [];
    }

    // Calculate priority scores for each insight
    const prioritizedInsights = insights.map((insight) => {
      const priorityScore = this.calculatePriorityScore(insight);

      return {
        ...insight,
        priority: priorityScore,
      };
    });

    // Sort by priority descending
    return prioritizedInsights.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculates priority score for an insight
   * Priority = (Impact * Confidence) / Effort
   */
  private calculatePriorityScore(insight: Insight): number {
    // Avoid division by zero
    const effort = Math.max(insight.effort, 0.1);

    // Base priority: impact weighted by confidence
    const impactScore = insight.impact * insight.confidence;

    // Adjust by effort (higher effort = lower priority)
    const priorityScore = impactScore / effort;

    // Normalize to 0-1 range
    return Math.min(Math.max(priorityScore, 0), 1);
  }

  /**
   * Filters insights by minimum confidence
   * @param insights - Insights to filter
   * @returns Filtered insights
   */
  filterByConfidence(insights: Insight[]): Insight[] {
    return insights.filter((insight) => insight.confidence >= this.config.minConfidence);
  }

  /**
   * Groups insights by type
   * @param insights - Insights to group
   * @returns Insights grouped by type
   */
  groupByType(insights: Insight[]): Record<string, Insight[]> {
    const grouped: Record<string, Insight[]> = {
      friction: [],
      value: [],
      churn: [],
      opportunity: [],
    };

    for (const insight of insights) {
      const existing = grouped[insight.type];
      if (existing !== undefined) {
        existing.push(insight);
      }
    }

    return grouped;
  }

  /**
   * Gets top N insights
   * @param insights - Insights to select from
   * @param n - Number of top insights to return
   * @returns Top N insights
   */
  getTopN(insights: Insight[], n: number): Insight[] {
    const prioritized = this.prioritize(insights);
    return prioritized.slice(0, n);
  }

  /**
   * Calculates quick wins (high impact, low effort)
   * @param insights - Insights to analyze
   * @returns Quick win insights
   */
  identifyQuickWins(insights: Insight[]): Insight[] {
    return insights.filter((insight) => {
      return insight.impact >= 0.6 && insight.effort <= 0.4 && insight.confidence >= 0.7;
    });
  }

  /**
   * Calculates major projects (high impact, high effort)
   * @param insights - Insights to analyze
   * @returns Major project insights
   */
  identifyMajorProjects(insights: Insight[]): Insight[] {
    return insights.filter((insight) => {
      return insight.impact >= 0.7 && insight.effort >= 0.6 && insight.confidence >= 0.6;
    });
  }
}
