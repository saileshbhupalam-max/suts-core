/**
 * Tests for file I/O utilities
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createWebSignal, createInsight, createSentimentAnalysis } from '@rgs/core';
import {
  ensureDir,
  writeSignals,
  readSignals,
  writeInsight,
  readInsight,
  fileExists,
} from '../../src/utils/fileio';

describe('file I/O utilities', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique test directory
    testDir = join(tmpdir(), `rgs-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('ensureDir', () => {
    it('should create directory if it does not exist', async () => {
      const newDir = join(testDir, 'new-dir');
      await ensureDir(newDir);

      const stats = await fs.stat(newDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      await ensureDir(testDir);
      // Should not throw
      await ensureDir(testDir);

      const stats = await fs.stat(testDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create nested directories', async () => {
      const nestedDir = join(testDir, 'a', 'b', 'c');
      await ensureDir(nestedDir);

      const stats = await fs.stat(nestedDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('writeSignals and readSignals', () => {
    it('should write and read signals', async () => {
      const signals = [
        createWebSignal({
          id: 'signal-1',
          source: 'reddit',
          content: 'Test content 1',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          url: 'https://reddit.com/1',
          metadata: { test: true },
        }),
        createWebSignal({
          id: 'signal-2',
          source: 'reddit',
          content: 'Test content 2',
          timestamp: new Date('2024-01-02T00:00:00Z'),
          url: 'https://reddit.com/2',
          metadata: { test: false },
        }),
      ];

      const filePath = join(testDir, 'signals.json');
      await writeSignals(filePath, signals);

      const readData = await readSignals(filePath);
      expect(readData).toHaveLength(2);
      expect(readData[0]?.id).toBe('signal-1');
      expect(readData[1]?.id).toBe('signal-2');
      expect(readData[0]?.timestamp).toBeInstanceOf(Date);
    });

    it('should preserve all signal properties', async () => {
      const signal = createWebSignal({
        id: 'signal-1',
        source: 'reddit',
        content: 'Test content',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        url: 'https://reddit.com/1',
        metadata: { key: 'value' },
        author: 'test-user',
        sentiment: 0.5,
        themes: ['gaming', 'test'],
      });

      const filePath = join(testDir, 'signals.json');
      await writeSignals(filePath, [signal]);

      const readData = await readSignals(filePath);
      expect(readData[0]).toMatchObject({
        id: 'signal-1',
        source: 'reddit',
        content: 'Test content',
        url: 'https://reddit.com/1',
        author: 'test-user',
        sentiment: 0.5,
        themes: ['gaming', 'test'],
      });
    });

    it('should create parent directory if it does not exist', async () => {
      const filePath = join(testDir, 'nested', 'dir', 'signals.json');
      const signals = [
        createWebSignal({
          id: 'signal-1',
          source: 'reddit',
          content: 'Test',
          timestamp: new Date(),
          url: 'https://test.com',
          metadata: {},
        }),
      ];

      await writeSignals(filePath, signals);

      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    });
  });

  describe('writeInsight and readInsight', () => {
    it('should write and read insight', async () => {
      const insight = createInsight({
        themes: [],
        sentiment: createSentimentAnalysis({
          overall: 0.5,
          distribution: { positive: 0.6, neutral: 0.3, negative: 0.1 },
          positiveSignals: ['sig-1'],
          negativeSignals: ['sig-2'],
        }),
        painPoints: ['pain 1', 'pain 2'],
        desires: ['desire 1', 'desire 2'],
        language: {
          commonPhrases: ['phrase 1'],
          tone: 'casual',
          frequentTerms: { test: 5 },
          emotionalIndicators: ['happy'],
        },
        confidence: 0.8,
      });

      const filePath = join(testDir, 'insight.json');
      await writeInsight(filePath, insight);

      const readData = await readInsight(filePath);
      expect(readData).toMatchObject({
        sentiment: {
          overall: 0.5,
          distribution: { positive: 0.6, neutral: 0.3, negative: 0.1 },
        },
        painPoints: ['pain 1', 'pain 2'],
        confidence: 0.8,
      });
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'test', 'utf-8');

      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const filePath = join(testDir, 'does-not-exist.txt');

      const exists = await fileExists(filePath);
      expect(exists).toBe(false);
    });

    it('should return true for existing directory', async () => {
      const exists = await fileExists(testDir);
      expect(exists).toBe(true);
    });
  });
});
