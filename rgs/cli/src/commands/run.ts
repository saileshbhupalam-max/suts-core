/**
 * RGS CLI - Run Command
 *
 * Command to run the full pipeline: scrape → analyze → report.
 */

import { join } from 'path';
import { promises as fs } from 'fs';
import { z } from 'zod';
import { scrapeCommand } from './scrape';
import { analyzeCommand } from './analyze';
import { fileExists, ensureDir } from '../utils/fileio';
import { createSpinner, printSuccess, printError, printHeader, printInfo } from '../utils/output';
import { validateOptions, runOptionsSchema } from '../utils/validation';

/**
 * Configuration file schema
 */
const configSchema = z.object({
  sources: z.array(z.string()).min(1, 'At least one source must be specified'),
  subreddits: z.array(z.string()).optional(),
  limit: z.number().int().positive().optional().default(10),
  analysis: z
    .object({
      skipSentiment: z.boolean().optional(),
      skipThemes: z.boolean().optional(),
    })
    .optional(),
});

type Config = z.infer<typeof configSchema>;

/**
 * Load configuration from file
 */
async function loadConfig(configPath: string): Promise<Config> {
  const configExists = await fileExists(configPath);
  if (!configExists) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const content = await fs.readFile(configPath, 'utf-8');
  const configData = JSON.parse(content) as unknown;

  return configSchema.parse(configData);
}

/**
 * Execute the run command (full pipeline)
 */
export async function runCommand(options: unknown): Promise<void> {
  try {
    // Validate options
    const validatedOptions = validateOptions(runOptionsSchema, options);

    printHeader('RGS Full Pipeline');

    // Load configuration
    const configSpinner = createSpinner('Loading configuration...').start();
    let config: Config;
    try {
      config = await loadConfig(validatedOptions.config);
      configSpinner.succeed(`Loaded configuration from ${validatedOptions.config}`);
    } catch (error) {
      configSpinner.fail('Failed to load configuration');
      throw error;
    }

    // Ensure output directory exists
    await ensureDir(validatedOptions.output);

    const signalsPath = join(validatedOptions.output, 'signals.json');
    const insightPath = join(validatedOptions.output, 'insight.json');

    // Step 1: Scrape
    printHeader('Step 1: Scraping');
    printInfo(`Sources: ${config.sources.join(', ')}`);
    printInfo(`Limit: ${config.limit} signals per source`);

    try {
      await scrapeCommand({
        sources: config.sources,
        subreddits: config.subreddits,
        limit: config.limit,
        output: signalsPath,
      });
    } catch (error) {
      throw new Error(`Scraping failed: ${(error as Error).message}`);
    }

    // Step 2: Analyze
    printHeader('Step 2: Analysis');
    printInfo(`Input: ${signalsPath}`);
    printInfo(`Output: ${insightPath}`);

    try {
      await analyzeCommand({
        input: signalsPath,
        output: insightPath,
        skipSentiment: config.analysis?.skipSentiment,
        skipThemes: config.analysis?.skipThemes,
      });
    } catch (error) {
      throw new Error(`Analysis failed: ${(error as Error).message}`);
    }

    // Step 3: Report
    printHeader('Step 3: Report');
    printInfo(`Signals: ${signalsPath}`);
    printInfo(`Insight: ${insightPath}`);

    // Generate a simple report
    const reportPath = join(validatedOptions.output, 'report.txt');
    const reportSpinner = createSpinner('Generating report...').start();

    try {
      const report = `
RGS Pipeline Report
===================

Configuration:
  - Sources: ${config.sources.join(', ')}
  - Limit: ${config.limit} signals per source
  ${config.subreddits !== undefined ? `- Subreddits: ${config.subreddits.join(', ')}` : ''}

Output Files:
  - Signals: ${signalsPath}
  - Insight: ${insightPath}
  - Report: ${reportPath}

Status: Completed Successfully
Generated: ${new Date().toISOString()}
`;

      await fs.writeFile(reportPath, report.trim(), 'utf-8');
      reportSpinner.succeed(`Report written to ${reportPath}`);
    } catch (error) {
      reportSpinner.fail('Failed to generate report');
      throw error;
    }

    printHeader('Pipeline Complete');
    printSuccess('Full pipeline executed successfully!');
    printInfo(`All outputs saved to: ${validatedOptions.output}`);
  } catch (error) {
    printError(`Run command failed: ${(error as Error).message}`);
    throw error;
  }
}
