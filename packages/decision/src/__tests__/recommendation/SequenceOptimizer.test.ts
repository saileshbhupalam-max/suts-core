/**
 * Tests for SequenceOptimizer
 */

import { SequenceOptimizer } from '../../recommendation/SequenceOptimizer';
import { PrioritizedInsight } from '../../models';

describe('SequenceOptimizer', () => {
  let optimizer: SequenceOptimizer;

  beforeEach(() => {
    optimizer = new SequenceOptimizer();
  });

  const createPrioritized = (
    overrides?: Partial<PrioritizedInsight>
  ): PrioritizedInsight => ({
    insight: {
      id: 'test-1',
      type: 'retention',
      severity: 'high',
      title: 'Test',
      description: 'Test',
      affectedUsers: 1000,
      potentialImpact: 0.8,
      confidence: 0.9,
      metadata: {},
    },
    priorityScore: 0.8,
    impactScore: 0.7,
    effortScore: 5,
    iceScore: 1.12,
    riceScore: 140,
    reach: 1000,
    ranking: 1,
    reasoning: 'Test',
    ...overrides,
  });

  describe('optimize', () => {
    it('should return sequenced changes', () => {
      const insights = [
        createPrioritized({ insight: { ...createPrioritized().insight, id: '1' } }),
        createPrioritized({ insight: { ...createPrioritized().insight, id: '2' } }),
      ];

      const sequenced = optimizer.optimize(insights);

      expect(Array.isArray(sequenced)).toBe(true);
      expect(sequenced.length).toBe(2);
    });

    it('should assign sequence numbers', () => {
      const insights = [
        createPrioritized({ insight: { ...createPrioritized().insight, id: '1' } }),
        createPrioritized({ insight: { ...createPrioritized().insight, id: '2' } }),
      ];

      const sequenced = optimizer.optimize(insights);

      sequenced.forEach((item, index) => {
        expect(item.sequenceNumber).toBe(index + 1);
      });
    });

    it('should include dependencies and blockers', () => {
      const insights = [
        createPrioritized({ insight: { ...createPrioritized().insight, id: '1' } }),
      ];

      const sequenced = optimizer.optimize(insights);

      sequenced.forEach((item) => {
        expect(item).toHaveProperty('dependencies');
        expect(item).toHaveProperty('blockers');
        expect(item).toHaveProperty('reasoning');
        expect(Array.isArray(item.dependencies)).toBe(true);
        expect(Array.isArray(item.blockers)).toBe(true);
      });
    });

    it('should prioritize by priority score', () => {
      const insights = [
        createPrioritized({
          insight: { ...createPrioritized().insight, id: 'low' },
          priorityScore: 0.3,
        }),
        createPrioritized({
          insight: { ...createPrioritized().insight, id: 'high' },
          priorityScore: 0.9,
        }),
      ];

      const sequenced = optimizer.optimize(insights);

      expect(sequenced[0].insight.insight.id).toBe('high');
    });

    it('should handle empty array', () => {
      const sequenced = optimizer.optimize([]);
      expect(sequenced).toEqual([]);
    });
  });
});
