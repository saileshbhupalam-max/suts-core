/**
 * Tests for GitHub client
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Octokit } from '@octokit/rest';
import { RateLimiter, RateLimitError, AuthenticationError, NetworkError, ScraperError } from '@rgs/utils';
import { GitHubClient } from '../src/client';
import type { GitHubIssue, GitHubComment } from '../src/mapper';

// Mock Octokit
jest.mock('@octokit/rest');

describe('GitHubClient', () => {
  let mockSearchIssues: jest.Mock;
  let mockGetIssue: jest.Mock;
  let mockListComments: jest.Mock;
  let mockGetRateLimit: jest.Mock;
  let mockGetAuthenticated: jest.Mock;
  let rateLimiter: RateLimiter;
  let client: GitHubClient;

  beforeEach(() => {
    // Create individual mock functions
    mockSearchIssues = jest.fn();
    mockGetIssue = jest.fn();
    mockListComments = jest.fn();
    mockGetRateLimit = jest.fn();
    mockGetAuthenticated = jest.fn();

    // Mock Octokit constructor
    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => ({
      search: {
        issuesAndPullRequests: mockSearchIssues,
      },
      issues: {
        get: mockGetIssue,
        listComments: mockListComments,
      },
      rateLimit: {
        get: mockGetRateLimit,
      },
      users: {
        getAuthenticated: mockGetAuthenticated,
      },
    } as unknown as Octokit));

    // Create rate limiter
    rateLimiter = new RateLimiter({
      requestsPerMinute: 100,
      burstSize: 10,
    });

    // Create client
    client = new GitHubClient('ghp_test_token', rateLimiter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchIssues', () => {
    it('should search issues successfully', async () => {
      const mockIssues = [
        {
          id: 1,
          number: 100,
          title: 'Test issue',
          state: 'open',
          user: { login: 'testuser', id: 1 },
          labels: [],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100',
          comments: 0,
        },
      ];

      mockSearchIssues.mockResolvedValue({
        data: {
          items: mockIssues,
          total_count: 1,
          incomplete_results: false,
        },
      } as never);

      const result = await client.searchIssues('performance repo:owner/repo', {
        perPage: 10,
        sort: 'created',
      });

      expect(result).toEqual(mockIssues);
      expect(mockSearchIssues).toHaveBeenCalledWith({
        q: 'performance repo:owner/repo',
        per_page: 10,
        page: 1,
        sort: 'created',
        order: 'desc',
      });
    });

    it('should filter out pull requests', async () => {
      const mockItems = [
        {
          id: 1,
          number: 100,
          title: 'Issue',
          state: 'open',
          user: { login: 'testuser', id: 1 },
          labels: [],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100',
          comments: 0,
        },
        {
          id: 2,
          number: 101,
          title: 'Pull request',
          state: 'open',
          user: { login: 'testuser', id: 1 },
          labels: [],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://github.com/owner/repo/pull/101',
          comments: 0,
          pull_request: { url: 'https://api.github.com/repos/owner/repo/pulls/101' },
        },
      ];

      mockSearchIssues.mockResolvedValue({
        data: {
          items: mockItems,
          total_count: 2,
          incomplete_results: false,
        },
      } as never);

      const result = await client.searchIssues('test', { perPage: 10 });

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(1);
    });

    it('should use custom page number', async () => {
      mockSearchIssues.mockResolvedValue({
        data: { items: [], total_count: 0, incomplete_results: false },
      } as never);

      await client.searchIssues('test', { perPage: 10, page: 3 });

      expect(mockSearchIssues).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3 })
      );
    });

    it('should handle rate limit errors', async () => {
      const error = {
        status: 403,
        message: 'API rate limit exceeded',
        response: {
          headers: {
            'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
          },
        },
      };

      mockSearchIssues.mockRejectedValue(error);

      await expect(client.searchIssues('test', { perPage: 10 })).rejects.toThrow(RateLimitError);
    });

    it('should handle authentication errors', async () => {
      const error = {
        status: 401,
        message: 'Bad credentials',
      };

      mockSearchIssues.mockRejectedValue(error);

      await expect(client.searchIssues('test', { perPage: 10 })).rejects.toThrow(AuthenticationError);
    });

    it('should handle invalid query errors', async () => {
      const error = {
        status: 422,
        message: 'Validation failed',
      };

      mockSearchIssues.mockRejectedValue(error);

      await expect(client.searchIssues('test', { perPage: 10 })).rejects.toThrow(ScraperError);
    });

    it('should handle network errors', async () => {
      const error = {
        status: 503,
        message: 'Service unavailable',
      };

      mockSearchIssues.mockRejectedValue(error);

      await expect(client.searchIssues('test', { perPage: 10 })).rejects.toThrow(NetworkError);
    });

    it('should handle 404 errors', async () => {
      const error = {
        status: 404,
        message: 'Not found',
      };

      mockSearchIssues.mockRejectedValue(error);

      await expect(client.searchIssues('test', { perPage: 10 })).rejects.toThrow(ScraperError);
    });
  });

  describe('getIssue', () => {
    it('should get issue successfully', async () => {
      const mockIssue: GitHubIssue = {
        id: 1,
        number: 100,
        title: 'Test issue',
        body: 'Test body',
        state: 'open',
        user: { login: 'testuser', id: 1 },
        labels: [],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100',
        comments: 0,
      };

      mockGetIssue.mockResolvedValue({
        data: mockIssue,
      } as never);

      const result = await client.getIssue('owner', 'repo', 100);

      expect(result).toEqual(mockIssue);
      expect(mockGetIssue).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 100,
      });
    });

    it('should handle errors when getting issue', async () => {
      mockGetIssue.mockRejectedValue({
        status: 404,
        message: 'Not found',
      });

      await expect(client.getIssue('owner', 'repo', 999)).rejects.toThrow(ScraperError);
    });
  });

  describe('getIssueComments', () => {
    it('should get all comments for an issue', async () => {
      const mockComments: GitHubComment[] = [
        {
          id: 1,
          body: 'Comment 1',
          user: { login: 'user1', id: 1 },
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100#issuecomment-1',
        },
        {
          id: 2,
          body: 'Comment 2',
          user: { login: 'user2', id: 2 },
          created_at: '2024-01-02T10:00:00Z',
          updated_at: '2024-01-02T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100#issuecomment-2',
        },
      ];

      mockListComments.mockResolvedValue({
        data: mockComments,
      } as never);

      const result = await client.getIssueComments('owner', 'repo', 100);

      expect(result).toEqual(mockComments);
      expect(mockListComments).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 100,
        per_page: 100,
        page: 1,
      });
    });

    it('should paginate through multiple pages of comments', async () => {
      const page1Comments = new Array(100).fill(null).map((_, i) => ({
        id: i,
        body: `Comment ${i}`,
        user: { login: 'user', id: 1 },
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        html_url: `https://github.com/owner/repo/issues/100#issuecomment-${i}`,
      }));

      const page2Comments = new Array(50).fill(null).map((_, i) => ({
        id: i + 100,
        body: `Comment ${i + 100}`,
        user: { login: 'user', id: 1 },
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        html_url: `https://github.com/owner/repo/issues/100#issuecomment-${i + 100}`,
      }));

      mockListComments
        .mockResolvedValueOnce({ data: page1Comments } as never)
        .mockResolvedValueOnce({ data: page2Comments } as never);

      const result = await client.getIssueComments('owner', 'repo', 100);

      expect(result).toHaveLength(150);
      expect(mockListComments).toHaveBeenCalledTimes(2);
      expect(mockListComments).toHaveBeenNthCalledWith(1, {
        owner: 'owner',
        repo: 'repo',
        issue_number: 100,
        per_page: 100,
        page: 1,
      });
      expect(mockListComments).toHaveBeenNthCalledWith(2, {
        owner: 'owner',
        repo: 'repo',
        issue_number: 100,
        per_page: 100,
        page: 2,
      });
    });

    it('should handle errors when getting comments', async () => {
      mockListComments.mockRejectedValue({
        status: 404,
        message: 'Not found',
      });

      await expect(client.getIssueComments('owner', 'repo', 999)).rejects.toThrow(ScraperError);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should get rate limit status', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600;

      mockGetRateLimit.mockResolvedValue({
        data: {
          resources: {
            core: {
              limit: 5000,
              remaining: 4500,
              reset: resetTime,
              used: 500,
            },
          },
        },
      } as never);

      const result = await client.getRateLimitStatus();

      expect(result.limit).toBe(5000);
      expect(result.remaining).toBe(4500);
      expect(result.used).toBe(500);
      expect(result.reset).toEqual(new Date(resetTime * 1000));
    });

    it('should handle errors when getting rate limit', async () => {
      mockGetRateLimit.mockRejectedValue({
        status: 401,
        message: 'Bad credentials',
      });

      await expect(client.getRateLimitStatus()).rejects.toThrow(AuthenticationError);
    });
  });

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      mockGetAuthenticated.mockResolvedValue({
        data: { login: 'testuser' },
      } as never);

      const result = await client.testConnection();

      expect(result).toBe(true);
      expect(mockGetAuthenticated).toHaveBeenCalled();
    });

    it('should throw on authentication failure', async () => {
      mockGetAuthenticated.mockRejectedValue({
        status: 401,
        message: 'Bad credentials',
      });

      await expect(client.testConnection()).rejects.toThrow(AuthenticationError);
    });
  });

  describe('error handling', () => {
    it('should handle generic errors', async () => {
      mockSearchIssues.mockRejectedValue(
        new Error('Generic error')
      );

      await expect(client.searchIssues('test', { perPage: 10 })).rejects.toThrow(ScraperError);
    });

    it('should handle unknown error types', async () => {
      mockSearchIssues.mockRejectedValue('string error');

      await expect(client.searchIssues('test', { perPage: 10 })).rejects.toThrow(ScraperError);
    });
  });
});
