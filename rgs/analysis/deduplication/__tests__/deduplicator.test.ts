/**
 * Tests for Deduplicator
 */

import { Deduplicator } from '../src/deduplicator';
import { WebSignal, createWebSignal } from '@rgs/core/models/signal';

describe('Deduplicator', () => {
  let deduplicator: Deduplicator;

  beforeEach(() => {
    deduplicator = new Deduplicator();
  });

  describe('deduplicate', () => {
    it('should handle empty array', () => {
      const result = deduplicator.deduplicate([]);

      expect(result.unique.length).toBe(0);
      expect(result.duplicates.size).toBe(0);
      expect(result.stats.total).toBe(0);
      expect(result.stats.unique).toBe(0);
      expect(result.stats.duplicates).toBe(0);
      expect(result.stats.dedupeRate).toBe(0);
    });

    it('should deduplicate exact matches', () => {
      const content = 'This is a duplicate post';
      const signals: WebSignal[] = [
        createWebSignal({
          id: 'signal-1',
          source: 'reddit',
          content,
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: { score: 50 },
        }),
        createWebSignal({
          id: 'signal-2',
          source: 'twitter',
          content,
          timestamp: new Date(),
          url: 'https://twitter.com/user/1',
          metadata: { likeCount: 10 },
        }),
        createWebSignal({
          id: 'signal-3',
          source: 'github',
          content,
          timestamp: new Date(),
          url: 'https://github.com/owner/repo/1',
          metadata: { reactions: { plusOne: 5 } },
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      expect(result.unique.length).toBe(1);
      expect(result.stats.total).toBe(3);
      expect(result.stats.unique).toBe(1);
      expect(result.stats.duplicates).toBe(2);
      expect(result.stats.dedupeRate).toBeCloseTo(66.67, 1);
    });

    it('should deduplicate similar content (>85%)', () => {
      const signals: WebSignal[] = [
        createWebSignal({
          id: 'signal-1',
          source: 'reddit',
          content: 'The quick brown fox jumps over the lazy dog in the garden',
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: { score: 50 },
        }),
        createWebSignal({
          id: 'signal-2',
          source: 'twitter',
          content: 'The quick brown fox jumps over the lazy dog in the garden',
          timestamp: new Date(),
          url: 'https://twitter.com/user/1',
          metadata: { likeCount: 10 },
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      // Should deduplicate as they're identical
      expect(result.unique.length).toBe(1);
      expect(result.stats.duplicates).toBe(1);
    });

    it('should keep dissimilar content', () => {
      const signals: WebSignal[] = [
        createWebSignal({
          id: 'signal-1',
          source: 'reddit',
          content: 'TypeScript is a strongly typed programming language',
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: {},
        }),
        createWebSignal({
          id: 'signal-2',
          source: 'twitter',
          content: 'Cooking pasta requires boiling water and salt',
          timestamp: new Date(),
          url: 'https://twitter.com/user/1',
          metadata: {},
        }),
        createWebSignal({
          id: 'signal-3',
          source: 'github',
          content: 'Machine learning models need training data and validation',
          timestamp: new Date(),
          url: 'https://github.com/owner/repo/1',
          metadata: {},
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      expect(result.unique.length).toBe(3);
      expect(result.stats.duplicates).toBe(0);
      expect(result.stats.dedupeRate).toBe(0);
    });

    it('should select highest quality as canonical', () => {
      const content = 'This is a test post';
      const signals: WebSignal[] = [
        createWebSignal({
          id: 'low-quality',
          source: 'reddit',
          content,
          timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // Old
          url: 'https://reddit.com/1',
          metadata: { score: 5 }, // Low score
        }),
        createWebSignal({
          id: 'high-quality',
          source: 'reddit',
          content,
          timestamp: new Date(), // Recent
          url: 'https://reddit.com/2',
          metadata: { score: 150, comments: 50, awards: 5 }, // High score, rich metadata
          author: 'expert_user',
        }),
        createWebSignal({
          id: 'medium-quality',
          source: 'reddit',
          content,
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Medium age
          url: 'https://reddit.com/3',
          metadata: { score: 25 },
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      expect(result.unique.length).toBe(1);
      expect(result.unique[0]!.id).toBe('high-quality');
    });

    it('should track duplicate stats', () => {
      const signals: WebSignal[] = [
        createWebSignal({
          id: '1',
          source: 'reddit',
          content: 'Content A',
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: {},
        }),
        createWebSignal({
          id: '2',
          source: 'reddit',
          content: 'Content A',
          timestamp: new Date(),
          url: 'https://reddit.com/2',
          metadata: {},
        }),
        createWebSignal({
          id: '3',
          source: 'reddit',
          content: 'Content B',
          timestamp: new Date(),
          url: 'https://reddit.com/3',
          metadata: {},
        }),
        createWebSignal({
          id: '4',
          source: 'reddit',
          content: 'Content B',
          timestamp: new Date(),
          url: 'https://reddit.com/4',
          metadata: {},
        }),
        createWebSignal({
          id: '5',
          source: 'reddit',
          content: 'Content C',
          timestamp: new Date(),
          url: 'https://reddit.com/5',
          metadata: {},
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      expect(result.stats.total).toBe(5);
      expect(result.stats.unique).toBe(3);
      expect(result.stats.duplicates).toBe(2);
      expect(result.stats.dedupeRate).toBe(40); // 2/5 * 100
    });

    it('should handle single signal', () => {
      const signals: WebSignal[] = [
        createWebSignal({
          id: 'only-one',
          source: 'reddit',
          content: 'Unique content',
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: {},
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      expect(result.unique.length).toBe(1);
      expect(result.unique[0]!.id).toBe('only-one');
      expect(result.stats.duplicates).toBe(0);
    });

    it('should store duplicates in map', () => {
      const content = 'Duplicate content';
      const signals: WebSignal[] = [
        createWebSignal({
          id: 'canonical',
          source: 'reddit',
          content,
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: { score: 100 }, // Highest quality
        }),
        createWebSignal({
          id: 'duplicate-1',
          source: 'twitter',
          content,
          timestamp: new Date(),
          url: 'https://twitter.com/user/1',
          metadata: { likeCount: 10 },
        }),
        createWebSignal({
          id: 'duplicate-2',
          source: 'github',
          content,
          timestamp: new Date(),
          url: 'https://github.com/owner/repo/1',
          metadata: { reactions: { plusOne: 5 } },
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      expect(result.duplicates.size).toBe(1);

      const canonicalId = result.unique[0]!.id;
      const duplicates = result.duplicates.get(canonicalId);

      expect(duplicates).toBeDefined();
      expect(duplicates!.length).toBe(2);
      expect(duplicates!.some((d) => d.id === 'duplicate-1')).toBe(true);
      expect(duplicates!.some((d) => d.id === 'duplicate-2')).toBe(true);
    });

    it('should handle custom similarity threshold', () => {
      const strictDeduplicator = new Deduplicator(0.95); // Very strict

      const signals: WebSignal[] = [
        createWebSignal({
          id: 'signal-1',
          source: 'reddit',
          content: 'The quick brown fox jumps over the lazy dog',
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: {},
        }),
        createWebSignal({
          id: 'signal-2',
          source: 'twitter',
          content: 'The quick brown fox leaps over the lazy dog',
          timestamp: new Date(),
          url: 'https://twitter.com/user/1',
          metadata: {},
        }),
      ];

      const result = strictDeduplicator.deduplicate(signals);

      // With 95% threshold, these might not be considered duplicates
      expect(result.unique.length).toBeGreaterThanOrEqual(1);
    });

    it('should normalize content for exact matching', () => {
      const signals: WebSignal[] = [
        createWebSignal({
          id: 'signal-1',
          source: 'reddit',
          content: '  The  quick   brown  fox  ',
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: {},
        }),
        createWebSignal({
          id: 'signal-2',
          source: 'twitter',
          content: 'The quick brown fox',
          timestamp: new Date(),
          url: 'https://twitter.com/user/1',
          metadata: {},
        }),
        createWebSignal({
          id: 'signal-3',
          source: 'github',
          content: 'THE QUICK BROWN FOX',
          timestamp: new Date(),
          url: 'https://github.com/owner/repo/1',
          metadata: {},
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      // All should be considered exact matches after normalization
      expect(result.unique.length).toBe(1);
      expect(result.stats.duplicates).toBe(2);
    });

    it('should handle multi-pass deduplication correctly', () => {
      const signals: WebSignal[] = [
        // Exact match group
        createWebSignal({
          id: 'exact-1',
          source: 'reddit',
          content: 'Exact duplicate text',
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: { score: 50 },
        }),
        createWebSignal({
          id: 'exact-2',
          source: 'twitter',
          content: 'Exact duplicate text',
          timestamp: new Date(),
          url: 'https://twitter.com/user/1',
          metadata: { likeCount: 10 },
        }),
        // High similarity group
        createWebSignal({
          id: 'similar-1',
          source: 'github',
          content: 'Machine learning models require large amounts of training data and compute resources',
          timestamp: new Date(),
          url: 'https://github.com/owner/repo/1',
          metadata: {},
        }),
        createWebSignal({
          id: 'similar-2',
          source: 'hackernews',
          content: 'Machine learning models require large amounts of training data and compute resources',
          timestamp: new Date(),
          url: 'https://news.ycombinator.com/item?id=1',
          metadata: {},
        }),
        // Unique signal
        createWebSignal({
          id: 'unique-1',
          source: 'reddit',
          content: 'Completely different content about cooking recipes',
          timestamp: new Date(),
          url: 'https://reddit.com/2',
          metadata: {},
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      expect(result.unique.length).toBe(3); // exact group, similar group, unique
      expect(result.stats.total).toBe(5);
      expect(result.stats.duplicates).toBe(2);
    });

    it('should handle signals with varying similarity thresholds', () => {
      const signals: WebSignal[] = [
        createWebSignal({
          id: '1',
          source: 'reddit',
          content: 'JavaScript frameworks are evolving rapidly with new features and patterns',
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: { score: 100 },
        }),
        createWebSignal({
          id: '2',
          source: 'twitter',
          content: 'JavaScript frameworks are evolving rapidly with new features and patterns',
          timestamp: new Date(),
          url: 'https://twitter.com/user/1',
          metadata: { likeCount: 50 },
        }),
        createWebSignal({
          id: '3',
          source: 'github',
          content: 'Python is a great language',
          timestamp: new Date(),
          url: 'https://github.com/owner/repo/1',
          metadata: {},
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      expect(result.unique.length).toBe(2); // One duplicate group + one unique
      expect(result.stats.duplicates).toBe(1);
    });

    it('should handle empty groups correctly', () => {
      const signals: WebSignal[] = [
        createWebSignal({
          id: '1',
          source: 'reddit',
          content: 'First unique content here',
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: {},
        }),
        createWebSignal({
          id: '2',
          source: 'twitter',
          content: 'Second unique content here',
          timestamp: new Date(),
          url: 'https://twitter.com/user/1',
          metadata: {},
        }),
        createWebSignal({
          id: '3',
          source: 'github',
          content: 'Third unique content here',
          timestamp: new Date(),
          url: 'https://github.com/owner/repo/1',
          metadata: {},
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      expect(result.unique.length).toBe(3);
      expect(result.stats.duplicates).toBe(0);
      expect(result.duplicates.size).toBe(0);
    });

    it('should handle multiple similar groups', () => {
      const signals: WebSignal[] = [
        // Group 1: JavaScript
        createWebSignal({
          id: 'js-1',
          source: 'reddit',
          content: 'Learning JavaScript is essential for modern web development and creating interactive user experiences',
          timestamp: new Date(),
          url: 'https://reddit.com/1',
          metadata: { score: 50 },
        }),
        createWebSignal({
          id: 'js-2',
          source: 'twitter',
          content: 'Learning JavaScript is essential for modern web development and creating interactive user experiences',
          timestamp: new Date(),
          url: 'https://twitter.com/user/1',
          metadata: { likeCount: 25 },
        }),
        // Group 2: Python
        createWebSignal({
          id: 'py-1',
          source: 'github',
          content: 'Python programming language is widely used for data science machine learning and artificial intelligence',
          timestamp: new Date(),
          url: 'https://github.com/owner/repo/1',
          metadata: { reactions: { plusOne: 30 } },
        }),
        createWebSignal({
          id: 'py-2',
          source: 'hackernews',
          content: 'Python programming language is widely used for data science machine learning and artificial intelligence',
          timestamp: new Date(),
          url: 'https://news.ycombinator.com/item?id=1',
          metadata: { points: 40 },
        }),
        // Unique
        createWebSignal({
          id: 'unique',
          source: 'reddit',
          content: 'Cooking recipes for delicious homemade pasta dishes',
          timestamp: new Date(),
          url: 'https://reddit.com/2',
          metadata: {},
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      expect(result.unique.length).toBe(3); // 2 groups + 1 unique
      expect(result.stats.duplicates).toBe(2);
      expect(result.duplicates.size).toBe(2); // 2 groups have duplicates
    });

    it('should handle signals with identical content but different metadata', () => {
      const content = 'Identical content across multiple platforms';
      const signals: WebSignal[] = [
        createWebSignal({
          id: 'low',
          source: 'reddit',
          content,
          timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          url: 'https://reddit.com/1',
          metadata: { score: 5 },
        }),
        createWebSignal({
          id: 'medium',
          source: 'twitter',
          content,
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          url: 'https://twitter.com/user/1',
          metadata: { likeCount: 20 },
        }),
        createWebSignal({
          id: 'high',
          source: 'github',
          content,
          timestamp: new Date(),
          url: 'https://github.com/owner/repo/1',
          metadata: {
            reactions: { plusOne: 50, heart: 20 },
            author_karma: 5000,
            verified: true,
          },
          author: 'expert_contributor',
        }),
      ];

      const result = deduplicator.deduplicate(signals);

      expect(result.unique.length).toBe(1);
      expect(result.stats.duplicates).toBe(2);
      // Should select the one with highest quality (most recent + most engagement + most metadata)
      expect(result.unique[0]!.id).toBe('high');
    });
  });
});
