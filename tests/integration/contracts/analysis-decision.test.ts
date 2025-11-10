/**
 * Contract Test: Analysis -> Decision System
 * Validates that analysis results can be used by decision system
 */

import { describe, it, expect } from '@jest/globals';
import { AnalysisEngine } from '../../../packages/analysis/src/index';
import { DecisionSystem } from '../../../packages/decision/src/index';
import { SimulationEngine } from '../../../packages/simulation/src/index';
import { EventCollector } from '../../../packages/telemetry/src/index';
import { VibeAtlasAdapter } from '../../../plugins/vibeatlas/src/index';
import { generateMockPersonas } from '../helpers/test-utils';

describe('Contract: Analysis -> Decision System', () => {
  it('should prioritize friction and value results without errors', async () => {
    const personas = generateMockPersonas(5);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent({
      ...e,
      timestamp: new Date(e.timestamp),
      action: e.action ?? '',
      emotionalState: e.emotionalState ?? { frustration: 0, confidence: 0, delight: 0, confusion: 0 },
    }));
    // Flush events from batch queue to storage
    collector.flush();
    const events = collector.query({});

    const analyzer = new AnalysisEngine();
    const friction = analyzer.analyzeFriction(events);
    const value = analyzer.analyzeValue(events);

    // Convert FrictionPoint and ValueMoment to AnalysisResult format
    const analysisResults = [
      ...friction.map(f => ({
        id: `friction-${f.location.action}`,
        type: 'ux' as const,
        severity: f.severity > 0.7 ? 'critical' as const : f.severity > 0.5 ? 'high' as const : 'medium' as const,
        title: `Friction at ${f.location.action}`,
        description: f.description,
        affectedUsers: f.affectedUsers,
        potentialImpact: f.severity,
        confidence: f.confidence,
        metadata: {},
      })),
      ...value.map(v => ({
        id: `value-${v.action}`,
        type: 'ux' as const,
        severity: 'low' as const,
        title: `Value moment at ${v.action}`,
        description: v.description,
        affectedUsers: v.affectedUsers,
        potentialImpact: v.delightScore,
        confidence: v.confidence,
        metadata: {},
      })),
    ];

    // Should not throw
    const decisionSystem = new DecisionSystem();
    expect(() => decisionSystem.prioritize(analysisResults)).not.toThrow();
  });

  it('should produce prioritized insights with valid structure', async () => {
    const personas = generateMockPersonas(5);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent({
      ...e,
      timestamp: new Date(e.timestamp),
      action: e.action ?? '',
      emotionalState: e.emotionalState ?? { frustration: 0, confidence: 0, delight: 0, confusion: 0 },
    }));
    // Flush events from batch queue to storage
    collector.flush();
    const events = collector.query({});

    const analyzer = new AnalysisEngine();
    const friction = analyzer.analyzeFriction(events);
    const value = analyzer.analyzeValue(events);

    // Convert to AnalysisResult format
    const analysisResults = [
      ...friction.map(f => ({
        id: `friction-${f.location.action}`,
        type: 'ux' as const,
        severity: f.severity > 0.7 ? 'critical' as const : f.severity > 0.5 ? 'high' as const : 'medium' as const,
        title: `Friction at ${f.location.action}`,
        description: f.description,
        affectedUsers: f.affectedUsers,
        potentialImpact: f.severity,
        confidence: f.confidence,
        metadata: {},
      })),
      ...value.map(v => ({
        id: `value-${v.action}`,
        type: 'ux' as const,
        severity: 'low' as const,
        title: `Value moment at ${v.action}`,
        description: v.description,
        affectedUsers: v.affectedUsers,
        potentialImpact: v.delightScore,
        confidence: v.confidence,
        metadata: {},
      })),
    ];

    const decisionSystem = new DecisionSystem();
    const insights = decisionSystem.prioritize(analysisResults);

    // Insights should be an array
    expect(Array.isArray(insights)).toBe(true);

    // Each insight should have priorityScore
    insights.forEach((insight) => {
      expect(insight.priorityScore).toBeDefined();
      expect(typeof insight.priorityScore).toBe('number');
      expect(insight.priorityScore).toBeGreaterThanOrEqual(0);
    });

    // Should be sorted by priorityScore (descending)
    for (let i = 1; i < insights.length; i++) {
      expect(insights[i]!.priorityScore).toBeLessThanOrEqual(insights[i - 1]!.priorityScore);
    }
  });

  it('should make go/no-go decisions from metrics', async () => {
    const personas = generateMockPersonas(5);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent({
      ...e,
      timestamp: new Date(e.timestamp),
      action: e.action ?? '',
      emotionalState: e.emotionalState ?? { frustration: 0, confidence: 0, delight: 0, confusion: 0 },
    }));
    // Flush events from batch queue to storage
    collector.flush();
    collector.query({});

    // Create SimulationMetrics in the format expected by goNoGoDecision
    const metrics = {
      retentionRate: 0.75,
      churnRate: 0.25,
      growthRate: 0.05,
      avgSessionDuration: 3600,
      userSatisfaction: 0.8,
      conversionRate: 0.6,
      revenuePerUser: 50,
      npsScore: 42,
      confidenceLevel: 0.85,
      sampleSize: personas.length,
    };

    const decisionSystem = new DecisionSystem();

    // Should not throw
    expect(() => decisionSystem.goNoGoDecision(metrics)).not.toThrow();
  });

  it('should produce valid go/no-go decision structure', async () => {
    const personas = generateMockPersonas(5);
    const adapter = new VibeAtlasAdapter();
    const productState = adapter.getInitialState();

    const engine = new SimulationEngine({
      seed: 12345,
      batchSize: 10,
      maxActionsPerDay: 10,
    });

    const state = await engine.run(personas, productState, 3);

    const collector = new EventCollector();
    state.events.forEach((e) => collector.trackEvent({
      ...e,
      timestamp: new Date(e.timestamp),
      action: e.action ?? '',
      emotionalState: e.emotionalState ?? { frustration: 0, confidence: 0, delight: 0, confusion: 0 },
    }));
    // Flush events from batch queue to storage
    collector.flush();
    collector.query({});

    // Create SimulationMetrics
    const metrics = {
      retentionRate: 0.75,
      churnRate: 0.25,
      growthRate: 0.05,
      avgSessionDuration: 3600,
      userSatisfaction: 0.8,
      conversionRate: 0.6,
      revenuePerUser: 50,
      npsScore: 42,
      confidenceLevel: 0.85,
      sampleSize: personas.length,
    };

    const decisionSystem = new DecisionSystem();
    const decision = decisionSystem.goNoGoDecision(metrics);

    // Decision should have required fields
    expect(decision.decision).toBeDefined();
    expect(['GO', 'NO_GO', 'CONDITIONAL']).toContain(decision.decision);

    expect(decision.confidence).toBeDefined();
    expect(typeof decision.confidence).toBe('number');
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);

    expect(decision.reasoning).toBeDefined();
    expect(typeof decision.reasoning).toBe('string');
  });

  it('should handle empty inputs gracefully', () => {
    const decisionSystem = new DecisionSystem();

    // Should not throw with empty arrays
    expect(() => decisionSystem.prioritize([])).not.toThrow();

    const insights = decisionSystem.prioritize([]);
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBe(0);
  });
});
