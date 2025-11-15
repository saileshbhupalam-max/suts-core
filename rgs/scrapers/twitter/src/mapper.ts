/**
 * Twitter to WebSignal Mapper
 *
 * Converts Twitter API v2 tweet objects to WebSignal format
 */

import { WebSignal, createWebSignal } from '@rgs/core/models/signal';
import { TweetV2 } from 'twitter-api-v2';

/**
 * Tweet metadata extracted from Twitter API
 */
export interface TweetMetadata extends Record<string, unknown> {
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  isRetweet: boolean;
  lang?: string;
  conversationId?: string;
}

/**
 * Maps a Twitter API v2 tweet to a WebSignal
 *
 * @param tweet - Tweet object from Twitter API v2
 * @returns WebSignal representation of the tweet
 */
export function mapTweetToSignal(tweet: TweetV2): WebSignal {
  // Extract metrics with defaults
  const metrics = tweet.public_metrics ?? {
    like_count: 0,
    retweet_count: 0,
    reply_count: 0,
    quote_count: 0,
  };

  // Check if this is a retweet
  const isRetweet = tweet.text.startsWith('RT @');

  // Build metadata
  const metadata: Record<string, unknown> = {
    likeCount: metrics.like_count ?? 0,
    retweetCount: metrics.retweet_count ?? 0,
    replyCount: metrics.reply_count ?? 0,
    quoteCount: metrics.quote_count ?? 0,
    isRetweet,
  };

  if (tweet.lang !== undefined) {
    metadata['lang'] = tweet.lang;
  }

  if (tweet.conversation_id !== undefined) {
    metadata['conversationId'] = tweet.conversation_id;
  }

  // Create WebSignal
  const signalParams: {
    id: string;
    source: 'twitter';
    content: string;
    timestamp: Date;
    url: string;
    metadata: Record<string, unknown>;
    author?: string;
  } = {
    id: `twitter-${tweet.id}`,
    source: 'twitter',
    content: tweet.text,
    timestamp: new Date(tweet.created_at ?? Date.now()),
    url: `https://twitter.com/i/web/status/${tweet.id}`,
    metadata,
  };

  if (tweet.author_id !== undefined) {
    signalParams.author = tweet.author_id;
  }

  return createWebSignal(signalParams);
}

/**
 * Maps multiple tweets to WebSignals
 *
 * @param tweets - Array of tweets from Twitter API v2
 * @returns Array of WebSignals
 */
export function mapTweetsToSignals(tweets: TweetV2[]): WebSignal[] {
  return tweets.map((tweet) => mapTweetToSignal(tweet));
}

/**
 * Filters out retweets from a list of tweets
 *
 * @param tweets - Array of tweets
 * @returns Array of tweets without retweets
 */
export function filterRetweets(tweets: TweetV2[]): TweetV2[] {
  return tweets.filter((tweet) => tweet.text.startsWith('RT @') === false);
}

/**
 * Filters tweets by language
 *
 * @param tweets - Array of tweets
 * @param languages - Array of language codes to include (e.g., ["en"])
 * @returns Array of tweets matching the specified languages
 */
export function filterByLanguage(tweets: TweetV2[], languages: string[]): TweetV2[] {
  return tweets.filter((tweet) => {
    if (tweet.lang === undefined) {
      return false;
    }
    return languages.includes(tweet.lang);
  });
}

/**
 * Deduplicates tweets by ID
 *
 * @param tweets - Array of tweets
 * @returns Array of unique tweets (first occurrence kept)
 */
export function deduplicateTweets(tweets: TweetV2[]): TweetV2[] {
  const seen = new Set<string>();
  const unique: TweetV2[] = [];

  for (const tweet of tweets) {
    if (seen.has(tweet.id) === false) {
      seen.add(tweet.id);
      unique.push(tweet);
    }
  }

  return unique;
}

/**
 * Calculates a basic sentiment score from tweet metrics
 *
 * @param tweet - Tweet object
 * @returns Sentiment score between -1 and 1, or undefined
 */
export function calculateTweetSentiment(tweet: TweetV2): number | undefined {
  const metrics = tweet.public_metrics;
  if (metrics === undefined) {
    return undefined;
  }

  const likes = metrics.like_count ?? 0;
  const retweets = metrics.retweet_count ?? 0;
  const replies = metrics.reply_count ?? 0;
  const quotes = metrics.quote_count ?? 0;

  // If no engagement, return neutral
  const totalEngagement = likes + retweets + replies + quotes;
  if (totalEngagement === 0) {
    return 0;
  }

  // Positive engagement (likes + retweets) vs replies/quotes (can be negative)
  // This is a simple heuristic - in production you'd use proper sentiment analysis
  const positiveEngagement = likes + retweets;
  const totalInteractions = positiveEngagement + replies + quotes;

  // Normalize to -1 to 1 range
  const sentiment = (positiveEngagement / totalInteractions) * 2 - 1;

  // Clamp to [-1, 1]
  return Math.max(-1, Math.min(1, sentiment));
}
