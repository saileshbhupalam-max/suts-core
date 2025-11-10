/**
 * Main analysis engine - orchestrates all analysis components
 */

import { TelemetryEvent } from '@suts/telemetry';
import {
  FrictionPoint,
  ValueMoment,
  ChurnDriver,
  FunnelAnalysis,
  FunnelStep,
} from './models';
import { AnalysisConfig, DEFAULT_ANALYSIS_CONFIG } from './models/config';
import { FrictionDetector, ValueDetector, ChurnPredictor } from './patterns';
import { ImpactEstimator, ConfidenceScorer } from './insights';

/**
 * Main analysis engine for detecting friction, value, and churn patterns
 */
export class AnalysisEngine {
  private readonly config: AnalysisConfig;
  private readonly frictionDetector: FrictionDetector;
  private readonly valueDetector: ValueDetector;
  private readonly churnPredictor: ChurnPredictor;
  private readonly impactEstimator: ImpactEstimator;
  private readonly confidenceScorer: ConfidenceScorer;

  /**
   * Creates a new analysis engine
   * @param config - Analysis configuration
   */
  constructor(config: Partial<AnalysisConfig> = {}) {
    this.config = { ...DEFAULT_ANALYSIS_CONFIG, ...config };

    // Initialize all components
    this.frictionDetector = new FrictionDetector(this.config);
    this.valueDetector = new ValueDetector(this.config);
    this.churnPredictor = new ChurnPredictor(this.config);
    this.impactEstimator = new ImpactEstimator();
    this.confidenceScorer = new ConfidenceScorer(this.config);
  }

  /**
   * Analyzes friction points from events
   * @param events - Telemetry events to analyze
   * @returns Array of friction points with priority scores
   */
  analyzeFriction(events: TelemetryEvent[]): FrictionPoint[] {
    if (events.length === 0) {
      return [];
    }

    // Detect friction points
    const frictionPoints = this.frictionDetector.detect(events);

    // Enhance with impact and confidence scores
    const totalUsers = new Set(events.map((e) => e.personaId)).size;

    return frictionPoints.map((friction) => {
      const impact = this.impactEstimator.estimateFrictionImpact(friction, totalUsers);
      const effort = this.impactEstimator.estimateFrictionEffort(friction);
      const confidence = this.confidenceScorer.scoreFriction(friction);

      // Recalculate priority with enhanced metrics
      const priority = this.calculateEnhancedPriority(impact, effort, confidence);

      return {
        ...friction,
        priority,
        confidence,
      };
    });
  }

  /**
   * Analyzes value moments from events
   * @param events - Telemetry events to analyze
   * @returns Array of value moments with priority scores
   */
  analyzeValue(events: TelemetryEvent[]): ValueMoment[] {
    if (events.length === 0) {
      return [];
    }

    // Detect value moments
    const valueMoments = this.valueDetector.detect(events);

    // Enhance with impact and confidence scores
    const totalUsers = new Set(events.map((e) => e.personaId)).size;

    return valueMoments.map((value) => {
      const impact = this.impactEstimator.estimateValueImpact(value, totalUsers);
      const effort = this.impactEstimator.estimateValueEffort(value);
      const confidence = this.confidenceScorer.scoreValue(value);

      // Recalculate priority with enhanced metrics
      const priority = this.calculateEnhancedPriority(impact, effort, confidence);

      return {
        ...value,
        priority,
        confidence,
      };
    });
  }

  /**
   * Analyzes churn drivers from events
   * @param events - Telemetry events to analyze
   * @returns Array of churn drivers with priority scores
   */
  analyzeChurn(events: TelemetryEvent[]): ChurnDriver[] {
    if (events.length === 0) {
      return [];
    }

    // Predict churn drivers
    const churnDrivers = this.churnPredictor.predict(events);

    // Enhance with impact and confidence scores
    const totalUsers = new Set(events.map((e) => e.personaId)).size;

    return churnDrivers.map((churn) => {
      const impact = this.impactEstimator.estimateChurnImpact(churn, totalUsers);
      const effort = this.impactEstimator.estimateChurnEffort(churn);
      const confidence = this.confidenceScorer.scoreChurn(churn);

      // Recalculate priority with enhanced metrics
      const priority = this.calculateEnhancedPriority(impact, effort, confidence);

      return {
        ...churn,
        priority,
        confidence,
      };
    });
  }

  /**
   * Analyzes funnel conversion from events
   * @param events - Telemetry events to analyze
   * @param steps - Funnel steps (action names)
   * @returns Funnel analysis with conversion rates
   */
  analyzeFunnel(events: TelemetryEvent[], steps: string[]): FunnelAnalysis {
    if (events.length === 0 || steps.length === 0) {
      return {
        steps: [],
        overallConversion: 0,
        totalUsers: 0,
        completedUsers: 0,
      };
    }

    const totalUsers = new Set(events.map((e) => e.personaId)).size;
    const funnelSteps: FunnelStep[] = [];

    let previousStepUsers = new Set(events.map((e) => e.personaId));

    for (let i = 0; i < steps.length; i++) {
      const stepAction = steps[i];
      if (stepAction === undefined) {
        continue;
      }

      // Find users who reached this step
      const stepEvents = events.filter((e) => e.action === stepAction);
      const stepUsers = new Set(stepEvents.map((e) => e.personaId));

      // Filter to only users who completed previous step
      const eligibleUsers = new Set(
        Array.from(stepUsers).filter((userId) => previousStepUsers.has(userId))
      );

      const entered = previousStepUsers.size;
      const completed = eligibleUsers.size;
      const abandoned = entered - completed;
      const conversionRate = entered > 0 ? completed / entered : 0;

      // Calculate average time spent on this step
      const avgTimeSpent = this.calculateAverageStepTime(
        Array.from(eligibleUsers),
        stepAction,
        i < steps.length - 1 ? steps[i + 1] : undefined,
        events
      );

      const dropoffRate = entered > 0 ? abandoned / entered : 0;

      funnelSteps.push({
        step: stepAction,
        entered,
        completed,
        abandoned,
        conversionRate,
        avgTimeSpent,
        dropoffRate,
      });

      // Update for next iteration
      previousStepUsers = eligibleUsers;
    }

    // Calculate overall conversion
    const completedUsers = funnelSteps.length > 0
      ? (funnelSteps[funnelSteps.length - 1]?.completed ?? 0)
      : 0;
    const overallConversion = totalUsers > 0 ? completedUsers / totalUsers : 0;

    // Find biggest dropoff
    const biggestDropoff = this.findBiggestDropoff(funnelSteps);

    // Generate recommendations
    const recommendations = this.generateFunnelRecommendations(funnelSteps);

    return {
      steps: funnelSteps,
      overallConversion,
      totalUsers,
      completedUsers,
      biggestDropoff,
      recommendations,
    };
  }

  /**
   * Calculates average time spent on a step
   */
  private calculateAverageStepTime(
    userIds: string[],
    currentStep: string,
    nextStep: string | undefined,
    events: TelemetryEvent[]
  ): number {
    const times: number[] = [];

    for (const userId of userIds) {
      const userEvents = events
        .filter((e) => e.personaId === userId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const currentStepEvent = userEvents.find((e) => e.action === currentStep);

      if (currentStepEvent !== undefined) {
        if (nextStep !== undefined) {
          const nextStepEvent = userEvents.find(
            (e) =>
              e.action === nextStep &&
              e.timestamp.getTime() > currentStepEvent.timestamp.getTime()
          );

          if (nextStepEvent !== undefined) {
            const timeDiff =
              nextStepEvent.timestamp.getTime() - currentStepEvent.timestamp.getTime();
            times.push(timeDiff);
          }
        } else {
          // Last step - calculate time to end of session
          const lastEvent = userEvents[userEvents.length - 1];
          if (lastEvent !== undefined) {
            const timeDiff =
              lastEvent.timestamp.getTime() - currentStepEvent.timestamp.getTime();
            times.push(timeDiff);
          }
        }
      }
    }

    if (times.length === 0) {
      return 0;
    }

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  /**
   * Finds the biggest dropoff in the funnel
   */
  private findBiggestDropoff(
    steps: FunnelStep[]
  ): { step: string; rate: number } | undefined {
    if (steps.length === 0) {
      return undefined;
    }

    let maxDropoff = steps[0];
    if (maxDropoff === undefined) {
      return undefined;
    }

    for (const step of steps) {
      if (step.dropoffRate > maxDropoff.dropoffRate) {
        maxDropoff = step;
      }
    }

    return {
      step: maxDropoff.step,
      rate: maxDropoff.dropoffRate,
    };
  }

  /**
   * Generates recommendations for funnel optimization
   */
  private generateFunnelRecommendations(steps: FunnelStep[]): string[] {
    const recommendations: string[] = [];

    for (const step of steps) {
      if (step.dropoffRate > 0.5) {
        recommendations.push(
          `High dropoff at ${step.step} (${(step.dropoffRate * 100).toFixed(0)}%): Investigate barriers and simplify this step`
        );
      }

      if (step.avgTimeSpent > 300000) {
        // > 5 minutes
        recommendations.push(
          `Users spending long time on ${step.step}: Consider breaking into smaller steps or adding progress indicators`
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Funnel is performing well. Monitor for changes over time.');
    }

    return recommendations;
  }

  /**
   * Calculates enhanced priority score
   */
  private calculateEnhancedPriority(impact: number, effort: number, confidence: number): number {
    // Priority = (Impact * Confidence) / Effort
    const safeEffort = Math.max(effort, 0.1);
    const priority = (impact * confidence) / safeEffort;

    return Math.min(Math.max(priority, 0), 1);
  }

  /**
   * Gets the configuration
   * @returns Current configuration
   */
  getConfig(): AnalysisConfig {
    return { ...this.config };
  }
}
