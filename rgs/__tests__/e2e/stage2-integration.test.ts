/**
 * E2E Integration Tests for RGS Stage 2 Multi-Source Expansion
 *
 * Tests the complete integration of:
 * - Multiple scraper sources (Twitter, GitHub, HackerNews)
 * - Cross-source deduplication
 * - Enhanced sentiment analysis (5-point scale with emotions)
 * - Quality scoring and filtering
 */

import { RateLimiter } from '../../utils/src/rate-limiter';
import { TwitterScraper, TwitterClient, TwitterConfig } from '../../scrapers/twitter/src';
import { GitHubScraper, GitHubClient, GitHubConfig } from '../../scrapers/github/src';
import { HackerNewsScraper, HackerNewsClient, HNConfig } from '../../scrapers/hackernews/src';
import {
  SignalDeduplicator,
  DeduplicationConfig,
} from '../../analysis/deduplication/src';
import {
  EnhancedSentimentAnalyzer,
  SentimentConfig,
} from '../../analysis/sentiment-enhanced/src';
import type { WebSignal } from '../../core/src/types';

describe('RGS Stage 2 - E2E Multi-Source Integration', () => {
  describe('Scraper Instantiation', () => {
    it('should create all Stage 2 scrapers without errors', () => {
      // Twitter scraper
      const twitterRateLimiter = new RateLimiter(450, 15 * 60 * 1000);
      const twitterClient = new TwitterClient('fake-token', twitterRateLimiter);
      const twitterConfig: TwitterConfig = {
        queries: ['test'],
        maxResultsPerQuery: 10,
      };
      const twitterScraper = new TwitterScraper(twitterClient, twitterConfig);
      expect(twitterScraper).toBeDefined();

      // GitHub scraper
      const githubRateLimiter = new RateLimiter(5000, 60 * 60 * 1000);
      const githubClient = new GitHubClient({ auth: 'fake-token' }, githubRateLimiter);
      const githubConfig: GitHubConfig = {
        repositories: ['test/repo'],
      };
      const githubScraper = new GitHubScraper(githubClient, githubConfig);
      expect(githubScraper).toBeDefined();

      // HackerNews scraper
      const hnRateLimiter = new RateLimiter(10000, 60 * 60 * 1000);
      const hnClient = new HackerNewsClient(hnRateLimiter);
      const hnConfig: HNConfig = {
        queries: ['test'],
        maxResultsPerQuery: 10,
      };
      const hnScraper = new HackerNewsScraper(hnClient, hnConfig);
      expect(hnScraper).toBeDefined();
    });
  });

  describe('Cross-Source Deduplication', () => {
    it('should deduplicate similar signals from different sources', async () => {
      // Create test signals from different sources with similar content
      const signals: WebSignal[] = [
        {
          id: 'twitter-1',
          source: 'twitter',
          content: 'The new API is amazing! Performance improvements are incredible.',
          url: 'https://twitter.com/test/1',
          timestamp: new Date('2024-01-01'),
          metadata: { tweetId: '123', author: 'user1' },
        },
        {
          id: 'github-1',
          source: 'github',
          content: 'The new API is amazing! Performance improvements are incredible.',
          url: 'https://github.com/test/repo/issues/1',
          timestamp: new Date('2024-01-01'),
          metadata: { issueNumber: 1, repository: 'test/repo' },
        },
        {
          id: 'hackernews-1',
          source: 'hackernews',
          content: 'Different topic entirely about databases and scaling.',
          url: 'https://news.ycombinator.com/item?id=1000',
          timestamp: new Date('2024-01-01'),
          metadata: { objectID: '1000', type: 'story' },
        },
      ];

      const deduplicationConfig: DeduplicationConfig = {
        similarityThreshold: 0.85,
        enableQualityScoring: true,
      };

      const deduplicator = new SignalDeduplicator(deduplicationConfig);
      const result = await deduplicator.deduplicate(signals);

      // Should identify twitter-1 and github-1 as duplicates (same content)
      // Should keep hackernews-1 as unique
      expect(result.uniqueSignals.length).toBe(2);
      expect(result.duplicateGroups.length).toBe(1);
      expect(result.duplicateGroups[0]?.signals.length).toBe(2);

      // Verify the duplicate group contains the similar signals
      const duplicateGroup = result.duplicateGroups[0];
      const signalIds = duplicateGroup?.signals.map((s) => s.id) ?? [];
      expect(signalIds).toContain('twitter-1');
      expect(signalIds).toContain('github-1');
    });

    it('should apply quality scoring and select best signal from duplicates', async () => {
      // Create signals with different quality indicators
      const signals: WebSignal[] = [
        {
          id: 'low-quality',
          source: 'twitter',
          content: 'API is good',
          url: 'https://twitter.com/test/1',
          timestamp: new Date('2024-01-01'),
          metadata: {
            tweetId: '123',
            author: 'user1',
            likes: 5,
            retweets: 1,
          },
        },
        {
          id: 'high-quality',
          source: 'github',
          content: 'The API is very good and useful',
          url: 'https://github.com/test/repo/issues/1',
          timestamp: new Date('2024-01-02'), // More recent
          metadata: {
            issueNumber: 1,
            repository: 'test/repo',
            reactions: 50,
            comments: 15,
          },
        },
      ];

      const config: DeduplicationConfig = {
        similarityThreshold: 0.80,
        enableQualityScoring: true,
      };

      const deduplicator = new SignalDeduplicator(config);
      const result = await deduplicator.deduplicate(signals);

      // Should select the higher quality signal
      expect(result.uniqueSignals.length).toBe(1);
      const selectedSignal = result.uniqueSignals[0];

      // GitHub signal should be selected (more engagement, more recent, longer)
      expect(selectedSignal?.id).toBe('high-quality');
      expect(selectedSignal?.qualityScore).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Sentiment Analysis', () => {
    it('should analyze sentiment on 5-point scale with emotions', async () => {
      const signal: WebSignal = {
        id: 'test-1',
        source: 'twitter',
        content:
          'I absolutely love this new feature! It makes me so happy and excited to use the product every day!',
        url: 'https://twitter.com/test/1',
        timestamp: new Date(),
        metadata: {},
      };

      const config: SentimentConfig = {
        cacheResults: false,
      };

      const analyzer = new EnhancedSentimentAnalyzer(config);
      const result = await analyzer.analyzeSentiment(signal);

      // Should detect very positive sentiment
      expect(result.scale).toBe('very_positive');
      expect(result.score).toBeGreaterThan(0.6);
      expect(result.confidence).toBeGreaterThan(0.7);

      // Should detect joy emotion
      expect(result.emotions).toBeDefined();
      expect(result.emotions.length).toBeGreaterThan(0);

      const joyEmotion = result.emotions.find((e) => e.type === 'joy');
      expect(joyEmotion).toBeDefined();
      expect(joyEmotion?.confidence).toBeGreaterThan(0.3);
    });

    it('should correctly identify negative sentiment with emotions', async () => {
      const signal: WebSignal = {
        id: 'test-2',
        source: 'github',
        content:
          'This bug is absolutely infuriating! I am so angry and frustrated. It completely breaks the workflow.',
        url: 'https://github.com/test/repo/issues/1',
        timestamp: new Date(),
        metadata: {},
      };

      const analyzer = new EnhancedSentimentAnalyzer({ cacheResults: false });
      const result = await analyzer.analyzeSentiment(signal);

      // Should detect very negative sentiment
      expect(result.scale).toMatch(/negative/);
      expect(result.score).toBeLessThan(0);
      expect(result.confidence).toBeGreaterThan(0.7);

      // Should detect anger emotion
      expect(result.emotions).toBeDefined();
      const angerEmotion = result.emotions.find((e) => e.type === 'anger');
      expect(angerEmotion).toBeDefined();
    });

    it('should aggregate sentiment across multiple signals', async () => {
      const signals: WebSignal[] = [
        {
          id: 'pos-1',
          source: 'twitter',
          content: 'Great feature! Love it!',
          url: 'https://twitter.com/test/1',
          timestamp: new Date(),
          metadata: {},
        },
        {
          id: 'neg-1',
          source: 'github',
          content: 'Terrible bug. Very frustrated.',
          url: 'https://github.com/test/repo/issues/1',
          timestamp: new Date(),
          metadata: {},
        },
        {
          id: 'neutral-1',
          source: 'hackernews',
          content: 'The API works as documented.',
          url: 'https://news.ycombinator.com/item?id=1000',
          timestamp: new Date(),
          metadata: {},
        },
      ];

      const analyzer = new EnhancedSentimentAnalyzer({ cacheResults: false });
      const aggregated = await analyzer.aggregateSentiment(signals);

      expect(aggregated.averageScore).toBeDefined();
      expect(aggregated.distribution).toBeDefined();
      expect(aggregated.distribution.very_positive).toBeGreaterThanOrEqual(0);
      expect(aggregated.distribution.very_negative).toBeGreaterThanOrEqual(0);
      expect(aggregated.distribution.neutral).toBeGreaterThanOrEqual(0);

      // Distribution should sum to 1
      const sum =
        aggregated.distribution.very_positive +
        aggregated.distribution.positive +
        aggregated.distribution.neutral +
        aggregated.distribution.negative +
        aggregated.distribution.very_negative;

      expect(sum).toBeCloseTo(1.0, 1);
    });
  });

  describe('Full Pipeline Integration', () => {
    it('should process signals through deduplication and enhanced sentiment', async () => {
      // Simulate signals from multiple sources
      const signals: WebSignal[] = [
        {
          id: 'twitter-1',
          source: 'twitter',
          content: 'Amazing new API! Love the performance boost!',
          url: 'https://twitter.com/test/1',
          timestamp: new Date('2024-01-01'),
          metadata: { likes: 100, retweets: 50 },
        },
        {
          id: 'github-1',
          source: 'github',
          content: 'Amazing new API! Love the performance boost!', // Duplicate
          url: 'https://github.com/test/repo/issues/1',
          timestamp: new Date('2024-01-01'),
          metadata: { reactions: 20 },
        },
        {
          id: 'hackernews-1',
          source: 'hackernews',
          content: 'Serious security vulnerability in authentication module.',
          url: 'https://news.ycombinator.com/item?id=1000',
          timestamp: new Date('2024-01-02'),
          metadata: { points: 500 },
        },
      ];

      // Step 1: Deduplicate
      const deduplicator = new SignalDeduplicator({
        similarityThreshold: 0.85,
        enableQualityScoring: true,
      });

      const deduplicationResult = await deduplicator.deduplicate(signals);
      expect(deduplicationResult.uniqueSignals.length).toBe(2); // 2 unique after dedup

      // Step 2: Analyze sentiment on deduplicated signals
      const analyzer = new EnhancedSentimentAnalyzer({ cacheResults: false });

      const sentimentResults = await Promise.all(
        deduplicationResult.uniqueSignals.map((signal) =>
          analyzer.analyzeSentiment(signal)
        )
      );

      expect(sentimentResults).toHaveLength(2);

      // First unique signal should be positive (API praise)
      const positiveResult = sentimentResults.find(
        (r) => r.scale === 'very_positive' || r.scale === 'positive'
      );
      expect(positiveResult).toBeDefined();
      expect(positiveResult?.score).toBeGreaterThan(0);

      // Second unique signal should be negative (security vulnerability)
      const negativeResult = sentimentResults.find((r) =>
        r.scale.includes('negative')
      );
      expect(negativeResult).toBeDefined();
      expect(negativeResult?.score).toBeLessThan(0);

      // Step 3: Aggregate sentiment
      const aggregated = await analyzer.aggregateSentiment(
        deduplicationResult.uniqueSignals
      );

      expect(aggregated.averageScore).toBeDefined();
      expect(aggregated.totalSignals).toBe(2);
      expect(aggregated.emotionSummary).toBeDefined();
    });
  });

  describe('Quality Filtering', () => {
    it('should filter low-quality signals while preserving high-quality ones', async () => {
      const signals: WebSignal[] = [
        {
          id: 'high-1',
          source: 'github',
          content:
            'Comprehensive analysis of the performance regression showing 40% slowdown in API response times with detailed benchmarks.',
          url: 'https://github.com/test/repo/issues/1',
          timestamp: new Date('2024-01-02'),
          metadata: { reactions: 150, comments: 50 },
        },
        {
          id: 'low-1',
          source: 'twitter',
          content: 'Bad',
          url: 'https://twitter.com/test/1',
          timestamp: new Date('2024-01-01'),
          metadata: { likes: 1 },
        },
        {
          id: 'high-2',
          source: 'hackernews',
          content:
            'Well-written discussion about microservices architecture trade-offs with concrete examples from production systems.',
          url: 'https://news.ycombinator.com/item?id=1000',
          timestamp: new Date('2024-01-03'),
          metadata: { points: 500, num_comments: 100 },
        },
      ];

      const deduplicator = new SignalDeduplicator({
        similarityThreshold: 0.85,
        enableQualityScoring: true,
      });

      const result = await deduplicator.deduplicate(signals);

      // All signals should remain (no duplicates)
      expect(result.uniqueSignals.length).toBe(3);

      // Filter by quality score (>= 0.5)
      const highQuality = result.uniqueSignals.filter(
        (s) => (s.qualityScore ?? 0) >= 0.5
      );

      expect(highQuality.length).toBeGreaterThanOrEqual(2);

      // High quality signals should include the detailed ones
      const highIds = highQuality.map((s) => s.id);
      expect(highIds).toContain('high-1');
      expect(highIds).toContain('high-2');
    });
  });
});
