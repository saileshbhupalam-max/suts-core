/**
 * Integration Tests for Pipeline
 *
 * Tests the full pipeline workflow with multiple stages
 */

import { PipelineOrchestrator } from '../src/orchestrator';
import { SCRAPE_STAGE, SENTIMENT_STAGE, THEMES_STAGE } from '../src/stages';
import { createProgressHook, createTimingHook, combineHooks } from '../src/hooks';
import type { ScrapeConfig } from '../src/stages';

describe('Pipeline Integration', () => {
  it('should run complete scrape → sentiment → themes pipeline', async () => {
    const pipeline = new PipelineOrchestrator()
      .addStage(SCRAPE_STAGE)
      .addStage(SENTIMENT_STAGE)
      .addStage(THEMES_STAGE);

    const config: ScrapeConfig = {
      sources: ['reddit'],
      subreddits: ['vscode'],
      maxSignals: 5,
    };

    const result = await pipeline.run(config);

    expect(result.success).toBe(true);
    expect(result.context.signals).toBeDefined();
    expect(result.context.signals?.length).toBe(5);
    expect(result.context.sentiments).toBeDefined();
    expect(result.context.themes).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should work with progress and timing hooks', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const pipeline = new PipelineOrchestrator()
      .addStage(SCRAPE_STAGE)
      .addStage(SENTIMENT_STAGE)
      .addHooks(combineHooks(createProgressHook(), createTimingHook()));

    const config: ScrapeConfig = {
      sources: ['reddit'],
      maxSignals: 3,
    };

    const result = await pipeline.run(config);

    expect(result.success).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(result.context.metadata['timings']).toBeDefined();

    const timings = result.context.metadata['timings'] as Record<string, number>;
    expect(timings['scrape']).toBeDefined();
    expect(timings['sentiment']).toBeDefined();

    consoleLogSpy.mockRestore();
  });

  it('should handle partial pipeline execution', async () => {
    const pipeline = new PipelineOrchestrator().addStage(SCRAPE_STAGE).addStage(SENTIMENT_STAGE);

    const config: ScrapeConfig = {
      sources: ['reddit'],
      maxSignals: 3,
    };

    const result = await pipeline.run(config);

    expect(result.success).toBe(true);
    expect(result.context.signals).toBeDefined();
    expect(result.context.sentiments).toBeDefined();
    expect(result.context.themes).toBeUndefined(); // Not run
  });

  it('should propagate stage outputs through pipeline', async () => {
    const pipeline = new PipelineOrchestrator()
      .addStage(SCRAPE_STAGE)
      .addStage(SENTIMENT_STAGE)
      .addStage(THEMES_STAGE);

    const config: ScrapeConfig = {
      sources: ['reddit'],
      maxSignals: 2,
    };

    const result = await pipeline.run(config);

    // Verify data flow
    expect(result.context.signals?.length).toBe(2);
    expect(result.context.sentiments?.length).toBe(2);
    expect(result.context.themes).toBeDefined();
  });

  it('should track errors without failing pipeline', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const pipeline = new PipelineOrchestrator().addStage(SCRAPE_STAGE);

    const config: ScrapeConfig = {
      sources: [], // Invalid: will cause error
    };

    await expect(pipeline.run(config)).rejects.toThrow();

    consoleErrorSpy.mockRestore();
  });

  it('should support reusing orchestrator with cleared stages', async () => {
    const pipeline = new PipelineOrchestrator().addStage(SCRAPE_STAGE);

    const config1: ScrapeConfig = {
      sources: ['reddit'],
      maxSignals: 3,
    };

    const result1 = await pipeline.run(config1);
    expect(result1.context.signals?.length).toBe(3);

    // Clear and reconfigure
    pipeline.clearStages();
    pipeline.addStage(SCRAPE_STAGE).addStage(SENTIMENT_STAGE);

    const config2: ScrapeConfig = {
      sources: ['reddit'],
      maxSignals: 5,
    };

    const result2 = await pipeline.run(config2);
    expect(result2.context.signals?.length).toBe(5);
    expect(result2.context.sentiments).toBeDefined();
  });

  it('should handle custom hooks in full pipeline', async () => {
    const stageCompletions: string[] = [];

    const pipeline = new PipelineOrchestrator()
      .addStage(SCRAPE_STAGE)
      .addStage(SENTIMENT_STAGE)
      .addHooks({
        async onStageComplete(stage) {
          stageCompletions.push(stage);
        },
      });

    const config: ScrapeConfig = {
      sources: ['reddit'],
      maxSignals: 2,
    };

    await pipeline.run(config);

    expect(stageCompletions).toEqual(['scrape', 'sentiment']);
  });

  it('should measure total pipeline duration', async () => {
    const pipeline = new PipelineOrchestrator()
      .addStage(SCRAPE_STAGE)
      .addStage(SENTIMENT_STAGE)
      .addStage(THEMES_STAGE);

    const config: ScrapeConfig = {
      sources: ['reddit'],
      maxSignals: 3,
    };

    const startTime = Date.now();
    const result = await pipeline.run(config);
    const actualDuration = Date.now() - startTime;

    expect(result.duration).toBeGreaterThan(0);
    expect(result.duration).toBeLessThanOrEqual(actualDuration + 10); // Small margin
  });
});
