/**
 * RGS Reddit Scraper
 *
 * Reddit scraper implementation for the Real Grounding System (RGS).
 */

// Export main scraper
export { RedditScraper } from './scraper';

// Export configuration
export {
  RedditConfig,
  RedditConfigSchema,
  DEFAULT_REDDIT_CONFIG,
  createRedditConfig,
  isValidSubreddit,
} from './config';

// Export client
export { RedditClient, GetPostsOptions, SubredditData } from './client';

// Export mapper types and functions
export {
  RedditPost,
  mapRedditPostToSignal,
  shouldFilterPost,
  mapRedditPostsToSignals,
} from './mapper';
