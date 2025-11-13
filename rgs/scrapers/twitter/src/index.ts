/**
 * Twitter Scraper Module
 *
 * Exports Twitter scraper implementation for RGS (Research Gathering System)
 */

export { TwitterScraper } from './scraper';
export { TwitterClient } from './client';
export {
  TwitterConfig,
  TwitterRateLimitConfig,
  DEFAULT_TWITTER_CONFIG,
  validateTwitterConfig,
  createTwitterConfigFromEnv,
  buildSearchQueries,
} from './config';
export {
  TweetMetadata,
  mapTweetToSignal,
  mapTweetsToSignals,
  filterRetweets,
  filterByLanguage,
  deduplicateTweets,
  calculateTweetSentiment,
} from './mapper';
export type { SearchTweetsOptions, SearchTweetsResponse } from './client';
