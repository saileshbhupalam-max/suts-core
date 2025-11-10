/**
 * Predicts churn rate changes from product changes
 */

import { ProductChange } from '../models';

/**
 * Predicts impact on user churn
 */
export class ChurnPredictor {
  /**
   * Predict churn change from a product change
   * @param change - The proposed product change
   * @param baselineChurn - Current churn rate (0-1)
   * @returns Predicted change in churn (-1 to 1, negative is good)
   */
  public predict(change: ProductChange, baselineChurn: number): number {
    const typeImpact = this.getTypeImpact(change.type);
    const effortFactor = this.getEffortFactor(change.estimatedEffort);
    const reachFactor = this.getReachFactor(change.expectedReach);

    // Calculate predicted change (negative means churn reduction)
    let predictedChange = -typeImpact * effortFactor * reachFactor;

    // Diminishing returns: harder to reduce already low churn
    if (baselineChurn < 0.2) {
      predictedChange *= baselineChurn / 0.2;
    }

    // Clamp to reasonable bounds
    return Math.max(-0.3, Math.min(0.1, predictedChange));
  }

  /**
   * Get impact multiplier by change type
   * @param type - Change type
   * @returns Impact multiplier
   */
  private getTypeImpact(type: ProductChange['type']): number {
    const impacts: Record<ProductChange['type'], number> = {
      feature: 0.04,
      fix: 0.1, // Fixes have highest impact on churn
      improvement: 0.07,
      experiment: 0.02,
    };
    return impacts[type] ?? 0.05;
  }

  /**
   * Calculate effort factor
   * @param effort - Estimated effort
   * @returns Effort multiplier
   */
  private getEffortFactor(effort: number): number {
    if (effort <= 0) {
      return 0;
    }
    return Math.min(2, 1 + Math.log10(effort) / 2);
  }

  /**
   * Calculate reach factor
   * @param reach - Expected reach
   * @returns Reach multiplier
   */
  private getReachFactor(reach: number): number {
    if (reach <= 0) {
      return 0;
    }
    return Math.min(2, Math.log10(reach + 1) / 3);
  }

  /**
   * Calculate confidence level for prediction
   * @param change - The product change
   * @param historicalData - Whether historical data is available
   * @returns Confidence (0-1)
   */
  public getConfidence(
    change: ProductChange,
    historicalData: boolean = false
  ): number {
    let confidence = 0.5;

    // Higher confidence for fixes
    if (change.type === 'fix') {
      confidence += 0.25;
    }

    // Lower confidence for experiments
    if (change.type === 'experiment') {
      confidence -= 0.15;
    }

    // Historical data increases confidence
    if (historicalData) {
      confidence += 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }
}
