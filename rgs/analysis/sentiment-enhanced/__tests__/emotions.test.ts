/**
 * Tests for emotion taxonomy
 */

import {
  EmotionCategory,
  EmotionLabel,
  EMOTION_TAXONOMY,
  EMOTION_LABELS,
  getEmotionCategory,
  getEmotionsByCategory,
  isValidEmotion,
  createEmotionScore,
  filterEmotionsByCategory,
  getTopEmotions
} from '../src/emotions';

describe('EmotionTaxonomy', () => {
  describe('EMOTION_TAXONOMY', () => {
    it('should have 18 emotion labels', () => {
      expect(Object.keys(EMOTION_TAXONOMY)).toHaveLength(18);
    });

    it('should categorize negative emotions correctly', () => {
      expect(EMOTION_TAXONOMY.frustrated).toBe(EmotionCategory.Negative);
      expect(EMOTION_TAXONOMY.angry).toBe(EmotionCategory.Negative);
      expect(EMOTION_TAXONOMY.disappointed).toBe(EmotionCategory.Negative);
      expect(EMOTION_TAXONOMY.annoyed).toBe(EmotionCategory.Negative);
    });

    it('should categorize neutral-negative emotions correctly', () => {
      expect(EMOTION_TAXONOMY.confused).toBe(EmotionCategory.NeutralNegative);
      expect(EMOTION_TAXONOMY.overwhelmed).toBe(EmotionCategory.NeutralNegative);
      expect(EMOTION_TAXONOMY.anxious).toBe(EmotionCategory.NeutralNegative);
      expect(EMOTION_TAXONOMY.skeptical).toBe(EmotionCategory.NeutralNegative);
    });

    it('should categorize neutral emotions correctly', () => {
      expect(EMOTION_TAXONOMY.indifferent).toBe(EmotionCategory.Neutral);
      expect(EMOTION_TAXONOMY.curious).toBe(EmotionCategory.Neutral);
      expect(EMOTION_TAXONOMY.uncertain).toBe(EmotionCategory.Neutral);
    });

    it('should categorize neutral-positive emotions correctly', () => {
      expect(EMOTION_TAXONOMY.hopeful).toBe(EmotionCategory.NeutralPositive);
      expect(EMOTION_TAXONOMY.interested).toBe(EmotionCategory.NeutralPositive);
      expect(EMOTION_TAXONOMY.satisfied).toBe(EmotionCategory.NeutralPositive);
    });

    it('should categorize positive emotions correctly', () => {
      expect(EMOTION_TAXONOMY.excited).toBe(EmotionCategory.Positive);
      expect(EMOTION_TAXONOMY.delighted).toBe(EmotionCategory.Positive);
      expect(EMOTION_TAXONOMY.grateful).toBe(EmotionCategory.Positive);
      expect(EMOTION_TAXONOMY.impressed).toBe(EmotionCategory.Positive);
    });
  });

  describe('EMOTION_LABELS', () => {
    it('should contain all 18 emotion labels', () => {
      expect(EMOTION_LABELS).toHaveLength(18);
    });

    it('should include all expected emotions', () => {
      const expected: EmotionLabel[] = [
        'frustrated', 'angry', 'disappointed', 'annoyed',
        'confused', 'overwhelmed', 'anxious', 'skeptical',
        'indifferent', 'curious', 'uncertain',
        'hopeful', 'interested', 'satisfied',
        'excited', 'delighted', 'grateful', 'impressed'
      ];

      for (const emotion of expected) {
        expect(EMOTION_LABELS).toContain(emotion);
      }
    });
  });

  describe('getEmotionCategory', () => {
    it('should return correct category for negative emotion', () => {
      expect(getEmotionCategory('frustrated')).toBe(EmotionCategory.Negative);
    });

    it('should return correct category for neutral-negative emotion', () => {
      expect(getEmotionCategory('confused')).toBe(EmotionCategory.NeutralNegative);
    });

    it('should return correct category for neutral emotion', () => {
      expect(getEmotionCategory('curious')).toBe(EmotionCategory.Neutral);
    });

    it('should return correct category for neutral-positive emotion', () => {
      expect(getEmotionCategory('hopeful')).toBe(EmotionCategory.NeutralPositive);
    });

    it('should return correct category for positive emotion', () => {
      expect(getEmotionCategory('excited')).toBe(EmotionCategory.Positive);
    });
  });

  describe('getEmotionsByCategory', () => {
    it('should return 4 negative emotions', () => {
      const negativeEmotions = getEmotionsByCategory(EmotionCategory.Negative);
      expect(negativeEmotions).toHaveLength(4);
      expect(negativeEmotions).toContain('frustrated');
      expect(negativeEmotions).toContain('angry');
    });

    it('should return 4 neutral-negative emotions', () => {
      const emotions = getEmotionsByCategory(EmotionCategory.NeutralNegative);
      expect(emotions).toHaveLength(4);
      expect(emotions).toContain('confused');
    });

    it('should return 3 neutral emotions', () => {
      const emotions = getEmotionsByCategory(EmotionCategory.Neutral);
      expect(emotions).toHaveLength(3);
      expect(emotions).toContain('curious');
    });

    it('should return 3 neutral-positive emotions', () => {
      const emotions = getEmotionsByCategory(EmotionCategory.NeutralPositive);
      expect(emotions).toHaveLength(3);
      expect(emotions).toContain('hopeful');
    });

    it('should return 4 positive emotions', () => {
      const emotions = getEmotionsByCategory(EmotionCategory.Positive);
      expect(emotions).toHaveLength(4);
      expect(emotions).toContain('excited');
    });
  });

  describe('isValidEmotion', () => {
    it('should return true for valid emotions', () => {
      expect(isValidEmotion('frustrated')).toBe(true);
      expect(isValidEmotion('excited')).toBe(true);
      expect(isValidEmotion('curious')).toBe(true);
    });

    it('should return false for invalid emotions', () => {
      expect(isValidEmotion('happy')).toBe(false);
      expect(isValidEmotion('sad')).toBe(false);
      expect(isValidEmotion('invalid')).toBe(false);
      expect(isValidEmotion('')).toBe(false);
    });
  });

  describe('createEmotionScore', () => {
    it('should create emotion score with correct properties', () => {
      const score = createEmotionScore('excited', 0.8);
      expect(score.label).toBe('excited');
      expect(score.category).toBe(EmotionCategory.Positive);
      expect(score.intensity).toBe(0.8);
    });

    it('should throw error for intensity < 0', () => {
      expect(() => createEmotionScore('excited', -0.1)).toThrow('Invalid emotion intensity');
    });

    it('should throw error for intensity > 1', () => {
      expect(() => createEmotionScore('excited', 1.1)).toThrow('Invalid emotion intensity');
    });

    it('should accept valid intensity range', () => {
      expect(() => createEmotionScore('excited', 0)).not.toThrow();
      expect(() => createEmotionScore('excited', 1)).not.toThrow();
      expect(() => createEmotionScore('excited', 0.5)).not.toThrow();
    });
  });

  describe('filterEmotionsByCategory', () => {
    it('should filter emotions by category', () => {
      const emotions = [
        createEmotionScore('excited', 0.8),
        createEmotionScore('frustrated', 0.6),
        createEmotionScore('curious', 0.4)
      ];

      const positive = filterEmotionsByCategory(emotions, EmotionCategory.Positive);
      expect(positive).toHaveLength(1);
      expect(positive[0]?.label).toBe('excited');

      const negative = filterEmotionsByCategory(emotions, EmotionCategory.Negative);
      expect(negative).toHaveLength(1);
      expect(negative[0]?.label).toBe('frustrated');
    });

    it('should return empty array if no emotions match', () => {
      const emotions = [createEmotionScore('excited', 0.8)];
      const filtered = filterEmotionsByCategory(emotions, EmotionCategory.Negative);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('getTopEmotions', () => {
    it('should return top N emotions by intensity', () => {
      const emotions = [
        createEmotionScore('excited', 0.9),
        createEmotionScore('frustrated', 0.3),
        createEmotionScore('curious', 0.7),
        createEmotionScore('hopeful', 0.5)
      ];

      const top2 = getTopEmotions(emotions, 2);
      expect(top2).toHaveLength(2);
      expect(top2[0]?.label).toBe('excited');
      expect(top2[0]?.intensity).toBe(0.9);
      expect(top2[1]?.label).toBe('curious');
      expect(top2[1]?.intensity).toBe(0.7);
    });

    it('should return all emotions if N is greater than array length', () => {
      const emotions = [
        createEmotionScore('excited', 0.8),
        createEmotionScore('curious', 0.6)
      ];

      const top5 = getTopEmotions(emotions, 5);
      expect(top5).toHaveLength(2);
    });

    it('should not modify original array', () => {
      const emotions = [
        createEmotionScore('excited', 0.9),
        createEmotionScore('curious', 0.7)
      ];
      const original = [...emotions];

      getTopEmotions(emotions, 1);
      expect(emotions).toEqual(original);
    });
  });
});
