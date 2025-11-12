/**
 * Tests for MockScraper placeholder
 */

import { MockScraper, createScraper } from '../../src/placeholders/scraper';

describe('MockScraper', () => {
  let scraper: MockScraper;

  beforeEach(() => {
    scraper = new MockScraper();
  });

  describe('scrape', () => {
    it('should generate mock signals with default limit', async () => {
      const signals = await scraper.scrape({
        type: 'reddit',
        params: {},
      });

      expect(signals).toHaveLength(10);
      expect(signals[0]!).toHaveProperty('id');
      expect(signals[0]!).toHaveProperty('source', 'reddit');
      expect(signals[0]!).toHaveProperty('content');
      expect(signals[0]!).toHaveProperty('timestamp');
      expect(signals[0]!).toHaveProperty('url');
      expect(signals[0]!).toHaveProperty('metadata');
    });

    it('should generate specified number of signals', async () => {
      const signals = await scraper.scrape({
        type: 'reddit',
        params: {},
        maxItems: 5,
      });

      expect(signals).toHaveLength(5);
    });

    it('should include sentiment and themes in signals', async () => {
      const signals = await scraper.scrape({
        type: 'reddit',
        params: {},
        maxItems: 1,
      });

      expect(signals[0]!.sentiment).toBeDefined();
      expect(signals[0]!.sentiment!).toBeGreaterThanOrEqual(-1);
      expect(signals[0]!.sentiment!).toBeLessThanOrEqual(1);
      expect(signals[0]!.themes).toBeDefined();
      expect(Array.isArray(signals[0]!.themes)).toBe(true);
    });

    it('should generate unique signal IDs', async () => {
      const signals = await scraper.scrape({
        type: 'reddit',
        params: {},
        maxItems: 3,
      });

      const ids = signals.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include metadata with mockData flag', async () => {
      const signals = await scraper.scrape({
        type: 'reddit',
        params: {},
        maxItems: 1,
      });

      expect(signals[0]!.metadata).toHaveProperty('mockData', true);
      expect(signals[0]!.metadata).toHaveProperty('source', 'reddit');
    });
  });

  describe('validate', () => {
    it('should validate valid signals', async () => {
      const signals = await scraper.scrape({
        type: 'reddit',
        params: {},
        maxItems: 1,
      });

      expect(scraper.validate(signals[0]!)).toBe(true);
    });

    it('should reject signals with invalid sentiment', () => {
      const invalidSignal = {
        id: 'test',
        source: 'reddit' as const,
        content: 'Test',
        timestamp: new Date(),
        url: 'https://test.com',
        metadata: {},
        sentiment: 2, // Invalid: out of range
      };

      expect(scraper.validate(invalidSignal)).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should always return true for mock scraper', async () => {
      const result = await scraper.testConnection();
      expect(result).toBe(true);
    });
  });
});

describe('createScraper', () => {
  it('should create a scraper instance', () => {
    const scraper = createScraper('reddit');
    expect(scraper).toBeInstanceOf(MockScraper);
  });

  it('should create scraper for any source', () => {
    const redditScraper = createScraper('reddit');
    const twitterScraper = createScraper('twitter');

    expect(redditScraper).toBeInstanceOf(MockScraper);
    expect(twitterScraper).toBeInstanceOf(MockScraper);
  });
});
