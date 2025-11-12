/**
 * Tests for analyze command
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createWebSignal } from '@rgs/core';
import { analyzeCommand } from '../../src/commands/analyze';
import { writeSignals, readInsight } from '../../src/utils/fileio';

describe('analyzeCommand', () => {
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

  const createTestSignals = (count: number) => {
    return Array.from({ length: count }, (_, i) =>
      createWebSignal({
        id: `signal-${i}`,
        source: 'reddit',
        content: `Test content ${i}`,
        timestamp: new Date(),
        url: `https://reddit.com/${i}`,
        metadata: {},
        sentiment: i % 2 === 0 ? 0.5 : -0.5,
        themes: ['gaming', 'test'],
      })
    );
  };

  it('should analyze signals and generate insight', async () => {
    const signals = createTestSignals(10);
    const inputPath = join(testDir, 'signals.json');
    const outputPath = join(testDir, 'insight.json');

    await writeSignals(inputPath, signals);

    await analyzeCommand({
      input: inputPath,
      output: outputPath,
    });

    const insight = await readInsight(outputPath);
    expect(insight).toHaveProperty('themes');
    expect(insight).toHaveProperty('sentiment');
    expect(insight).toHaveProperty('painPoints');
    expect(insight).toHaveProperty('desires');
    expect(insight).toHaveProperty('language');
    expect(insight).toHaveProperty('confidence');
  });

  it('should throw error if input file does not exist', async () => {
    const inputPath = join(testDir, 'nonexistent.json');
    const outputPath = join(testDir, 'insight.json');

    await expect(
      analyzeCommand({
        input: inputPath,
        output: outputPath,
      })
    ).rejects.toThrow('Input file not found');
  });

  it('should throw error if input file has no signals', async () => {
    const inputPath = join(testDir, 'signals.json');
    const outputPath = join(testDir, 'insight.json');

    await writeSignals(inputPath, []);

    await expect(
      analyzeCommand({
        input: inputPath,
        output: outputPath,
      })
    ).rejects.toThrow('No signals found in input file');
  });

  it('should handle skipSentiment option', async () => {
    const signals = createTestSignals(5);
    const inputPath = join(testDir, 'signals.json');
    const outputPath = join(testDir, 'insight.json');

    await writeSignals(inputPath, signals);

    await analyzeCommand({
      input: inputPath,
      output: outputPath,
      skipSentiment: true,
    });

    const insight = await readInsight(outputPath);
    expect(insight).toHaveProperty('sentiment');
  });

  it('should handle skipThemes option', async () => {
    const signals = createTestSignals(5);
    const inputPath = join(testDir, 'signals.json');
    const outputPath = join(testDir, 'insight.json');

    await writeSignals(inputPath, signals);

    await analyzeCommand({
      input: inputPath,
      output: outputPath,
      skipThemes: true,
    });

    const insight = await readInsight(outputPath);
    expect(insight).toHaveProperty('themes');
  });

  it('should handle both skip options', async () => {
    const signals = createTestSignals(5);
    const inputPath = join(testDir, 'signals.json');
    const outputPath = join(testDir, 'insight.json');

    await writeSignals(inputPath, signals);

    await analyzeCommand({
      input: inputPath,
      output: outputPath,
      skipSentiment: true,
      skipThemes: true,
    });

    const insight = await readInsight(outputPath);
    expect(insight).toBeDefined();
  });

  it('should throw error for invalid options', async () => {
    await expect(
      analyzeCommand({
        input: '',
        output: join(testDir, 'insight.json'),
      })
    ).rejects.toThrow();
  });
});
