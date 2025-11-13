/**
 * Pipeline Lifecycle Hooks
 *
 * Hooks allow external code to observe and react to pipeline events
 * without modifying the core orchestrator logic.
 */

import type { PipelineContext } from './context';

/**
 * Lifecycle hooks interface
 *
 * All hooks are optional. Hooks are called at specific points during
 * pipeline execution and receive the current context.
 */
export interface PipelineHooks {
  /**
   * Called when pipeline execution starts
   *
   * @param context - Pipeline context
   */
  onStart?(context: PipelineContext): Promise<void>;

  /**
   * Called when a stage is about to execute
   *
   * @param stage - Name of the stage
   * @param context - Pipeline context
   */
  onStageStart?(stage: string, context: PipelineContext): Promise<void>;

  /**
   * Called when a stage completes successfully
   *
   * @param stage - Name of the stage
   * @param output - Stage output
   * @param context - Pipeline context
   */
  onStageComplete?(stage: string, output: unknown, context: PipelineContext): Promise<void>;

  /**
   * Called when a stage encounters an error
   *
   * @param stage - Name of the stage
   * @param error - Error that occurred
   * @param context - Pipeline context
   */
  onStageError?(stage: string, error: Error, context: PipelineContext): Promise<void>;

  /**
   * Called when pipeline execution completes (success or failure)
   *
   * @param context - Pipeline context
   */
  onComplete?(context: PipelineContext): Promise<void>;

  /**
   * Called when pipeline execution fails with a fatal error
   *
   * @param error - Fatal error that stopped the pipeline
   * @param context - Pipeline context
   */
  onError?(error: Error, context: PipelineContext): Promise<void>;
}

/**
 * Combines multiple hooks into a single hooks object
 *
 * When multiple hooks define the same method, they are called in order.
 * If any hook throws an error, subsequent hooks are still called.
 *
 * @param hooks - Array of hooks to combine
 * @returns Combined hooks object
 */
export function combineHooks(...hooks: PipelineHooks[]): PipelineHooks {
  const combined: PipelineHooks = {};

  // Helper to combine hook methods
  const combineMethod = <K extends keyof PipelineHooks>(key: K): PipelineHooks[K] => {
    const methods = hooks
      .map((h) => h[key])
      .filter((m): m is NonNullable<PipelineHooks[K]> => m !== undefined);

    if (methods.length === 0) {
      return undefined;
    }

    return (async (...args: unknown[]) => {
      for (const method of methods) {
        try {
          await (method as (...args: unknown[]) => Promise<void>)(...args);
        } catch (error) {
          // Log but don't throw - allow other hooks to execute
          console.error(`Hook ${key} failed:`, error);
        }
      }
    }) as PipelineHooks[K];
  };

  const onStart = combineMethod('onStart');
  const onStageStart = combineMethod('onStageStart');
  const onStageComplete = combineMethod('onStageComplete');
  const onStageError = combineMethod('onStageError');
  const onComplete = combineMethod('onComplete');
  const onError = combineMethod('onError');

  if (onStart !== undefined) {
    combined.onStart = onStart;
  }
  if (onStageStart !== undefined) {
    combined.onStageStart = onStageStart;
  }
  if (onStageComplete !== undefined) {
    combined.onStageComplete = onStageComplete;
  }
  if (onStageError !== undefined) {
    combined.onStageError = onStageError;
  }
  if (onComplete !== undefined) {
    combined.onComplete = onComplete;
  }
  if (onError !== undefined) {
    combined.onError = onError;
  }

  return combined;
}

/**
 * Creates a progress logging hook
 *
 * Logs pipeline progress to console with emoji indicators
 *
 * @returns Hooks object that logs progress
 */
export function createProgressHook(): PipelineHooks {
  /* eslint-disable no-console */
  /* eslint-disable @typescript-eslint/require-await */
  return {
    async onStart(context: PipelineContext): Promise<void> {
      console.log(`🚀 Pipeline started at ${context.startTime.toISOString()}`);
    },

    async onStageStart(stage: string): Promise<void> {
      console.log(`→ Starting stage: ${stage}`);
    },

    async onStageComplete(stage: string): Promise<void> {
      console.log(`✅ Completed stage: ${stage}`);
    },

    async onStageError(stage: string, error: Error): Promise<void> {
      console.error(`❌ Stage ${stage} failed:`, error.message);
    },

    async onComplete(context: PipelineContext): Promise<void> {
      const duration = Date.now() - context.startTime.getTime();
      const errorCount = context.errors.length;

      if (errorCount > 0) {
        console.log(`⚠️  Pipeline completed with ${errorCount} error(s) in ${duration}ms`);
      } else {
        console.log(`✨ Pipeline completed successfully in ${duration}ms`);
      }
    },

    async onError(error: Error): Promise<void> {
      console.error('💥 Pipeline failed:', error.message);
    },
  };
  /* eslint-enable @typescript-eslint/require-await */
  /* eslint-enable no-console */
}

/**
 * Creates a timing hook that tracks stage durations
 *
 * Stores timing information in context metadata
 *
 * @returns Hooks object that tracks timing
 */
export function createTimingHook(): PipelineHooks {
  const stageStartTimes = new Map<string, number>();

  /* eslint-disable @typescript-eslint/require-await */
  return {
    async onStart(context: PipelineContext): Promise<void> {
      context.metadata['timings'] = {};
    },

    async onStageStart(stage: string): Promise<void> {
      stageStartTimes.set(stage, Date.now());
    },

    async onStageComplete(
      stage: string,
      _output: unknown,
      context: PipelineContext
    ): Promise<void> {
      const startTime = stageStartTimes.get(stage);
      if (startTime !== undefined) {
        const duration = Date.now() - startTime;
        const timings = context.metadata['timings'] as Record<string, number> | undefined;
        if (timings !== undefined) {
          timings[stage] = duration;
        }
        stageStartTimes.delete(stage);
      }
    },

    async onStageError(stage: string): Promise<void> {
      stageStartTimes.delete(stage);
    },
  };
  /* eslint-enable @typescript-eslint/require-await */
}
