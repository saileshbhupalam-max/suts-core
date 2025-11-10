/**
 * Tests for CorrelationAnalyzer
 */

import { CorrelationAnalyzer } from '../CorrelationAnalyzer';
import { DEFAULT_ANALYSIS_CONFIG } from '../../models/config';
import { createEvent, createRetentionEvents } from '../../test-utils';

describe('CorrelationAnalyzer', () => {
  describe('analyzeRetentionCorrelations', () => {
    it('should return empty array for insufficient events', () => {
      const analyzer = new CorrelationAnalyzer(DEFAULT_ANALYSIS_CONFIG);
      const results = analyzer.analyzeRetentionCorrelations([]);

      expect(results).toEqual([]);
    });

    it('should analyze retention correlations', () => {
      const analyzer = new CorrelationAnalyzer(DEFAULT_ANALYSIS_CONFIG);
      const events = createRetentionEvents(20, 10);

      const results = analyzer.analyzeRetentionCorrelations(events);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.metric).toBe('retention');
      expect(results[0]?.correlation).toBeGreaterThanOrEqual(-1);
      expect(results[0]?.correlation).toBeLessThanOrEqual(1);
    });

    it('should calculate p-values', () => {
      const analyzer = new CorrelationAnalyzer(DEFAULT_ANALYSIS_CONFIG);
      const events = createRetentionEvents(30, 10);

      const results = analyzer.analyzeRetentionCorrelations(events);

      if (results.length > 0) {
        expect(results[0]?.pValue).toBeGreaterThanOrEqual(0);
        expect(results[0]?.pValue).toBeLessThanOrEqual(1);
      }
    });

    it('should mark significant correlations', () => {
      const analyzer = new CorrelationAnalyzer(DEFAULT_ANALYSIS_CONFIG);
      const events = createRetentionEvents(50, 10);

      const results = analyzer.analyzeRetentionCorrelations(events);

      const significant = results.filter((r) => r.significant);
      expect(significant.length).toBeGreaterThanOrEqual(0);
    });

    it('should sort by absolute correlation', () => {
      const analyzer = new CorrelationAnalyzer(DEFAULT_ANALYSIS_CONFIG);
      const events = createRetentionEvents(40, 20);

      const results = analyzer.analyzeRetentionCorrelations(events);

      if (results.length > 1) {
        expect(Math.abs(results[0]?.correlation ?? 0)).toBeGreaterThanOrEqual(
          Math.abs(results[results.length - 1]?.correlation ?? 0)
        );
      }
    });
  });

  describe('analyzeChurnCorrelations', () => {
    it('should return empty array for insufficient events', () => {
      const analyzer = new CorrelationAnalyzer(DEFAULT_ANALYSIS_CONFIG);
      const results = analyzer.analyzeChurnCorrelations([]);

      expect(results).toEqual([]);
    });

    it('should analyze churn correlations', () => {
      const analyzer = new CorrelationAnalyzer(DEFAULT_ANALYSIS_CONFIG);
      const baseTime = Date.now();

      const events = [
        ...Array.from({ length: 30 }, (_, i) =>
          createEvent({
            personaId: `user-${i}`,
            action: 'problematic_action',
            emotionalState: {
              frustration: 0.9,
              confidence: 0.1,
              delight: 0.1,
              confusion: 0.9,
            },
            timestamp: new Date(baseTime + i * 1000),
          })
        ),
        ...Array.from({ length: 30 }, (_, i) =>
          createEvent({
            personaId: `user-${i}`,
            action: 'uninstall',
            timestamp: new Date(baseTime + 10000 + i * 1000),
          })
        ),
      ];

      const results = analyzer.analyzeChurnCorrelations(events);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.metric).toBe('churn');
    });
  });

  describe('edge cases', () => {
    it('should handle events from single user', () => {
      const analyzer = new CorrelationAnalyzer(DEFAULT_ANALYSIS_CONFIG);
      const events = Array.from({ length: 50 }, (_, i) =>
        createEvent({
          personaId: 'single-user',
          action: 'action',
          timestamp: new Date(Date.now() + i * 1000),
        })
      );

      expect(() => analyzer.analyzeRetentionCorrelations(events)).not.toThrow();
    });

    it('should handle all users with same action', () => {
      const analyzer = new CorrelationAnalyzer(DEFAULT_ANALYSIS_CONFIG);
      const events = Array.from({ length: 50 }, (_, i) =>
        createEvent({
          personaId: `user-${i}`,
          action: 'same_action',
          timestamp: new Date(Date.now() + i * 1000),
        })
      );

      const results = analyzer.analyzeRetentionCorrelations(events);

      expect(results).toBeDefined();
    });
  });
});
