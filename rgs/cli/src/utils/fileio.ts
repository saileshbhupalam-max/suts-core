/**
 * RGS CLI - File I/O Utilities
 *
 * Helper functions for reading and writing data files.
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';
import { WebSignal, Insight } from '@rgs/core';

/**
 * Ensure directory exists, create if it doesn't
 */
export async function ensureDir(path: string): Promise<void> {
  try {
    await fs.mkdir(path, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Write signals to JSON file
 */
export async function writeSignals(filePath: string, signals: WebSignal[]): Promise<void> {
  await ensureDir(dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(signals, null, 2), 'utf-8');
}

/**
 * Read signals from JSON file
 */
export async function readSignals(filePath: string): Promise<WebSignal[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(content) as unknown[];

  // Convert date strings back to Date objects
  return data.map((item) => {
    const signal = item as Record<string, unknown>;
    if (typeof signal['timestamp'] === 'string') {
      signal['timestamp'] = new Date(signal['timestamp']);
    }
    return signal as unknown as WebSignal;
  });
}

/**
 * Write insight to JSON file
 */
export async function writeInsight(filePath: string, insight: Insight): Promise<void> {
  await ensureDir(dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(insight, null, 2), 'utf-8');
}

/**
 * Read insight from JSON file
 */
export async function readInsight(filePath: string): Promise<Insight> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as Insight;
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
