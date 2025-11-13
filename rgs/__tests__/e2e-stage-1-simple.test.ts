/**
 * RGS Stage 1 E2E Integration Test (Simplified)
 *
 * Smoke test verifying packages can be imported and instantiated together
 */

import { WebSignal } from '../core/src';
import { KeywordClusterer } from '../analysis/themes/src/clusterer';
import { PatternDetector } from '../analysis/themes/src/patterns';

describe('RGS Stage 1 Integration - Smoke Test', () => {
  it('should import and instantiate all Stage 1 packages without errors', () => {
    // Verify core types work
    const signal: WebSignal = {
      id: 'test',
      source: 'reddit',
      content: 'Test content',
      timestamp: new Date(),
      url: 'https://example.com',
      metadata: {},
    };

    expect(signal.id).toBe('test');
    expect(signal.source).toBe('reddit');

    // Verify theme analysis components instantiate
    const clusterer = new KeywordClusterer();
    expect(clusterer).toBeDefined();

    const detector = new PatternDetector();
    expect(detector).toBeDefined();
  });

  it('should process keywords through clusterer', () => {
    const clusterer = new KeywordClusterer();
    const keywords = ['expensive', 'costly', 'price', 'pricing', 'cost'];

    const clusters = clusterer.cluster(keywords);

    expect(Array.isArray(clusters)).toBe(true);
    expect(clusters.length).toBeGreaterThan(0);

    // Verify cluster structure
    if (clusters[0] !== undefined) {
      expect(clusters[0]).toHaveProperty('representative');
      expect(clusters[0]).toHaveProperty('keywords');
      expect(clusters[0]).toHaveProperty('similarity');
    }
  });

  it('should detect patterns in signals', () => {
    const detector = new PatternDetector({
      minFrequency: 1,
      maxExamples: 5,
      maxExampleLength: 200,
    });

    const signals: WebSignal[] = [
      {
        id: '1',
        source: 'reddit',
        content: 'I use VSCode for development',
        timestamp: new Date(),
        url: 'https://example.com/1',
        metadata: {},
      },
      {
        id: '2',
        source: 'reddit',
        content: 'This is better than the old system',
        timestamp: new Date(),
        url: 'https://example.com/2',
        metadata: {},
      },
    ];

    const patterns = detector.detect(signals);

    expect(Array.isArray(patterns)).toBe(true);
    // Patterns found depends on content, so we just verify it returns an array
  });

  it('should verify all packages can co-exist without conflicts', () => {
    // Import all main exports from each Stage 1 package
    const { createWebSignal } = require('../core/src');

    const { Logger, LogLevel } = require('../utils/src');

    const { KeywordClusterer } = require('../analysis/themes/src/clusterer');
    const { PatternDetector } = require('../analysis/themes/src/patterns');

    // Verify all exports are defined
    expect(createWebSignal).toBeDefined();
    expect(Logger).toBeDefined();
    expect(LogLevel).toBeDefined();
    expect(KeywordClusterer).toBeDefined();
    expect(PatternDetector).toBeDefined();

    // Create instances to verify no runtime conflicts
    const logger = new Logger({ minLevel: LogLevel.ERROR });
    expect(logger).toBeDefined();

    const signal = createWebSignal({
      id: 'test',
      source: 'test',
      content: 'test',
      timestamp: new Date(),
      url: 'https://test.com',
      metadata: {},
    });
    expect(signal).toBeDefined();
  });
});
