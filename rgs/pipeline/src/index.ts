/**
 * RGS Pipeline - Main Index
 *
 * Exports all pipeline components for coordinating scrape and analysis workflows.
 */

// Core orchestrator
export { PipelineOrchestrator, PipelineError } from './orchestrator';
export type { PipelineStage, PipelineResult } from './orchestrator';

// Context
export { createPipelineContext, isPipelineContext, clonePipelineContext } from './context';
export type { PipelineContext } from './context';

// Hooks
export { combineHooks, createProgressHook, createTimingHook } from './hooks';
export type { PipelineHooks } from './hooks';

// Stages
export { SCRAPE_STAGE, SENTIMENT_STAGE, THEMES_STAGE, createStage } from './stages';
export type { ScrapeConfig, SentimentResult } from './stages';
