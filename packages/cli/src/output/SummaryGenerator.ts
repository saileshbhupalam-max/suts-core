/**
 * Summary generator for simulation results
 */

import chalk from 'chalk';
import {
  SimulationResults,
  SummaryData,
  GoNoGoDecision,
} from './ResultsWriter';

/**
 * Generate executive summaries
 */
export class SummaryGenerator {
  /**
   * Generate a text summary for console output
   * @param results - Simulation results
   * @returns Formatted summary string
   */
  public static generateTextSummary(results: SimulationResults): string {
    const lines: string[] = [];

    lines.push(chalk.bold.cyan('\n=== SUTS Simulation Summary ===\n'));

    // Basic info
    lines.push(chalk.bold('Simulation Details:'));
    lines.push(`  Product: ${results.summary.productPlugin}`);
    lines.push(`  Personas: ${results.summary.totalPersonas}`);
    lines.push(`  Days Simulated: ${results.summary.simulationDays}`);
    lines.push(
      `  Total Events: ${results.summary.totalEvents.toLocaleString()}`
    );
    lines.push(
      `  Duration: ${(results.summary.duration / 1000).toFixed(2)}s\n`
    );

    // Key metrics
    lines.push(chalk.bold('Key Metrics:'));
    lines.push(
      `  Positioning Score: ${(results.goNoGo.metrics.positioning * 100).toFixed(1)}%`
    );
    lines.push(
      `  Retention Score: ${(results.goNoGo.metrics.retention * 100).toFixed(1)}%`
    );
    lines.push(
      `  Viral Coefficient: ${(results.goNoGo.metrics.viral * 100).toFixed(1)}%\n`
    );

    // Friction and value
    lines.push(chalk.bold('Analysis:'));
    lines.push(`  Friction Points: ${results.frictionPoints.length}`);
    lines.push(`  Value Moments: ${results.valueMoments.length}\n`);

    // Decision
    lines.push(chalk.bold('Go/No-Go Decision:'));
    const decision =
      results.goNoGo.decision === 'go'
        ? chalk.green.bold('GO ✓')
        : chalk.red.bold('NO-GO ✗');
    lines.push(`  Decision: ${decision}`);
    lines.push(
      `  Confidence: ${(results.goNoGo.confidence * 100).toFixed(1)}%`
    );
    lines.push(`  Reasoning: ${results.goNoGo.reasoning}\n`);

    return lines.join('\n');
  }

  /**
   * Generate a summary data object
   * @param startTime - Simulation start time
   * @param endTime - Simulation end time
   * @param totalPersonas - Number of personas
   * @param totalEvents - Number of events
   * @param simulationDays - Number of days simulated
   * @param productPlugin - Product plugin name
   * @returns Summary data object
   */
  public static generateSummaryData(
    startTime: Date,
    endTime: Date,
    totalPersonas: number,
    totalEvents: number,
    simulationDays: number,
    productPlugin: string
  ): SummaryData {
    return {
      totalPersonas,
      totalEvents,
      simulationDays,
      productPlugin,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: endTime.getTime() - startTime.getTime(),
    };
  }

  /**
   * Generate a mock Go/No-Go decision (for testing)
   * @param positioningScore - Positioning score
   * @param retentionScore - Retention score
   * @param viralScore - Viral coefficient
   * @returns Go/No-Go decision
   */
  public static generateGoNoGoDecision(
    positioningScore: number,
    retentionScore: number,
    viralScore: number
  ): GoNoGoDecision {
    const decision =
      positioningScore >= 0.6 && retentionScore >= 0.8 && viralScore >= 0.25
        ? 'go'
        : 'no-go';

    const confidence = (positioningScore + retentionScore + viralScore) / 3;

    return {
      decision,
      confidence,
      reasoning:
        decision === 'go'
          ? 'All key metrics meet or exceed thresholds. Product shows strong market fit.'
          : 'One or more key metrics below threshold. Product needs improvement before launch.',
      metrics: {
        positioning: positioningScore,
        retention: retentionScore,
        viral: viralScore,
      },
    };
  }
}
