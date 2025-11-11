/**
 * Tests for IScraper interface and BaseScraper
 */

import { type ScrapeConfig, type WebSignal, ScraperError, BaseScraper } from '../src';

// Mock implementation for testing
class MockScraper extends BaseScraper {
  async scrape(config: ScrapeConfig): Promise<WebSignal[]> {
    return [
      {
        id: 'test-1',
        source: config.type,
        content: 'Test content',
        timestamp: new Date(),
        url: 'https://example.com',
        metadata: {},
      },
    ];
  }
}

describe('Scraper Interface', () => {
  describe('ScraperError', () => {
    it('should create a scraper error with code', () => {
      const error = new ScraperError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ScraperError');
      expect(error instanceof Error).toBe(true);
    });

    it('should create a scraper error with details', () => {
      const details = { url: 'https://example.com', status: 404 };
      const error = new ScraperError('Not found', 'NOT_FOUND', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('BaseScraper', () => {
    let scraper: MockScraper;

    beforeEach(() => {
      scraper = new MockScraper();
    });

    describe('scrape', () => {
      it('should scrape signals successfully', async () => {
        const config: ScrapeConfig = {
          type: 'reddit',
          params: { subreddit: 'test' },
        };

        const signals = await scraper.scrape(config);

        expect(signals).toHaveLength(1);
        expect(signals[0]?.id).toBe('test-1');
        expect(signals[0]?.source).toBe('reddit');
      });
    });

    describe('validate', () => {
      it('should validate a correct signal', () => {
        const signal: WebSignal = {
          id: 'test-1',
          source: 'reddit',
          content: 'Valid content',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
        };

        expect(scraper.validate(signal)).toBe(true);
      });

      it('should reject signal with empty id', () => {
        const signal: WebSignal = {
          id: '',
          source: 'reddit',
          content: 'Content',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
        };

        expect(scraper.validate(signal)).toBe(false);
      });

      it('should reject signal with whitespace-only id', () => {
        const signal: WebSignal = {
          id: '   ',
          source: 'reddit',
          content: 'Content',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
        };

        expect(scraper.validate(signal)).toBe(false);
      });

      it('should reject signal with empty content', () => {
        const signal: WebSignal = {
          id: 'test-1',
          source: 'reddit',
          content: '',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
        };

        expect(scraper.validate(signal)).toBe(false);
      });

      it('should reject signal with empty url', () => {
        const signal: WebSignal = {
          id: 'test-1',
          source: 'reddit',
          content: 'Content',
          timestamp: new Date(),
          url: '',
          metadata: {},
        };

        expect(scraper.validate(signal)).toBe(false);
      });

      it('should reject signal with invalid timestamp', () => {
        const signal: WebSignal = {
          id: 'test-1',
          source: 'reddit',
          content: 'Content',
          timestamp: new Date('invalid'),
          url: 'https://example.com',
          metadata: {},
        };

        expect(scraper.validate(signal)).toBe(false);
      });

      it('should reject signal with invalid sentiment', () => {
        const signal: WebSignal = {
          id: 'test-1',
          source: 'reddit',
          content: 'Content',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
          sentiment: 2,
        };

        expect(scraper.validate(signal)).toBe(false);
      });

      it('should accept signal with valid sentiment', () => {
        const signal: WebSignal = {
          id: 'test-1',
          source: 'reddit',
          content: 'Content',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
          sentiment: 0.5,
        };

        expect(scraper.validate(signal)).toBe(true);
      });
    });

    describe('testConnection', () => {
      it('should return true by default', async () => {
        const result = await scraper.testConnection();
        expect(result).toBe(true);
      });
    });

    describe('createResult', () => {
      it('should create a scrape result', () => {
        const signals: WebSignal[] = [
          {
            id: 'test-1',
            source: 'reddit',
            content: 'Content',
            timestamp: new Date(),
            url: 'https://example.com',
            metadata: {},
          },
        ];
        const errors: Error[] = [];
        const startTime = new Date('2024-01-01T10:00:00Z');
        const endTime = new Date('2024-01-01T10:00:05Z');

        const result = scraper['createResult'](signals, errors, startTime, endTime);

        expect(result.signals).toEqual(signals);
        expect(result.count).toBe(1);
        expect(result.errors).toEqual([]);
        expect(result.success).toBe(true);
        expect(result.metadata.startTime).toEqual(startTime);
        expect(result.metadata.endTime).toEqual(endTime);
        expect(result.metadata.durationMs).toBe(5000);
      });

      it('should mark result as unsuccessful when errors exist', () => {
        const errors = [new Error('Test error')];
        const startTime = new Date();
        const endTime = new Date();

        const result = scraper['createResult']([], errors, startTime, endTime);

        expect(result.success).toBe(false);
        expect(result.errors).toEqual(errors);
      });
    });
  });
});
