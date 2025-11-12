/**
 * Tests for scrape command
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { scrapeCommand } from '../../src/commands/scrape';
import { readSignals } from '../../src/utils/fileio';

describe('scrapeCommand', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `rgs-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should scrape signals from a single source', async () => {
    const outputPath = join(testDir, 'signals.json');

    await scrapeCommand({
      sources: ['reddit'],
      limit: 5,
      output: outputPath,
    });

    const signals = await readSignals(outputPath);
    expect(signals).toHaveLength(5);
    expect(signals[0].source).toBe('reddit');
  });

  it('should scrape signals from multiple sources', async () => {
    const outputPath = join(testDir, 'signals.json');

    await scrapeCommand({
      sources: ['reddit', 'twitter'],
      limit: 3,
      output: outputPath,
    });

    const signals = await readSignals(outputPath);
    expect(signals).toHaveLength(6); // 3 from each source
  });

  it('should use default limit if not specified', async () => {
    const outputPath = join(testDir, 'signals.json');

    await scrapeCommand({
      sources: ['reddit'],
      output: outputPath,
    });

    const signals = await readSignals(outputPath);
    expect(signals).toHaveLength(10); // Default limit
  });

  it('should throw error for invalid options', async () => {
    await expect(
      scrapeCommand({
        sources: [],
        output: join(testDir, 'signals.json'),
      })
    ).rejects.toThrow();
  });

  it('should throw error when no signals are scraped', async () => {
    const outputPath = join(testDir, 'signals.json');

    await expect(
      scrapeCommand({
        sources: ['reddit'],
        limit: 0,
        output: outputPath,
      })
    ).rejects.toThrow('No signals were scraped');
  });

  it('should pass subreddits option to scraper', async () => {
    const outputPath = join(testDir, 'signals.json');

    await scrapeCommand({
      sources: ['reddit'],
      subreddits: ['vscode', 'gaming'],
      limit: 5,
      output: outputPath,
    });

    const signals = await readSignals(outputPath);
    expect(signals).toHaveLength(5);
  });
});
