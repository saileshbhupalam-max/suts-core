/**
 * Tests for SimilarityCalculator
 */

import { SimilarityCalculator } from '../src/similarity';

describe('SimilarityCalculator', () => {
  let calculator: SimilarityCalculator;

  beforeEach(() => {
    calculator = new SimilarityCalculator();
  });

  describe('cosineSimilarity', () => {
    it('should return 1.0 for identical texts', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const similarity = calculator.cosineSimilarity(text, text);

      expect(similarity).toBeCloseTo(1.0, 2);
    });

    it('should return high similarity for very similar texts', () => {
      const text1 = 'The quick brown fox jumps over the lazy dog';
      const text2 = 'The quick brown fox leaps over the lazy dog';
      const similarity = calculator.cosineSimilarity(text1, text2);

      expect(similarity).toBeGreaterThan(0.6);
    });

    it('should return low similarity for different texts', () => {
      const text1 = 'The quick brown fox jumps over the lazy dog';
      const text2 = 'Artificial intelligence is transforming modern software development';
      const similarity = calculator.cosineSimilarity(text1, text2);

      expect(similarity).toBeLessThan(0.3);
    });

    it('should return 0 for completely different texts with no common words', () => {
      const text1 = 'abc def ghi';
      const text2 = 'xyz uvw rst';
      const similarity = calculator.cosineSimilarity(text1, text2);

      expect(similarity).toBe(0);
    });

    it('should handle empty strings', () => {
      const similarity = calculator.cosineSimilarity('', '');

      expect(similarity).toBe(0);
    });
  });

  describe('jaccardSimilarity', () => {
    it('should return 1.0 for identical texts', () => {
      const text = 'hello world test';
      const similarity = calculator.jaccardSimilarity(text, text);

      expect(similarity).toBe(1.0);
    });

    it('should compute Jaccard similarity correctly', () => {
      const text1 = 'cat dog bird';
      const text2 = 'cat dog fish';
      // Intersection: {cat, dog} = 2
      // Union: {cat, dog, bird, fish} = 4
      // Jaccard = 2/4 = 0.5
      const similarity = calculator.jaccardSimilarity(text1, text2);

      expect(similarity).toBeCloseTo(0.5, 2);
    });

    it('should return 0 for completely different texts', () => {
      const text1 = 'apple orange banana';
      const text2 = 'car bike train';
      const similarity = calculator.jaccardSimilarity(text1, text2);

      expect(similarity).toBe(0);
    });

    it('should handle empty strings', () => {
      const similarity = calculator.jaccardSimilarity('', '');

      expect(similarity).toBe(1.0);
    });

    it('should be case-insensitive', () => {
      const text1 = 'HELLO WORLD';
      const text2 = 'hello world';
      const similarity = calculator.jaccardSimilarity(text1, text2);

      expect(similarity).toBe(1.0);
    });
  });

  describe('levenshteinSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      const text = 'hello';
      const similarity = calculator.levenshteinSimilarity(text, text);

      expect(similarity).toBe(1.0);
    });

    it('should compute similarity correctly for small edits', () => {
      const text1 = 'kitten';
      const text2 = 'sitting';
      // Levenshtein distance = 3 (k→s, e→i, insert g)
      // Max length = 7
      // Similarity = 1 - (3/7) = 0.571...
      const similarity = calculator.levenshteinSimilarity(text1, text2);

      expect(similarity).toBeCloseTo(0.571, 2);
    });

    it('should return 0 for completely different strings of same length', () => {
      const text1 = 'aaaa';
      const text2 = 'bbbb';
      // Distance = 4, max length = 4
      // Similarity = 1 - (4/4) = 0
      const similarity = calculator.levenshteinSimilarity(text1, text2);

      expect(similarity).toBe(0);
    });

    it('should handle empty strings', () => {
      const similarity = calculator.levenshteinSimilarity('', '');

      expect(similarity).toBe(1.0);
    });

    it('should handle one empty string', () => {
      const similarity = calculator.levenshteinSimilarity('hello', '');

      expect(similarity).toBe(0);
    });
  });

  describe('similarity', () => {
    it('should return high score for identical texts', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const similarity = calculator.similarity(text, text);

      expect(similarity).toBeGreaterThan(0.9);
    });

    it('should identify near-duplicates', () => {
      const text1 = 'This is a great product for developers';
      const text2 = 'This is an excellent product for developers';
      const similarity = calculator.similarity(text1, text2);

      expect(similarity).toBeGreaterThan(0.4);
    });

    it('should return low score for different texts', () => {
      const text1 = 'Machine learning models require training data';
      const text2 = 'Cooking pasta requires boiling water';
      const similarity = calculator.similarity(text1, text2);

      expect(similarity).toBeLessThan(0.3);
    });

    it('should combine cosine and Jaccard with proper weighting', () => {
      const text1 = 'apple banana cherry';
      const text2 = 'apple banana date';

      const cosine = calculator.cosineSimilarity(text1, text2);
      const jaccard = calculator.jaccardSimilarity(text1, text2);
      const combined = calculator.similarity(text1, text2);

      // Verify weighted average: 0.7 * cosine + 0.3 * jaccard
      const expected = 0.7 * cosine + 0.3 * jaccard;
      expect(combined).toBeCloseTo(expected, 5);
    });
  });
});
