/**
 * RGS CLI - Scrape Command
 *
 * Command to scrape web signals from various sources.
 */

import { WebSignal } from '@rgs/core';
import { createScraper } from '../placeholders/scraper';
import { writeSignals } from '../utils/fileio';
import { createSpinner, printSuccess, printError, printSummary } from '../utils/output';
import { validateOptions, scrapeOptionsSchema } from '../utils/validation';

/**
 * Execute the scrape command
 */
export async function scrapeCommand(options: unknown): Promise<void> {
  try {
    // Validate options
    const validatedOptions = validateOptions(scrapeOptionsSchema, options);

    // Start scraping
    const spinner = createSpinner('Initializing scrapers...').start();

    const allSignals: WebSignal[] = [];
    const errors: Error[] = [];

    for (const source of validatedOptions.sources) {
      spinner.text = `Scraping ${source}...`;

      try {
        const scraper = createScraper(source);

        // Test connection first
        const isConnected = await scraper.testConnection();
        if (!isConnected) {
          throw new Error(`Failed to connect to ${source}`);
        }

        // Scrape signals
        const params: Record<string, string> = {};
        if (validatedOptions.subreddits !== undefined) {
          params['subreddits'] = validatedOptions.subreddits.join(',');
        }

        const signals = await scraper.scrape({
          type: source as 'reddit' | 'twitter',
          params,
          maxItems: validatedOptions.limit ?? 10,
        });

        allSignals.push(...signals);
        spinner.succeed(`Scraped ${signals.length} signals from ${source}`);
      } catch (error) {
        spinner.fail(`Failed to scrape ${source}`);
        errors.push(error as Error);
        printError(`Error scraping ${source}: ${(error as Error).message}`);
      }

      // Re-start spinner for next source if there are more
      if (validatedOptions.sources.indexOf(source) < validatedOptions.sources.length - 1) {
        spinner.start();
      }
    }

    // Write results to file
    if (allSignals.length > 0) {
      const writeSpinner = createSpinner('Writing signals to file...').start();
      try {
        await writeSignals(validatedOptions.output, allSignals);
        writeSpinner.succeed(`Wrote ${allSignals.length} signals to ${validatedOptions.output}`);
      } catch (error) {
        writeSpinner.fail('Failed to write signals to file');
        throw error;
      }
    }

    // Print summary
    printSummary('Scrape Summary', [
      ['Sources', validatedOptions.sources.join(', ')],
      ['Total Signals', allSignals.length],
      ['Errors', errors.length],
      ['Output', validatedOptions.output],
    ]);

    if (allSignals.length === 0) {
      throw new Error('No signals were scraped');
    }

    printSuccess('Scraping completed successfully!');
  } catch (error) {
    printError(`Scrape command failed: ${(error as Error).message}`);
    throw error;
  }
}
