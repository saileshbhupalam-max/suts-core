/**
 * RGS Reporter - Placeholder Data
 *
 * Generates placeholder data for testing and development.
 */

import { WebSignal, createWebSignal } from '@rgs/core';
import { ReportData, CategorizedTheme } from '../types';

/**
 * Generate placeholder web signals
 */
export function generatePlaceholderSignals(count: number): WebSignal[] {
  const signals: WebSignal[] = [];
  const baseDate = new Date('2025-11-12T00:00:00Z');

  const samplePosts = [
    {
      content: 'The token costs are way too expensive for our use case',
      sentiment: -0.8,
      themes: ['Token costs', 'Pricing'],
    },
    {
      content: 'Love the new features, but wish it was faster',
      sentiment: 0.3,
      themes: ['Performance', 'Features'],
    },
    {
      content: 'Great API documentation and easy to integrate',
      sentiment: 0.9,
      themes: ['Documentation', 'Developer experience'],
    },
    {
      content: 'Would be nice to have better error messages',
      sentiment: -0.2,
      themes: ['Error handling', 'Developer experience'],
    },
    {
      content: 'The pricing model is confusing, need more clarity',
      sentiment: -0.5,
      themes: ['Pricing', 'Documentation'],
    },
  ];

  for (let i = 0; i < count; i++) {
    const sampleIndex = i % samplePosts.length;
    const sample = samplePosts[sampleIndex];
    if (sample === undefined) {
      continue;
    }
    const signal = createWebSignal({
      id: `signal-${i + 1}`,
      source: 'reddit',
      content: sample.content,
      timestamp: new Date(baseDate.getTime() + i * 3600000),
      url: `https://reddit.com/r/example/comments/${i + 1}`,
      metadata: { score: 10 + i, subreddit: 'example' },
      author: `user${(i % 10) + 1}`,
      sentiment: sample.sentiment,
      themes: sample.themes,
    });
    signals.push(signal);
  }

  return signals;
}

/**
 * Generate placeholder themes
 */
export function generatePlaceholderThemes(): CategorizedTheme[] {
  return [
    {
      name: 'Token costs',
      confidence: 0.9,
      frequency: 45,
      keywords: ['expensive', 'pricing', 'costs', 'tokens'],
      category: 'pain',
      sentiment: -0.6,
    },
    {
      name: 'Performance',
      confidence: 0.85,
      frequency: 32,
      keywords: ['slow', 'speed', 'latency', 'performance'],
      category: 'pain',
      sentiment: -0.4,
    },
    {
      name: 'Documentation',
      confidence: 0.8,
      frequency: 28,
      keywords: ['docs', 'documentation', 'guide', 'tutorial'],
      category: 'desire',
      sentiment: 0.5,
    },
    {
      name: 'Developer experience',
      confidence: 0.75,
      frequency: 25,
      keywords: ['dx', 'api', 'integration', 'ease'],
      category: 'desire',
      sentiment: 0.6,
    },
    {
      name: 'Error handling',
      confidence: 0.7,
      frequency: 20,
      keywords: ['errors', 'exceptions', 'messages', 'debugging'],
      category: 'pain',
      sentiment: -0.3,
    },
  ];
}

/**
 * Generate complete placeholder report data
 */
export function generatePlaceholderReportData(signalCount: number = 150): ReportData {
  const signals = generatePlaceholderSignals(signalCount);
  const themes = generatePlaceholderThemes();

  return {
    signals,
    themes,
    sentiment: {
      overall: 0.32,
      distribution: {
        positive: 0.45,
        neutral: 0.25,
        negative: 0.3,
      },
      positiveSignals: [
        'Great API documentation and easy to integrate',
        'Love the new features, very intuitive',
        'Excellent developer experience overall',
      ],
      negativeSignals: [
        'The token costs are way too expensive for our use case',
        'Performance is quite slow for large datasets',
        'Error messages are not helpful for debugging',
      ],
    },
    metadata: {
      scrapedAt: new Date('2025-11-12T10:00:00Z'),
      sources: ['reddit'],
      totalSignals: signalCount,
      generatedAt: new Date(),
      version: '1.0.0',
    },
  };
}
