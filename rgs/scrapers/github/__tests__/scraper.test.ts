/**
 * Tests for GitHub scraper
 */

/* eslint-disable @typescript-eslint/unbound-method */

import { GitHubScraper } from '../src/scraper';
import { GitHubClient } from '../src/client';
import { createGitHubConfig } from '../src/config';
import type { GitHubIssue, GitHubComment } from '../src/mapper';

// Mock the GitHubClient
jest.mock('../src/client');

describe('GitHubScraper', () => {
  let mockClient: jest.Mocked<GitHubClient>;
  let scraper: GitHubScraper;

  const mockConfig = createGitHubConfig({
    token: 'ghp_test_token',
    repos: ['owner/repo'],
    queries: ['performance'],
    includeComments: true,
    state: 'all',
    maxIssuesPerQuery: 10,
  });

  beforeEach(() => {
    // Create mock client
    mockClient = {
      searchIssues: jest.fn(),
      getIssue: jest.fn(),
      getIssueComments: jest.fn(),
      getRateLimitStatus: jest.fn(),
      testConnection: jest.fn(),
    } as unknown as jest.Mocked<GitHubClient>;

    // Mock GitHubClient constructor
    (GitHubClient as jest.MockedClass<typeof GitHubClient>).mockImplementation(() => mockClient);

    // Create scraper
    scraper = new GitHubScraper(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scrape', () => {
    it('should scrape issues successfully', async () => {
      const mockIssues: GitHubIssue[] = [
        {
          id: 1,
          number: 100,
          title: 'Performance issue',
          body: 'App is slow',
          state: 'open',
          user: { login: 'user1', id: 1 },
          labels: [{ id: 1, name: 'bug' }],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100',
          comments: 0,
        },
      ];

      mockClient.searchIssues.mockResolvedValue(mockIssues);

      const signals = await scraper.scrape();

      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('github-issue-1');
      expect(signals[0]?.source).toBe('github');
      expect(signals[0]?.content).toContain('Performance issue');
      expect(signals[0]?.author).toBe('user1');
      expect(mockClient.searchIssues).toHaveBeenCalledWith(
        'performance repo:owner/repo is:issue state:all',
        expect.objectContaining({
          perPage: 10,
          page: 1,
        })
      );
    });

    it('should scrape issues and comments when includeComments is true', async () => {
      const mockIssues: GitHubIssue[] = [
        {
          id: 1,
          number: 100,
          title: 'Issue with comments',
          body: 'Issue body',
          state: 'open',
          user: { login: 'user1', id: 1 },
          labels: [],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100',
          comments: 2,
        },
      ];

      const mockComments: GitHubComment[] = [
        {
          id: 10,
          body: 'First comment',
          user: { login: 'commenter1', id: 2 },
          created_at: '2024-01-02T10:00:00Z',
          updated_at: '2024-01-02T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100#issuecomment-10',
        },
        {
          id: 11,
          body: 'Second comment',
          user: { login: 'commenter2', id: 3 },
          created_at: '2024-01-03T10:00:00Z',
          updated_at: '2024-01-03T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100#issuecomment-11',
        },
      ];

      mockClient.searchIssues.mockResolvedValue(mockIssues);
      mockClient.getIssueComments.mockResolvedValue(mockComments);

      const signals = await scraper.scrape();

      // Should have 1 issue + 2 comments = 3 signals
      expect(signals).toHaveLength(3);
      expect(signals[0]?.id).toBe('github-issue-1');
      expect(signals[1]?.id).toBe('github-comment-10');
      expect(signals[2]?.id).toBe('github-comment-11');
      expect(mockClient.getIssueComments).toHaveBeenCalledWith('owner', 'repo', 100);
    });

    it('should not fetch comments when includeComments is false', async () => {
      const configNoComments = createGitHubConfig({
        ...mockConfig,
        includeComments: false,
      });
      const scraperNoComments = new GitHubScraper(configNoComments);

      const mockIssues: GitHubIssue[] = [
        {
          id: 1,
          number: 100,
          title: 'Issue',
          body: 'Body',
          state: 'open',
          user: { login: 'user1', id: 1 },
          labels: [],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100',
          comments: 5,
        },
      ];

      mockClient.searchIssues.mockResolvedValue(mockIssues);

      const signals = await scraperNoComments.scrape();

      expect(signals).toHaveLength(1);
      expect(mockClient.getIssueComments).not.toHaveBeenCalled();
    });

    it('should not fetch comments for issues with zero comments', async () => {
      const mockIssues: GitHubIssue[] = [
        {
          id: 1,
          number: 100,
          title: 'Issue',
          body: 'Body',
          state: 'open',
          user: { login: 'user1', id: 1 },
          labels: [],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100',
          comments: 0,
        },
      ];

      mockClient.searchIssues.mockResolvedValue(mockIssues);

      const signals = await scraper.scrape();

      expect(signals).toHaveLength(1);
      expect(mockClient.getIssueComments).not.toHaveBeenCalled();
    });

    it('should deduplicate signals by ID', async () => {
      // Return same issue twice (simulating duplicate from multiple queries)
      const mockIssue: GitHubIssue = {
        id: 1,
        number: 100,
        title: 'Duplicate issue',
        body: 'Body',
        state: 'open',
        user: { login: 'user1', id: 1 },
        labels: [],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100',
        comments: 0,
      };

      mockClient.searchIssues.mockResolvedValue([mockIssue, mockIssue]);

      const signals = await scraper.scrape();

      // Should only have one signal despite duplicate
      expect(signals).toHaveLength(1);
    });

    it('should process multiple queries', async () => {
      const multiQueryConfig = createGitHubConfig({
        token: 'ghp_test_token',
        repos: ['owner/repo'],
        queries: ['performance', 'bug'],
        includeComments: false,
      });
      const multiQueryScraper = new GitHubScraper(multiQueryConfig);

      const mockIssues1: GitHubIssue[] = [
        {
          id: 1,
          number: 100,
          title: 'Performance',
          body: 'Body',
          state: 'open',
          user: { login: 'user1', id: 1 },
          labels: [],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100',
          comments: 0,
        },
      ];

      const mockIssues2: GitHubIssue[] = [
        {
          id: 2,
          number: 101,
          title: 'Bug',
          body: 'Body',
          state: 'open',
          user: { login: 'user2', id: 2 },
          labels: [],
          created_at: '2024-01-02T10:00:00Z',
          updated_at: '2024-01-02T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/101',
          comments: 0,
        },
      ];

      mockClient.searchIssues
        .mockResolvedValueOnce(mockIssues1)
        .mockResolvedValueOnce(mockIssues2);

      const signals = await multiQueryScraper.scrape();

      expect(signals).toHaveLength(2);
      expect(mockClient.searchIssues).toHaveBeenCalledTimes(2);
    });

    it('should filter out invalid signals', async () => {
      const mockIssues: GitHubIssue[] = [
        {
          id: 1,
          number: 100,
          title: '',  // Invalid - empty title
          body: '',
          state: 'open',
          user: { login: 'user1', id: 1 },
          labels: [],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100',
          comments: 0,
        },
      ];

      mockClient.searchIssues.mockResolvedValue(mockIssues);

      const signals = await scraper.scrape();

      // Should filter out invalid signal
      expect(signals).toHaveLength(0);
    });

    it('should handle errors when fetching comments gracefully', async () => {
      const mockIssues: GitHubIssue[] = [
        {
          id: 1,
          number: 100,
          title: 'Issue',
          body: 'Body',
          state: 'open',
          user: { login: 'user1', id: 1 },
          labels: [],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://github.com/owner/repo/issues/100',
          comments: 2,
        },
      ];

      mockClient.searchIssues.mockResolvedValue(mockIssues);
      mockClient.getIssueComments.mockRejectedValue(new Error('API error'));

      // Should not throw, but return issue without comments
      const signals = await scraper.scrape();

      expect(signals).toHaveLength(1);
      expect(signals[0]?.id).toBe('github-issue-1');
    });

    it('should handle issues without repository URL', async () => {
      const mockIssues: GitHubIssue[] = [
        {
          id: 1,
          number: 100,
          title: 'Issue',
          body: 'Body',
          state: 'open',
          user: { login: 'user1', id: 1 },
          labels: [],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          html_url: 'https://invalid-url',  // Invalid URL format
          comments: 0,
        },
      ];

      mockClient.searchIssues.mockResolvedValue(mockIssues);

      const signals = await scraper.scrape();

      // Should skip issue with invalid repo
      expect(signals).toHaveLength(0);
    });

    it('should propagate search errors', async () => {
      mockClient.searchIssues.mockRejectedValue(new Error('API error'));

      await expect(scraper.scrape()).rejects.toThrow('API error');
    });
  });

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      mockClient.testConnection.mockResolvedValue(true);

      const result = await scraper.testConnection();

      expect(result).toBe(true);
      expect(mockClient.testConnection).toHaveBeenCalled();
    });

    it('should return false on failed connection', async () => {
      mockClient.testConnection.mockRejectedValue(new Error('Connection failed'));

      const result = await scraper.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('validate', () => {
    it('should validate valid GitHub signal', () => {
      const signal = {
        id: 'github-issue-1',
        source: 'github' as const,
        content: 'Valid content',
        timestamp: new Date(),
        url: 'https://github.com/owner/repo/issues/100',
        metadata: {},
      };

      expect(scraper.validate(signal)).toBe(true);
    });

    it('should reject signal with wrong source', () => {
      const signal = {
        id: 'reddit-post-1',
        source: 'reddit' as const,
        content: 'Content',
        timestamp: new Date(),
        url: 'https://reddit.com/r/test',
        metadata: {},
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal with invalid GitHub URL', () => {
      const signal = {
        id: 'github-issue-1',
        source: 'github' as const,
        content: 'Content',
        timestamp: new Date(),
        url: 'https://example.com/issues/100',
        metadata: {},
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal with empty content', () => {
      const signal = {
        id: 'github-issue-1',
        source: 'github' as const,
        content: '',
        timestamp: new Date(),
        url: 'https://github.com/owner/repo/issues/100',
        metadata: {},
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should reject signal with empty ID', () => {
      const signal = {
        id: '',
        source: 'github' as const,
        content: 'Content',
        timestamp: new Date(),
        url: 'https://github.com/owner/repo/issues/100',
        metadata: {},
      };

      expect(scraper.validate(signal)).toBe(false);
    });

    it('should accept api.github.com URLs', () => {
      const signal = {
        id: 'github-issue-1',
        source: 'github' as const,
        content: 'Content',
        timestamp: new Date(),
        url: 'https://api.github.com/repos/owner/repo/issues/100',
        metadata: {},
      };

      expect(scraper.validate(signal)).toBe(true);
    });
  });
});
