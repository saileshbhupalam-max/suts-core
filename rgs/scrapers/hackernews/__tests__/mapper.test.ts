/**
 * Tests for HackerNews mapper
 */

import {
  mapStoryToSignal,
  mapCommentToSignal,
  mapItemToSignal,
  isValidStory,
  isValidComment,
} from '../src/mapper';
import { HNStory, HNComment, HNItem } from '../src/client';

describe('HackerNews Mapper', () => {
  describe('mapStoryToSignal', () => {
    it('should map story with URL to signal', () => {
      const story: HNStory = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        title: 'Test Story',
        url: 'https://example.com',
        points: 100,
        num_comments: 50,
      };

      const signal = mapStoryToSignal(story);

      expect(signal.id).toBe('hn-12345');
      expect(signal.source).toBe('hackernews');
      expect(signal.content).toBe('Test Story');
      expect(signal.author).toBe('testuser');
      expect(signal.timestamp).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(signal.url).toBe('https://example.com');
      expect(signal.metadata).toEqual({
        points: 100,
        numComments: 50,
        storyTitle: 'Test Story',
        storyUrl: 'https://example.com',
        objectID: '12345',
        type: 'story',
      });
    });

    it('should map story without URL to signal with HN item page', () => {
      const story: HNStory = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        title: 'Test Story',
        points: 100,
        num_comments: 50,
      };

      const signal = mapStoryToSignal(story);

      expect(signal.url).toBe('https://news.ycombinator.com/item?id=12345');
    });

    it('should use story_text as content if available', () => {
      const story: HNStory = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        title: 'Test Story',
        story_text: 'Detailed story text',
        points: 100,
        num_comments: 50,
      };

      const signal = mapStoryToSignal(story);

      expect(signal.content).toBe('Detailed story text');
    });

    it('should handle zero points and comments', () => {
      const story: HNStory = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        title: 'Test Story',
        points: 0,
        num_comments: 0,
      };

      const signal = mapStoryToSignal(story);

      expect(signal.metadata['points']).toBe(0);
      expect(signal.metadata['numComments']).toBe(0);
    });
  });

  describe('mapCommentToSignal', () => {
    it('should map comment to signal', () => {
      const comment: HNComment = {
        objectID: '67890',
        created_at: '2024-01-02T00:00:00.000Z',
        author: 'commenter',
        comment_text: 'This is a comment',
        story_id: 12345,
        parent_id: 12345,
      };

      const signal = mapCommentToSignal(comment, 'Parent Story');

      expect(signal.id).toBe('hn-comment-67890');
      expect(signal.source).toBe('hackernews');
      expect(signal.content).toBe('This is a comment');
      expect(signal.author).toBe('commenter');
      expect(signal.timestamp).toEqual(new Date('2024-01-02T00:00:00.000Z'));
      expect(signal.url).toBe('https://news.ycombinator.com/item?id=67890');
      expect(signal.metadata).toEqual({
        storyId: 12345,
        storyTitle: 'Parent Story',
        parentId: 12345,
        objectID: '67890',
        type: 'comment',
      });
    });

    it('should handle empty comment_text as empty string', () => {
      const comment: HNComment = {
        objectID: '67890',
        created_at: '2024-01-02T00:00:00.000Z',
        author: 'commenter',
        comment_text: '',
        story_id: 12345,
      };

      const signal = mapCommentToSignal(comment, 'Parent Story');

      expect(signal.content).toBe('');
    });
  });

  describe('isValidStory', () => {
    it('should return true for valid story', () => {
      const item: HNItem = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        title: 'Test Story',
        points: 100,
        num_comments: 50,
      };

      expect(isValidStory(item)).toBe(true);
    });

    it('should return false for story without title', () => {
      const item: HNItem = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        points: 100,
        num_comments: 50,
      };

      expect(isValidStory(item)).toBe(false);
    });

    it('should return false for story with empty title', () => {
      const item: HNItem = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        title: '   ',
        points: 100,
        num_comments: 50,
      };

      expect(isValidStory(item)).toBe(false);
    });

    it('should return false for story without points', () => {
      const item: HNItem = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        title: 'Test Story',
        num_comments: 50,
      };

      expect(isValidStory(item)).toBe(false);
    });

    it('should return false for story without num_comments', () => {
      const item: HNItem = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        title: 'Test Story',
        points: 100,
      };

      expect(isValidStory(item)).toBe(false);
    });

    it('should return true for story with zero points', () => {
      const item: HNItem = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        title: 'Test Story',
        points: 0,
        num_comments: 0,
      };

      expect(isValidStory(item)).toBe(true);
    });
  });

  describe('isValidComment', () => {
    it('should return true for valid comment', () => {
      const item: HNItem = {
        objectID: '67890',
        created_at: '2024-01-02T00:00:00.000Z',
        author: 'commenter',
        comment_text: 'This is a comment',
        story_id: 12345,
      };

      expect(isValidComment(item)).toBe(true);
    });

    it('should return false for comment without comment_text', () => {
      const item: HNItem = {
        objectID: '67890',
        created_at: '2024-01-02T00:00:00.000Z',
        author: 'commenter',
        story_id: 12345,
      };

      expect(isValidComment(item)).toBe(false);
    });

    it('should return false for comment with empty comment_text', () => {
      const item: HNItem = {
        objectID: '67890',
        created_at: '2024-01-02T00:00:00.000Z',
        author: 'commenter',
        comment_text: '   ',
        story_id: 12345,
      };

      expect(isValidComment(item)).toBe(false);
    });

    it('should return false for comment without story_id', () => {
      const item: HNItem = {
        objectID: '67890',
        created_at: '2024-01-02T00:00:00.000Z',
        author: 'commenter',
        comment_text: 'This is a comment',
      };

      expect(isValidComment(item)).toBe(false);
    });
  });

  describe('mapItemToSignal', () => {
    it('should map valid story', () => {
      const item: HNItem = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
        title: 'Test Story',
        points: 100,
        num_comments: 50,
      };

      const signal = mapItemToSignal(item);

      expect(signal).not.toBeNull();
      expect(signal?.id).toBe('hn-12345');
      expect(signal?.source).toBe('hackernews');
    });

    it('should map valid comment with story title', () => {
      const item: HNItem = {
        objectID: '67890',
        created_at: '2024-01-02T00:00:00.000Z',
        author: 'commenter',
        comment_text: 'This is a comment',
        story_id: 12345,
      };

      const signal = mapItemToSignal(item, 'Parent Story');

      expect(signal).not.toBeNull();
      expect(signal?.id).toBe('hn-comment-67890');
      expect(signal?.source).toBe('hackernews');
      expect(signal?.metadata['storyTitle']).toBe('Parent Story');
    });

    it('should return null for comment without story title', () => {
      const item: HNItem = {
        objectID: '67890',
        created_at: '2024-01-02T00:00:00.000Z',
        author: 'commenter',
        comment_text: 'This is a comment',
        story_id: 12345,
      };

      const signal = mapItemToSignal(item);

      expect(signal).toBeNull();
    });

    it('should return null for invalid item', () => {
      const item: HNItem = {
        objectID: '12345',
        created_at: '2024-01-01T00:00:00.000Z',
        author: 'testuser',
      };

      const signal = mapItemToSignal(item);

      expect(signal).toBeNull();
    });
  });
});
