/**
 * Multi-criteria decision tree
 */

import { SimulationMetrics } from '../models';

/**
 * Decision criteria
 */
export interface DecisionCriteria {
  name: string;
  weight: number;
  evaluate: (metrics: SimulationMetrics) => number;
}

/**
 * Decision node in the tree
 */
export interface DecisionNode {
  name: string;
  score: number;
  passed: boolean;
  children: DecisionNode[];
  reasoning: string;
}

/**
 * Multi-criteria decision making using tree structure
 */
export class DecisionTree {
  private readonly criteria: DecisionCriteria[];

  /**
   * Create decision tree
   * @param criteria - Decision criteria
   */
  constructor(criteria: DecisionCriteria[] = []) {
    this.criteria =
      criteria.length > 0 ? criteria : this.getDefaultCriteria();
  }

  /**
   * Evaluate metrics using decision tree
   * @param metrics - Simulation metrics
   * @returns Decision tree root node
   */
  public evaluate(metrics: SimulationMetrics): DecisionNode {
    const children = this.criteria.map((criterion) =>
      this.evaluateCriterion(criterion, metrics)
    );

    const totalWeight = this.criteria.reduce(
      (sum, c) => sum + c.weight,
      0
    );
    const weightedScore = children.reduce((sum, node, i) => {
      const criterion = this.criteria[i];
      if (criterion === undefined) {
        return sum;
      }
      return sum + node.score * criterion.weight;
    }, 0);
    const normalizedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return {
      name: 'Overall Decision',
      score: normalizedScore,
      passed: normalizedScore >= 0.7,
      children,
      reasoning: this.generateOverallReasoning(normalizedScore, children),
    };
  }

  /**
   * Evaluate single criterion
   * @param criterion - The criterion
   * @param metrics - Simulation metrics
   * @returns Decision node
   */
  private evaluateCriterion(
    criterion: DecisionCriteria,
    metrics: SimulationMetrics
  ): DecisionNode {
    const score = criterion.evaluate(metrics);
    const passed = score >= 0.7;

    return {
      name: criterion.name,
      score,
      passed,
      children: [],
      reasoning: this.generateCriterionReasoning(
        criterion.name,
        score,
        passed
      ),
    };
  }

  /**
   * Get default decision criteria
   * @returns Default criteria
   */
  private getDefaultCriteria(): DecisionCriteria[] {
    return [
      {
        name: 'Retention',
        weight: 0.3,
        evaluate: (metrics) => metrics.retentionRate,
      },
      {
        name: 'Churn',
        weight: 0.25,
        evaluate: (metrics) => 1 - metrics.churnRate,
      },
      {
        name: 'Growth',
        weight: 0.2,
        evaluate: (metrics) => Math.max(0, (metrics.growthRate + 1) / 2),
      },
      {
        name: 'Satisfaction',
        weight: 0.15,
        evaluate: (metrics) => metrics.userSatisfaction,
      },
      {
        name: 'Confidence',
        weight: 0.1,
        evaluate: (metrics) => metrics.confidenceLevel,
      },
    ];
  }

  /**
   * Generate reasoning for criterion
   * @param name - Criterion name
   * @param score - Score
   * @param passed - Whether it passed
   * @returns Reasoning text
   */
  private generateCriterionReasoning(
    name: string,
    score: number,
    passed: boolean
  ): string {
    const scorePercent = (score * 100).toFixed(1);
    const status = passed ? 'PASS' : 'FAIL';
    return `${name}: ${scorePercent}% [${status}]`;
  }

  /**
   * Generate overall reasoning
   * @param score - Overall score
   * @param children - Child nodes
   * @returns Reasoning text
   */
  private generateOverallReasoning(
    score: number,
    children: DecisionNode[]
  ): string {
    const scorePercent = (score * 100).toFixed(1);
    const passedCount = children.filter((c) => c.passed).length;
    const totalCount = children.length;

    return `Overall score: ${scorePercent}% (${passedCount}/${totalCount} criteria passed)`;
  }

  /**
   * Get failing criteria
   * @param root - Decision tree root
   * @returns Array of failing criterion names
   */
  public getFailingCriteria(root: DecisionNode): string[] {
    return root.children.filter((c) => !c.passed).map((c) => c.name);
  }

  /**
   * Get passing criteria
   * @param root - Decision tree root
   * @returns Array of passing criterion names
   */
  public getPassingCriteria(root: DecisionNode): string[] {
    return root.children.filter((c) => c.passed).map((c) => c.name);
  }
}
