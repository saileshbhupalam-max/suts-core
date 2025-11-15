/**
 * Tests for Twitter Mapper
 */

import { TweetV2 } from 'twitter-api-v2';
import {
  mapTweetToSignal,
  mapTweetsToSignals,
  filterRetweets,
  filterByLanguage,
  deduplicateTweets,
  calculateTweetSentiment,
} from '../src/mapper';

describe('TwitterMapper', () => {
  const createMockTweet = (overrides?: Partial<TweetV2>): TweetV2 => ({
    id: '123456789',
    text: 'Test tweet content',
    created_at: '2025-01-01T12:00:00.000Z',
    author_id: 'user123',
    public_metrics: {
      like_count: 10,
      retweet_count: 5,
      reply_count: 2,
      quote_count: 1,
      impression_count: 100,
      bookmark_count: 0,
    },
    lang: 'en',
    conversation_id: 'conv123',
    ...overrides,
  } as TweetV2);

  describe('mapTweetToSignal', () => {
    it('should map a tweet to a WebSignal', () => {
      const tweet = createMockTweet();
      const signal = mapTweetToSignal(tweet);

      expect(signal.id).toBe('twitter-123456789');
      expect(signal.source).toBe('twitter');
      expect(signal.content).toBe('Test tweet content');
      expect(signal.author).toBe('user123');
      expect(signal.timestamp).toEqual(new Date('2025-01-01T12:00:00.000Z'));
      expect(signal.url).toBe('https://twitter.com/i/web/status/123456789');
      expect(signal.metadata).toBeDefined();
    });

    it('should include correct metadata', () => {
      const tweet = createMockTweet();
      const signal = mapTweetToSignal(tweet);

      expect(signal.metadata).toEqual({
        likeCount: 10,
        retweetCount: 5,
        replyCount: 2,
        quoteCount: 1,
        isRetweet: false,
        lang: 'en',
        conversationId: 'conv123',
      });
    });

    it('should detect retweets correctly', () => {
      const tweet = createMockTweet({ text: 'RT @user: This is a retweet' });
      const signal = mapTweetToSignal(tweet);

      expect(signal.metadata).toMatchObject({
        isRetweet: true,
      });
    });

    it('should handle missing public_metrics', () => {
      const tweet = {
        id: '123456789',
        text: 'Test tweet content',
        created_at: '2025-01-01T12:00:00.000Z',
        author_id: 'user123',
        conversation_id: 'conv123',
      } as TweetV2;
      const signal = mapTweetToSignal(tweet);

      expect(signal.metadata).toMatchObject({
        likeCount: 0,
        retweetCount: 0,
        replyCount: 0,
        quoteCount: 0,
      });
    });

    it('should handle missing created_at', () => {
      const tweet = {
        id: '123456789',
        text: 'Test tweet content',
        author_id: 'user123',
        conversation_id: 'conv123',
      } as TweetV2;
      const signal = mapTweetToSignal(tweet);

      expect(signal.timestamp).toBeInstanceOf(Date);
      expect(signal.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should handle missing lang', () => {
      const tweet = {
        id: '123456789',
        text: 'Test tweet content',
        created_at: '2025-01-01T12:00:00.000Z',
        author_id: 'user123',
        conversation_id: 'conv123',
      } as TweetV2;
      const signal = mapTweetToSignal(tweet);

      expect(signal.metadata).toMatchObject({
        lang: undefined,
      });
    });

    it('should handle partial public_metrics', () => {
      const tweet = createMockTweet({
        public_metrics: {
          like_count: 5,
          retweet_count: 0,
          reply_count: 0,
          quote_count: 0,
          impression_count: 0,
          bookmark_count: 0,
        },
      });
      const signal = mapTweetToSignal(tweet);

      expect(signal.metadata).toMatchObject({
        likeCount: 5,
        retweetCount: 0,
        replyCount: 0,
        quoteCount: 0,
      });
    });
  });

  describe('mapTweetsToSignals', () => {
    it('should map multiple tweets to signals', () => {
      const tweets = [
        createMockTweet({ id: '1', text: 'Tweet 1' }),
        createMockTweet({ id: '2', text: 'Tweet 2' }),
        createMockTweet({ id: '3', text: 'Tweet 3' }),
      ];

      const signals = mapTweetsToSignals(tweets);

      expect(signals).toHaveLength(3);
      expect(signals[0]?.id).toBe('twitter-1');
      expect(signals[1]?.id).toBe('twitter-2');
      expect(signals[2]?.id).toBe('twitter-3');
    });

    it('should handle empty array', () => {
      const signals = mapTweetsToSignals([]);
      expect(signals).toHaveLength(0);
    });
  });

  describe('filterRetweets', () => {
    it('should filter out retweets', () => {
      const tweets = [
        createMockTweet({ id: '1', text: 'Regular tweet' }),
        createMockTweet({ id: '2', text: 'RT @user: This is a retweet' }),
        createMockTweet({ id: '3', text: 'Another regular tweet' }),
        createMockTweet({ id: '4', text: 'RT @another: Another retweet' }),
      ];

      const filtered = filterRetweets(tweets);

      expect(filtered).toHaveLength(2);
      expect(filtered[0]?.id).toBe('1');
      expect(filtered[1]?.id).toBe('3');
    });

    it('should return empty array if all are retweets', () => {
      const tweets = [
        createMockTweet({ id: '1', text: 'RT @user: Retweet 1' }),
        createMockTweet({ id: '2', text: 'RT @user: Retweet 2' }),
      ];

      const filtered = filterRetweets(tweets);
      expect(filtered).toHaveLength(0);
    });

    it('should return all tweets if none are retweets', () => {
      const tweets = [
        createMockTweet({ id: '1', text: 'Regular tweet 1' }),
        createMockTweet({ id: '2', text: 'Regular tweet 2' }),
      ];

      const filtered = filterRetweets(tweets);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('filterByLanguage', () => {
    it('should filter tweets by language', () => {
      const tweets = [
        createMockTweet({ id: '1', lang: 'en' }),
        createMockTweet({ id: '2', lang: 'es' }),
        createMockTweet({ id: '3', lang: 'en' }),
        createMockTweet({ id: '4', lang: 'fr' }),
      ];

      const filtered = filterByLanguage(tweets, ['en']);

      expect(filtered).toHaveLength(2);
      expect(filtered[0]?.id).toBe('1');
      expect(filtered[1]?.id).toBe('3');
    });

    it('should support multiple languages', () => {
      const tweets = [
        createMockTweet({ id: '1', lang: 'en' }),
        createMockTweet({ id: '2', lang: 'es' }),
        createMockTweet({ id: '3', lang: 'fr' }),
      ];

      const filtered = filterByLanguage(tweets, ['en', 'es']);

      expect(filtered).toHaveLength(2);
      expect(filtered[0]?.id).toBe('1');
      expect(filtered[1]?.id).toBe('2');
    });

    it('should filter out tweets with undefined language', () => {
      const tweets = [
        createMockTweet({ id: '1', lang: 'en' }),
        { id: '2', text: 'No lang', created_at: '2025-01-01T12:00:00.000Z', author_id: 'user123', conversation_id: 'conv123' } as TweetV2,
      ];

      const filtered = filterByLanguage(tweets, ['en']);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.id).toBe('1');
    });

    it('should return empty array if no matches', () => {
      const tweets = [
        createMockTweet({ id: '1', lang: 'en' }),
        createMockTweet({ id: '2', lang: 'es' }),
      ];

      const filtered = filterByLanguage(tweets, ['fr']);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('deduplicateTweets', () => {
    it('should remove duplicate tweets', () => {
      const tweets = [
        createMockTweet({ id: '1', text: 'Tweet 1' }),
        createMockTweet({ id: '2', text: 'Tweet 2' }),
        createMockTweet({ id: '1', text: 'Tweet 1 duplicate' }),
        createMockTweet({ id: '3', text: 'Tweet 3' }),
        createMockTweet({ id: '2', text: 'Tweet 2 duplicate' }),
      ];

      const deduplicated = deduplicateTweets(tweets);

      expect(deduplicated).toHaveLength(3);
      expect(deduplicated[0]?.id).toBe('1');
      expect(deduplicated[1]?.id).toBe('2');
      expect(deduplicated[2]?.id).toBe('3');
      // First occurrence should be kept
      expect(deduplicated[0]?.text).toBe('Tweet 1');
      expect(deduplicated[1]?.text).toBe('Tweet 2');
    });

    it('should handle array with no duplicates', () => {
      const tweets = [
        createMockTweet({ id: '1' }),
        createMockTweet({ id: '2' }),
        createMockTweet({ id: '3' }),
      ];

      const deduplicated = deduplicateTweets(tweets);
      expect(deduplicated).toHaveLength(3);
    });

    it('should handle empty array', () => {
      const deduplicated = deduplicateTweets([]);
      expect(deduplicated).toHaveLength(0);
    });
  });

  describe('calculateTweetSentiment', () => {
    it('should calculate positive sentiment for highly liked tweets', () => {
      const tweet = createMockTweet({
        public_metrics: {
          like_count: 100,
          retweet_count: 50,
          reply_count: 5,
          quote_count: 5,
          impression_count: 1000,
          bookmark_count: 10,
        },
      });

      const sentiment = calculateTweetSentiment(tweet);

      expect(sentiment).toBeDefined();
      expect(sentiment).toBeGreaterThan(0);
      expect(sentiment).toBeLessThanOrEqual(1);
    });

    it('should return neutral sentiment for no engagement', () => {
      const tweet = createMockTweet({
        public_metrics: {
          like_count: 0,
          retweet_count: 0,
          reply_count: 0,
          quote_count: 0,
          impression_count: 0,
          bookmark_count: 0,
        },
      });

      const sentiment = calculateTweetSentiment(tweet);
      expect(sentiment).toBe(0);
    });

    it('should return undefined for missing metrics', () => {
      const tweet = {
        id: '123456789',
        text: 'Test tweet',
        created_at: '2025-01-01T12:00:00.000Z',
        author_id: 'user123',
        conversation_id: 'conv123',
      } as TweetV2;

      const sentiment = calculateTweetSentiment(tweet);
      expect(sentiment).toBeUndefined();
    });

    it('should normalize sentiment to range [-1, 1]', () => {
      const tweet = createMockTweet({
        public_metrics: {
          like_count: 1000,
          retweet_count: 1000,
          reply_count: 0,
          quote_count: 0,
        impression_count: 0,
        },
      });

      const sentiment = calculateTweetSentiment(tweet);

      expect(sentiment).toBeDefined();
      expect(sentiment).toBeGreaterThanOrEqual(-1);
      expect(sentiment).toBeLessThanOrEqual(1);
    });

    it('should handle partial metrics', () => {
      const tweet = createMockTweet({
        public_metrics: {
          like_count: 10,
          retweet_count: undefined,
          reply_count: undefined,
          quote_count: undefined,
        } as TweetV2['public_metrics'],
      });

      const sentiment = calculateTweetSentiment(tweet);

      expect(sentiment).toBeDefined();
      expect(sentiment).toBeGreaterThan(0);
    });
  });
});
