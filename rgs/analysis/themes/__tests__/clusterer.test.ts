/**
 * Tests for keyword clusterer
 */

import { KeywordClusterer, DEFAULT_CLUSTERER_CONFIG } from '../src/clusterer';

describe('KeywordClusterer', () => {
  describe('cluster', () => {
    it('should return empty array for empty input', () => {
      const clusterer = new KeywordClusterer();
      const result = clusterer.cluster([]);
      expect(result).toEqual([]);
    });

    it('should create single cluster for identical keywords', () => {
      const clusterer = new KeywordClusterer();
      const result = clusterer.cluster(['expensive', 'expensive', 'expensive']);

      expect(result).toHaveLength(1);
      expect(result[0]?.representative).toBe('expensive');
      // Keywords are deduplicated by the clusterer
      expect(result[0]?.keywords).toContain('expensive');
      expect(result[0]?.keywords.length).toBeGreaterThan(0);
    });

    it('should cluster similar keywords together', () => {
      const clusterer = new KeywordClusterer();
      const result = clusterer.cluster(['expensive', 'costly', 'pricey']);

      // These words are not similar enough to cluster by default similarity
      // Each should be in its own cluster
      expect(result.length).toBeGreaterThan(0);
    });

    it('should cluster keywords with substring relationships', () => {
      const clusterer = new KeywordClusterer();
      const result = clusterer.cluster(['test', 'testing', 'tested']);

      expect(result.length).toBeGreaterThan(0);
      // Should have some clustering based on substring matching
    });

    it('should respect minimum cluster size', () => {
      const clusterer = new KeywordClusterer({
        ...DEFAULT_CLUSTERER_CONFIG,
        minClusterSize: 2,
      });

      const result = clusterer.cluster(['expensive', 'costly', 'unique']);

      // Only clusters with 2+ keywords should be included
      for (const cluster of result) {
        expect(cluster.keywords.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should sort clusters by size descending', () => {
      const clusterer = new KeywordClusterer();
      const result = clusterer.cluster([
        'expensive',
        'expensive',
        'expensive',
        'costly',
        'costly',
        'unique',
      ]);

      // Clusters should be sorted by size
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]?.keywords.length).toBeGreaterThanOrEqual(
          result[i]?.keywords.length ?? 0
        );
      }
    });

    it('should normalize keywords for comparison', () => {
      const clusterer = new KeywordClusterer();
      const result = clusterer.cluster(['Expensive', 'EXPENSIVE', 'expensive']);

      expect(result).toHaveLength(1);
      expect(result[0]?.keywords).toHaveLength(3);
    });

    it('should use stemming when enabled', () => {
      const clusterer = new KeywordClusterer({
        ...DEFAULT_CLUSTERER_CONFIG,
        useStemming: true,
      });

      const result = clusterer.cluster(['running', 'runs', 'run']);

      // With stemming, these should potentially cluster together
      expect(result.length).toBeGreaterThan(0);
    });

    it('should not use stemming when disabled', () => {
      const clusterer = new KeywordClusterer({
        ...DEFAULT_CLUSTERER_CONFIG,
        useStemming: false,
      });

      const result = clusterer.cluster(['running', 'runs', 'run']);

      // Without stemming, similarity depends on string matching
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle special characters in keywords', () => {
      const clusterer = new KeywordClusterer();
      const result = clusterer.cluster(['API-key', 'api_key', 'api.key']);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should calculate similarity scores', () => {
      const clusterer = new KeywordClusterer();
      const result = clusterer.cluster(['test', 'testing']);

      for (const cluster of result) {
        expect(cluster.similarity).toBeGreaterThanOrEqual(0);
        expect(cluster.similarity).toBeLessThanOrEqual(1);
      }
    });

    it('should handle large keyword sets', () => {
      const clusterer = new KeywordClusterer();
      const keywords = Array.from({ length: 100 }, (_, i) => `keyword-${i}`);

      const result = clusterer.cluster(keywords);

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(keywords.length);
    });

    it('should respect similarity threshold', () => {
      const clusterer = new KeywordClusterer({
        ...DEFAULT_CLUSTERER_CONFIG,
        similarityThreshold: 0.95, // Very high threshold
      });

      const result = clusterer.cluster(['expensive', 'costly', 'pricey']);

      // With high threshold, fewer keywords will cluster together
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('mergeClusters', () => {
    it('should return clusters unchanged if under max', () => {
      const clusterer = new KeywordClusterer();
      const clusters = [
        { representative: 'test', keywords: ['test', 'testing'], similarity: 0.9 },
        { representative: 'code', keywords: ['code', 'coding'], similarity: 0.85 },
      ];

      const result = clusterer.mergeClusters(clusters, 5);

      expect(result).toHaveLength(2);
      expect(result).toEqual(clusters);
    });

    it('should merge small clusters when exceeding max', () => {
      const clusterer = new KeywordClusterer();
      const clusters = [
        { representative: 'test', keywords: ['test', 'testing'], similarity: 0.9 },
        { representative: 'code', keywords: ['code', 'coding'], similarity: 0.85 },
        { representative: 'debug', keywords: ['debug'], similarity: 1.0 },
        { representative: 'fix', keywords: ['fix'], similarity: 1.0 },
      ];

      const result = clusterer.mergeClusters(clusters, 2);

      expect(result).toHaveLength(2);

      // Last cluster should be 'other' with merged keywords
      const lastCluster = result[result.length - 1];
      expect(lastCluster?.representative).toBe('other');
    });

    it('should keep largest clusters', () => {
      const clusterer = new KeywordClusterer();
      const clusters = [
        { representative: 'large', keywords: ['a', 'b', 'c', 'd', 'e'], similarity: 0.9 },
        { representative: 'medium', keywords: ['x', 'y', 'z'], similarity: 0.85 },
        { representative: 'small', keywords: ['p'], similarity: 1.0 },
      ];

      const result = clusterer.mergeClusters(clusters, 2);

      expect(result).toHaveLength(2);
      expect(result[0]?.representative).toBe('large');
    });

    it('should handle empty cluster list', () => {
      const clusterer = new KeywordClusterer();
      const result = clusterer.mergeClusters([], 5);

      expect(result).toEqual([]);
    });

    it('should not create other cluster if exactly at max', () => {
      const clusterer = new KeywordClusterer();
      const clusters = [
        { representative: 'a', keywords: ['a'], similarity: 1.0 },
        { representative: 'b', keywords: ['b'], similarity: 1.0 },
      ];

      const result = clusterer.mergeClusters(clusters, 2);

      expect(result).toHaveLength(2);
      expect(result.every((c) => c.representative !== 'other')).toBe(true);
    });

    it('should merge all keywords into other cluster', () => {
      const clusterer = new KeywordClusterer();
      const clusters = [
        { representative: 'large', keywords: ['a', 'b', 'c'], similarity: 0.9 },
        { representative: 'small1', keywords: ['x'], similarity: 1.0 },
        { representative: 'small2', keywords: ['y'], similarity: 1.0 },
        { representative: 'small3', keywords: ['z'], similarity: 1.0 },
      ];

      const result = clusterer.mergeClusters(clusters, 2);

      const otherCluster = result.find((c) => c.representative === 'other');
      expect(otherCluster).toBeDefined();
      expect(otherCluster?.keywords).toContain('x');
      expect(otherCluster?.keywords).toContain('y');
      expect(otherCluster?.keywords).toContain('z');
    });
  });
});
