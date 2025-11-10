/**
 * Optimizes the sequence of implementing changes
 */

import { PrioritizedInsight } from '../models';

/**
 * Sequenced change with dependencies
 */
export interface SequencedChange {
  insight: PrioritizedInsight;
  sequenceNumber: number;
  dependencies: string[];
  blockers: string[];
  reasoning: string;
}

/**
 * Optimizes implementation sequence
 */
export class SequenceOptimizer {
  /**
   * Optimize sequence of changes
   * @param insights - Prioritized insights
   * @returns Optimally sequenced changes
   */
  public optimize(insights: PrioritizedInsight[]): SequencedChange[] {
    // Sort by priority score
    const sorted = [...insights].sort(
      (a, b) => b.priorityScore - a.priorityScore
    );

    const sequenced: SequencedChange[] = [];
    const completed: Set<string> = new Set() = new Set();

    // Build sequence considering dependencies
    for (const insight of sorted) {
      const dependencies = this.identifyDependencies(insight, completed);
      const blockers = this.identifyBlockers(insight, sequenced);

      sequenced.push({
        insight,
        sequenceNumber: sequenced.length + 1,
        dependencies: Array.from(dependencies),
        blockers,
        reasoning: this.generateReasoning(insight, dependencies, blockers),
      });

      completed.add(insight.insight.id);
    }

    return this.reorderByDependencies(sequenced);
  }

  /**
   * Identify dependencies for an insight
   * @param insight - The insight
   * @param completed - Set of completed insight IDs
   * @returns Set of dependency IDs
   */
  private identifyDependencies(
    insight: PrioritizedInsight, _completed: Set<string> = new Set(),
  ): Set<string> {
    const dependencies = new Set<string>();

    // Infrastructure and performance fixes should come first
    if (
      insight.insight.type !== 'performance' &&
      insight.insight.type !== 'ux'
    ) {
      // Look for performance issues in completed set
      // This is a simplified heuristic
    }

    return dependencies;
  }

  /**
   * Identify blockers for an insight
   * @param insight - The insight
   * @param sequenced - Already sequenced changes
   * @returns Array of blocker descriptions
   */
  private identifyBlockers(
    insight: PrioritizedInsight,
    sequenced: SequencedChange[]
  ): string[] {
    const blockers: string[] = [];

    // Check if high-effort items should wait
    if (insight.effortScore > 10) {
      const criticalItems = sequenced.filter(
        (s) => s.insight.insight.severity === 'critical' && s.insight.effortScore < 5
      );
      if (criticalItems.length > 0) {
        blockers.push('Wait for critical quick wins to complete');
      }
    }

    return blockers;
  }

  /**
   * Generate reasoning for sequence position
   * @param insight - The insight
   * @param dependencies - Dependencies
   * @param blockers - Blockers
   * @returns Reasoning text
   */
  private generateReasoning(
    insight: PrioritizedInsight,
    dependencies: Set<string>,
    blockers: string[]
  ): string {
    const parts: string[] = [];

    if (insight.insight.severity === 'critical') {
      parts.push('Critical priority due to severity');
    }

    if (insight.priorityScore > 0.8) {
      parts.push('High priority score indicates significant value');
    }

    if (insight.effortScore < 3) {
      parts.push('Quick win - low effort required');
    }

    if (dependencies.size > 0) {
      parts.push(`Depends on ${dependencies.size} other fix(es)`);
    }

    if (blockers.length > 0) {
      parts.push('Has blockers that should be resolved first');
    }

    return parts.join('; ') || 'Standard priority';
  }

  /**
   * Reorder sequence to respect dependencies
   * @param sequenced - Initial sequence
   * @returns Reordered sequence
   */
  private reorderByDependencies(
    sequenced: SequencedChange[]
  ): SequencedChange[] {
    // Topological sort to respect dependencies
    const result: SequencedChange[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (change: SequencedChange): void => {
      const id = change.insight.insight.id;

      if (visited.has(id)) {
        return;
      }

      if (visiting.has(id)) {
        // Cycle detected - skip for now
        return;
      }

      visiting.add(id);

      // Visit dependencies first
      for (const depId of change.dependencies) {
        const dep = sequenced.find((s) => s.insight.insight.id === depId);
        if (dep) {
          visit(dep);
        }
      }

      visiting.delete(id);
      visited.add(id);
      result.push(change);
    };

    for (const change of sequenced) {
      visit(change);
    }

    // Update sequence numbers
    return result.map((change, index) => ({
      ...change,
      sequenceNumber: index + 1,
    }));
  }
}
