/**
 * Tests for Pipeline Context
 */

import { createPipelineContext, isPipelineContext, clonePipelineContext } from '../src/context';

describe('Pipeline Context', () => {
  describe('createPipelineContext', () => {
    it('should create a valid context with initialized fields', () => {
      const context = createPipelineContext();

      expect(context.startTime).toBeInstanceOf(Date);
      expect(context.errors).toEqual([]);
      expect(context.metadata).toEqual({});
      expect(context.signals).toBeUndefined();
      expect(context.sentiments).toBeUndefined();
      expect(context.themes).toBeUndefined();
    });

    it('should create contexts with unique start times', async () => {
      const context1 = createPipelineContext();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const context2 = createPipelineContext();

      expect(context2.startTime.getTime()).toBeGreaterThanOrEqual(context1.startTime.getTime());
    });
  });

  describe('isPipelineContext', () => {
    it('should return true for valid context', () => {
      const context = createPipelineContext();
      expect(isPipelineContext(context)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isPipelineContext(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isPipelineContext(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isPipelineContext(123)).toBe(false);
      expect(isPipelineContext('string')).toBe(false);
      expect(isPipelineContext(true)).toBe(false);
    });

    it('should return false for object missing required fields', () => {
      expect(isPipelineContext({})).toBe(false);
      expect(isPipelineContext({ startTime: new Date() })).toBe(false);
      expect(
        isPipelineContext({
          startTime: new Date(),
          errors: [],
        })
      ).toBe(false);
    });

    it('should return false for object with invalid field types', () => {
      expect(
        isPipelineContext({
          startTime: 'not a date',
          errors: [],
          metadata: {},
        })
      ).toBe(false);

      expect(
        isPipelineContext({
          startTime: new Date(),
          errors: 'not an array',
          metadata: {},
        })
      ).toBe(false);

      expect(
        isPipelineContext({
          startTime: new Date(),
          errors: [],
          metadata: null,
        })
      ).toBe(false);
    });
  });

  describe('clonePipelineContext', () => {
    it('should create a deep copy of context', () => {
      const original = createPipelineContext();
      original.errors.push(new Error('test'));
      original.metadata['foo'] = 'bar';

      const cloned = clonePipelineContext(original);

      expect(cloned).not.toBe(original);
      expect(cloned.startTime).toBe(original.startTime);
      expect(cloned.errors).toEqual(original.errors);
      expect(cloned.errors).not.toBe(original.errors);
      expect(cloned.metadata).toEqual(original.metadata);
      expect(cloned.metadata).not.toBe(original.metadata);
    });

    it('should clone signals array if present', () => {
      const original = createPipelineContext();
      original.signals = [
        {
          id: 'signal-1',
          source: 'reddit',
          content: 'test content',
          author: 'user1',
          timestamp: new Date(),
          url: 'https://example.com',
          metadata: {},
        },
      ];

      const cloned = clonePipelineContext(original);

      expect(cloned.signals).toEqual(original.signals);
      expect(cloned.signals).not.toBe(original.signals);
    });

    it('should clone sentiments array if present', () => {
      const original = createPipelineContext();
      original.sentiments = [
        {
          signalId: 'signal-1',
          score: 0.8,
          confidence: 0.9,
          label: 'positive',
        },
      ];

      const cloned = clonePipelineContext(original);

      expect(cloned.sentiments).toEqual(original.sentiments);
      expect(cloned.sentiments).not.toBe(original.sentiments);
    });

    it('should clone themes array if present', () => {
      const original = createPipelineContext();
      original.themes = [
        {
          name: 'Performance',
          confidence: 0.85,
          keywords: ['speed', 'fast'],
          frequency: 10,
        },
      ];

      const cloned = clonePipelineContext(original);

      expect(cloned.themes).toEqual(original.themes);
      expect(cloned.themes).not.toBe(original.themes);
    });

    it('should handle undefined optional fields', () => {
      const original = createPipelineContext();
      const cloned = clonePipelineContext(original);

      expect(cloned.signals).toBeUndefined();
      expect(cloned.sentiments).toBeUndefined();
      expect(cloned.themes).toBeUndefined();
    });

    it('should not share references between original and clone', () => {
      const original = createPipelineContext();
      original.errors.push(new Error('test'));
      original.metadata['foo'] = 'bar';

      const cloned = clonePipelineContext(original);

      // Modify clone
      cloned.errors.push(new Error('another'));
      cloned.metadata['baz'] = 'qux';

      // Original should not be affected
      expect(original.errors).toHaveLength(1);
      expect(original.metadata).toEqual({ foo: 'bar' });
    });
  });
});
