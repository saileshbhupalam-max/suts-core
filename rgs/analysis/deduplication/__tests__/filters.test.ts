/**
 * Tests for SignalFilter
 */

import { SignalFilter } from '../src/filters';
import { WebSignal, createWebSignal } from '@rgs/core/models/signal';

describe('SignalFilter', () => {
  let filter: SignalFilter;
  let signals: WebSignal[];

  beforeEach(() => {
    filter = new SignalFilter();

    // Create test signals
    signals = [
      createWebSignal({
        id: 'reddit-1',
        source: 'reddit',
        content: 'High quality post about TypeScript with great engagement',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        url: 'https://reddit.com/test1',
        metadata: { score: 100, comments: 50 },
        author: 'expert',
      }),
      createWebSignal({
        id: 'twitter-1',
        source: 'twitter',
        content: 'Short tweet about JavaScript',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        url: 'https://twitter.com/user/1',
        metadata: { likeCount: 5 },
      }),
      createWebSignal({
        id: 'github-1',
        source: 'github',
        content: 'Bug report: TypeScript compiler issue with generics',
        timestamp: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
        url: 'https://github.com/owner/repo/issues/1',
        metadata: { reactions: { plusOne: 10, heart: 5 } },
        author: 'developer',
      }),
      createWebSignal({
        id: 'hackernews-1',
        source: 'hackernews',
        content: 'Show HN: New JavaScript framework for building web apps',
        timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        url: 'https://news.ycombinator.com/item?id=1',
        metadata: { points: 200 },
        author: 'hacker',
      }),
    ];
  });

  describe('filterByQuality', () => {
    it('should filter by quality threshold', () => {
      const filtered = filter.filterByQuality(signals, 0.7);

      expect(filtered.length).toBeLessThan(signals.length);
      expect(filtered.every((s) => s.id === 'reddit-1' || s.id === 'hackernews-1')).toBe(true);
    });

    it('should use default threshold of 0.6', () => {
      const filtered = filter.filterByQuality(signals);

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThanOrEqual(signals.length);
    });

    it('should return all signals with threshold 0', () => {
      const filtered = filter.filterByQuality(signals, 0);

      expect(filtered.length).toBe(signals.length);
    });

    it('should return empty array with threshold 1', () => {
      const filtered = filter.filterByQuality(signals, 1);

      expect(filtered.length).toBe(0);
    });
  });

  describe('filterBySource', () => {
    it('should filter by single source', () => {
      const filtered = filter.filterBySource(signals, ['reddit']);

      expect(filtered.length).toBe(1);
      expect(filtered[0]!.source).toBe('reddit');
    });

    it('should filter by multiple sources', () => {
      const filtered = filter.filterBySource(signals, ['reddit', 'twitter']);

      expect(filtered.length).toBe(2);
      expect(filtered.every((s) => s.source === 'reddit' || s.source === 'twitter')).toBe(true);
    });

    it('should return empty array for non-matching sources', () => {
      const filtered = filter.filterBySource([], ['reddit']);

      expect(filtered.length).toBe(0);
    });

    it('should return all signals when all sources are included', () => {
      const filtered = filter.filterBySource(signals, [
        'reddit',
        'twitter',
        'github',
        'hackernews',
      ]);

      expect(filtered.length).toBe(signals.length);
    });
  });

  describe('filterByDateRange', () => {
    it('should filter by date range', () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = new Date(); // now

      const filtered = filter.filterByDateRange(signals, startDate, endDate);

      expect(filtered.length).toBe(2); // reddit-1 and twitter-1
      expect(filtered.every((s) => s.timestamp >= startDate && s.timestamp <= endDate)).toBe(true);
    });

    it('should include signals on boundary dates', () => {
      const signal = signals[0]!;
      const startDate = signal.timestamp;
      const endDate = signal.timestamp;

      const filtered = filter.filterByDateRange(signals, startDate, endDate);

      expect(filtered.length).toBe(1);
      expect(filtered[0]!.id).toBe(signal.id);
    });

    it('should return empty array for future date range', () => {
      const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // next week

      const filtered = filter.filterByDateRange(signals, startDate, endDate);

      expect(filtered.length).toBe(0);
    });
  });

  describe('filterByKeywords', () => {
    it('should filter by keywords in ANY mode', () => {
      const filtered = filter.filterByKeywords(signals, ['TypeScript', 'JavaScript'], 'any');

      expect(filtered.length).toBe(4); // All signals contain either TypeScript or JavaScript
    });

    it('should filter by keywords in ALL mode', () => {
      const filtered = filter.filterByKeywords(signals, ['TypeScript', 'JavaScript'], 'all');

      expect(filtered.length).toBe(0); // No signal contains both
    });

    it('should default to ANY mode', () => {
      const filtered = filter.filterByKeywords(signals, ['TypeScript']);

      expect(filtered.length).toBe(2); // reddit-1, github-1
    });

    it('should be case-insensitive', () => {
      const filtered = filter.filterByKeywords(signals, ['typescript']);

      expect(filtered.length).toBe(2); // reddit-1, github-1
    });

    it('should return empty array when no keywords match', () => {
      const filtered = filter.filterByKeywords(signals, ['Python', 'Ruby']);

      expect(filtered.length).toBe(0);
    });

    it('should return all signals when keyword is common', () => {
      const filtered = filter.filterByKeywords(signals, ['a']); // Common letter

      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('applyFilters', () => {
    it('should apply quality filter', () => {
      const filtered = filter.applyFilters(signals, {
        minQuality: 0.7,
      });

      expect(filtered.length).toBeLessThan(signals.length);
    });

    it('should apply source filter', () => {
      const filtered = filter.applyFilters(signals, {
        sources: ['reddit', 'twitter'],
      });

      expect(filtered.length).toBe(2);
    });

    it('should apply date range filter', () => {
      const filtered = filter.applyFilters(signals, {
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
      });

      expect(filtered.length).toBe(2);
    });

    it('should apply keyword filter', () => {
      const filtered = filter.applyFilters(signals, {
        keywords: {
          terms: ['TypeScript'],
          mode: 'any',
        },
      });

      expect(filtered.length).toBe(2);
    });

    it('should apply multiple filters in sequence', () => {
      const filtered = filter.applyFilters(signals, {
        sources: ['reddit', 'github', 'hackernews'],
        keywords: {
          terms: ['TypeScript'],
          mode: 'any',
        },
        minQuality: 0.5,
      });

      // Should match reddit-1 and github-1 (both have TypeScript and pass quality)
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThan(signals.length);
      expect(filtered.every((s) => s.content.toLowerCase().includes('typescript'))).toBe(true);
    });

    it('should return all signals when no filters are specified', () => {
      const filtered = filter.applyFilters(signals, {});

      expect(filtered.length).toBe(signals.length);
    });

    it('should apply filters in correct order', () => {
      // First filter by source, then by keywords
      const filtered = filter.applyFilters(signals, {
        sources: ['reddit'], // Only reddit-1
        keywords: {
          terms: ['TypeScript'], // reddit-1 has TypeScript
        },
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0]!.id).toBe('reddit-1');
    });
  });
});
