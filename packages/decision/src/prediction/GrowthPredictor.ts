/**
 * Predicts user growth rate changes from product changes
 */

import { ProductChange } from '../models';

/**
 * Predicts impact on user growth
 */
export class GrowthPredictor {
  /**
   * Predict growth change from a product change
   * @param change - The proposed product change
   * @param _baselineGrowth - Current growth rate (-1 to 1)
   * @returns Predicted change in growth (-1 to 1)
   */
  public predict(change: ProductChange, _baselineGrowth: number): number {
    const typeImpact = this.getTypeImpact(change.type);
    const effortFactor = this.getEffortFactor(change.estimatedEffort);
    const reachFactor = this.getReachFactor(change.expectedReach);
    const viralityFactor = this.getViralityFactor(change);

    // Calculate predicted change
    const predictedChange =
      typeImpact * effortFactor * reachFactor * viralityFactor;

    // Clamp to reasonable bounds
    return Math.max(-0.2, Math.min(0.2, predictedChange));
  }

  /**
   * Get impact multiplier by change type
   * @param type - Change type
   * @returns Impact multiplier
   */
  private getTypeImpact(type: ProductChange['type']): number {
    const impacts: Record<ProductChange['type'], number> = {
      feature: 0.08, // Features drive growth
      fix: 0.03,
      improvement: 0.05,
      experiment: 0.04,
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
   * Calculate virality factor based on change characteristics
   * @param change - The product change
   * @returns Virality multiplier
   */
  private getViralityFactor(change: ProductChange): number {
    // Check if change is related to sharing or social features
    const viralKeywords = ['share', 'social', 'invite', 'referral', 'viral'];
    const hasViralElement = viralKeywords.some(
      (keyword) =>
        change.description.toLowerCase().includes(keyword) ||
        change.name.toLowerCase().includes(keyword)
    );

    return hasViralElement ? 1.5 : 1.0;
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
    let confidence = 0.4; // Lower base confidence (growth is harder to predict)

    // Features have more predictable growth impact
    if (change.type === 'feature') {
      confidence += 0.1;
    }

    // Historical data increases confidence
    if (historicalData) {
      confidence += 0.25;
    }

    return Math.max(0, Math.min(1, confidence));
  }
}
