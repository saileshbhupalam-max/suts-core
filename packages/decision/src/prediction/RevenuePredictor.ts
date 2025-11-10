/**
 * Predicts revenue impact from product changes
 */

import { ProductChange } from '../models';

/**
 * Configuration for revenue prediction
 */
export interface RevenuePredictorConfig {
  /**
   * Average revenue per user
   */
  avgRevenuePerUser: number;
  /**
   * Current user base size
   */
  currentUserBase: number;
}

/**
 * Predicts impact on revenue
 */
export class RevenuePredictor {
  private readonly config: RevenuePredictorConfig;

  /**
   * Create revenue predictor
   * @param config - Configuration with revenue metrics
   */
  constructor(config: RevenuePredictorConfig) {
    this.config = config;
  }

  /**
   * Predict revenue change from a product change
   * @param change - The proposed product change
   * @param retentionChange - Predicted retention change
   * @param growthChange - Predicted growth change
   * @returns Predicted revenue change (absolute value)
   */
  public predict(
    change: ProductChange,
    retentionChange: number,
    growthChange: number
  ): number {
    const typeImpact = this.getTypeImpact(change.type);
    const directImpact = this.calculateDirectImpact(change);
    const indirectImpact = this.calculateIndirectImpact(
      retentionChange,
      growthChange
    );

    const totalImpact = (directImpact + indirectImpact) * typeImpact;

    return totalImpact;
  }

  /**
   * Calculate direct revenue impact from the change itself
   * @param change - The product change
   * @returns Direct revenue impact
   */
  private calculateDirectImpact(change: ProductChange): number {
    // Check if change is monetization-related
    const revenueKeywords = [
      'monetization',
      'payment',
      'subscription',
      'pricing',
      'upsell',
      'premium',
    ];
    const isRevenueRelated = revenueKeywords.some(
      (keyword) =>
        change.description.toLowerCase().includes(keyword) ||
        change.name.toLowerCase().includes(keyword)
    );

    if (isRevenueRelated) {
      // Estimate 5-15% revenue impact for monetization changes
      const impactPercent = 0.05 + Math.random() * 0.1;
      return (
        this.config.avgRevenuePerUser * this.config.currentUserBase * impactPercent
      );
    }

    return 0;
  }

  /**
   * Calculate indirect revenue impact from retention and growth
   * @param retentionChange - Predicted retention change
   * @param growthChange - Predicted growth change
   * @returns Indirect revenue impact
   */
  private calculateIndirectImpact(
    retentionChange: number,
    growthChange: number
  ): number {
    const retentionImpact =
      retentionChange * this.config.currentUserBase * this.config.avgRevenuePerUser;
    const growthImpact =
      growthChange * this.config.currentUserBase * this.config.avgRevenuePerUser;

    return retentionImpact + growthImpact;
  }

  /**
   * Get impact multiplier by change type
   * @param type - Change type
   * @returns Impact multiplier
   */
  private getTypeImpact(type: ProductChange['type']): number {
    const impacts: Record<ProductChange['type'], number> = {
      feature: 1.2,
      fix: 0.8,
      improvement: 1.0,
      experiment: 0.9,
    };
    return impacts[type] ?? 0.05;
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
    let confidence = 0.3; // Low base confidence (revenue is complex)

    // Higher confidence for revenue-related changes
    const revenueKeywords = [
      'monetization',
      'payment',
      'subscription',
      'pricing',
    ];
    const isRevenueRelated = revenueKeywords.some(
      (keyword) =>
        change.description.toLowerCase().includes(keyword) ||
        change.name.toLowerCase().includes(keyword)
    );

    if (isRevenueRelated) {
      confidence += 0.3;
    }

    // Historical data significantly increases confidence
    if (historicalData) {
      confidence += 0.3;
    }

    return Math.max(0, Math.min(1, confidence));
  }
}
