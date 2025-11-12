/**
 * Pipeline Orchestrator - Coordinates multi-stage workflows
 *
 * The orchestrator manages the execution of a series of stages,
 * maintaining context, handling errors, and calling lifecycle hooks.
 */

import { createPipelineContext, type PipelineContext } from './context';
import type { PipelineHooks } from './hooks';

/**
 * Pipeline stage interface
 *
 * A stage represents a single step in the pipeline. Each stage:
 * - Takes input of type TInput
 * - Produces output of type TOutput
 * - Has access to the pipeline context
 * - Can optionally validate its output
 * - Can optionally handle errors
 *
 * @typeParam TInput - Type of input the stage accepts
 * @typeParam TOutput - Type of output the stage produces
 */
export interface PipelineStage<TInput, TOutput> {
  /**
   * Unique name identifying this stage
   */
  name: string;

  /**
   * Execute the stage logic
   *
   * @param input - Input data for the stage
   * @param context - Pipeline context
   * @returns Stage output
   * @throws Error if stage execution fails
   */
  execute(input: TInput, context: PipelineContext): Promise<TOutput>;

  /**
   * Optional output validation
   *
   * @param output - Output to validate
   * @returns True if output is valid
   */
  validate?(output: TOutput): boolean;

  /**
   * Optional error handler
   *
   * Called when the stage throws an error. Can be used for cleanup
   * or to add error information to context.
   *
   * @param error - Error that occurred
   * @param context - Pipeline context
   */
  onError?(error: Error, context: PipelineContext): Promise<void>;
}

/**
 * Pipeline execution result
 */
export interface PipelineResult<T> {
  /**
   * Final output from the last stage
   */
  output: T;

  /**
   * Final pipeline context
   */
  context: PipelineContext;

  /**
   * Execution duration in milliseconds
   */
  duration: number;

  /**
   * Whether pipeline completed successfully
   */
  success: boolean;
}

/**
 * Pipeline execution error
 */
export class PipelineError extends Error {
  public override readonly cause?: Error | undefined;

  constructor(
    message: string,
    public readonly stage: string,
    public readonly context: PipelineContext,
    cause?: Error | undefined
  ) {
    super(message);
    this.name = 'PipelineError';
    this.cause = cause;
  }
}

/**
 * Pipeline Orchestrator
 *
 * Coordinates the execution of multiple stages in sequence,
 * managing context, errors, and lifecycle hooks.
 *
 * @example
 * ```typescript
 * const pipeline = new PipelineOrchestrator()
 *   .addStage(scrapeStage)
 *   .addStage(analyzeStage)
 *   .addHooks(progressHook);
 *
 * const result = await pipeline.run(config);
 * ```
 */
export class PipelineOrchestrator {
  private stages: Array<PipelineStage<unknown, unknown>> = [];
  private hooks: PipelineHooks = {};

  /**
   * Add a stage to the pipeline
   *
   * Stages are executed in the order they are added.
   *
   * @param stage - Stage to add
   * @returns This orchestrator for chaining
   */
  addStage<TInput, TOutput>(stage: PipelineStage<TInput, TOutput>): this {
    this.stages.push(stage as PipelineStage<unknown, unknown>);
    return this;
  }

  /**
   * Set lifecycle hooks
   *
   * @param hooks - Hooks to use during execution
   * @returns This orchestrator for chaining
   */
  addHooks(hooks: PipelineHooks): this {
    this.hooks = hooks;
    return this;
  }

  /**
   * Run the pipeline
   *
   * Executes all stages in sequence, calling hooks at appropriate times.
   *
   * @param input - Initial input for the first stage
   * @returns Pipeline result containing output and context
   * @throws PipelineError if any stage fails
   */
  async run<T>(input: unknown): Promise<PipelineResult<T>> {
    const context = createPipelineContext();
    const startTime = Date.now();

    try {
      // Call onStart hook
      if (this.hooks.onStart !== undefined) {
        await this.hooks.onStart(context);
      }

      // Execute stages sequentially
      let currentInput = input;

      for (const stage of this.stages) {
        currentInput = await this.executeStage(stage, currentInput, context);
      }

      // Call onComplete hook
      if (this.hooks.onComplete !== undefined) {
        await this.hooks.onComplete(context);
      }

      const duration = Date.now() - startTime;

      return {
        output: currentInput as T,
        context,
        duration,
        success: true,
      };
    } catch (error) {
      // Call onError hook
      if (this.hooks.onError !== undefined && error instanceof Error) {
        await this.hooks.onError(error, context);
      }

      // Call onComplete hook even on error
      if (this.hooks.onComplete !== undefined) {
        await this.hooks.onComplete(context);
      }

      // If it's already a PipelineError, rethrow it
      if (error instanceof PipelineError) {
        throw error;
      }

      // Wrap unknown errors
      throw new PipelineError(
        'Pipeline execution failed',
        'unknown',
        context,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Execute a single stage
   *
   * @param stage - Stage to execute
   * @param input - Stage input
   * @param context - Pipeline context
   * @returns Stage output
   * @throws PipelineError if stage fails
   */
  private async executeStage(
    stage: PipelineStage<unknown, unknown>,
    input: unknown,
    context: PipelineContext
  ): Promise<unknown> {
    try {
      // Call onStageStart hook
      if (this.hooks.onStageStart !== undefined) {
        await this.hooks.onStageStart(stage.name, context);
      }

      // Execute stage
      const output = await stage.execute(input, context);

      // Validate output if validator is provided
      if (stage.validate !== undefined && !stage.validate(output)) {
        throw new Error(`Stage ${stage.name} produced invalid output`);
      }

      // Call onStageComplete hook
      if (this.hooks.onStageComplete !== undefined) {
        await this.hooks.onStageComplete(stage.name, output, context);
      }

      return output;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Add error to context
      context.errors.push(err);

      // Call stage's error handler if provided
      if (stage.onError !== undefined) {
        await stage.onError(err, context);
      }

      // Call onStageError hook
      if (this.hooks.onStageError !== undefined) {
        await this.hooks.onStageError(stage.name, err, context);
      }

      // Throw PipelineError
      throw new PipelineError(`Stage ${stage.name} failed: ${err.message}`, stage.name, context, err);
    }
  }

  /**
   * Get the number of stages in the pipeline
   */
  get stageCount(): number {
    return this.stages.length;
  }

  /**
   * Get names of all stages in the pipeline
   */
  getStageNames(): string[] {
    return this.stages.map((stage) => stage.name);
  }

  /**
   * Clear all stages from the pipeline
   */
  clearStages(): void {
    this.stages = [];
  }

  /**
   * Clear hooks from the pipeline
   */
  clearHooks(): void {
    this.hooks = {};
  }
}
