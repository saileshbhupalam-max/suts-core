/**
 * Tests for Pipeline Hooks
 */

import { combineHooks, createProgressHook, createTimingHook, type PipelineHooks } from '../src/hooks';
import { createPipelineContext } from '../src/context';

describe('Pipeline Hooks', () => {
  describe('combineHooks', () => {
    it('should combine multiple hooks', async () => {
      const calls: string[] = [];

      const hook1: PipelineHooks = {
        async onStart() {
          calls.push('hook1-start');
        },
      };

      const hook2: PipelineHooks = {
        async onStart() {
          calls.push('hook2-start');
        },
      };

      const combined = combineHooks(hook1, hook2);
      const context = createPipelineContext();

      if (combined.onStart !== undefined) {
        await combined.onStart(context);
      }

      expect(calls).toEqual(['hook1-start', 'hook2-start']);
    });

    it('should handle hooks with different methods', async () => {
      const calls: string[] = [];

      const hook1: PipelineHooks = {
        async onStart() {
          calls.push('hook1-start');
        },
      };

      const hook2: PipelineHooks = {
        async onComplete() {
          calls.push('hook2-complete');
        },
      };

      const combined = combineHooks(hook1, hook2);
      const context = createPipelineContext();

      if (combined.onStart !== undefined) {
        await combined.onStart(context);
      }
      if (combined.onComplete !== undefined) {
        await combined.onComplete(context);
      }

      expect(calls).toEqual(['hook1-start', 'hook2-complete']);
    });

    it('should return undefined for methods not present in any hook', () => {
      const hook1: PipelineHooks = {
        async onStart() {
          // no-op
        },
      };

      const combined = combineHooks(hook1);

      expect(combined.onComplete).toBeUndefined();
      expect(combined.onError).toBeUndefined();
      expect(combined.onStageStart).toBeUndefined();
    });

    it('should continue executing hooks even if one fails', async () => {
      const calls: string[] = [];
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const hook1: PipelineHooks = {
        async onStart() {
          calls.push('hook1-start');
          throw new Error('hook1 failed');
        },
      };

      const hook2: PipelineHooks = {
        async onStart() {
          calls.push('hook2-start');
        },
      };

      const combined = combineHooks(hook1, hook2);
      const context = createPipelineContext();

      if (combined.onStart !== undefined) {
        await combined.onStart(context);
      }

      expect(calls).toEqual(['hook1-start', 'hook2-start']);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should work with empty hooks array', () => {
      const combined = combineHooks();

      expect(combined.onStart).toBeUndefined();
      expect(combined.onComplete).toBeUndefined();
      expect(combined.onError).toBeUndefined();
    });
  });

  describe('createProgressHook', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log pipeline start', async () => {
      const hook = createProgressHook();
      const context = createPipelineContext();

      if (hook.onStart !== undefined) {
        await hook.onStart(context);
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pipeline started at')
      );
    });

    it('should log stage start', async () => {
      const hook = createProgressHook();
      const context = createPipelineContext();

      if (hook.onStageStart !== undefined) {
        await hook.onStageStart('test-stage', context);
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('→ Starting stage: test-stage');
    });

    it('should log stage complete', async () => {
      const hook = createProgressHook();
      const context = createPipelineContext();

      if (hook.onStageComplete !== undefined) {
        await hook.onStageComplete('test-stage', {}, context);
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Completed stage: test-stage');
    });

    it('should log stage error', async () => {
      const hook = createProgressHook();
      const context = createPipelineContext();
      const error = new Error('Test error');

      if (hook.onStageError !== undefined) {
        await hook.onStageError('test-stage', error, context);
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Stage test-stage failed:',
        'Test error'
      );
    });

    it('should log pipeline completion without errors', async () => {
      const hook = createProgressHook();
      const context = createPipelineContext();

      if (hook.onComplete !== undefined) {
        await hook.onComplete(context);
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pipeline completed successfully')
      );
    });

    it('should log pipeline completion with errors', async () => {
      const hook = createProgressHook();
      const context = createPipelineContext();
      context.errors.push(new Error('Test error'));

      if (hook.onComplete !== undefined) {
        await hook.onComplete(context);
      }

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pipeline completed with 1 error(s)')
      );
    });

    it('should log pipeline error', async () => {
      const hook = createProgressHook();
      const context = createPipelineContext();
      const error = new Error('Fatal error');

      if (hook.onError !== undefined) {
        await hook.onError(error, context);
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('💥 Pipeline failed:', 'Fatal error');
    });
  });

  describe('createTimingHook', () => {
    it('should initialize timings metadata on start', async () => {
      const hook = createTimingHook();
      const context = createPipelineContext();

      if (hook.onStart !== undefined) {
        await hook.onStart(context);
      }

      expect(context.metadata['timings']).toEqual({});
    });

    it('should track stage duration', async () => {
      const hook = createTimingHook();
      const context = createPipelineContext();

      if (hook.onStart !== undefined) {
        await hook.onStart(context);
      }

      if (hook.onStageStart !== undefined) {
        await hook.onStageStart('test-stage', context);
      }

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (hook.onStageComplete !== undefined) {
        await hook.onStageComplete('test-stage', {}, context);
      }

      const timings = context.metadata['timings'] as Record<string, number>;
      expect(timings).toBeDefined();
      expect(timings['test-stage']).toBeGreaterThanOrEqual(40);
    });

    it('should track multiple stage durations', async () => {
      const hook = createTimingHook();
      const context = createPipelineContext();

      if (hook.onStart !== undefined) {
        await hook.onStart(context);
      }

      // Stage 1
      if (hook.onStageStart !== undefined) {
        await hook.onStageStart('stage1', context);
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
      if (hook.onStageComplete !== undefined) {
        await hook.onStageComplete('stage1', {}, context);
      }

      // Stage 2
      if (hook.onStageStart !== undefined) {
        await hook.onStageStart('stage2', context);
      }
      await new Promise((resolve) => setTimeout(resolve, 30));
      if (hook.onStageComplete !== undefined) {
        await hook.onStageComplete('stage2', {}, context);
      }

      const timings = context.metadata['timings'] as Record<string, number>;
      expect(timings['stage1']).toBeGreaterThanOrEqual(10);
      expect(timings['stage2']).toBeGreaterThanOrEqual(20);
    });

    it('should clean up on stage error', async () => {
      const hook = createTimingHook();
      const context = createPipelineContext();

      if (hook.onStart !== undefined) {
        await hook.onStart(context);
      }

      if (hook.onStageStart !== undefined) {
        await hook.onStageStart('test-stage', context);
      }

      if (hook.onStageError !== undefined) {
        await hook.onStageError('test-stage', new Error('Test error'), context);
      }

      const timings = context.metadata['timings'] as Record<string, number>;
      expect(timings).toBeDefined();
      expect(timings['test-stage']).toBeUndefined();
    });
  });
});
