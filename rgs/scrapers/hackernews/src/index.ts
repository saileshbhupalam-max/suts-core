/**
 * HackerNews Scraper
 *
 * Main exports for the HackerNews scraper module.
 */

export { HackerNewsClient } from './client';
export type {
  HNItem,
  HNStory,
  HNComment,
  HNSearchResult,
  HNSearchOptions,
} from './client';

export { HackerNewsScraper } from './scraper';

export type { HNConfig } from './config';
export { DEFAULT_HN_CONFIG, validateHNConfig } from './config';

export {
  mapStoryToSignal,
  mapCommentToSignal,
  mapItemToSignal,
  isValidStory,
  isValidComment,
} from './mapper';
