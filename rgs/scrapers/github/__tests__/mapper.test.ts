/**
 * Tests for GitHub mappers
 */

import {
  mapIssueToSignal,
  mapCommentToSignal,
  buildSearchQuery,
  GitHubIssue,
  GitHubComment,
} from '../src/mapper';

describe('Mapper', () => {
  describe('mapIssueToSignal', () => {
    it('should map issue with full data to signal', () => {
      const issue: GitHubIssue = {
        id: 12345,
        number: 100,
        title: 'Performance issue',
        body: 'The app is running slowly',
        state: 'open',
        user: {
          login: 'testuser',
          id: 1,
          type: 'User',
        },
        labels: [
          { id: 1, name: 'bug', color: 'red', description: 'Bug label' },
          { id: 2, name: 'performance', color: 'yellow' },
        ],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-02T10:00:00Z',
        closed_at: null,
        html_url: 'https://github.com/owner/repo/issues/100',
        comments: 5,
        reactions: {
          total_count: 10,
          '+1': 5,
          '-1': 1,
          laugh: 2,
          hooray: 1,
          confused: 0,
          heart: 1,
          rocket: 0,
          eyes: 0,
        },
      };

      const signal = mapIssueToSignal(issue, 'owner/repo');

      expect(signal.id).toBe('github-issue-12345');
      expect(signal.source).toBe('github');
      expect(signal.content).toBe('Performance issue\n\nThe app is running slowly');
      expect(signal.author).toBe('testuser');
      expect(signal.timestamp).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(signal.url).toBe('https://github.com/owner/repo/issues/100');
      expect(signal.metadata).toMatchObject({
        repo: 'owner/repo',
        issueNumber: 100,
        state: 'open',
        labels: ['bug', 'performance'],
        commentsCount: 5,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-02T10:00:00Z',
        reactions: {
          total: 10,
          plusOne: 5,
          minusOne: 1,
          laugh: 2,
          hooray: 1,
          confused: 0,
          heart: 1,
          rocket: 0,
          eyes: 0,
        },
      });
    });

    it('should map issue without body', () => {
      const issue: GitHubIssue = {
        id: 12345,
        number: 100,
        title: 'Performance issue',
        body: null,
        state: 'open',
        user: null,
        labels: [],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-02T10:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100',
        comments: 0,
      };

      const signal = mapIssueToSignal(issue, 'owner/repo');

      expect(signal.content).toBe('Performance issue');
      expect(signal.author).toBeUndefined();
    });

    it('should map issue with empty body', () => {
      const issue: GitHubIssue = {
        id: 12345,
        number: 100,
        title: 'Performance issue',
        body: '   ',
        state: 'open',
        user: null,
        labels: [],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-02T10:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100',
        comments: 0,
      };

      const signal = mapIssueToSignal(issue, 'owner/repo');

      expect(signal.content).toBe('Performance issue');
    });

    it('should map closed issue with closedAt timestamp', () => {
      const issue: GitHubIssue = {
        id: 12345,
        number: 100,
        title: 'Fixed bug',
        body: 'Bug description',
        state: 'closed',
        user: { login: 'testuser', id: 1 },
        labels: [],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-02T10:00:00Z',
        closed_at: '2024-01-03T10:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100',
        comments: 0,
      };

      const signal = mapIssueToSignal(issue, 'owner/repo');

      expect(signal.metadata['closedAt']).toBe('2024-01-03T10:00:00Z');
    });

    it('should map issue without reactions', () => {
      const issue: GitHubIssue = {
        id: 12345,
        number: 100,
        title: 'Issue title',
        body: 'Issue body',
        state: 'open',
        user: { login: 'testuser', id: 1 },
        labels: [],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-02T10:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100',
        comments: 0,
      };

      const signal = mapIssueToSignal(issue, 'owner/repo');

      expect(signal.metadata['reactions']).toBeUndefined();
    });

    it('should handle empty labels array', () => {
      const issue: GitHubIssue = {
        id: 12345,
        number: 100,
        title: 'Issue title',
        body: 'Issue body',
        state: 'open',
        user: { login: 'testuser', id: 1 },
        labels: [],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-02T10:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100',
        comments: 0,
      };

      const signal = mapIssueToSignal(issue, 'owner/repo');

      expect(signal.metadata['labels']).toEqual([]);
    });
  });

  describe('mapCommentToSignal', () => {
    const issue: GitHubIssue = {
      id: 12345,
      number: 100,
      title: 'Issue title',
      body: 'Issue body',
      state: 'open',
      user: { login: 'issueauthor', id: 1 },
      labels: [],
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z',
      html_url: 'https://github.com/owner/repo/issues/100',
      comments: 1,
    };

    it('should map comment with full data to signal', () => {
      const comment: GitHubComment = {
        id: 67890,
        body: 'This is a helpful comment',
        user: {
          login: 'commenter',
          id: 2,
          type: 'User',
        },
        created_at: '2024-01-03T10:00:00Z',
        updated_at: '2024-01-03T11:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100#issuecomment-67890',
        reactions: {
          total_count: 3,
          '+1': 2,
          '-1': 0,
          heart: 1,
        },
      };

      const signal = mapCommentToSignal(comment, issue, 'owner/repo');

      expect(signal.id).toBe('github-comment-67890');
      expect(signal.source).toBe('github');
      expect(signal.content).toBe('This is a helpful comment');
      expect(signal.author).toBe('commenter');
      expect(signal.timestamp).toEqual(new Date('2024-01-03T10:00:00Z'));
      expect(signal.url).toBe('https://github.com/owner/repo/issues/100#issuecomment-67890');
      expect(signal.metadata).toMatchObject({
        repo: 'owner/repo',
        issueNumber: 100,
        issueTitle: 'Issue title',
        issueState: 'open',
        commentId: 67890,
        createdAt: '2024-01-03T10:00:00Z',
        updatedAt: '2024-01-03T11:00:00Z',
        reactions: {
          total: 3,
          plusOne: 2,
          minusOne: 0,
          heart: 1,
        },
      });
    });

    it('should map comment without body', () => {
      const comment: GitHubComment = {
        id: 67890,
        body: null,
        user: { login: 'commenter', id: 2 },
        created_at: '2024-01-03T10:00:00Z',
        updated_at: '2024-01-03T11:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100#issuecomment-67890',
      };

      const signal = mapCommentToSignal(comment, issue, 'owner/repo');

      expect(signal.content).toBe('');
    });

    it('should map comment without user', () => {
      const comment: GitHubComment = {
        id: 67890,
        body: 'Anonymous comment',
        user: null,
        created_at: '2024-01-03T10:00:00Z',
        updated_at: '2024-01-03T11:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100#issuecomment-67890',
      };

      const signal = mapCommentToSignal(comment, issue, 'owner/repo');

      expect(signal.author).toBeUndefined();
    });

    it('should map comment without reactions', () => {
      const comment: GitHubComment = {
        id: 67890,
        body: 'Comment body',
        user: { login: 'commenter', id: 2 },
        created_at: '2024-01-03T10:00:00Z',
        updated_at: '2024-01-03T11:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100#issuecomment-67890',
      };

      const signal = mapCommentToSignal(comment, issue, 'owner/repo');

      expect(signal.metadata['reactions']).toBeUndefined();
    });

    it('should trim whitespace from comment body', () => {
      const comment: GitHubComment = {
        id: 67890,
        body: '   Comment with whitespace   ',
        user: { login: 'commenter', id: 2 },
        created_at: '2024-01-03T10:00:00Z',
        updated_at: '2024-01-03T11:00:00Z',
        html_url: 'https://github.com/owner/repo/issues/100#issuecomment-67890',
      };

      const signal = mapCommentToSignal(comment, issue, 'owner/repo');

      expect(signal.content).toBe('Comment with whitespace');
    });
  });

  describe('buildSearchQuery', () => {
    it('should build query for single repo', () => {
      const query = buildSearchQuery(['microsoft/vscode'], 'performance', 'open');

      expect(query).toBe('performance repo:microsoft/vscode is:issue state:open');
    });

    it('should build query for multiple repos', () => {
      const query = buildSearchQuery(
        ['microsoft/vscode', 'cursor/cursor'],
        'bug',
        'all'
      );

      expect(query).toBe('bug repo:microsoft/vscode repo:cursor/cursor is:issue state:all');
    });

    it('should handle different states', () => {
      const openQuery = buildSearchQuery(['owner/repo'], 'test', 'open');
      const closedQuery = buildSearchQuery(['owner/repo'], 'test', 'closed');
      const allQuery = buildSearchQuery(['owner/repo'], 'test', 'all');

      expect(openQuery).toContain('state:open');
      expect(closedQuery).toContain('state:closed');
      expect(allQuery).toContain('state:all');
    });

    it('should preserve keyword spacing', () => {
      const query = buildSearchQuery(['owner/repo'], 'slow performance issue', 'open');

      expect(query).toContain('slow performance issue');
    });

    it('should handle special characters in keywords', () => {
      const query = buildSearchQuery(['owner/repo'], 'bug: "memory leak"', 'open');

      expect(query).toContain('bug: "memory leak"');
    });
  });
});
