/**
 * Tests for QualityScorer
 */

import { QualityScorer } from '../src/quality';
import { createWebSignal } from '@rgs/core/models/signal';

describe('QualityScorer', () => {
  let scorer: QualityScorer;

  beforeEach(() => {
    scorer = new QualityScorer();
  });

  describe('score', () => {
    it('should return scores between 0 and 1', () => {
      const signal = createWebSignal({
        id: 'test-1',
        source: 'reddit',
        content: 'This is a test post with reasonable length for quality scoring',
        timestamp: new Date(),
        url: 'https://reddit.com/test',
        metadata: { score: 50 },
      });

      const result = scorer.score(signal);

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(1);
      expect(result.breakdown.length).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.metadata).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.engagement).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.recency).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.authority).toBeGreaterThanOrEqual(0);
    });

    it('should score Reddit signals by upvotes', () => {
      const highScore = createWebSignal({
        id: 'reddit-1',
        source: 'reddit',
        content: 'A great discussion about TypeScript types and interfaces',
        timestamp: new Date(),
        url: 'https://reddit.com/r/typescript/test',
        metadata: { score: 150 },
        author: 'typescript_expert',
      });

      const lowScore = createWebSignal({
        id: 'reddit-2',
        source: 'reddit',
        content: 'A mediocre post with low engagement',
        timestamp: new Date(),
        url: 'https://reddit.com/r/typescript/test2',
        metadata: { score: 5 },
        author: 'newbie',
      });

      const highResult = scorer.score(highScore);
      const lowResult = scorer.score(lowScore);

      expect(highResult.breakdown.engagement).toBeGreaterThan(lowResult.breakdown.engagement);
      expect(highResult.overall).toBeGreaterThan(lowResult.overall);
    });

    it('should score Twitter signals by likes', () => {
      const highLikes = createWebSignal({
        id: 'twitter-1',
        source: 'twitter',
        content: 'Excited to announce our new TypeScript library!',
        timestamp: new Date(),
        url: 'https://twitter.com/user/status/123',
        metadata: { likeCount: 75 },
        author: 'tech_influencer',
      });

      const lowLikes = createWebSignal({
        id: 'twitter-2',
        source: 'twitter',
        content: 'Random tweet',
        timestamp: new Date(),
        url: 'https://twitter.com/user/status/124',
        metadata: { likeCount: 2 },
        author: 'random_user',
      });

      const highResult = scorer.score(highLikes);
      const lowResult = scorer.score(lowLikes);

      expect(highResult.breakdown.engagement).toBeGreaterThan(lowResult.breakdown.engagement);
    });

    it('should score GitHub signals by reactions', () => {
      const highReactions = createWebSignal({
        id: 'github-1',
        source: 'github',
        content: 'This is a critical bug that affects many users',
        timestamp: new Date(),
        url: 'https://github.com/owner/repo/issues/123',
        metadata: {
          reactions: {
            plusOne: 15,
            heart: 5,
            hooray: 3,
            rocket: 2,
            eyes: 1,
          },
        },
        author: 'contributor',
      });

      const lowReactions = createWebSignal({
        id: 'github-2',
        source: 'github',
        content: 'Minor documentation typo',
        timestamp: new Date(),
        url: 'https://github.com/owner/repo/issues/124',
        metadata: {
          reactions: {
            plusOne: 1,
          },
        },
        author: 'contributor2',
      });

      const highResult = scorer.score(highReactions);
      const lowResult = scorer.score(lowReactions);

      expect(highResult.breakdown.engagement).toBeGreaterThan(lowResult.breakdown.engagement);
    });

    it('should score HN signals by points', () => {
      const highPoints = createWebSignal({
        id: 'hn-1',
        source: 'hackernews',
        content: 'Show HN: I built a new tool for developers',
        timestamp: new Date(),
        url: 'https://news.ycombinator.com/item?id=123',
        metadata: { points: 100 },
        author: 'hacker',
      });

      const lowPoints = createWebSignal({
        id: 'hn-2',
        source: 'hackernews',
        content: 'Ask HN: Basic question',
        timestamp: new Date(),
        url: 'https://news.ycombinator.com/item?id=124',
        metadata: { points: 3 },
        author: 'newbie',
      });

      const highResult = scorer.score(highPoints);
      const lowResult = scorer.score(lowPoints);

      expect(highResult.breakdown.engagement).toBeGreaterThan(lowResult.breakdown.engagement);
    });

    it('should score recency correctly', () => {
      const recent = createWebSignal({
        id: 'recent-1',
        source: 'reddit',
        content: 'Recent post',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        url: 'https://reddit.com/test',
        metadata: {},
      });

      const old = createWebSignal({
        id: 'old-1',
        source: 'reddit',
        content: 'Old post',
        timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        url: 'https://reddit.com/test2',
        metadata: {},
      });

      const recentResult = scorer.score(recent);
      const oldResult = scorer.score(old);

      expect(recentResult.breakdown.recency).toBeGreaterThan(oldResult.breakdown.recency);
      expect(recentResult.breakdown.recency).toBe(1.0); // 0-7 days
      expect(oldResult.breakdown.recency).toBe(0.4); // >90 days
    });

    it('should penalize very short content', () => {
      const shortContent = createWebSignal({
        id: 'short-1',
        source: 'reddit',
        content: 'Too short',
        timestamp: new Date(),
        url: 'https://reddit.com/test',
        metadata: {},
      });

      const goodContent = createWebSignal({
        id: 'good-1',
        source: 'reddit',
        content:
          'This is a well-written post with good length and meaningful content that provides value to readers and deserves a higher quality score',
        timestamp: new Date(),
        url: 'https://reddit.com/test2',
        metadata: {},
      });

      const shortResult = scorer.score(shortContent);
      const goodResult = scorer.score(goodContent);

      expect(shortResult.breakdown.length).toBeLessThan(goodResult.breakdown.length);
      expect(shortResult.breakdown.length).toBe(0.2); // <50 chars
    });

    it('should score very long content appropriately', () => {
      const veryLongContent = createWebSignal({
        id: 'very-long-1',
        source: 'reddit',
        content: 'a'.repeat(2500), // >2000 chars
        timestamp: new Date(),
        url: 'https://reddit.com/test',
        metadata: {},
      });

      const longContent = createWebSignal({
        id: 'long-1',
        source: 'reddit',
        content: 'b'.repeat(1000), // 500-2000 chars
        timestamp: new Date(),
        url: 'https://reddit.com/test2',
        metadata: {},
      });

      const veryLongResult = scorer.score(veryLongContent);
      const longResult = scorer.score(longContent);

      expect(veryLongResult.breakdown.length).toBe(0.8); // >2000 chars
      expect(longResult.breakdown.length).toBe(0.9); // 500-2000 chars
    });

    it('should score metadata richness', () => {
      const richMetadata = createWebSignal({
        id: 'rich-1',
        source: 'reddit',
        content: 'Post with rich metadata',
        timestamp: new Date(),
        url: 'https://reddit.com/test',
        metadata: {
          score: 50,
          comments: 25,
          awards: 3,
          subreddit: 'typescript',
          author_flair: 'expert',
          gilded: 1,
          stickied: false,
          locked: false,
          archived: false,
          permalink: '/r/typescript/test',
        },
      });

      const poorMetadata = createWebSignal({
        id: 'poor-1',
        source: 'reddit',
        content: 'Post with minimal metadata',
        timestamp: new Date(),
        url: 'https://reddit.com/test2',
        metadata: {},
      });

      const richResult = scorer.score(richMetadata);
      const poorResult = scorer.score(poorMetadata);

      expect(richResult.breakdown.metadata).toBeGreaterThan(poorResult.breakdown.metadata);
      expect(richResult.breakdown.metadata).toBe(1.0); // 10+ fields
      expect(poorResult.breakdown.metadata).toBe(0); // 0 fields
    });

    it('should score author authority', () => {
      const withAuthor = createWebSignal({
        id: 'with-author',
        source: 'reddit',
        content: 'Post by known author',
        timestamp: new Date(),
        url: 'https://reddit.com/test',
        metadata: {},
        author: 'expert_user',
      });

      const withoutAuthor = createWebSignal({
        id: 'without-author',
        source: 'reddit',
        content: 'Anonymous post',
        timestamp: new Date(),
        url: 'https://reddit.com/test2',
        metadata: {},
      });

      const withAuthorResult = scorer.score(withAuthor);
      const withoutAuthorResult = scorer.score(withoutAuthor);

      expect(withAuthorResult.breakdown.authority).toBeGreaterThan(
        withoutAuthorResult.breakdown.authority
      );
      expect(withAuthorResult.breakdown.authority).toBe(0.7);
      expect(withoutAuthorResult.breakdown.authority).toBe(0.5);
    });

    it('should compute overall score as weighted average', () => {
      const signal = createWebSignal({
        id: 'test-1',
        source: 'reddit',
        content: 'This is a test post with reasonable length for quality scoring purposes',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        url: 'https://reddit.com/test',
        metadata: { score: 50, comments: 10, subreddit: 'test' },
        author: 'test_user',
      });

      const result = scorer.score(signal);

      // Verify weighted average: 0.2*length + 0.15*metadata + 0.3*engagement + 0.15*recency + 0.2*authority
      const expected =
        0.2 * result.breakdown.length +
        0.15 * result.breakdown.metadata +
        0.3 * result.breakdown.engagement +
        0.15 * result.breakdown.recency +
        0.2 * result.breakdown.authority;

      expect(result.overall).toBeCloseTo(expected, 5);
    });
  });
});
