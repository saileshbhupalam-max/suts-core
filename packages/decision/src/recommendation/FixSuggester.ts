/**
 * Suggests specific fixes for identified issues
 */

import { AnalysisResult } from '../models';

/**
 * Fix suggestion with details
 */
export interface FixSuggestion {
  id: string;
  title: string;
  description: string;
  implementation: string[];
  estimatedImpact: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
}

/**
 * Suggests actionable fixes for insights
 */
export class FixSuggester {
  /**
   * Generate fix suggestions for an insight
   * @param insight - The insight to fix
   * @returns Array of fix suggestions
   */
  public suggest(insight: AnalysisResult): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    // Generate type-specific fixes
    switch (insight.type) {
      case 'retention':
        suggestions.push(...this.suggestRetentionFixes(insight));
        break;
      case 'churn':
        suggestions.push(...this.suggestChurnFixes(insight));
        break;
      case 'growth':
        suggestions.push(...this.suggestGrowthFixes(insight));
        break;
      case 'revenue':
        suggestions.push(...this.suggestRevenueFixes(insight));
        break;
      case 'ux':
        suggestions.push(...this.suggestUXFixes(insight));
        break;
      case 'performance':
        suggestions.push(...this.suggestPerformanceFixes(insight));
        break;
    }

    return suggestions;
  }

  /**
   * Suggest retention-related fixes
   * @param insight - The insight
   * @returns Fix suggestions
   */
  private suggestRetentionFixes(insight: AnalysisResult): FixSuggestion[] {
    return [
      {
        id: `fix-${insight.id}-onboarding`,
        title: 'Improve onboarding experience',
        description: 'Enhance user onboarding to increase early engagement',
        implementation: [
          'Add interactive tutorial',
          'Reduce steps to first value',
          'Implement progress indicators',
        ],
        estimatedImpact: 0.7,
        priority: insight.severity,
        category: 'retention',
      },
      {
        id: `fix-${insight.id}-engagement`,
        title: 'Increase engagement touchpoints',
        description: 'Add more opportunities for user engagement',
        implementation: [
          'Implement email reminders',
          'Add push notifications',
          'Create engagement loops',
        ],
        estimatedImpact: 0.6,
        priority: this.downgradePriority(insight.severity),
        category: 'retention',
      },
    ];
  }

  /**
   * Suggest churn-related fixes
   * @param insight - The insight
   * @returns Fix suggestions
   */
  private suggestChurnFixes(insight: AnalysisResult): FixSuggestion[] {
    return [
      {
        id: `fix-${insight.id}-pain-points`,
        title: 'Address user pain points',
        description: 'Fix identified friction causing users to leave',
        implementation: [
          'Identify top churn reasons',
          'Implement targeted fixes',
          'A/B test solutions',
        ],
        estimatedImpact: 0.8,
        priority: insight.severity,
        category: 'churn',
      },
      {
        id: `fix-${insight.id}-win-back`,
        title: 'Create win-back campaign',
        description: 'Re-engage churned users',
        implementation: [
          'Segment churned users',
          'Create personalized offers',
          'Automate win-back emails',
        ],
        estimatedImpact: 0.5,
        priority: this.downgradePriority(insight.severity),
        category: 'churn',
      },
    ];
  }

  /**
   * Suggest growth-related fixes
   * @param insight - The insight
   * @returns Fix suggestions
   */
  private suggestGrowthFixes(insight: AnalysisResult): FixSuggestion[] {
    return [
      {
        id: `fix-${insight.id}-acquisition`,
        title: 'Optimize acquisition funnel',
        description: 'Improve conversion at each stage',
        implementation: [
          'Analyze funnel drop-off',
          'Reduce friction points',
          'Implement social proof',
        ],
        estimatedImpact: 0.7,
        priority: insight.severity,
        category: 'growth',
      },
    ];
  }

  /**
   * Suggest revenue-related fixes
   * @param insight - The insight
   * @returns Fix suggestions
   */
  private suggestRevenueFixes(insight: AnalysisResult): FixSuggestion[] {
    return [
      {
        id: `fix-${insight.id}-monetization`,
        title: 'Optimize monetization strategy',
        description: 'Improve revenue per user',
        implementation: [
          'Test pricing models',
          'Add upsell opportunities',
          'Implement value-based pricing',
        ],
        estimatedImpact: 0.8,
        priority: insight.severity,
        category: 'revenue',
      },
    ];
  }

  /**
   * Suggest UX-related fixes
   * @param insight - The insight
   * @returns Fix suggestions
   */
  private suggestUXFixes(insight: AnalysisResult): FixSuggestion[] {
    return [
      {
        id: `fix-${insight.id}-usability`,
        title: 'Improve usability',
        description: 'Make interface more intuitive',
        implementation: [
          'Conduct usability testing',
          'Simplify navigation',
          'Add contextual help',
        ],
        estimatedImpact: 0.6,
        priority: insight.severity,
        category: 'ux',
      },
    ];
  }

  /**
   * Suggest performance-related fixes
   * @param insight - The insight
   * @returns Fix suggestions
   */
  private suggestPerformanceFixes(insight: AnalysisResult): FixSuggestion[] {
    return [
      {
        id: `fix-${insight.id}-performance`,
        title: 'Optimize performance',
        description: 'Reduce load times and improve responsiveness',
        implementation: [
          'Profile performance bottlenecks',
          'Implement caching',
          'Optimize critical path',
        ],
        estimatedImpact: 0.7,
        priority: insight.severity,
        category: 'performance',
      },
    ];
  }

  /**
   * Downgrade priority by one level
   * @param priority - Current priority
   * @returns Downgraded priority
   */
  private downgradePriority(
    priority: 'critical' | 'high' | 'medium' | 'low'
  ): 'critical' | 'high' | 'medium' | 'low' {
    const map: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      critical: 'high',
      high: 'medium',
      medium: 'low',
      low: 'low',
    };
    return map[priority] ?? 'low';
  }
}
