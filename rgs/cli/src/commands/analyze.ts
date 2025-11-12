/**
 * RGS CLI - Analyze Command
 *
 * Command to analyze web signals and generate insights.
 */

import { WebSignal, Insight } from '@rgs/core';
import { createAnalyzer } from '../placeholders/analyzer';
import { readSignals, writeInsight, fileExists } from '../utils/fileio';
import { createSpinner, printSuccess, printError, printSummary, printInfo } from '../utils/output';
import { validateOptions, analyzeOptionsSchema } from '../utils/validation';

/**
 * Execute the analyze command
 */
export async function analyzeCommand(options: unknown): Promise<void> {
  try {
    // Validate options
    const validatedOptions = validateOptions(analyzeOptionsSchema, options);

    // Check if input file exists
    const inputExists = await fileExists(validatedOptions.input);
    if (!inputExists) {
      throw new Error(`Input file not found: ${validatedOptions.input}`);
    }

    // Load signals
    const loadSpinner = createSpinner('Loading signals...').start();
    let signals: WebSignal[];
    try {
      signals = await readSignals(validatedOptions.input);
      loadSpinner.succeed(`Loaded ${signals.length} signals from ${validatedOptions.input}`);
    } catch (error) {
      loadSpinner.fail('Failed to load signals');
      throw new Error(`Failed to read signals: ${(error as Error).message}`);
    }

    if (signals.length === 0) {
      throw new Error('No signals found in input file');
    }

    // Create analyzer
    const analyzer = createAnalyzer();

    // Run analysis
    const analysisSpinner = createSpinner('Analyzing signals...').start();

    let insight: Insight;
    try {
      if (validatedOptions.skipSentiment === true && validatedOptions.skipThemes === true) {
        printInfo('Both sentiment and theme analysis are skipped. Generating minimal insight...');
        insight = await analyzer.generateInsight(signals);
      } else {
        // Generate full insight
        analysisSpinner.text = 'Generating insight...';
        insight = await analyzer.generateInsight(signals);

        // Print analysis details
        if (validatedOptions.skipSentiment !== true) {
          printInfo(
            `Sentiment: ${insight.sentiment.overall.toFixed(2)} (${(insight.sentiment.distribution.positive * 100).toFixed(1)}% positive, ${(insight.sentiment.distribution.negative * 100).toFixed(1)}% negative)`
          );
        }

        if (validatedOptions.skipThemes !== true) {
          printInfo(`Themes: ${insight.themes.length} themes identified`);
        }
      }

      analysisSpinner.succeed('Analysis completed');
    } catch (error) {
      analysisSpinner.fail('Analysis failed');
      throw error;
    }

    // Write insight to file
    const writeSpinner = createSpinner('Writing insight to file...').start();
    try {
      await writeInsight(validatedOptions.output, insight);
      writeSpinner.succeed(`Wrote insight to ${validatedOptions.output}`);
    } catch (error) {
      writeSpinner.fail('Failed to write insight');
      throw error;
    }

    // Print summary
    printSummary('Analysis Summary', [
      ['Input Signals', signals.length],
      ['Themes Identified', insight.themes.length],
      ['Sentiment Score', insight.sentiment.overall.toFixed(2)],
      ['Pain Points', insight.painPoints.length],
      ['Desires', insight.desires.length],
      ['Confidence', `${(insight.confidence * 100).toFixed(1)}%`],
      ['Output', validatedOptions.output],
    ]);

    printSuccess('Analysis completed successfully!');
  } catch (error) {
    printError(`Analyze command failed: ${(error as Error).message}`);
    throw error;
  }
}
