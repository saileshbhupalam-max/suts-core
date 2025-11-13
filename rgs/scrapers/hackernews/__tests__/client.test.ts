/**
 * Tests for HackerNews API client
 */

import axios, { AxiosError } from 'axios';
import { HackerNewsClient, HNSearchResult } from '../src/client';
import { RateLimiter } from '@rgs/utils';
import { ScraperError, RateLimitError, NetworkError } from '@rgs/utils';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HackerNewsClient', () => {
  let client: HackerNewsClient;
  let rateLimiter: RateLimiter;
  let mockAxiosInstance: jest.Mocked<any>;

  beforeEach(() => {
    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
    };
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    // Create rate limiter (high limit for tests)
    rateLimiter = new RateLimiter({
      requestsPerMinute: 10000,
    });

    // Create client
    client = new HackerNewsClient(rateLimiter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchStories', () => {
    it('should search for stories successfully', async () => {
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
        hitsPerPage: 100,
        processingTimeMS: 5,
        query: 'test',
        params: '',
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResult });

      const result = await client.searchStories('test');

      expect(result).toEqual(mockResult);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://hn.algolia.com/api/v1/search',
        {
          params: { query: 'test' },
        }
      );
    });

    it('should include search options in request', async () => {
      const mockResult: HNSearchResult = {
        hits: [],
        nbHits: 0,
        page: 0,
        nbPages: 0,
        hitsPerPage: 50,
        processingTimeMS: 2,
        query: 'test',
        params: '',
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResult });

      await client.searchStories('test', {
        tags: 'story',
        numericFilters: 'points>100',
        hitsPerPage: 50,
        page: 1,
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://hn.algolia.com/api/v1/search',
        {
          params: {
            query: 'test',
            tags: 'story',
            numericFilters: 'points>100',
            hitsPerPage: 50,
            page: 1,
          },
        }
      );
    });

    it('should limit hitsPerPage to 1000', async () => {
      const mockResult: HNSearchResult = {
        hits: [],
        nbHits: 0,
        page: 0,
        nbPages: 0,
        hitsPerPage: 1000,
        processingTimeMS: 2,
        query: 'test',
        params: '',
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResult });

      await client.searchStories('test', {
        hitsPerPage: 5000,
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://hn.algolia.com/api/v1/search',
        {
          params: {
            query: 'test',
            hitsPerPage: 1000,
          },
        }
      );
    });

    it('should trim query whitespace', async () => {
      const mockResult: HNSearchResult = {
        hits: [],
        nbHits: 0,
        page: 0,
        nbPages: 0,
        hitsPerPage: 100,
        processingTimeMS: 2,
        query: 'test',
        params: '',
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResult });

      await client.searchStories('  test  ');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://hn.algolia.com/api/v1/search',
        {
          params: { query: 'test' },
        }
      );
    });

    it('should throw error for empty query', async () => {
      await expect(client.searchStories('')).rejects.toThrow(ScraperError);
      await expect(client.searchStories('   ')).rejects.toThrow(ScraperError);
    });

    it('should handle rate limit error (429)', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 429,
          headers: { 'retry-after': '60' },
        },
        code: undefined,
      } as unknown as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true) as any;

      await expect(client.searchStories('test')).rejects.toThrow(RateLimitError);
    });

    it('should handle bad request error (400)', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
        },
        code: undefined,
      } as unknown as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true) as any;

      await expect(client.searchStories('test')).rejects.toThrow(ScraperError);
    });

    it('should handle not found error (404)', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
        },
        code: undefined,
      } as unknown as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true) as any;

      await expect(client.searchStories('test')).rejects.toThrow(ScraperError);
    });

    it('should handle server error (500)', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
        },
        code: undefined,
      } as unknown as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true) as any;

      await expect(client.searchStories('test')).rejects.toThrow(NetworkError);
    });

    it('should handle connection refused error', async () => {
      const axiosError = {
        isAxiosError: true,
        code: 'ECONNREFUSED',
      } as unknown as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true) as any;

      await expect(client.searchStories('test')).rejects.toThrow(NetworkError);
    });

    it('should handle timeout error', async () => {
      const axiosError = {
        isAxiosError: true,
        code: 'ETIMEDOUT',
      } as unknown as AxiosError;

      mockAxiosInstance.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true) as any;

      await expect(client.searchStories('test')).rejects.toThrow(NetworkError);
    });

    it('should handle unknown error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Unknown error'));
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(false) as any;

      await expect(client.searchStories('test')).rejects.toThrow(ScraperError);
    });
  });

  describe('getItem', () => {
    it('should get item by ID successfully', async () => {
      const mockItem = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        title: 'Test Story',
        points: 100,
        num_comments: 50,
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockItem });

      const result = await client.getItem(12345);

      expect(result).toEqual(mockItem);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://hn.algolia.com/api/v1/items/12345'
      );
    });

    it('should throw error for invalid ID', async () => {
      await expect(client.getItem(0)).rejects.toThrow(ScraperError);
      await expect(client.getItem(-1)).rejects.toThrow(ScraperError);
    });
  });

  describe('getItemComments', () => {
    it('should get comments for story', async () => {
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
        hitsPerPage: 1000,
        processingTimeMS: 3,
        query: '',
        params: '',
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResult });

      const result = await client.getItemComments(12345);

      expect(result).toEqual(mockResult.hits);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://hn.algolia.com/api/v1/search',
        {
          params: {
            query: '',
            tags: 'comment',
            numericFilters: 'story_id=12345',
            hitsPerPage: 1000,
          },
        }
      );
    });

    it('should throw error for invalid story ID', async () => {
      await expect(client.getItemComments(0)).rejects.toThrow(ScraperError);
      await expect(client.getItemComments(-1)).rejects.toThrow(ScraperError);
    });
  });

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { hits: [] } });

      const result = await client.testConnection();

      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));

      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });
});
