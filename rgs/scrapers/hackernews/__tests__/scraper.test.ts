/**
 * Tests for HackerNews scraper
 */

import { HackerNewsScraper } from '../src/scraper';
import { HackerNewsClient, HNSearchResult } from '../src/client';
import { HNConfig, DEFAULT_HN_CONFIG } from '../src/config';
import { ScrapeConfig } from '@rgs/core';
import { WebSignal } from '@rgs/core';

// Mock the client
jest.mock('../src/client');

describe('HackerNewsScraper', () => {
  let scraper: HackerNewsScraper;
  let mockClient: jest.Mocked<HackerNewsClient>;
  let config: HNConfig;
  let scrapeConfig: ScrapeConfig;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      searchStories: jest.fn(),
      getItem: jest.fn(),
      getItemComments: jest.fn(),
      testConnection: jest.fn(),
    } as any;

    // Create config
    config = {
      ...DEFAULT_HN_CONFIG,
      queries: ['test'],
      tags: ['story'],
      includeComments: false,
      maxResultsPerQuery: 10,
    };

    scrapeConfig = {
      type: 'hackernews',
      params: {},
    };

    // Create scraper
    scraper = new HackerNewsScraper(mockClient, config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scrape', () => {
    it('should scrape stories successfully', async () => {
      const mockResult: HNSearchResult = {
        hits: [
          {
            objectID: '12345',
            created_at: '2024-01-01T00:00:00.000Z',
            author: 'testuser',
            title: 'Test Story',
            points: 100,
            num_comments: 50,
          },
        ],
        nbHits: 1,
        page: 0,
        nbPages: 1,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test',
        params: '',
      };

      mockClient.searchStories.mockResolvedValue(mockResult);

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('hn-12345');
      expect(signals[0]?.source).toBe('hackernews');
      expect(signals[0]?.content).toBe('Test Story');
      expect(mockClient.searchStories).toHaveBeenCalledWith('test', {
        tags: 'story',
        numericFilters: 'points>10',
        hitsPerPage: 10,
      });
    });

    it('should scrape multiple queries', async () => {
      config = {
        ...config,
        queries: ['test1', 'test2'],
      };
      scraper = new HackerNewsScraper(mockClient, config);

      const mockResult1: HNSearchResult = {
        hits: [
          {
            objectID: '12345',
            created_at: '2024-01-01T00:00:00.000Z',
            author: 'user1',
            title: 'Story 1',
            points: 100,
            num_comments: 50,
          },
        ],
        nbHits: 1,
        page: 0,
        nbPages: 1,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test1',
        params: '',
      };

      const mockResult2: HNSearchResult = {
        hits: [
          {
            objectID: '67890',
            created_at: '2024-01-02T00:00:00.000Z',
            author: 'user2',
            title: 'Story 2',
            points: 200,
            num_comments: 100,
          },
        ],
        nbHits: 1,
        page: 0,
        nbPages: 1,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test2',
        params: '',
      };

      mockClient.searchStories
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2);

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(2);
      expect(signals[0]?.id).toBe('hn-12345');
      expect(signals[1]?.id).toBe('hn-67890');
      expect(mockClient.searchStories).toHaveBeenCalledTimes(2);
    });

    it('should deduplicate signals by ID', async () => {
      config = {
        ...config,
        queries: ['test1', 'test2'],
      };
      scraper = new HackerNewsScraper(mockClient, config);

      // Same story returned by both queries
      const mockResult: HNSearchResult = {
        hits: [
          {
            objectID: '12345',
            created_at: '2024-01-01T00:00:00.000Z',
            author: 'testuser',
            title: 'Test Story',
            points: 100,
            num_comments: 50,
          },
        ],
        nbHits: 1,
        page: 0,
        nbPages: 1,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test',
        params: '',
      };

      mockClient.searchStories.mockResolvedValue(mockResult);

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('hn-12345');
    });

    it('should filter invalid stories', async () => {
      const mockResult: HNSearchResult = {
        hits: [
          {
            objectID: '12345',
            created_at: '2024-01-01T00:00:00.000Z',
            author: 'testuser',
            title: 'Valid Story',
            points: 100,
            num_comments: 50,
          },
          {
            // Invalid - missing title
            objectID: '67890',
            created_at: '2024-01-02T00:00:00.000Z',
            author: 'testuser',
          },
        ],
        nbHits: 2,
        page: 0,
        nbPages: 1,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test',
        params: '',
      };

      mockClient.searchStories.mockResolvedValue(mockResult);

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('hn-12345');
    });

    it('should scrape comments when configured', async () => {
      config = {
        ...config,
        tags: ['comment'],
      };
      scraper = new HackerNewsScraper(mockClient, config);

      const mockResult: HNSearchResult = {
        hits: [
          {
            objectID: '67890',
            created_at: '2024-01-02T00:00:00.000Z',
            author: 'commenter',
            comment_text: 'This is a comment',
            story_id: 12345,
          },
        ],
        nbHits: 1,
        page: 0,
        nbPages: 1,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test',
        params: '',
      };

      mockClient.searchStories.mockResolvedValue(mockResult);

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('hn-comment-67890');
      expect(signals[0]?.content).toBe('This is a comment');
      expect(mockClient.searchStories).toHaveBeenCalledWith('test', {
        tags: 'comment',
        hitsPerPage: 10,
      });
    });

    it('should fetch story comments when includeComments is true', async () => {
      config = {
        ...config,
        includeComments: true,
      };
      scraper = new HackerNewsScraper(mockClient, config);

      const mockStoryResult: HNSearchResult = {
        hits: [
          {
            objectID: '12345',
            created_at: '2024-01-01T00:00:00.000Z',
            author: 'testuser',
            title: 'Test Story',
            points: 100,
            num_comments: 1,
          },
        ],
        nbHits: 1,
        page: 0,
        nbPages: 1,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test',
        params: '',
      };

      const mockComments = [
        {
          objectID: '67890',
          created_at: '2024-01-02T00:00:00.000Z',
          author: 'commenter',
          comment_text: 'This is a comment',
          story_id: 12345,
        },
      ];

      mockClient.searchStories.mockResolvedValue(mockStoryResult);
      mockClient.getItemComments.mockResolvedValue(mockComments);

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(2);
      expect(signals[0]?.id).toBe('hn-12345');
      expect(signals[1]?.id).toBe('hn-comment-67890');
      expect(mockClient.getItemComments).toHaveBeenCalledWith(12345);
    });

    it('should handle query failures gracefully', async () => {
      config = {
        ...config,
        queries: ['test1', 'test2'],
      };
      scraper = new HackerNewsScraper(mockClient, config);

      const mockResult: HNSearchResult = {
        hits: [
          {
            objectID: '12345',
            created_at: '2024-01-01T00:00:00.000Z',
            author: 'testuser',
            title: 'Test Story',
            points: 100,
            num_comments: 50,
          },
        ],
        nbHits: 1,
        page: 0,
        nbPages: 1,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test1',
        params: '',
      };

      mockClient.searchStories
        .mockRejectedValueOnce(new Error('Query failed'))
        .mockResolvedValueOnce(mockResult);

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('hn-12345');
    });

    it('should handle comment fetch failures gracefully', async () => {
      config = {
        ...config,
        includeComments: true,
      };
      scraper = new HackerNewsScraper(mockClient, config);

      const mockStoryResult: HNSearchResult = {
        hits: [
          {
            objectID: '12345',
            created_at: '2024-01-01T00:00:00.000Z',
            author: 'testuser',
            title: 'Test Story',
            points: 100,
            num_comments: 1,
          },
        ],
        nbHits: 1,
        page: 0,
        nbPages: 1,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test',
        params: '',
      };

      mockClient.searchStories.mockResolvedValue(mockStoryResult);
      mockClient.getItemComments.mockRejectedValue(new Error('Comment fetch failed'));

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('hn-12345');
    });

    it('should not fetch comments for stories with zero comments', async () => {
      config = {
        ...config,
        includeComments: true,
      };
      scraper = new HackerNewsScraper(mockClient, config);

      const mockStoryResult: HNSearchResult = {
        hits: [
          {
            objectID: '12345',
            created_at: '2024-01-01T00:00:00.000Z',
            author: 'testuser',
            title: 'Test Story',
            points: 100,
            num_comments: 0,
          },
        ],
        nbHits: 1,
        page: 0,
        nbPages: 1,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test',
        params: '',
      };

      mockClient.searchStories.mockResolvedValue(mockStoryResult);

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(1);
      expect(mockClient.getItemComments).not.toHaveBeenCalled();
    });

    it('should filter by minimum points', async () => {
      config = {
        ...config,
        minPoints: 50,
      };
      scraper = new HackerNewsScraper(mockClient, config);

      const mockResult: HNSearchResult = {
        hits: [],
        nbHits: 0,
        page: 0,
        nbPages: 0,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test',
        params: '',
      };

      mockClient.searchStories.mockResolvedValue(mockResult);

      await scraper.scrape(scrapeConfig);

      expect(mockClient.searchStories).toHaveBeenCalledWith('test', {
        tags: 'story',
        numericFilters: 'points>50',
        hitsPerPage: 10,
      });
    });

    it('should not include numeric filter when minPoints is undefined', async () => {
      const { minPoints, ...configWithoutMinPoints } = config;
      config = {
        ...configWithoutMinPoints,
      } as HNConfig;
      scraper = new HackerNewsScraper(mockClient, config);

      const mockResult: HNSearchResult = {
        hits: [],
        nbHits: 0,
        page: 0,
        nbPages: 0,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test',
        params: '',
      };

      mockClient.searchStories.mockResolvedValue(mockResult);

      await scraper.scrape(scrapeConfig);

      expect(mockClient.searchStories).toHaveBeenCalledWith('test', {
        tags: 'story',
        numericFilters: undefined,
        hitsPerPage: 10,
      });
    });

    it('should handle empty results', async () => {
      const mockResult: HNSearchResult = {
        hits: [],
        nbHits: 0,
        page: 0,
        nbPages: 0,
        hitsPerPage: 10,
        processingTimeMS: 5,
        query: 'test',
        params: '',
      };

      mockClient.searchStories.mockResolvedValue(mockResult);

      const signals = await scraper.scrape(scrapeConfig);

      expect(signals).toHaveLength(0);
    });
  });

  describe('validate', () => {
    it('should validate valid story signal', () => {
      const signal: WebSignal = {
        id: 'hn-12345',
        source: 'hackernews',
        content: 'Test Story',
        author: 'testuser',
        timestamp: new Date(),
        url: 'https://news.ycombinator.com/item?id=12345',
        metadata: {
          objectID: '12345',
          type: 'story',
          points: 100,
          numComments: 50,
        },
      };

      expect(scraper.validate(signal)).toBe(true);
    });

    it('should validate valid comment signal', () => {
      const signal: WebSignal = {
        id: 'hn-comment-67890',
        source: 'hackernews',
        content: 'This is a comment',
        author: 'commenter',
        timestamp: new Date(),
        url: 'https://news.ycombinator.com/item?id=67890',
        metadata: {
          objectID: '67890',
          type: 'comment',
          storyId: 12345,
        },
      };

      expect(scraper.validate(signal)).toBe(true);
    });

    it('should reject signal with wrong source', () => {
      const signal: WebSignal = {
        id: 'hn-12345',
        source: 'reddit',
        content: 'Test Story',
        timestamp: new Date(),
        url: 'https://news.ycombinator.com/item?id=12345',
        metadata: {
          objectID: '12345',
          type: 'story',
        },
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal with invalid ID format', () => {
      const signal: WebSignal = {
        id: 'invalid-12345',
        source: 'hackernews',
        content: 'Test Story',
        timestamp: new Date(),
        url: 'https://news.ycombinator.com/item?id=12345',
        metadata: {
          objectID: '12345',
          type: 'story',
        },
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal with invalid URL', () => {
      const signal: WebSignal = {
        id: 'hn-12345',
        source: 'hackernews',
        content: 'Test Story',
        timestamp: new Date(),
        url: 'invalid-url',
        metadata: {
          objectID: '12345',
          type: 'story',
        },
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal without objectID in metadata', () => {
      const signal: WebSignal = {
        id: 'hn-12345',
        source: 'hackernews',
        content: 'Test Story',
        timestamp: new Date(),
        url: 'https://news.ycombinator.com/item?id=12345',
        metadata: {
          type: 'story',
        },
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal without type in metadata', () => {
      const signal: WebSignal = {
        id: 'hn-12345',
        source: 'hackernews',
        content: 'Test Story',
        timestamp: new Date(),
        url: 'https://news.ycombinator.com/item?id=12345',
        metadata: {
          objectID: '12345',
        },
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal with invalid type in metadata', () => {
      const signal: WebSignal = {
        id: 'hn-12345',
        source: 'hackernews',
        content: 'Test Story',
        timestamp: new Date(),
        url: 'https://news.ycombinator.com/item?id=12345',
        metadata: {
          objectID: '12345',
          type: 'invalid',
        },
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal with empty content', () => {
      const signal: WebSignal = {
        id: 'hn-12345',
        source: 'hackernews',
        content: '',
        timestamp: new Date(),
        url: 'https://news.ycombinator.com/item?id=12345',
        metadata: {
          objectID: '12345',
          type: 'story',
        },
      };

      expect(scraper.validate(signal)).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      mockClient.testConnection.mockResolvedValue(true);

      const result = await scraper.testConnection();

      expect(result).toBe(true);
      expect(mockClient.testConnection).toHaveBeenCalled();
    });

    it('should return false on connection failure', async () => {
      mockClient.testConnection.mockRejectedValue(new Error('Connection failed'));

      const result = await scraper.testConnection();

      expect(result).toBe(false);
    });
  });
});
