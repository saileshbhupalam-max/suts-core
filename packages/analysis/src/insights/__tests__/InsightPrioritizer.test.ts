/**
 * Tests for InsightPrioritizer
 */

import { InsightPrioritizer } from '../InsightPrioritizer';
import { Insight } from '../../models';
import { DEFAULT_ANALYSIS_CONFIG } from '../../models/config';

describe('InsightPrioritizer', () => {
  const createInsight = (overrides: Partial<Insight> = {}): Insight => ({
    type: 'friction',
    title: 'Test Insight',
    description: 'Test description',
    impact: 0.5,
    effort: 0.5,
    priority: 0.5,
    confidence: 0.5,
    data: {},
    recommendations: [],
    ...overrides,
  });

  describe('prioritize', () => {
    it('should return empty array for no insights', () => {
      const prioritizer = new InsightPrioritizer(DEFAULT_ANALYSIS_CONFIG);
      const results = prioritizer.prioritize([]);

      expect(results).toEqual([]);
    });

    it('should prioritize high impact, low effort insights first', () => {
      const prioritizer = new InsightPrioritizer(DEFAULT_ANALYSIS_CONFIG);

      const insights = [
        createInsight({ title: 'Low Priority', impact: 0.3, effort: 0.8, confidence: 0.5 }),
        createInsight({ title: 'High Priority', impact: 0.9, effort: 0.2, confidence: 0.9 }),
        createInsight({ title: 'Medium Priority', impact: 0.6, effort: 0.5, confidence: 0.7 }),
      ];

      const results = prioritizer.prioritize(insights);

      expect(results[0]?.title).toBe('High Priority');
      expect(results[0]?.priority).toBeGreaterThan(results[1]?.priority ?? 0);
    });

    it('should calculate priority scores', () => {
      const prioritizer = new InsightPrioritizer(DEFAULT_ANALYSIS_CONFIG);

      const insights = [createInsight({ impact: 0.8, effort: 0.4, confidence: 0.9 })];

      const results = prioritizer.prioritize(insights);

      expect(results[0]?.priority).toBeGreaterThan(0);
      expect(results[0]?.priority).toBeLessThanOrEqual(1);
    });

    it('should handle zero effort', () => {
      const prioritizer = new InsightPrioritizer(DEFAULT_ANALYSIS_CONFIG);

      const insights = [createInsight({ impact: 0.8, effort: 0, confidence: 0.9 })];

      expect(() => prioritizer.prioritize(insights)).not.toThrow();
    });
  });

  describe('filterByConfidence', () => {
    it('should filter insights below minimum confidence', () => {
      const prioritizer = new InsightPrioritizer(DEFAULT_ANALYSIS_CONFIG);

      const insights = [
        createInsight({ confidence: 0.3 }),
        createInsight({ confidence: 0.7 }),
        createInsight({ confidence: 0.9 }),
      ];

      const results = prioritizer.filterByConfidence(insights);

      expect(results.length).toBe(2);
      expect(results.every((r) => r.confidence >= 0.5)).toBe(true);
    });
  });

  describe('groupByType', () => {
    it('should group insights by type', () => {
      const prioritizer = new InsightPrioritizer(DEFAULT_ANALYSIS_CONFIG);

      const insights = [
        createInsight({ type: 'friction' }),
        createInsight({ type: 'value' }),
        createInsight({ type: 'friction' }),
        createInsight({ type: 'churn' }),
      ];

      const grouped = prioritizer.groupByType(insights);

      expect(grouped['friction']?.length).toBe(2);
      expect(grouped['value']?.length).toBe(1);
      expect(grouped['churn']?.length).toBe(1);
      expect(grouped['opportunity']?.length).toBe(0);
    });
  });

  describe('getTopN', () => {
    it('should return top N insights', () => {
      const prioritizer = new InsightPrioritizer(DEFAULT_ANALYSIS_CONFIG);

      const insights = [
        createInsight({ impact: 0.9, effort: 0.2 }),
        createInsight({ impact: 0.7, effort: 0.3 }),
        createInsight({ impact: 0.5, effort: 0.5 }),
        createInsight({ impact: 0.3, effort: 0.8 }),
      ];

      const top2 = prioritizer.getTopN(insights, 2);

      expect(top2.length).toBe(2);
      expect(top2[0]?.impact).toBeGreaterThanOrEqual(top2[1]?.impact ?? 0);
    });
  });

  describe('identifyQuickWins', () => {
    it('should identify quick wins', () => {
      const prioritizer = new InsightPrioritizer(DEFAULT_ANALYSIS_CONFIG);

      const insights = [
        createInsight({ impact: 0.7, effort: 0.3, confidence: 0.8 }), // Quick win
        createInsight({ impact: 0.5, effort: 0.8, confidence: 0.9 }), // Not a quick win
        createInsight({ impact: 0.8, effort: 0.2, confidence: 0.9 }), // Quick win
      ];

      const quickWins = prioritizer.identifyQuickWins(insights);

      expect(quickWins.length).toBe(2);
      expect(quickWins.every((qw) => qw.impact >= 0.6 && qw.effort <= 0.4)).toBe(true);
    });
  });

  describe('identifyMajorProjects', () => {
    it('should identify major projects', () => {
      const prioritizer = new InsightPrioritizer(DEFAULT_ANALYSIS_CONFIG);

      const insights = [
        createInsight({ impact: 0.8, effort: 0.7, confidence: 0.8 }), // Major project
        createInsight({ impact: 0.5, effort: 0.3, confidence: 0.9 }), // Not major
        createInsight({ impact: 0.9, effort: 0.8, confidence: 0.9 }), // Major project
      ];

      const majorProjects = prioritizer.identifyMajorProjects(insights);

      expect(majorProjects.length).toBe(2);
      expect(majorProjects.every((mp) => mp.impact >= 0.7 && mp.effort >= 0.6)).toBe(true);
    });
  });
});
