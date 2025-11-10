/**
 * IAnalysisEngine Interface
 * Defines contract for analyzing simulation results
 */

import { AnalysisResult, FrictionPoint, ValueMoment, ViralTrigger, RetentionAnalysis, TelemetryEvent } from '../models/index';

/**
 * Configuration for analysis
 */
export interface AnalysisConfig {
  /**
   * Simulation ID to analyze
   */
  simulationId: string;

  /**
   * Type of analysis to perform
   */
  analysisType: 'friction' | 'value' | 'retention' | 'viral' | 'comprehensive';

  /**
   * Optional filters
   */
  filters?: {
    /**
     * Filter by persona IDs
     */
    personaIds?: string[];

    /**
     * Filter by session range
     */
    sessionRange?: {
      start: number;
      end: number;
    };

    /**
     * Filter by time range
     */
    timeRange?: {
      start: Date;
      end: Date;
    };
  };

  /**
   * Analysis options
   */
  options?: {
    /**
     * Minimum user threshold for friction points
     * @default 5
     */
    minUserThreshold?: number;

    /**
     * Frustration threshold for friction detection
     * @default 0.6
     */
    frustrationThreshold?: number;

    /**
     * Delight threshold for value moment detection
     * @default 0.7
     */
    delightThreshold?: number;

    /**
     * Include detailed user reasoning
     * @default true
     */
    includeReasonig?: boolean;

    /**
     * Generate executive summary
     * @default true
     */
    generateSummary?: boolean;
  };
}

/**
 * IAnalysisEngine Interface
 * Analyze simulation results to extract actionable insights
 */
export interface IAnalysisEngine {
  /**
   * Analyze friction points in the simulation
   *
   * @param config - Analysis configuration
   * @returns Promise resolving to friction points
   * @throws Error if analysis fails
   *
   * @example
   * ```typescript
   * const frictionPoints = await engine.analyzeFrictionPoints({
   *   simulationId: 'sim-001',
   *   analysisType: 'friction',
   *   options: { frustrationThreshold: 0.7 }
   * });
   * console.log(`Found ${frictionPoints.length} friction points`);
   * ```
   */
  analyzeFrictionPoints(config: AnalysisConfig): Promise<FrictionPoint[]>;

  /**
   * Analyze value moments (moments of delight)
   *
   * @param config - Analysis configuration
   * @returns Promise resolving to value moments
   * @throws Error if analysis fails
   */
  analyzeValueMoments(config: AnalysisConfig): Promise<ValueMoment[]>;

  /**
   * Analyze viral triggers (what makes users share)
   *
   * @param config - Analysis configuration
   * @returns Promise resolving to viral triggers
   * @throws Error if analysis fails
   */
  analyzeViralTriggers(config: AnalysisConfig): Promise<ViralTrigger[]>;

  /**
   * Analyze retention patterns and churn
   *
   * @param config - Analysis configuration
   * @returns Promise resolving to retention analysis
   * @throws Error if analysis fails
   */
  analyzeRetention(config: AnalysisConfig): Promise<RetentionAnalysis>;

  /**
   * Run comprehensive analysis (all analysis types)
   *
   * @param config - Analysis configuration
   * @returns Promise resolving to complete analysis result
   * @throws Error if analysis fails
   */
  runComprehensiveAnalysis(config: AnalysisConfig): Promise<AnalysisResult>;

  /**
   * Compare two simulations
   *
   * @param simulationId1 - First simulation
   * @param simulationId2 - Second simulation
   * @returns Promise resolving to comparison results
   * @throws Error if comparison fails
   */
  compareSimulations(
    simulationId1: string,
    simulationId2: string
  ): Promise<{
    frictionDiff: Array<{ point: string; change: number }>;
    valueDiff: Array<{ moment: string; change: number }>;
    retentionDiff: { control: number; treatment: number; improvement: number };
    recommendation: 'ship' | 'hold' | 'iterate';
    reasoning: string;
  }>;

  /**
   * Generate executive summary from analysis
   *
   * @param analysisResult - Analysis result to summarize
   * @returns Promise resolving to executive summary
   * @throws Error if generation fails
   */
  generateExecutiveSummary(analysisResult: AnalysisResult): Promise<string>;

  /**
   * Predict user behavior based on analysis
   *
   * @param events - Historical events
   * @param futureContext - Future product state or context
   * @returns Promise resolving to predictions
   * @throws Error if prediction fails
   */
  predictBehavior(
    events: TelemetryEvent[],
    futureContext: Record<string, unknown>
  ): Promise<{
    predictedRetention: number;
    predictedChurn: number;
    riskFactors: string[];
    opportunities: string[];
    confidence: number;
  }>;
}
