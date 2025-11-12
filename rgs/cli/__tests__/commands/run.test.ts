/**
 * Tests for run command
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { runCommand } from '../../src/commands/run';
import { readSignals, readInsight, fileExists } from '../../src/utils/fileio';

describe('runCommand', () => {
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

  it('should run full pipeline with valid config', async () => {
    const configPath = join(testDir, 'config.json');
    const outputDir = join(testDir, 'output');

    const config = {
      sources: ['reddit'],
      limit: 5,
    };

    await fs.writeFile(configPath, JSON.stringify(config), 'utf-8');

    await runCommand({
      config: configPath,
      output: outputDir,
    });

    // Check that all output files were created
    const signalsPath = join(outputDir, 'signals.json');
    const insightPath = join(outputDir, 'insight.json');
    const reportPath = join(outputDir, 'report.txt');

    expect(await fileExists(signalsPath)).toBe(true);
    expect(await fileExists(insightPath)).toBe(true);
    expect(await fileExists(reportPath)).toBe(true);

    // Verify signals
    const signals = await readSignals(signalsPath);
    expect(signals).toHaveLength(5);

    // Verify insight
    const insight = await readInsight(insightPath);
    expect(insight).toBeDefined();
    expect(insight).toHaveProperty('themes');
    expect(insight).toHaveProperty('sentiment');

    // Verify report
    const report = await fs.readFile(reportPath, 'utf-8');
    expect(report).toContain('RGS Pipeline Report');
    expect(report).toContain('reddit');
  });

  it('should handle config with multiple sources', async () => {
    const configPath = join(testDir, 'config.json');
    const outputDir = join(testDir, 'output');

    const config = {
      sources: ['reddit', 'twitter'],
      limit: 3,
    };

    await fs.writeFile(configPath, JSON.stringify(config), 'utf-8');

    await runCommand({
      config: configPath,
      output: outputDir,
    });

    const signalsPath = join(outputDir, 'signals.json');
    const signals = await readSignals(signalsPath);
    expect(signals).toHaveLength(6); // 3 from each source
  });

  it('should handle config with subreddits', async () => {
    const configPath = join(testDir, 'config.json');
    const outputDir = join(testDir, 'output');

    const config = {
      sources: ['reddit'],
      subreddits: ['vscode', 'gaming'],
      limit: 5,
    };

    await fs.writeFile(configPath, JSON.stringify(config), 'utf-8');

    await runCommand({
      config: configPath,
      output: outputDir,
    });

    const reportPath = join(outputDir, 'report.txt');
    const report = await fs.readFile(reportPath, 'utf-8');
    expect(report).toContain('vscode');
    expect(report).toContain('gaming');
  });

  it('should handle config with analysis options', async () => {
    const configPath = join(testDir, 'config.json');
    const outputDir = join(testDir, 'output');

    const config = {
      sources: ['reddit'],
      limit: 5,
      analysis: {
        skipSentiment: true,
        skipThemes: false,
      },
    };

    await fs.writeFile(configPath, JSON.stringify(config), 'utf-8');

    await runCommand({
      config: configPath,
      output: outputDir,
    });

    const insightPath = join(outputDir, 'insight.json');
    const insight = await readInsight(insightPath);
    expect(insight).toBeDefined();
  });

  it('should throw error if config file does not exist', async () => {
    const configPath = join(testDir, 'nonexistent.json');
    const outputDir = join(testDir, 'output');

    await expect(
      runCommand({
        config: configPath,
        output: outputDir,
      })
    ).rejects.toThrow('Config file not found');
  });

  it('should throw error for invalid config', async () => {
    const configPath = join(testDir, 'config.json');
    const outputDir = join(testDir, 'output');

    const config = {
      sources: [], // Invalid: empty sources
    };

    await fs.writeFile(configPath, JSON.stringify(config), 'utf-8');

    await expect(
      runCommand({
        config: configPath,
        output: outputDir,
      })
    ).rejects.toThrow();
  });

  it('should use default limit if not specified in config', async () => {
    const configPath = join(testDir, 'config.json');
    const outputDir = join(testDir, 'output');

    const config = {
      sources: ['reddit'],
    };

    await fs.writeFile(configPath, JSON.stringify(config), 'utf-8');

    await runCommand({
      config: configPath,
      output: outputDir,
    });

    const signalsPath = join(outputDir, 'signals.json');
    const signals = await readSignals(signalsPath);
    expect(signals).toHaveLength(10); // Default limit
  });

  it('should create output directory if it does not exist', async () => {
    const configPath = join(testDir, 'config.json');
    const outputDir = join(testDir, 'new-output-dir');

    const config = {
      sources: ['reddit'],
      limit: 5,
    };

    await fs.writeFile(configPath, JSON.stringify(config), 'utf-8');

    await runCommand({
      config: configPath,
      output: outputDir,
    });

    expect(await fileExists(outputDir)).toBe(true);
  });
});
