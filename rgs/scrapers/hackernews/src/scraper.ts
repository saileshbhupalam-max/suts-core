/**
 * HackerNews Scraper Implementation
 *
 * Scrapes stories and comments from HackerNews using the Algolia Search API.
 */

import { IScraper, ScrapeConfig, BaseScraper } from '@rgs/core';
import { WebSignal } from '@rgs/core';
import { Logger } from '@rgs/utils';
import { HackerNewsClient, HNStory } from './client';
import { HNConfig } from './config';
import { mapStoryToSignal, mapCommentToSignal, isValidStory, isValidComment } from './mapper';

/**
 * HackerNews scraper implementation
 */
export class HackerNewsScraper extends BaseScraper implements IScraper {
  private readonly client: HackerNewsClient;
  private readonly config: HNConfig;
  private readonly logger: Logger | undefined;

  /**
   * Creates a new HackerNewsScraper
   *
   * @param client - HackerNews API client
   * @param config - HN-specific configuration
   * @param logger - Optional logger instance
   */
  constructor(client: HackerNewsClient, config: HNConfig, logger?: Logger) {
    super();
    this.client = client;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Scrapes HackerNews for stories and comments matching configured queries
   *
   * @param _config - Scrape configuration
   * @returns Promise resolving to array of web signals
   */
  async scrape(_config: ScrapeConfig): Promise<WebSignal[]> {
    this.logger?.info('Starting HackerNews scrape', {
      queries: this.config.queries,
      maxResults: this.config.maxResultsPerQuery,
    });

    const allSignals: WebSignal[] = [];
    const seenIds = new Set<string>();

    // Execute each query
    for (const query of this.config.queries) {
      this.logger?.debug('Scraping query', { query });

      try {
        const signals = await this.scrapeQuery(query);

        // Deduplicate by ID
        for (const signal of signals) {
          if (!seenIds.has(signal.id)) {
            seenIds.add(signal.id);
            allSignals.push(signal);
          }
        }

        this.logger?.debug('Query complete', {
          query,
          signalsFound: signals.length,
          totalSignals: allSignals.length,
        });
      } catch (error) {
        this.logger?.error('Query failed', {
          query,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with other queries even if one fails
      }
    }

    // Validate all signals
    const validSignals = allSignals.filter((signal) => this.validate(signal));

    this.logger?.info('HackerNews scrape complete', {
      totalSignals: allSignals.length,
      validSignals: validSignals.length,
      invalidSignals: allSignals.length - validSignals.length,
    });

    return validSignals;
  }

  /**
   * Scrapes a single query
   *
   * @param query - Search query
   * @returns Promise resolving to array of web signals
   */
  private async scrapeQuery(query: string): Promise<WebSignal[]> {
    const signals: WebSignal[] = [];

    // Scrape stories if configured
    if (this.config.tags.includes('story')) {
      const storySignals = await this.scrapeStories(query);
      signals.push(...storySignals);
    }

    // Scrape comments if configured
    if (this.config.tags.includes('comment')) {
      const commentSignals = await this.scrapeComments(query);
      signals.push(...commentSignals);
    }

    return signals;
  }

  /**
   * Scrapes stories matching a query
   *
   * @param query - Search query
   * @returns Promise resolving to array of web signals
   */
  private async scrapeStories(query: string): Promise<WebSignal[]> {
    const signals: WebSignal[] = [];

    // Build numeric filter for minimum points
    const numericFilters =
      this.config.minPoints !== undefined && this.config.minPoints > 0
        ? `points>${this.config.minPoints}`
        : undefined;

    // Search for stories
    const result = await this.client.searchStories(
      query,
      numericFilters !== undefined
        ? {
            tags: 'story',
            numericFilters,
            hitsPerPage: this.config.maxResultsPerQuery,
          }
        : {
            tags: 'story',
            hitsPerPage: this.config.maxResultsPerQuery,
          }
    );

    this.logger?.debug('Stories fetched', {
      query,
      count: result.hits.length,
      total: result.nbHits,
    });

    // Process each story
    for (const item of result.hits) {
      if (!isValidStory(item)) {
        continue;
      }

      // isValidStory is a type guard, so item is now HNStory
      // Add story signal
      signals.push(mapStoryToSignal(item));

      // Optionally fetch comments for this story
      if (this.config.includeComments && item.num_comments > 0) {
        try {
          const commentSignals = await this.scrapeStoryComments(item);
          signals.push(...commentSignals);
        } catch (error) {
          this.logger?.warn('Failed to fetch comments', {
            storyId: item.objectID,
            error: error instanceof Error ? error.message : String(error),
          });
          // Continue even if comment fetching fails
        }
      }
    }

    return signals;
  }

  /**
   * Scrapes comments matching a query
   *
   * @param query - Search query
   * @returns Promise resolving to array of web signals
   */
  private async scrapeComments(query: string): Promise<WebSignal[]> {
    const signals: WebSignal[] = [];

    // Search for comments
    const result = await this.client.searchStories(query, {
      tags: 'comment',
      hitsPerPage: this.config.maxResultsPerQuery,
    });

    this.logger?.debug('Comments fetched', {
      query,
      count: result.hits.length,
      total: result.nbHits,
    });

    // Process each comment
    for (const item of result.hits) {
      if (!isValidComment(item)) {
        continue;
      }

      // Use a generic story title since we don't have the actual story
      const storyTitle = `Story #${item.story_id}`;
      signals.push(mapCommentToSignal(item, storyTitle));
    }

    return signals;
  }

  /**
   * Scrapes all comments for a specific story
   *
   * @param story - HackerNews story
   * @returns Promise resolving to array of web signals
   */
  private async scrapeStoryComments(story: HNStory): Promise<WebSignal[]> {
    const signals: WebSignal[] = [];

    // Fetch comments for this story
    const comments = await this.client.getItemComments(parseInt(story.objectID));

    this.logger?.debug('Story comments fetched', {
      storyId: story.objectID,
      count: comments.length,
    });

    // Map comments to signals
    for (const comment of comments) {
      if (isValidComment(comment)) {
        signals.push(mapCommentToSignal(comment, story.title));
      }
    }

    return signals;
  }

  /**
   * Tests connection to HackerNews API
   *
   * @returns Promise resolving to true if connection successful
   */
  override async testConnection(): Promise<boolean> {
    try {
      return await this.client.testConnection();
    } catch (error) {
      this.logger?.error('Connection test failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Validates a web signal from HackerNews
   *
   * @param signal - Signal to validate
   * @returns true if signal is valid
   */
  override validate(signal: WebSignal): boolean {
    // Use base validation
    if (!super.validate(signal)) {
      return false;
    }

    // Check HackerNews-specific requirements
    if (signal.source !== 'hackernews') {
      return false;
    }

    // Check ID format
    if (!signal.id.startsWith('hn-')) {
      return false;
    }

    // Check URL format
    if (!signal.url.includes('news.ycombinator.com') && !signal.url.includes('http')) {
      return false;
    }

    // Check metadata exists
    if (typeof signal.metadata !== 'object' || signal.metadata === null) {
      return false;
    }

    // Check objectID in metadata
    if (typeof signal.metadata['objectID'] !== 'string') {
      return false;
    }

    // Check type in metadata
    const type = signal.metadata['type'];
    if (type !== 'story' && type !== 'comment') {
      return false;
    }

    return true;
  }
}
