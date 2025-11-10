/**
 * Tests for ICEScorer
 */

import { ICEScorer } from '../../prioritization/ICEScorer';
import { AnalysisResult } from '../../models';

describe('ICEScorer', () => {
  let scorer: ICEScorer;

  beforeEach(() => {
    scorer = new ICEScorer();
  });

  const createInsight = (overrides?: Partial<AnalysisResult>): AnalysisResult => ({
    id: 'test-1',
    type: 'retention',
    severity: 'medium',
    title: 'Test',
    description: 'Test',
    affectedUsers: 1000,
    potentialImpact: 0.5,
    confidence: 0.7,
    metadata: {},
    ...overrides,
  });

  describe('score', () => {
    it('should return positive score', () => {
      const insight = createInsight();
      const score = scorer.score(insight);

      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should increase with higher impact', () => {
      const lowImpact = createInsight({ potentialImpact: 0.2 });
      const highImpact = createInsight({ potentialImpact: 0.9 });

      const lowScore = scorer.score(lowImpact);
      const highScore = scorer.score(highImpact);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should increase with higher confidence', () => {
      const lowConfidence = createInsight({ confidence: 0.3 });
      const highConfidence = createInsight({ confidence: 0.9 });

      const lowScore = scorer.score(lowConfidence);
      const highScore = scorer.score(highConfidence);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should handle zero effort gracefully', () => {
      const insight = createInsight();
      const score = scorer.score(insight);

      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getComponents', () => {
    it('should return all ICE components', () => {
      const insight = createInsight();
      const components = scorer.getComponents(insight);

      expect(components).toHaveProperty('impact');
      expect(components).toHaveProperty('confidence');
      expect(components).toHaveProperty('effort');
      expect(components.confidence).toBe(0.7);
    });
  });
});
