/**
 * Tests for sentiment scales
 */

import {
  SentimentScale,
  scaleToScore,
  scoreToScale,
  getScaleDescription,
  isValidScale
} from '../src/scales';

describe('SentimentScale', () => {
  describe('scaleToScore', () => {
    it('should map VeryNegative (1) to -1.0', () => {
      expect(scaleToScore(SentimentScale.VeryNegative)).toBe(-1.0);
    });

    it('should map Negative (2) to -0.5', () => {
      expect(scaleToScore(SentimentScale.Negative)).toBe(-0.5);
    });

    it('should map Neutral (3) to 0.0', () => {
      expect(scaleToScore(SentimentScale.Neutral)).toBe(0.0);
    });

    it('should map Positive (4) to 0.5', () => {
      expect(scaleToScore(SentimentScale.Positive)).toBe(0.5);
    });

    it('should map VeryPositive (5) to 1.0', () => {
      expect(scaleToScore(SentimentScale.VeryPositive)).toBe(1.0);
    });
  });

  describe('scoreToScale', () => {
    it('should map -1.0 to VeryNegative', () => {
      expect(scoreToScale(-1.0)).toBe(SentimentScale.VeryNegative);
    });

    it('should map -0.8 to VeryNegative', () => {
      expect(scoreToScale(-0.8)).toBe(SentimentScale.VeryNegative);
    });

    it('should map -0.5 to Negative', () => {
      expect(scoreToScale(-0.5)).toBe(SentimentScale.Negative);
    });

    it('should map -0.3 to Negative', () => {
      expect(scoreToScale(-0.3)).toBe(SentimentScale.Negative);
    });

    it('should map 0.0 to Neutral', () => {
      expect(scoreToScale(0.0)).toBe(SentimentScale.Neutral);
    });

    it('should map 0.1 to Neutral', () => {
      expect(scoreToScale(0.1)).toBe(SentimentScale.Neutral);
    });

    it('should map 0.5 to Positive', () => {
      expect(scoreToScale(0.5)).toBe(SentimentScale.Positive);
    });

    it('should map 0.6 to Positive', () => {
      expect(scoreToScale(0.6)).toBe(SentimentScale.Positive);
    });

    it('should map 1.0 to VeryPositive', () => {
      expect(scoreToScale(1.0)).toBe(SentimentScale.VeryPositive);
    });

    it('should map 0.9 to VeryPositive', () => {
      expect(scoreToScale(0.9)).toBe(SentimentScale.VeryPositive);
    });
  });

  describe('getScaleDescription', () => {
    it('should return correct description for VeryNegative', () => {
      expect(getScaleDescription(SentimentScale.VeryNegative)).toBe('Very Negative');
    });

    it('should return correct description for Negative', () => {
      expect(getScaleDescription(SentimentScale.Negative)).toBe('Negative');
    });

    it('should return correct description for Neutral', () => {
      expect(getScaleDescription(SentimentScale.Neutral)).toBe('Neutral');
    });

    it('should return correct description for Positive', () => {
      expect(getScaleDescription(SentimentScale.Positive)).toBe('Positive');
    });

    it('should return correct description for VeryPositive', () => {
      expect(getScaleDescription(SentimentScale.VeryPositive)).toBe('Very Positive');
    });
  });

  describe('isValidScale', () => {
    it('should return true for valid scale values (1-5)', () => {
      expect(isValidScale(1)).toBe(true);
      expect(isValidScale(2)).toBe(true);
      expect(isValidScale(3)).toBe(true);
      expect(isValidScale(4)).toBe(true);
      expect(isValidScale(5)).toBe(true);
    });

    it('should return false for invalid scale values', () => {
      expect(isValidScale(0)).toBe(false);
      expect(isValidScale(6)).toBe(false);
      expect(isValidScale(-1)).toBe(false);
      expect(isValidScale(10)).toBe(false);
    });

    it('should return false for non-integer values', () => {
      expect(isValidScale(2.5)).toBe(false);
      expect(isValidScale(3.7)).toBe(false);
    });
  });

  describe('bidirectional mapping', () => {
    it('should maintain consistency when converting scale to score and back', () => {
      const scales = [
        SentimentScale.VeryNegative,
        SentimentScale.Negative,
        SentimentScale.Neutral,
        SentimentScale.Positive,
        SentimentScale.VeryPositive
      ];

      for (const scale of scales) {
        const score = scaleToScore(scale);
        const backToScale = scoreToScale(score);
        expect(backToScale).toBe(scale);
      }
    });
  });
});
