/**
 * Reddit Post to WebSignal Mapper
 *
 * Maps Reddit post data to the WebSignal format.
 */

import { WebSignal, createWebSignal } from '@rgs/core/models/signal';

/**
 * Reddit post data structure from snoowrap
 */
export interface RedditPost {
  /** Unique post ID */
  readonly id: string;

  /** Post title */
  readonly title: string;

  /** Post body text (self-posts only) */
  readonly selftext: string;

  /** Author username */
  readonly author: {
    readonly name: string;
  };

  /** Unix timestamp (seconds) when post was created */
  readonly created_utc: number;

  /** Permalink to the post */
  readonly permalink: string;

  /** Subreddit name (without r/ prefix) */
  readonly subreddit: {
    readonly display_name: string;
  };

  /** Post score (upvotes - downvotes) */
  readonly score: number;

  /** Number of comments */
  readonly num_comments: number;

  /** Upvote ratio (0-1) */
  readonly upvote_ratio: number;

  /** Post URL (for link posts) */
  readonly url: string;

  /** Whether post is a self-post (text post) */
  readonly is_self: boolean;

  /** Whether post was removed */
  readonly removed?: boolean;

  /** Whether post was deleted */
  readonly author_fullname?: string;
}

/**
 * Maps a Reddit post to a WebSignal
 *
 * @param post - Reddit post from snoowrap
 * @returns WebSignal representation of the post
 */
export function mapRedditPostToSignal(post: RedditPost): WebSignal {
  // Combine title and selftext for content
  // For link posts, include the URL in content
  let content: string;
  if (post.is_self) {
    content = `${post.title.trim()}\n\n${post.selftext.trim()}`;
  } else {
    content = `${post.title.trim()}\n\nLink: ${post.url}`;
  }

  // Build full Reddit URL
  const url = `https://reddit.com${post.permalink}`;

  // Convert Unix timestamp (seconds) to Date
  const timestamp = new Date(post.created_utc * 1000);

  // Extract subreddit name
  const subredditName =
    typeof post.subreddit === 'object' && post.subreddit !== null
      ? post.subreddit.display_name
      : String(post.subreddit);

  // Build metadata with Reddit-specific fields
  const metadata: Record<string, unknown> = {
    subreddit: subredditName,
    score: post.score,
    numComments: post.num_comments,
    upvoteRatio: post.upvote_ratio,
    isLink: !post.is_self,
  };

  if (!post.is_self) {
    metadata['linkUrl'] = post.url;
  }

  // Get author name safely
  let authorName: string | undefined;
  if (typeof post.author === 'object' && post.author !== null) {
    authorName = post.author.name;
  } else if (typeof post.author === 'string') {
    authorName = post.author;
  }

  // Create WebSignal with conditional author
  const signalParams: Parameters<typeof createWebSignal>[0] = {
    id: `reddit-${post.id}`,
    source: 'reddit',
    content: content.trim(),
    timestamp,
    url,
    metadata,
  };

  if (authorName !== undefined) {
    signalParams.author = authorName;
  }

  return createWebSignal(signalParams);
}

/**
 * Checks if a Reddit post should be filtered out
 *
 * @param post - Reddit post to check
 * @returns true if post should be filtered out, false otherwise
 */
export function shouldFilterPost(post: RedditPost): boolean {
  // Filter deleted posts (author shows as [deleted])
  if (typeof post.author === 'object' && post.author !== null && post.author.name === '[deleted]') {
    return true;
  }

  // Filter removed posts
  if (post.removed === true) {
    return true;
  }

  // Filter posts with empty content
  if (post.is_self && post.selftext.trim().length === 0 && post.title.trim().length === 0) {
    return true;
  }

  // Filter posts without author fullname (indicates deleted user)
  if (
    post.author_fullname === undefined ||
    post.author_fullname === null ||
    post.author_fullname.trim().length === 0
  ) {
    return true;
  }

  return false;
}

/**
 * Maps multiple Reddit posts to WebSignals, filtering out invalid posts
 *
 * @param posts - Array of Reddit posts
 * @returns Array of WebSignals
 */
export function mapRedditPostsToSignals(posts: RedditPost[]): WebSignal[] {
  return posts.filter((post) => !shouldFilterPost(post)).map((post) => mapRedditPostToSignal(post));
}
