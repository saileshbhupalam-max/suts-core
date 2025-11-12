/**
 * Tests for Reddit Post Mapper
 */

import {
  RedditPost,
  mapRedditPostToSignal,
  shouldFilterPost,
  mapRedditPostsToSignals,
} from '../src/mapper';

describe('RedditMapper', () => {
  const createMockPost = (overrides?: Partial<RedditPost>): RedditPost => ({
    id: 'test123',
    title: 'Test Post Title',
    selftext: 'This is the post body text.',
    author: { name: 'testuser' },
    created_utc: 1699999999,
    permalink: '/r/vscode/comments/test123/test_post/',
    subreddit: { display_name: 'vscode' },
    score: 100,
    num_comments: 25,
    upvote_ratio: 0.95,
    url: 'https://reddit.com/r/vscode/comments/test123/test_post/',
    is_self: true,
    author_fullname: 't2_testuser',
    ...overrides,
  });

  describe('mapRedditPostToSignal', () => {
    it('should map a self-post to WebSignal correctly', () => {
      const post = createMockPost();
      const signal = mapRedditPostToSignal(post);

      expect(signal.id).toBe('reddit-test123');
      expect(signal.source).toBe('reddit');
      expect(signal.content).toBe('Test Post Title\n\nThis is the post body text.');
      expect(signal.url).toBe('https://reddit.com/r/vscode/comments/test123/test_post/');
      expect(signal.timestamp).toEqual(new Date(1699999999 * 1000));
      expect(signal.author).toBe('testuser');
      expect(signal.metadata).toEqual({
        subreddit: 'vscode',
        score: 100,
        numComments: 25,
        upvoteRatio: 0.95,
        isLink: false,
      });
    });

    it('should map a link post to WebSignal correctly', () => {
      const post = createMockPost({
        is_self: false,
        selftext: '',
        url: 'https://example.com/article',
      });
      const signal = mapRedditPostToSignal(post);

      expect(signal.content).toBe('Test Post Title\n\nLink: https://example.com/article');
      expect(signal.metadata['isLink']).toBe(true);
      expect(signal.metadata['linkUrl']).toBe('https://example.com/article');
    });

    it('should handle author as string', () => {
      const post = createMockPost({
        author: 'stringauthor' as unknown as { name: string },
      });
      const signal = mapRedditPostToSignal(post);

      expect(signal.author).toBe('stringauthor');
    });

    it('should handle subreddit as string', () => {
      const post = createMockPost({
        subreddit: 'programming' as unknown as { display_name: string },
      });
      const signal = mapRedditPostToSignal(post);

      expect(signal.metadata['subreddit']).toBe('programming');
    });

    it('should handle missing author gracefully', () => {
      const post = createMockPost({
        author: undefined as unknown as { name: string },
      });
      const signal = mapRedditPostToSignal(post);

      expect(signal.author).toBeUndefined();
    });

    it('should trim content whitespace', () => {
      const post = createMockPost({
        title: '  Title with spaces  ',
        selftext: '  Body with spaces  ',
      });
      const signal = mapRedditPostToSignal(post);

      expect(signal.content).toBe('Title with spaces\n\nBody with spaces');
    });
  });

  describe('shouldFilterPost', () => {
    it('should not filter valid posts', () => {
      const post = createMockPost();
      expect(shouldFilterPost(post)).toBe(false);
    });

    it('should filter deleted posts', () => {
      const post = createMockPost({
        author: { name: '[deleted]' },
      });
      expect(shouldFilterPost(post)).toBe(true);
    });

    it('should filter removed posts', () => {
      const post = createMockPost({
        removed: true,
      });
      expect(shouldFilterPost(post)).toBe(true);
    });

    it('should filter posts with empty content and title', () => {
      const post = createMockPost({
        is_self: true,
        title: '   ',
        selftext: '   ',
      });
      expect(shouldFilterPost(post)).toBe(true);
    });

    it('should filter posts without author_fullname', () => {
      const post = {
        ...createMockPost(),
      } as RedditPost;
      // Remove author_fullname property
      delete (post as { author_fullname?: string }).author_fullname;
      expect(shouldFilterPost(post)).toBe(true);
    });

    it('should filter posts with empty author_fullname', () => {
      const post = createMockPost({
        author_fullname: '',
      });
      expect(shouldFilterPost(post)).toBe(true);
    });

    it('should not filter link posts with empty selftext', () => {
      const post = createMockPost({
        is_self: false,
        selftext: '',
        title: 'Valid Link Post',
      });
      expect(shouldFilterPost(post)).toBe(false);
    });
  });

  describe('mapRedditPostsToSignals', () => {
    it('should map multiple posts and filter invalid ones', () => {
      const posts: RedditPost[] = [
        createMockPost({ id: 'post1' }),
        createMockPost({ id: 'post2', author: { name: '[deleted]' } }), // Should be filtered
        createMockPost({ id: 'post3', removed: true }), // Should be filtered
        createMockPost({ id: 'post4' }),
      ];

      const signals = mapRedditPostsToSignals(posts);

      expect(signals).toHaveLength(2);
      expect(signals[0]?.id).toBe('reddit-post1');
      expect(signals[1]?.id).toBe('reddit-post4');
    });

    it('should return empty array for empty input', () => {
      const signals = mapRedditPostsToSignals([]);
      expect(signals).toEqual([]);
    });

    it('should filter out all invalid posts', () => {
      const postWithoutAuthorFullname = { ...createMockPost() } as RedditPost;
      delete (postWithoutAuthorFullname as { author_fullname?: string }).author_fullname;

      const posts: RedditPost[] = [
        createMockPost({ author: { name: '[deleted]' } }),
        createMockPost({ removed: true }),
        postWithoutAuthorFullname,
      ];

      const signals = mapRedditPostsToSignals(posts);
      expect(signals).toEqual([]);
    });

    it('should preserve all valid posts', () => {
      const posts: RedditPost[] = [
        createMockPost({ id: 'post1' }),
        createMockPost({ id: 'post2' }),
        createMockPost({ id: 'post3' }),
      ];

      const signals = mapRedditPostsToSignals(posts);
      expect(signals).toHaveLength(3);
    });
  });
});
