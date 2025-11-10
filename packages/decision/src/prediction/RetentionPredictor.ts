/**
 * Predicts retention rate changes from product changes
 */

import { ProductChange } from '../models';

/**
 * Predicts impact on user retention
 */
export class RetentionPredictor {
  /**
   * Predict retention change from a product change
   * @param change - The proposed product change
   * @param baselineRetention - Current retention rate (0-1)
   * @returns Predicted change in retention (-1 to 1)
   */
  public predict(change: ProductChange, baselineRetention: number): number {
    const typeImpact = this.getTypeImpact(change.type);
    const effortFactor = this.getEffortFactor(change.estimatedEffort);
    const reachFactor = this.getReachFactor(change.expectedReach);

    // Calculate predicted change
    let predictedChange = typeImpact * effortFactor * reachFactor;

    // Diminishing returns: harder to improve already high retention
    if (baselineRetention > 0.8) {
      predictedChange *= 1 - (baselineRetention - 0.8) * 2;
    }

    // Clamp to reasonable bounds
    return Math.max(-0.3, Math.min(0.3, predictedChange));
  }

  /**
   * Get impact multiplier by change type
   * @param type - Change type
   * @returns Impact multiplier
   */
  private getTypeImpact(type: ProductChange['type']): number {
    const impacts: Record<ProductChange['type'], number> = {
      feature: 0.05,
      fix: 0.08,
      improvement: 0.06,
      experiment: 0.03,
    };
    return impacts[type] ?? 0.05;
  }

  /**
   * Calculate effort factor (more effort can mean more impact)
   * @param effort - Estimated effort
   * @returns Effort multiplier
   */
  private getEffortFactor(effort: number): number {
    // Logarithmic scale: diminishing returns on effort
    if (effort <= 0) {
      return 0;
    }
    return Math.min(2, 1 + Math.log10(effort) / 2);
  }

  /**
   * Calculate reach factor (more users affected = more impact)
   * @param reach - Expected reach
   * @returns Reach multiplier
   */
  private getReachFactor(reach: number): number {
    if (reach <= 0) {
      return 0;
    }
    // Logarithmic scale
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
    let confidence = 0.5; // Base confidence

    // Higher confidence for fixes (clearer impact)
    if (change.type === 'fix') {
      confidence += 0.2;
    }

    // Lower confidence for experiments
    if (change.type === 'experiment') {
      confidence -= 0.1;
    }

    // Historical data increases confidence
    if (historicalData) {
      confidence += 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }
}
