/**
 * Main Decision System - Prioritization and recommendation engine
 */

import {
  AnalysisResult,
  PrioritizedInsight,
  Experiment,
  ImpactPrediction,
  GoNoGoResult,
  ProductChange,
  SimulationMetrics,
  DecisionConfig,
} from './models';

import { ImpactScorer } from './prioritization/ImpactScorer';
import { EffortEstimator } from './prioritization/EffortEstimator';
import { ICEScorer } from './prioritization/ICEScorer';
import { RICEScorer } from './prioritization/RICEScorer';

import { RetentionPredictor } from './prediction/RetentionPredictor';
import { ChurnPredictor } from './prediction/ChurnPredictor';
import { GrowthPredictor } from './prediction/GrowthPredictor';
import {
  RevenuePredictor,
  RevenuePredictorConfig,
} from './prediction/RevenuePredictor';

import { ExperimentDesigner } from './recommendation/ExperimentDesigner';
import { RiskAssessor } from './recommendation/RiskAssessor';

import { GoNoGoEngine } from './logic/GoNoGoEngine';

/**
 * Main decision system for prioritization and recommendations
 */
export class DecisionSystem {
  private readonly config: DecisionConfig;

  // Prioritization components
  private readonly impactScorer: ImpactScorer;
  private readonly effortEstimator: EffortEstimator;
  private readonly iceScorer: ICEScorer;
  private readonly riceScorer: RICEScorer;

  // Prediction components
  private readonly retentionPredictor: RetentionPredictor;
  private readonly churnPredictor: ChurnPredictor;
  private readonly growthPredictor: GrowthPredictor;
  private readonly revenuePredictor: RevenuePredictor;

  // Recommendation components
  private readonly experimentDesigner: ExperimentDesigner;
  private readonly riskAssessor: RiskAssessor;

  // Decision logic
  private readonly goNoGoEngine: GoNoGoEngine;

  /**
   * Create decision system
   * @param config - Decision configuration
   */
  constructor(config: DecisionConfig = {}) {
    this.config = config;

    // Initialize prioritization components
    this.impactScorer = new ImpactScorer();
    this.effortEstimator = new EffortEstimator();
    this.iceScorer = new ICEScorer(this.impactScorer, this.effortEstimator);
    this.riceScorer = new RICEScorer(this.impactScorer, this.effortEstimator);

    // Initialize prediction components
    this.retentionPredictor = new RetentionPredictor();
    this.churnPredictor = new ChurnPredictor();
    this.growthPredictor = new GrowthPredictor();

    // Initialize revenue predictor with defaults
    const revenueConfig: RevenuePredictorConfig = {
      avgRevenuePerUser: 50,
      currentUserBase: 10000,
    };
    this.revenuePredictor = new RevenuePredictor(revenueConfig);

    // Initialize recommendation components
    this.experimentDesigner = new ExperimentDesigner();
    this.riskAssessor = new RiskAssessor();

    // Initialize decision logic
    this.goNoGoEngine = new GoNoGoEngine(config);
  }

  /**
   * Prioritize insights
   * @param insights - Analysis results to prioritize
   * @returns Prioritized and ranked insights
   */
  public prioritize(insights: AnalysisResult[]): PrioritizedInsight[] {
    const prioritized: PrioritizedInsight[] = insights.map((insight) => {
      const impactScore = this.impactScorer.score(insight);
      const effortScore = this.effortEstimator.estimate(insight);
      const iceScore = this.iceScorer.score(insight);
      const riceScore = this.riceScorer.score(insight);
      const reach = insight.affectedUsers;

      // Calculate overall priority score
      const weights = this.config.prioritization ?? {
        impactWeight: 0.4,
        confidenceWeight: 0.3,
        effortWeight: 0.3,
      };

      const priorityScore =
        impactScore * (weights.impactWeight ?? 0.4) +
        insight.confidence * (weights.confidenceWeight ?? 0.3) +
        (1 / (effortScore + 1)) * (weights.effortWeight ?? 0.3);

      return {
        insight,
        priorityScore,
        impactScore,
        effortScore,
        iceScore,
        riceScore,
        reach,
        ranking: 0, // Will be set after sorting
        reasoning: this.generatePriorityReasoning(
          insight,
          priorityScore,
          impactScore,
          effortScore
        ),
      };
    });

    // Sort by priority score and assign rankings
    prioritized.sort((a, b) => b.priorityScore - a.priorityScore);
    prioritized.forEach((item, index) => {
      item.ranking = index + 1;
    });

    return prioritized;
  }

  /**
   * Recommend experiments for insights
   * @param insights - Analysis results
   * @returns Recommended A/B test experiments
   */
  public recommendExperiments(insights: AnalysisResult[]): Experiment[] {
    // Prioritize first to focus on high-value insights
    const prioritized = this.prioritize(insights);

    // Design experiments for top insights
    const topInsights = prioritized
      .filter((p) => p.priorityScore > 0.5)
      .slice(0, 5);

    return topInsights.map((p) => this.experimentDesigner.design(p.insight));
  }

  /**
   * Predict impact of a product change
   * @param change - Proposed product change
   * @param baselineMetrics - Current baseline metrics
   * @returns Impact prediction
   */
  public predictImpact(
    change: ProductChange,
    baselineMetrics?: {
      retention: number;
      churn: number;
      growth: number;
    }
  ): ImpactPrediction {
    const baseline = baselineMetrics ?? {
      retention: 0.7,
      churn: 0.3,
      growth: 0.05,
    };

    // Predict changes
    const retentionChange = this.retentionPredictor.predict(
      change,
      baseline.retention
    );
    const churnChange = this.churnPredictor.predict(change, baseline.churn);
    const growthChange = this.growthPredictor.predict(
      change,
      baseline.growth
    );
    const revenueChange = this.revenuePredictor.predict(
      change,
      retentionChange,
      growthChange
    );

    // Calculate confidence
    const retentionConfidence =
      this.retentionPredictor.getConfidence(change);
    const churnConfidence = this.churnPredictor.getConfidence(change);
    const growthConfidence = this.growthPredictor.getConfidence(change);
    const revenueConfidence = this.revenuePredictor.getConfidence(change);

    const avgConfidence =
      (retentionConfidence +
        churnConfidence +
        growthConfidence +
        revenueConfidence) /
      4;

    // Create prediction
    const prediction: ImpactPrediction = {
      changeId: change.id,
      predictedRetentionChange: retentionChange,
      predictedChurnChange: churnChange,
      predictedGrowthChange: growthChange,
      predictedRevenueChange: revenueChange,
      confidenceLevel: avgConfidence,
      affectedUserCount: change.expectedReach,
      timeToImpact: this.estimateTimeToImpact(change),
      risks: [],
      opportunities: [],
    };

    // Assess risks
    const riskAssessment = this.riskAssessor.assess(change, prediction);
    prediction.risks = [
      ...riskAssessment.technicalRisks,
      ...riskAssessment.businessRisks,
      ...riskAssessment.userRisks,
    ];

    // Identify opportunities
    prediction.opportunities = this.identifyOpportunities(prediction);

    return prediction;
  }

  /**
   * Make GO/NO-GO decision
   * @param metrics - Simulation metrics
   * @returns GO/NO-GO decision result
   */
  public goNoGoDecision(metrics: SimulationMetrics): GoNoGoResult {
    return this.goNoGoEngine.decide(metrics);
  }

  /**
   * Generate priority reasoning
   * @param insight - The insight
   * @param priorityScore - Priority score
   * @param impactScore - Impact score
   * @param effortScore - Effort score
   * @returns Reasoning text
   */
  private generatePriorityReasoning(
    insight: AnalysisResult,
    priorityScore: number,
    impactScore: number,
    effortScore: number
  ): string {
    const parts: string[] = [];

    parts.push(
      `Priority: ${(priorityScore * 100).toFixed(1)}%`
    );
    parts.push(
      `Impact: ${(impactScore * 100).toFixed(1)}%`
    );
    parts.push(`Effort: ${effortScore} points`);

    if (insight.severity === 'critical') {
      parts.push('Critical severity');
    }

    if (impactScore > 0.8) {
      parts.push('High impact opportunity');
    }

    if (effortScore < 3) {
      parts.push('Quick win');
    }

    return parts.join(', ');
  }

  /**
   * Estimate time to impact
   * @param change - Product change
   * @returns Days until impact
   */
  private estimateTimeToImpact(change: ProductChange): number {
    // Based on type and effort
    const baseTime: Record<ProductChange['type'], number> = {
      feature: 30,
      fix: 7,
      improvement: 14,
      experiment: 21,
    };

    const base = baseTime[change.type] ?? 14;
    const effortMultiplier = 1 + change.estimatedEffort / 10;

    return Math.round(base * effortMultiplier);
  }

  /**
   * Identify opportunities from prediction
   * @param prediction - Impact prediction
   * @returns Array of opportunities
   */
  private identifyOpportunities(
    prediction: ImpactPrediction
  ): ImpactPrediction['opportunities'] {
    const opportunities: ImpactPrediction['opportunities'] = [];

    if (prediction.predictedRetentionChange > 0.05) {
      opportunities.push({
        type: 'retention',
        magnitude: prediction.predictedRetentionChange,
        probability: prediction.confidenceLevel,
        description: 'Significant retention improvement opportunity',
      });
    }

    if (prediction.predictedChurnChange < -0.05) {
      opportunities.push({
        type: 'churn',
        magnitude: Math.abs(prediction.predictedChurnChange),
        probability: prediction.confidenceLevel,
        description: 'Notable churn reduction potential',
      });
    }

    if (prediction.predictedGrowthChange > 0.05) {
      opportunities.push({
        type: 'growth',
        magnitude: prediction.predictedGrowthChange,
        probability: prediction.confidenceLevel,
        description: 'Strong growth acceleration possibility',
      });
    }

    if (prediction.predictedRevenueChange > 1000) {
      opportunities.push({
        type: 'revenue',
        magnitude: Math.min(1, prediction.predictedRevenueChange / 10000),
        probability: prediction.confidenceLevel,
        description: 'Substantial revenue increase potential',
      });
    }

    return opportunities;
  }
}
