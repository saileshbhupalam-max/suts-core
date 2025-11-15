/**
 * HackerNews to WebSignal Mapper
 *
 * Converts HackerNews stories and comments to WebSignal format.
 */

import { WebSignal, createWebSignal } from '@rgs/core';
import { HNItem, HNStory, HNComment } from './client';

/**
 * Maps a HackerNews story to a WebSignal
 *
 * @param story - HackerNews story from Algolia API
 * @returns WebSignal representing the story
 */
export function mapStoryToSignal(story: HNStory): WebSignal {
  // Use story text if available, otherwise use title
  const content = story.story_text ?? story.title;

  // Prefer the actual URL, fallback to HN item page
  const url =
    story.url ?? `https://news.ycombinator.com/item?id=${story.objectID}`;

  return createWebSignal({
    id: `hn-${story.objectID}`,
    source: 'hackernews',
    content,
    author: story.author,
    timestamp: new Date(story.created_at),
    url,
    metadata: {
      points: story.points ?? 0,
      numComments: story.num_comments ?? 0,
      storyTitle: story.title,
      storyUrl: story.url,
      objectID: story.objectID,
      type: 'story',
    },
  });
}

/**
 * Maps a HackerNews comment to a WebSignal
 *
 * @param comment - HackerNews comment from Algolia API
 * @param storyTitle - Title of the parent story
 * @returns WebSignal representing the comment
 */
export function mapCommentToSignal(comment: HNComment, storyTitle: string): WebSignal {
  const url = `https://news.ycombinator.com/item?id=${comment.objectID}`;

  return createWebSignal({
    id: `hn-comment-${comment.objectID}`,
    source: 'hackernews',
    content: comment.comment_text ?? '',
    author: comment.author,
    timestamp: new Date(comment.created_at),
    url,
    metadata: {
      storyId: comment.story_id,
      storyTitle,
      parentId: comment.parent_id,
      objectID: comment.objectID,
      type: 'comment',
    },
  });
}

/**
 * Checks if an HNItem is a valid story with required fields
 *
 * @param item - HackerNews item to check
 * @returns true if item is a valid story
 */
export function isValidStory(item: HNItem): item is HNStory {
  return (
    item.title !== undefined &&
    item.title.trim().length > 0 &&
    typeof item.points === 'number' &&
    typeof item.num_comments === 'number'
  );
}

/**
 * Checks if an HNItem is a valid comment with required fields
 *
 * @param item - HackerNews item to check
 * @returns true if item is a valid comment
 */
export function isValidComment(item: HNItem): item is HNComment {
  return (
    item.comment_text !== undefined &&
    item.comment_text.trim().length > 0 &&
    typeof item.story_id === 'number'
  );
}

/**
 * Maps any HackerNews item to a WebSignal
 * Handles both stories and comments
 *
 * @param item - HackerNews item
 * @param storyTitle - Optional story title for comments
 * @returns WebSignal or null if item cannot be mapped
 */
export function mapItemToSignal(item: HNItem, storyTitle?: string): WebSignal | null {
  // Try mapping as story first
  if (isValidStory(item)) {
    return mapStoryToSignal(item);
  }

  // Try mapping as comment
  if (isValidComment(item) && storyTitle !== undefined) {
    return mapCommentToSignal(item, storyTitle);
  }

  // Cannot map this item
  return null;
}
