/**
 * Tests for SummaryGenerator
 */

import { SummaryGenerator } from '../../src/output/SummaryGenerator';
import { SimulationResults } from '../../src/output/ResultsWriter';

describe('SummaryGenerator', () => {
  describe('generateTextSummary', () => {
    it('should generate text summary', () => {
      const results: SimulationResults = {
        summary: {
          totalPersonas: 100,
          totalEvents: 5000,
          simulationDays: 7,
          productPlugin: 'vibeatlas',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 10000,
        },
        personas: [],
        events: [],
        frictionPoints: [
          {
            id: 'f1',
            description: 'Test',
            severity: 0.5,
            frequency: 0.3,
            affectedPersonas: [],
          },
        ],
        valueMoments: [
          {
            id: 'v1',
            description: 'Test',
            impact: 0.8,
            frequency: 0.6,
            affectedPersonas: [],
          },
        ],
        goNoGo: {
          decision: 'go',
          confidence: 0.85,
          reasoning: 'All metrics meet thresholds',
          metrics: {
            positioning: 0.7,
            retention: 0.85,
            viral: 0.3,
          },
        },
      };

      const summary = SummaryGenerator.generateTextSummary(results);

      expect(summary).toContain('SUTS Simulation Summary');
      expect(summary).toContain('vibeatlas');
      expect(summary).toContain('100');
      expect(summary).toContain('5,000'); // Number is formatted with comma
      expect(summary).toContain('GO');
    });

    it('should show no-go decision', () => {
      const results: SimulationResults = {
        summary: {
          totalPersonas: 50,
          totalEvents: 1000,
          simulationDays: 3,
          productPlugin: 'test',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 5000,
        },
        personas: [],
        events: [],
        frictionPoints: [],
        valueMoments: [],
        goNoGo: {
          decision: 'no-go',
          confidence: 0.5,
          reasoning: 'Metrics below threshold',
          metrics: {
            positioning: 0.4,
            retention: 0.6,
            viral: 0.1,
          },
        },
      };

      const summary = SummaryGenerator.generateTextSummary(results);

      expect(summary).toContain('NO-GO');
    });
  });

  describe('generateSummaryData', () => {
    it('should generate summary data', () => {
      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T01:00:00Z');

      const summary = SummaryGenerator.generateSummaryData(
        startTime,
        endTime,
        100,
        5000,
        7,
        'vibeatlas'
      );

      expect(summary.totalPersonas).toBe(100);
      expect(summary.totalEvents).toBe(5000);
      expect(summary.simulationDays).toBe(7);
      expect(summary.productPlugin).toBe('vibeatlas');
      expect(summary.startTime).toBe(startTime.toISOString());
      expect(summary.endTime).toBe(endTime.toISOString());
      expect(summary.duration).toBe(3600000); // 1 hour in ms
    });

    it('should calculate duration correctly', () => {
      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T00:00:10Z');

      const summary = SummaryGenerator.generateSummaryData(
        startTime,
        endTime,
        10,
        100,
        1,
        'test'
      );

      expect(summary.duration).toBe(10000); // 10 seconds in ms
    });
  });

  describe('generateGoNoGoDecision', () => {
    it('should generate go decision when all metrics meet thresholds', () => {
      const decision = SummaryGenerator.generateGoNoGoDecision(0.7, 0.85, 0.3);

      expect(decision.decision).toBe('go');
      expect(decision.metrics.positioning).toBe(0.7);
      expect(decision.metrics.retention).toBe(0.85);
      expect(decision.metrics.viral).toBe(0.3);
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
    });

    it('should generate no-go decision when positioning is below threshold', () => {
      const decision = SummaryGenerator.generateGoNoGoDecision(0.5, 0.85, 0.3);

      expect(decision.decision).toBe('no-go');
    });

    it('should generate no-go decision when retention is below threshold', () => {
      const decision = SummaryGenerator.generateGoNoGoDecision(0.7, 0.7, 0.3);

      expect(decision.decision).toBe('no-go');
    });

    it('should generate no-go decision when viral is below threshold', () => {
      const decision = SummaryGenerator.generateGoNoGoDecision(0.7, 0.85, 0.2);

      expect(decision.decision).toBe('no-go');
    });

    it('should calculate confidence correctly', () => {
      const decision = SummaryGenerator.generateGoNoGoDecision(0.6, 0.9, 0.3);

      expect(decision.confidence).toBeCloseTo((0.6 + 0.9 + 0.3) / 3, 2);
    });

    it('should have appropriate reasoning for go decision', () => {
      const decision = SummaryGenerator.generateGoNoGoDecision(0.7, 0.85, 0.3);

      expect(decision.reasoning).toContain('meet');
    });

    it('should have appropriate reasoning for no-go decision', () => {
      const decision = SummaryGenerator.generateGoNoGoDecision(0.5, 0.7, 0.2);

      expect(decision.reasoning).toContain('below');
    });
  });
});
