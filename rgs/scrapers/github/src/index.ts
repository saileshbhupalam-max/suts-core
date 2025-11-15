/**
 * RGS GitHub Scraper
 *
 * Scrapes issues and discussions from GitHub repositories.
 *
 * @packageDocumentation
 */

// Main scraper
export { GitHubScraper } from './scraper';

// Client
export { GitHubClient, type SearchOptions, type RateLimitInfo } from './client';

// Configuration
export {
  type GitHubConfig,
  type IssueState,
  type SearchSort,
  defaultGitHubConfig,
  GitHubConfigSchema,
  validateGitHubConfig,
  createGitHubConfig,
  loadGitHubConfigFromEnv,
} from './config';

// Mappers and types
export {
  type GitHubUser,
  type GitHubLabel,
  type GitHubReactions,
  type GitHubIssue,
  type GitHubComment,
  mapIssueToSignal,
  mapCommentToSignal,
  buildSearchQuery,
} from './mapper';
