/**
 * Tests for WebSignal model
 */

import {
  type WebSignal,
  createWebSignal,
  isValidSentiment,
  isWebSignal,
} from '../src/models/signal';

describe('WebSignal', () => {
  describe('createWebSignal', () => {
    it('should create a valid web signal with required fields', () => {
      const signal = createWebSignal({
        id: 'signal-1',
        source: 'reddit',
        content: 'Test content',
        timestamp: new Date('2024-01-01'),
        url: 'https://reddit.com/r/test/1',
        metadata: { score: 100 },
      });

      expect(signal.id).toBe('signal-1');
      expect(signal.source).toBe('reddit');
      expect(signal.content).toBe('Test content');
      expect(signal.timestamp).toEqual(new Date('2024-01-01'));
      expect(signal.url).toBe('https://reddit.com/r/test/1');
      expect(signal.metadata).toEqual({ score: 100 });
    });

    it('should create a signal with optional fields', () => {
      const signal = createWebSignal({
        id: 'signal-2',
        source: 'twitter',
        content: 'Tweet content',
        timestamp: new Date(),
        url: 'https://twitter.com/user/status/123',
        metadata: {},
        author: 'testuser',
        sentiment: 0.5,
        themes: ['tech', 'ai'],
      });

      expect(signal.author).toBe('testuser');
      expect(signal.sentiment).toBe(0.5);
      expect(signal.themes).toEqual(['tech', 'ai']);
    });
  });

  describe('isValidSentiment', () => {
    it('should return true for valid sentiment scores', () => {
      expect(isValidSentiment(-1)).toBe(true);
      expect(isValidSentiment(0)).toBe(true);
      expect(isValidSentiment(1)).toBe(true);
      expect(isValidSentiment(0.5)).toBe(true);
      expect(isValidSentiment(-0.75)).toBe(true);
    });

    it('should return false for invalid sentiment scores', () => {
      expect(isValidSentiment(-1.1)).toBe(false);
      expect(isValidSentiment(1.1)).toBe(false);
      expect(isValidSentiment(-2)).toBe(false);
      expect(isValidSentiment(5)).toBe(false);
    });
  });

  describe('isWebSignal', () => {
    const validSignal: WebSignal = {
      id: 'test-id',
      source: 'reddit',
      content: 'Test content',
      timestamp: new Date(),
      url: 'https://example.com',
      metadata: {},
    };

    it('should return true for valid web signals', () => {
      expect(isWebSignal(validSignal)).toBe(true);
    });

    it('should return true for signals with optional fields', () => {
      const signal: WebSignal = {
        ...validSignal,
        author: 'testuser',
        sentiment: 0.5,
        themes: ['tech'],
      };
      expect(isWebSignal(signal)).toBe(true);
    });

    it('should return false for null or non-objects', () => {
      expect(isWebSignal(null)).toBe(false);
      expect(isWebSignal(undefined)).toBe(false);
      expect(isWebSignal('string')).toBe(false);
      expect(isWebSignal(123)).toBe(false);
      expect(isWebSignal([])).toBe(false);
    });

    it('should return false for missing required fields', () => {
      expect(isWebSignal({ ...validSignal, id: '' })).toBe(false);
      expect(isWebSignal({ ...validSignal, content: '' })).toBe(false);
      expect(isWebSignal({ ...validSignal, url: '' })).toBe(false);
    });

    it('should return false for wrong field types', () => {
      expect(isWebSignal({ ...validSignal, id: 123 })).toBe(false);
      expect(isWebSignal({ ...validSignal, source: 'invalid' })).toBe(false);
      expect(isWebSignal({ ...validSignal, content: null })).toBe(false);
      expect(isWebSignal({ ...validSignal, timestamp: 'not-a-date' })).toBe(false);
      expect(isWebSignal({ ...validSignal, metadata: null })).toBe(false);
    });

    it('should return false for invalid optional fields', () => {
      expect(isWebSignal({ ...validSignal, author: 123 })).toBe(false);
      expect(isWebSignal({ ...validSignal, sentiment: 2 })).toBe(false);
      expect(isWebSignal({ ...validSignal, sentiment: -2 })).toBe(false);
      expect(isWebSignal({ ...validSignal, themes: 'not-an-array' })).toBe(false);
      expect(isWebSignal({ ...validSignal, themes: [123] })).toBe(false);
    });
  });
});
