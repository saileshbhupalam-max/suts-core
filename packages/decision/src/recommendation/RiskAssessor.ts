/**
 * Assesses risks associated with product changes
 */

import { ProductChange, ImpactPrediction } from '../models';

/**
 * Risk assessment result
 */
export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  technicalRisks: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    probability: number;
    description: string;
    mitigation: string;
  }>;
  businessRisks: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    probability: number;
    description: string;
    mitigation: string;
  }>;
  userRisks: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    probability: number;
    description: string;
    mitigation: string;
  }>;
  recommendations: string[];
}

/**
 * Assesses downside risks
 */
export class RiskAssessor {
  /**
   * Assess risks for a product change
   * @param change - The product change
   * @param prediction - Impact prediction
   * @returns Risk assessment
   */
  public assess(
    change: ProductChange,
    prediction: ImpactPrediction
  ): RiskAssessment {
    const technicalRisks = this.assessTechnicalRisks(change, prediction);
    const businessRisks = this.assessBusinessRisks(change, prediction);
    const userRisks = this.assessUserRisks(change, prediction);

    const riskScore = this.calculateRiskScore(
      technicalRisks,
      businessRisks,
      userRisks
    );
    const overallRisk = this.categorizeRisk(riskScore);

    return {
      overallRisk,
      riskScore,
      technicalRisks,
      businessRisks,
      userRisks,
      recommendations: this.generateRecommendations(
        overallRisk,
        technicalRisks,
        businessRisks,
        userRisks
      ),
    };
  }

  /**
   * Assess technical risks
   * @param change - The product change
   * @param prediction - Impact prediction
   * @returns Technical risks
   */
  private assessTechnicalRisks(
    change: ProductChange,
    prediction: ImpactPrediction
  ): RiskAssessment['technicalRisks'] {
    const risks: RiskAssessment['technicalRisks'] = [];

    // High complexity risk
    if (change.estimatedEffort > 20) {
      risks.push({
        type: 'complexity',
        severity: 'high',
        probability: 0.6,
        description: 'High complexity may lead to implementation issues',
        mitigation: 'Break down into smaller increments, increase testing',
      });
    }

    // Deployment risk
    if (change.expectedReach > 10000) {
      risks.push({
        type: 'deployment',
        severity: 'medium',
        probability: 0.4,
        description: 'Large user base affected during rollout',
        mitigation: 'Use phased rollout, implement feature flags',
      });
    }

    // Performance risk
    if (prediction.timeToImpact < 1) {
      risks.push({
        type: 'performance',
        severity: 'medium',
        probability: 0.3,
        description: 'Immediate impact may cause performance issues',
        mitigation: 'Load testing, monitoring, rollback plan',
      });
    }

    return risks;
  }

  /**
   * Assess business risks
   * @param change - The product change
   * @param prediction - Impact prediction
   * @returns Business risks
   */
  private assessBusinessRisks(
    change: ProductChange,
    prediction: ImpactPrediction
  ): RiskAssessment['businessRisks'] {
    const risks: RiskAssessment['businessRisks'] = [];

    // Revenue risk
    if (prediction.predictedRevenueChange < 0) {
      risks.push({
        type: 'revenue',
        severity: 'high',
        probability: prediction.confidenceLevel,
        description: `Potential revenue decrease of ${Math.abs(prediction.predictedRevenueChange).toFixed(2)}`,
        mitigation: 'Monitor closely, prepare alternative strategies',
      });
    }

    // Market risk
    if (change.type === 'experiment') {
      risks.push({
        type: 'market',
        severity: 'low',
        probability: 0.3,
        description: 'Experimental feature may not resonate with users',
        mitigation: 'Clear success metrics, rapid iteration',
      });
    }

    return risks;
  }

  /**
   * Assess user experience risks
   * @param change - The product change
   * @param prediction - Impact prediction
   * @returns User risks
   */
  private assessUserRisks(
    change: ProductChange,
    prediction: ImpactPrediction
  ): RiskAssessment['userRisks'] {
    const risks: RiskAssessment['userRisks'] = [];

    // Churn risk
    if (prediction.predictedChurnChange > 0.05) {
      risks.push({
        type: 'churn',
        severity: 'critical',
        probability: prediction.confidenceLevel,
        description: 'Significant churn increase predicted',
        mitigation: 'Careful A/B testing, user feedback, easy rollback',
      });
    }

    // Adoption risk
    if (change.type === 'feature') {
      risks.push({
        type: 'adoption',
        severity: 'medium',
        probability: 0.5,
        description: 'Users may not adopt new feature',
        mitigation: 'Clear value proposition, onboarding, support',
      });
    }

    // Confusion risk
    if (prediction.affectedUserCount > 50000) {
      risks.push({
        type: 'confusion',
        severity: 'medium',
        probability: 0.4,
        description: 'Large-scale changes may confuse existing users',
        mitigation: 'Communication plan, documentation, support resources',
      });
    }

    return risks;
  }

  /**
   * Calculate overall risk score
   * @param technicalRisks - Technical risks
   * @param businessRisks - Business risks
   * @param userRisks - User risks
   * @returns Risk score (0-1)
   */
  private calculateRiskScore(
    technicalRisks: RiskAssessment['technicalRisks'],
    businessRisks: RiskAssessment['businessRisks'],
    userRisks: RiskAssessment['userRisks']
  ): number {
    const allRisks = [...technicalRisks, ...businessRisks, ...userRisks];

    if (allRisks.length === 0) {
      return 0;
    }

    const severityWeights: Record<string, number> = {
      critical: 1.0,
      high: 0.75,
      medium: 0.5,
      low: 0.25,
    };

    const totalScore = allRisks.reduce((sum, risk) => {
      const severityWeight = severityWeights[risk.severity] ?? 0.5;
      return sum + severityWeight * risk.probability;
    }, 0);

    return Math.min(1, totalScore / allRisks.length);
  }

  /**
   * Categorize risk score
   * @param score - Risk score
   * @returns Risk category
   */
  private categorizeRisk(
    score: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) {
      return 'critical';
    }
    if (score >= 0.6) {
      return 'high';
    }
    if (score >= 0.3) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate risk mitigation recommendations
   * @param overallRisk - Overall risk level
   * @param technicalRisks - Technical risks
   * @param businessRisks - Business risks
   * @param userRisks - User risks
   * @returns Recommendations
   */
  private generateRecommendations(
    overallRisk: string,
    technicalRisks: RiskAssessment['technicalRisks'],
    businessRisks: RiskAssessment['businessRisks'],
    userRisks: RiskAssessment['userRisks']
  ): string[] {
    const recommendations: string[] = [];

    if (overallRisk === 'critical' || overallRisk === 'high') {
      recommendations.push('Consider smaller scope or phased rollout');
      recommendations.push('Establish clear rollback criteria and plan');
      recommendations.push('Increase monitoring and alerting');
    }

    if (technicalRisks.length > 0) {
      recommendations.push('Conduct thorough technical review');
      recommendations.push('Increase test coverage');
    }

    if (businessRisks.length > 0) {
      recommendations.push('Define clear success metrics');
      recommendations.push('Prepare contingency plans');
    }

    if (userRisks.length > 0) {
      recommendations.push('Gather user feedback early');
      recommendations.push('Plan communication strategy');
    }

    return recommendations;
  }
}
