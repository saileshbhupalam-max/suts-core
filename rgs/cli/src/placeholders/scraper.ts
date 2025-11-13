/**
 * RGS CLI - Placeholder Scraper
 *
 * Temporary implementation until real scrapers are merged.
 */

import { WebSignal, ScrapeConfig, IScraper, BaseScraper, createWebSignal } from '@rgs/core';

/**
 * Mock scraper for CLI testing and placeholder functionality
 */
export class MockScraper extends BaseScraper implements IScraper {
  // eslint-disable-next-line @typescript-eslint/require-await
  override async scrape(config: ScrapeConfig): Promise<WebSignal[]> {
    // Generate mock signals based on config
    const signals: WebSignal[] = [];
    const limit = config.maxItems ?? 10;

    for (let i = 0; i < limit; i++) {
      const signal = createWebSignal({
        id: `mock-${config.type}-${Date.now()}-${i}`,
        source: config.type,
        content: `Mock ${config.type} post #${i + 1}: This is a placeholder signal for testing.`,
        timestamp: new Date(),
        url: `https://${config.type}.com/post/${i + 1}`,
        metadata: {
          mockData: true,
          index: i,
          source: config.type,
        },
        author: `mock_user_${i}`,
        sentiment: Math.random() * 2 - 1, // Random sentiment between -1 and 1
        themes: ['gaming', 'placeholder', 'test'],
      });

      signals.push(signal);
    }

    return signals;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async testConnection(): Promise<boolean> {
    // Mock connection is always successful
    return true;
  }
}

/**
 * Factory function to create a scraper for a given source
 * This will be replaced with real scraper implementations later
 */
export function createScraper(_source: string): IScraper {
  // For now, always return MockScraper
  // Later this will return RedditScraper, TwitterScraper, etc.
  return new MockScraper();
}
