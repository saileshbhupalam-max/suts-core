/**
 * Pipeline Context - Maintains state throughout pipeline execution
 *
 * Context is passed to each stage and can store:
 * - Intermediate results from stages
 * - Errors encountered during execution
 * - Arbitrary metadata
 */

import type { WebSignal } from '@rgs/core/models/signal';
import type { Theme } from '@rgs/core/models/insight';

/**
 * Pipeline execution context
 *
 * The context maintains state as the pipeline progresses through stages.
 * Each stage can read from and write to the context.
 */
export interface PipelineContext {
  /**
   * Pipeline execution start time
   */
  readonly startTime: Date;

  /**
   * Web signals collected during scraping stage
   */
  signals?: WebSignal[];

  /**
   * Sentiment analysis results
   * Stored as pipeline-specific sentiment results
   */
  sentiments?: Array<{
    signalId: string;
    score: number;
    confidence: number;
    label: 'positive' | 'negative' | 'neutral';
  }>;

  /**
   * Extracted themes
   */
  themes?: Theme[];

  /**
   * Errors encountered during pipeline execution
   * Non-fatal errors are collected here while the pipeline continues
   */
  errors: Error[];

  /**
   * Arbitrary metadata for storing custom data
   */
  metadata: Record<string, unknown>;
}

/**
 * Creates a new pipeline context
 *
 * @returns Fresh pipeline context with initialized fields
 */
export function createPipelineContext(): PipelineContext {
  return {
    startTime: new Date(),
    errors: [],
    metadata: {},
  };
}

/**
 * Type guard to check if an object is a valid pipeline context
 *
 * @param value - Value to check
 * @returns True if value is a valid PipelineContext
 */
export function isPipelineContext(value: unknown): value is PipelineContext {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const ctx = value as Partial<PipelineContext>;

  return (
    ctx.startTime instanceof Date &&
    Array.isArray(ctx.errors) &&
    typeof ctx.metadata === 'object' &&
    ctx.metadata !== null
  );
}

/**
 * Clones a pipeline context (shallow copy of arrays and metadata)
 *
 * @param context - Context to clone
 * @returns New context instance with copied values
 */
export function clonePipelineContext(context: PipelineContext): PipelineContext {
  const cloned: PipelineContext = {
    ...context,
    errors: [...context.errors],
    metadata: { ...context.metadata },
  };

  if (context.signals !== undefined) {
    cloned.signals = [...context.signals];
  }

  if (context.sentiments !== undefined) {
    cloned.sentiments = [...context.sentiments];
  }

  if (context.themes !== undefined) {
    cloned.themes = [...context.themes];
  }

  return cloned;
}
