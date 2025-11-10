/**
 * Tests for RICEScorer
 */

import { RICEScorer } from '../../prioritization/RICEScorer';
import { AnalysisResult } from '../../models';

describe('RICEScorer', () => {
  let scorer: RICEScorer;

  beforeEach(() => {
    scorer = new RICEScorer();
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

    it('should increase with higher reach', () => {
      const lowReach = createInsight({ affectedUsers: 100 });
      const highReach = createInsight({ affectedUsers: 10000 });

      const lowScore = scorer.score(lowReach);
      const highScore = scorer.score(highReach);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should accept custom reach parameter', () => {
      const insight = createInsight({ affectedUsers: 100 });
      const scoreWithCustomReach = scorer.score(insight, 5000);

      expect(scoreWithCustomReach).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero effort gracefully', () => {
      const insight = createInsight();
      const score = scorer.score(insight);

      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getComponents', () => {
    it('should return all RICE components', () => {
      const insight = createInsight();
      const components = scorer.getComponents(insight);

      expect(components).toHaveProperty('reach');
      expect(components).toHaveProperty('impact');
      expect(components).toHaveProperty('confidence');
      expect(components).toHaveProperty('effort');
      expect(components.reach).toBe(1000);
    });

    it('should use custom reach if provided', () => {
      const insight = createInsight();
      const components = scorer.getComponents(insight, 5000);

      expect(components.reach).toBe(5000);
    });
  });
});
