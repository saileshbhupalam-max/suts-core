/**
 * Tests for emotion detection module
 */

import {
  isValidEmotion,
  validateEmotions,
  extractEmotions,
  getEmotionSentiment,
  VALID_EMOTIONS,
  EMOTION_SENTIMENT_MAP,
  type Emotion,
} from '../src/emotions';

describe('emotions', () => {
  describe('isValidEmotion', () => {
    it('should return true for valid emotion labels', () => {
      expect(isValidEmotion('frustrated')).toBe(true);
      expect(isValidEmotion('excited')).toBe(true);
      expect(isValidEmotion('confused')).toBe(true);
      expect(isValidEmotion('grateful')).toBe(true);
    });

    it('should return false for invalid emotion labels', () => {
      expect(isValidEmotion('invalid')).toBe(false);
      expect(isValidEmotion('happy')).toBe(false);
      expect(isValidEmotion('')).toBe(false);
      expect(isValidEmotion('Frustrated')).toBe(false); // Case sensitive
    });

    it('should validate all emotions from VALID_EMOTIONS', () => {
      for (const emotion of VALID_EMOTIONS) {
        expect(isValidEmotion(emotion)).toBe(true);
      }
    });
  });

  describe('validateEmotions', () => {
    it('should filter out invalid emotions', () => {
      const input = ['frustrated', 'invalid', 'excited', 'happy'];
      const result = validateEmotions(input);
      expect(result).toEqual(['frustrated', 'excited']);
    });

    it('should return empty array for all invalid emotions', () => {
      const input = ['invalid', 'happy', 'sad'];
      const result = validateEmotions(input);
      expect(result).toEqual([]);
    });

    it('should return all emotions if all valid', () => {
      const input: Emotion[] = ['frustrated', 'excited', 'confused'];
      const result = validateEmotions(input);
      expect(result).toEqual(input);
    });

    it('should handle empty array', () => {
      const result = validateEmotions([]);
      expect(result).toEqual([]);
    });
  });

  describe('extractEmotions', () => {
    describe('negative emotions (sentiment < -0.5)', () => {
      it('should detect angry emotion', () => {
        const text = 'I am so angry about this bug!';
        const emotions = extractEmotions(text, -0.8);
        expect(emotions).toContain('angry');
      });

      it('should detect frustrated emotion', () => {
        const text = 'This is so frustrating, nothing works!';
        const emotions = extractEmotions(text, -0.7);
        expect(emotions).toContain('frustrated');
      });

      it('should detect disappointed emotion', () => {
        const text = 'I am really disappointed with this feature.';
        const emotions = extractEmotions(text, -0.6);
        expect(emotions).toContain('disappointed');
      });

      it('should detect multiple negative emotions', () => {
        const text = 'I am frustrated and angry about this disappointing bug.';
        const emotions = extractEmotions(text, -0.9);
        expect(emotions.length).toBeGreaterThan(0);
        expect(emotions.some((e) => ['frustrated', 'angry', 'disappointed'].includes(e))).toBe(
          true
        );
      });

      it('should use default frustrated if no keywords found', () => {
        const text = 'This is not good at all.';
        const emotions = extractEmotions(text, -0.7);
        expect(emotions).toContain('frustrated');
      });
    });

    describe('neutral-negative emotions (sentiment -0.5 to 0)', () => {
      it('should detect confused emotion', () => {
        const text = 'I am confused about how this works.';
        const emotions = extractEmotions(text, -0.3);
        expect(emotions).toContain('confused');
      });

      it('should detect overwhelmed emotion', () => {
        const text = 'This is too complex and overwhelming.';
        const emotions = extractEmotions(text, -0.4);
        expect(emotions).toContain('overwhelmed');
      });

      it('should detect anxious emotion', () => {
        const text = 'I am worried and anxious about this change.';
        const emotions = extractEmotions(text, -0.2);
        expect(emotions).toContain('anxious');
      });

      it('should use default confused if no keywords found', () => {
        const text = 'Not sure about this.';
        const emotions = extractEmotions(text, -0.3);
        expect(emotions).toContain('confused');
      });
    });

    describe('neutral-positive emotions (sentiment 0 to 0.5)', () => {
      it('should detect curious emotion', () => {
        const text = 'I am curious about this new feature.';
        const emotions = extractEmotions(text, 0.3);
        expect(emotions).toContain('curious');
      });

      it('should detect hopeful emotion', () => {
        const text = 'I am hopeful this will work well.';
        const emotions = extractEmotions(text, 0.4);
        expect(emotions).toContain('hopeful');
      });

      it('should use default interested if no keywords found', () => {
        const text = 'This looks okay.';
        const emotions = extractEmotions(text, 0.3);
        expect(emotions).toContain('interested');
      });
    });

    describe('positive emotions (sentiment >= 0.5)', () => {
      it('should detect excited emotion', () => {
        const text = 'This is so exciting and amazing!';
        const emotions = extractEmotions(text, 0.8);
        expect(emotions).toContain('excited');
      });

      it('should detect delighted emotion', () => {
        const text = 'I love this! It is perfect and delightful.';
        const emotions = extractEmotions(text, 0.9);
        expect(emotions).toContain('delighted');
      });

      it('should detect grateful emotion', () => {
        const text = 'Thank you so much! I am grateful for this.';
        const emotions = extractEmotions(text, 0.7);
        expect(emotions).toContain('grateful');
      });

      it('should use default excited if no keywords found', () => {
        const text = 'This is good.';
        const emotions = extractEmotions(text, 0.6);
        expect(emotions).toContain('excited');
      });
    });

    it('should remove duplicate emotions', () => {
      const text = 'I am frustrated and frustrated again!';
      const emotions = extractEmotions(text, -0.7);
      const uniqueEmotions = new Set(emotions);
      expect(emotions.length).toBe(uniqueEmotions.size);
    });

    it('should always return at least one emotion', () => {
      const text = 'Some neutral text.';
      expect(extractEmotions(text, -0.8).length).toBeGreaterThan(0);
      expect(extractEmotions(text, -0.3).length).toBeGreaterThan(0);
      expect(extractEmotions(text, 0.3).length).toBeGreaterThan(0);
      expect(extractEmotions(text, 0.8).length).toBeGreaterThan(0);
    });
  });

  describe('getEmotionSentiment', () => {
    it('should return 0 for empty emotions array', () => {
      const result = getEmotionSentiment([]);
      expect(result).toBe(0);
    });

    it('should return correct average for single emotion', () => {
      const result = getEmotionSentiment(['frustrated']);
      expect(result).toBe(EMOTION_SENTIMENT_MAP.frustrated);
    });

    it('should return average of multiple emotions', () => {
      const emotions: Emotion[] = ['frustrated', 'excited'];
      const result = getEmotionSentiment(emotions);
      const expected = (EMOTION_SENTIMENT_MAP.frustrated + EMOTION_SENTIMENT_MAP.excited) / 2;
      expect(result).toBeCloseTo(expected);
    });

    it('should handle all negative emotions', () => {
      const emotions: Emotion[] = ['angry', 'frustrated', 'disappointed'];
      const result = getEmotionSentiment(emotions);
      expect(result).toBeLessThan(0);
    });

    it('should handle all positive emotions', () => {
      const emotions: Emotion[] = ['excited', 'delighted', 'grateful'];
      const result = getEmotionSentiment(emotions);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle mixed emotions', () => {
      const emotions: Emotion[] = ['frustrated', 'hopeful'];
      const result = getEmotionSentiment(emotions);
      expect(result).toBeGreaterThan(-1);
      expect(result).toBeLessThan(1);
    });
  });

  describe('EMOTION_SENTIMENT_MAP', () => {
    it('should have entries for all valid emotions', () => {
      for (const emotion of VALID_EMOTIONS) {
        expect(EMOTION_SENTIMENT_MAP[emotion]).toBeDefined();
        expect(typeof EMOTION_SENTIMENT_MAP[emotion]).toBe('number');
      }
    });

    it('should have sentiment scores in range [-1, 1]', () => {
      for (const emotion of VALID_EMOTIONS) {
        const score = EMOTION_SENTIMENT_MAP[emotion];
        expect(score).toBeGreaterThanOrEqual(-1);
        expect(score).toBeLessThanOrEqual(1);
      }
    });

    it('should have negative scores for negative emotions', () => {
      expect(EMOTION_SENTIMENT_MAP.angry).toBeLessThan(0);
      expect(EMOTION_SENTIMENT_MAP.frustrated).toBeLessThan(0);
      expect(EMOTION_SENTIMENT_MAP.disappointed).toBeLessThan(0);
    });

    it('should have positive scores for positive emotions', () => {
      expect(EMOTION_SENTIMENT_MAP.excited).toBeGreaterThan(0);
      expect(EMOTION_SENTIMENT_MAP.delighted).toBeGreaterThan(0);
      expect(EMOTION_SENTIMENT_MAP.grateful).toBeGreaterThan(0);
    });
  });
});
