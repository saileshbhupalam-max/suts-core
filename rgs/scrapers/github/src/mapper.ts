/**
 * RGS GitHub Scraper - Mappers
 *
 * Maps GitHub API responses to WebSignal format.
 */

import { WebSignal, createWebSignal } from '@rgs/core';

/**
 * GitHub user information
 */
export interface GitHubUser {
  readonly login: string;
  readonly id: number;
  readonly type?: string;
}

/**
 * GitHub label information
 */
export interface GitHubLabel {
  readonly id: number;
  readonly name: string;
  readonly color?: string;
  readonly description?: string;
}

/**
 * GitHub reactions
 */
export interface GitHubReactions {
  readonly url?: string;
  readonly total_count?: number;
  readonly '+1'?: number;
  readonly '-1'?: number;
  readonly laugh?: number;
  readonly hooray?: number;
  readonly confused?: number;
  readonly heart?: number;
  readonly rocket?: number;
  readonly eyes?: number;
}

/**
 * GitHub issue from API response
 */
export interface GitHubIssue {
  readonly id: number;
  readonly number: number;
  readonly title: string;
  readonly body?: string | null;
  readonly state: string;
  readonly user: GitHubUser | null;
  readonly labels: readonly GitHubLabel[];
  readonly created_at: string;
  readonly updated_at: string;
  readonly closed_at?: string | null;
  readonly html_url: string;
  readonly comments: number;
  readonly reactions?: GitHubReactions;
  readonly repository_url?: string;
}

/**
 * GitHub comment from API response
 */
export interface GitHubComment {
  readonly id: number;
  readonly body: string | null;
  readonly user: GitHubUser | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly html_url: string;
  readonly reactions?: GitHubReactions;
}

/**
 * Maps a GitHub issue to a WebSignal
 *
 * @param issue - GitHub issue from API
 * @param repo - Repository name (owner/repo)
 * @returns WebSignal representation of the issue
 */
export function mapIssueToSignal(issue: GitHubIssue, repo: string): WebSignal {
  // Combine title and body for content
  const title = issue.title.trim();
  const body = issue.body?.trim() ?? '';
  const content = body.length > 0 ? `${title}\n\n${body}` : title;

  // Extract label names
  const labels = issue.labels.map((label) => label.name);

  // Build metadata
  const metadata: Record<string, unknown> = {
    repo,
    issueNumber: issue.number,
    state: issue.state,
    labels,
    commentsCount: issue.comments,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  };

  // Add optional fields if present
  if (issue.closed_at !== undefined && issue.closed_at !== null) {
    metadata['closedAt'] = issue.closed_at;
  }

  // Add reactions if present
  if (issue.reactions !== undefined) {
    metadata['reactions'] = {
      total: issue.reactions.total_count ?? 0,
      plusOne: issue.reactions['+1'] ?? 0,
      minusOne: issue.reactions['-1'] ?? 0,
      laugh: issue.reactions.laugh ?? 0,
      hooray: issue.reactions.hooray ?? 0,
      confused: issue.reactions.confused ?? 0,
      heart: issue.reactions.heart ?? 0,
      rocket: issue.reactions.rocket ?? 0,
      eyes: issue.reactions.eyes ?? 0,
    };
  }

  const author = issue.user?.login;

  return createWebSignal({
    id: `github-issue-${issue.id}`,
    source: 'github',
    content,
    timestamp: new Date(issue.created_at),
    url: issue.html_url,
    metadata,
    ...(author !== undefined && { author }),
  });
}

/**
 * Maps a GitHub comment to a WebSignal
 *
 * @param comment - GitHub comment from API
 * @param issue - The issue this comment belongs to
 * @param repo - Repository name (owner/repo)
 * @returns WebSignal representation of the comment
 */
export function mapCommentToSignal(
  comment: GitHubComment,
  issue: GitHubIssue,
  repo: string
): WebSignal {
  // Use comment body as content
  const content = comment.body?.trim() ?? '';

  // Build metadata
  const metadata: Record<string, unknown> = {
    repo,
    issueNumber: issue.number,
    issueTitle: issue.title,
    issueState: issue.state,
    commentId: comment.id,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  };

  // Add reactions if present
  if (comment.reactions !== undefined) {
    metadata['reactions'] = {
      total: comment.reactions.total_count ?? 0,
      plusOne: comment.reactions['+1'] ?? 0,
      minusOne: comment.reactions['-1'] ?? 0,
      laugh: comment.reactions.laugh ?? 0,
      hooray: comment.reactions.hooray ?? 0,
      confused: comment.reactions.confused ?? 0,
      heart: comment.reactions.heart ?? 0,
      rocket: comment.reactions.rocket ?? 0,
      eyes: comment.reactions.eyes ?? 0,
    };
  }

  const author = comment.user?.login;

  return createWebSignal({
    id: `github-comment-${comment.id}`,
    source: 'github',
    content,
    timestamp: new Date(comment.created_at),
    url: comment.html_url,
    metadata,
    ...(author !== undefined && { author }),
  });
}

/**
 * Builds a GitHub search query string
 *
 * @param repos - List of repositories (owner/repo)
 * @param keyword - Search keyword
 * @param state - Issue state filter
 * @returns GitHub search query string
 */
export function buildSearchQuery(
  repos: readonly string[],
  keyword: string,
  state: string
): string {
  const repoFilter = repos.map((r) => `repo:${r}`).join(' ');
  return `${keyword} ${repoFilter} is:issue state:${state}`;
}
