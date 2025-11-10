/**
 * Tests for FixSuggester
 */

import { FixSuggester } from '../../recommendation/FixSuggester';
import { AnalysisResult } from '../../models';

describe('FixSuggester', () => {
  let suggester: FixSuggester;

  beforeEach(() => {
    suggester = new FixSuggester();
  });

  const createInsight = (overrides?: Partial<AnalysisResult>): AnalysisResult => ({
    id: 'test-1',
    type: 'retention',
    severity: 'high',
    title: 'Low retention',
    description: 'Users are not returning',
    affectedUsers: 5000,
    potentialImpact: 0.8,
    confidence: 0.9,
    metadata: {},
    ...overrides,
  });

  describe('suggest', () => {
    it('should return fix suggestions', () => {
      const insight = createInsight();
      const suggestions = suggester.suggest(insight);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should include fix details', () => {
      const insight = createInsight();
      const suggestions = suggester.suggest(insight);

      suggestions.forEach((suggestion) => {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('implementation');
        expect(suggestion).toHaveProperty('estimatedImpact');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('category');
      });
    });

    it('should suggest retention fixes', () => {
      const insight = createInsight({ type: 'retention' });
      const suggestions = suggester.suggest(insight);

      expect(suggestions.some((s) => s.category === 'retention')).toBe(true);
    });

    it('should suggest churn fixes', () => {
      const insight = createInsight({ type: 'churn' });
      const suggestions = suggester.suggest(insight);

      expect(suggestions.some((s) => s.category === 'churn')).toBe(true);
    });

    it('should suggest growth fixes', () => {
      const insight = createInsight({ type: 'growth' });
      const suggestions = suggester.suggest(insight);

      expect(suggestions.some((s) => s.category === 'growth')).toBe(true);
    });

    it('should suggest revenue fixes', () => {
      const insight = createInsight({ type: 'revenue' });
      const suggestions = suggester.suggest(insight);

      expect(suggestions.some((s) => s.category === 'revenue')).toBe(true);
    });

    it('should suggest UX fixes', () => {
      const insight = createInsight({ type: 'ux' });
      const suggestions = suggester.suggest(insight);

      expect(suggestions.some((s) => s.category === 'ux')).toBe(true);
    });

    it('should suggest performance fixes', () => {
      const insight = createInsight({ type: 'performance' });
      const suggestions = suggester.suggest(insight);

      expect(suggestions.some((s) => s.category === 'performance')).toBe(true);
    });
  });
});
