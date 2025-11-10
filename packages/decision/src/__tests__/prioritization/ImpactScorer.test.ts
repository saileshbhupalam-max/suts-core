/**
 * Tests for ImpactScorer
 */

import { ImpactScorer } from '../../prioritization/ImpactScorer';
import { AnalysisResult } from '../../models';

describe('ImpactScorer', () => {
  let scorer: ImpactScorer;

  beforeEach(() => {
    scorer = new ImpactScorer();
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
    it('should return score between 0 and 1', () => {
      const insight = createInsight();
      const score = scorer.score(insight);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should score critical severity higher', () => {
      const mediumInsight = createInsight({ severity: 'medium' });
      const criticalInsight = createInsight({ severity: 'critical' });

      const mediumScore = scorer.score(mediumInsight);
      const criticalScore = scorer.score(criticalInsight);

      expect(criticalScore).toBeGreaterThan(mediumScore);
    });

    it('should score more affected users higher', () => {
      const lowUsers = createInsight({ affectedUsers: 100 });
      const highUsers = createInsight({ affectedUsers: 10000 });

      const lowScore = scorer.score(lowUsers);
      const highScore = scorer.score(highUsers);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should score higher potential impact higher', () => {
      const lowImpact = createInsight({ potentialImpact: 0.2 });
      const highImpact = createInsight({ potentialImpact: 0.9 });

      const lowScore = scorer.score(lowImpact);
      const highScore = scorer.score(highImpact);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should handle zero affected users', () => {
      const insight = createInsight({ affectedUsers: 0 });
      const score = scorer.score(insight);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle all severity levels', () => {
      const severities = ['critical', 'high', 'medium', 'low'] as const;

      severities.forEach((severity) => {
        const insight = createInsight({ severity });
        const score = scorer.score(insight);

        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });
});
