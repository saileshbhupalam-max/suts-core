/**
 * RGS CLI - Main Entry Point
 *
 * Command line interface for Reddit Gaming Signals.
 */

import { Command } from 'commander';
import { scrapeCommand } from './commands/scrape';
import { analyzeCommand } from './commands/analyze';
import { runCommand } from './commands/run';

/**
 * Main CLI program
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name('rgs')
    .description('RGS - Reddit Gaming Signals CLI')
    .version('0.1.0');

  // Scrape command
  program
    .command('scrape')
    .description('Scrape web signals from various sources')
    .option('-s, --sources <sources...>', 'Sources to scrape (e.g., reddit twitter)', ['reddit'])
    .option('-r, --subreddits <subreddits...>', 'Subreddits to scrape (for reddit source)')
    .option('-l, --limit <number>', 'Maximum number of signals per source', (val) => parseInt(val, 10), 10)
    .requiredOption('-o, --output <path>', 'Output file path for signals')
    .action(async (options) => {
      try {
        await scrapeCommand(options);
        process.exit(0);
      } catch (error) {
        console.error((error as Error).message);
        process.exit(1);
      }
    });

  // Analyze command
  program
    .command('analyze')
    .description('Analyze web signals and generate insights')
    .requiredOption('-i, --input <path>', 'Input file path for signals')
    .requiredOption('-o, --output <path>', 'Output file path for insights')
    .option('--skip-sentiment', 'Skip sentiment analysis', false)
    .option('--skip-themes', 'Skip theme extraction', false)
    .action(async (options) => {
      try {
        await analyzeCommand(options);
        process.exit(0);
      } catch (error) {
        console.error((error as Error).message);
        process.exit(1);
      }
    });

  // Run command (full pipeline)
  program
    .command('run')
    .description('Run the full pipeline: scrape → analyze → report')
    .requiredOption('-c, --config <path>', 'Configuration file path')
    .requiredOption('-o, --output <path>', 'Output directory for all results')
    .action(async (options) => {
      try {
        await runCommand(options);
        process.exit(0);
      } catch (error) {
        console.error((error as Error).message);
        process.exit(1);
      }
    });

  return program;
}

/**
 * Run the CLI
 */
export async function run(argv: string[] = process.argv): Promise<void> {
  const program = createProgram();
  await program.parseAsync(argv);
}
