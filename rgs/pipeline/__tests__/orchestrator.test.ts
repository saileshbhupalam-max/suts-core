/**
 * Tests for Pipeline Orchestrator
 */

import {
  PipelineOrchestrator,
  PipelineError,
  type PipelineStage,
} from '../src/orchestrator';
import { createPipelineContext, type PipelineContext } from '../src/context';
import type { PipelineHooks } from '../src/hooks';

describe('Pipeline Orchestrator', () => {
  describe('constructor', () => {
    it('should create an empty orchestrator', () => {
      const orchestrator = new PipelineOrchestrator();
      expect(orchestrator.stageCount).toBe(0);
      expect(orchestrator.getStageNames()).toEqual([]);
    });
  });

  describe('addStage', () => {
    it('should add a stage to the pipeline', () => {
      const orchestrator = new PipelineOrchestrator();
      const stage: PipelineStage<number, number> = {
        name: 'test-stage',
        async execute(input: number) {
          return input * 2;
        },
      };

      orchestrator.addStage(stage);

      expect(orchestrator.stageCount).toBe(1);
      expect(orchestrator.getStageNames()).toEqual(['test-stage']);
    });

    it('should support method chaining', () => {
      const orchestrator = new PipelineOrchestrator();
      const stage1: PipelineStage<number, number> = {
        name: 'stage1',
        async execute(input: number) {
          return input * 2;
        },
      };
      const stage2: PipelineStage<number, number> = {
        name: 'stage2',
        async execute(input: number) {
          return input + 10;
        },
      };

      const result = orchestrator.addStage(stage1).addStage(stage2);

      expect(result).toBe(orchestrator);
      expect(orchestrator.stageCount).toBe(2);
    });

    it('should add multiple stages in order', () => {
      const orchestrator = new PipelineOrchestrator();
      const stage1: PipelineStage<number, number> = {
        name: 'stage1',
        async execute(input: number) {
          return input;
        },
      };
      const stage2: PipelineStage<number, number> = {
        name: 'stage2',
        async execute(input: number) {
          return input;
        },
      };

      orchestrator.addStage(stage1).addStage(stage2);

      expect(orchestrator.getStageNames()).toEqual(['stage1', 'stage2']);
    });
  });

  describe('addHooks', () => {
    it('should add hooks to the pipeline', () => {
      const orchestrator = new PipelineOrchestrator();
      const hooks: PipelineHooks = {
        async onStart() {
          // no-op
        },
      };

      const result = orchestrator.addHooks(hooks);

      expect(result).toBe(orchestrator);
    });
  });

  describe('run', () => {
    it('should execute a single stage', async () => {
      const orchestrator = new PipelineOrchestrator();
      const stage: PipelineStage<number, number> = {
        name: 'double',
        async execute(input: number) {
          return input * 2;
        },
      };

      orchestrator.addStage(stage);

      const result = await orchestrator.run<number>(5);

      expect(result.output).toBe(10);
      expect(result.success).toBe(true);
      expect(result.context.errors).toEqual([]);
    });

    it('should execute multiple stages in sequence', async () => {
      const orchestrator = new PipelineOrchestrator();
      const stage1: PipelineStage<number, number> = {
        name: 'double',
        async execute(input: number) {
          return input * 2;
        },
      };
      const stage2: PipelineStage<number, number> = {
        name: 'add-ten',
        async execute(input: number) {
          return input + 10;
        },
      };

      orchestrator.addStage(stage1).addStage(stage2);

      const result = await orchestrator.run<number>(5);

      expect(result.output).toBe(20); // (5 * 2) + 10
      expect(result.success).toBe(true);
    });

    it('should pass context through all stages', async () => {
      const orchestrator = new PipelineOrchestrator();
      const contextValues: string[] = [];

      const stage1: PipelineStage<number, number> = {
        name: 'stage1',
        async execute(input: number, context: PipelineContext) {
          context.metadata['stage1'] = 'ran';
          contextValues.push('stage1');
          return input;
        },
      };

      const stage2: PipelineStage<number, number> = {
        name: 'stage2',
        async execute(input: number, context: PipelineContext) {
          expect(context.metadata['stage1']).toBe('ran');
          contextValues.push('stage2');
          return input;
        },
      };

      orchestrator.addStage(stage1).addStage(stage2);

      await orchestrator.run<number>(1);

      expect(contextValues).toEqual(['stage1', 'stage2']);
    });

    it('should call lifecycle hooks', async () => {
      const orchestrator = new PipelineOrchestrator();
      const hookCalls: string[] = [];

      const stage: PipelineStage<number, number> = {
        name: 'test-stage',
        async execute(input: number) {
          return input;
        },
      };

      const hooks: PipelineHooks = {
        async onStart() {
          hookCalls.push('onStart');
        },
        async onStageStart(stageName: string) {
          hookCalls.push(`onStageStart:${stageName}`);
        },
        async onStageComplete(stageName: string) {
          hookCalls.push(`onStageComplete:${stageName}`);
        },
        async onComplete() {
          hookCalls.push('onComplete');
        },
      };

      orchestrator.addStage(stage).addHooks(hooks);

      await orchestrator.run<number>(1);

      expect(hookCalls).toEqual([
        'onStart',
        'onStageStart:test-stage',
        'onStageComplete:test-stage',
        'onComplete',
      ]);
    });

    it('should validate stage output if validator provided', async () => {
      const orchestrator = new PipelineOrchestrator();
      const stage: PipelineStage<number, number> = {
        name: 'positive-only',
        async execute(input: number) {
          return input;
        },
        validate(output: number): boolean {
          return output > 0;
        },
      };

      orchestrator.addStage(stage);

      // Valid output
      const result1 = await orchestrator.run<number>(5);
      expect(result1.success).toBe(true);

      // Invalid output
      orchestrator.clearStages();
      orchestrator.addStage(stage);
      await expect(orchestrator.run<number>(-5)).rejects.toThrow(PipelineError);
    });

    it('should throw PipelineError if stage fails', async () => {
      const orchestrator = new PipelineOrchestrator();
      const stage: PipelineStage<number, number> = {
        name: 'failing-stage',
        async execute() {
          throw new Error('Stage failed');
        },
      };

      orchestrator.addStage(stage);

      await expect(orchestrator.run<number>(1)).rejects.toThrow(PipelineError);
    });

    it('should call stage onError handler when stage fails', async () => {
      let errorHandlerCalled = false;

      const orchestrator = new PipelineOrchestrator();
      const stage: PipelineStage<number, number> = {
        name: 'failing-stage',
        async execute() {
          throw new Error('Test error');
        },
        async onError() {
          errorHandlerCalled = true;
        },
      };

      orchestrator.addStage(stage);

      await expect(orchestrator.run<number>(1)).rejects.toThrow(PipelineError);
      expect(errorHandlerCalled).toBe(true);
    });

    it('should call onStageError hook when stage fails', async () => {
      let hookCalled = false;

      const orchestrator = new PipelineOrchestrator();
      const stage: PipelineStage<number, number> = {
        name: 'failing-stage',
        async execute() {
          throw new Error('Test error');
        },
      };

      const hooks: PipelineHooks = {
        async onStageError() {
          hookCalled = true;
        },
      };

      orchestrator.addStage(stage).addHooks(hooks);

      await expect(orchestrator.run<number>(1)).rejects.toThrow(PipelineError);
      expect(hookCalled).toBe(true);
    });

    it('should call onError hook when pipeline fails', async () => {
      let hookCalled = false;

      const orchestrator = new PipelineOrchestrator();
      const stage: PipelineStage<number, number> = {
        name: 'failing-stage',
        async execute() {
          throw new Error('Test error');
        },
      };

      const hooks: PipelineHooks = {
        async onError() {
          hookCalled = true;
        },
      };

      orchestrator.addStage(stage).addHooks(hooks);

      await expect(orchestrator.run<number>(1)).rejects.toThrow(PipelineError);
      expect(hookCalled).toBe(true);
    });

    it('should call onComplete hook even when pipeline fails', async () => {
      let completeCalled = false;

      const orchestrator = new PipelineOrchestrator();
      const stage: PipelineStage<number, number> = {
        name: 'failing-stage',
        async execute() {
          throw new Error('Test error');
        },
      };

      const hooks: PipelineHooks = {
        async onComplete() {
          completeCalled = true;
        },
      };

      orchestrator.addStage(stage).addHooks(hooks);

      await expect(orchestrator.run<number>(1)).rejects.toThrow(PipelineError);
      expect(completeCalled).toBe(true);
    });

    it('should add error to context when stage fails', async () => {
      const orchestrator = new PipelineOrchestrator();
      const stage: PipelineStage<number, number> = {
        name: 'failing-stage',
        async execute() {
          throw new Error('Test error');
        },
      };

      orchestrator.addStage(stage);

      try {
        await orchestrator.run<number>(1);
        fail('Expected error to be thrown');
      } catch (error) {
        if (error instanceof PipelineError) {
          expect(error.context.errors).toHaveLength(1);
          expect(error.context.errors[0]?.message).toBe('Test error');
        }
      }
    });

    it('should include execution duration in result', async () => {
      const orchestrator = new PipelineOrchestrator();
      const stage: PipelineStage<number, number> = {
        name: 'slow-stage',
        async execute(input: number) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return input;
        },
      };

      orchestrator.addStage(stage);

      const result = await orchestrator.run<number>(1);

      expect(result.duration).toBeGreaterThanOrEqual(50);
    });

    it('should handle empty pipeline', async () => {
      const orchestrator = new PipelineOrchestrator();
      const result = await orchestrator.run<number>(42);

      expect(result.output).toBe(42);
      expect(result.success).toBe(true);
    });
  });

  describe('clearStages', () => {
    it('should remove all stages', () => {
      const orchestrator = new PipelineOrchestrator();
      const stage: PipelineStage<number, number> = {
        name: 'test',
        async execute(input: number) {
          return input;
        },
      };

      orchestrator.addStage(stage);
      expect(orchestrator.stageCount).toBe(1);

      orchestrator.clearStages();
      expect(orchestrator.stageCount).toBe(0);
      expect(orchestrator.getStageNames()).toEqual([]);
    });
  });

  describe('clearHooks', () => {
    it('should remove all hooks', async () => {
      let hookCalled = false;

      const orchestrator = new PipelineOrchestrator();
      const hooks: PipelineHooks = {
        async onStart() {
          hookCalled = true;
        },
      };

      orchestrator.addHooks(hooks);
      orchestrator.clearHooks();

      await orchestrator.run(1);

      expect(hookCalled).toBe(false);
    });
  });

  describe('PipelineError', () => {
    it('should include stage name and context', () => {
      const context = createPipelineContext();
      const cause = new Error('Original error');
      const error = new PipelineError('Pipeline failed', 'test-stage', context, cause);

      expect(error.message).toBe('Pipeline failed');
      expect(error.stage).toBe('test-stage');
      expect(error.context).toBe(context);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('PipelineError');
    });
  });
});
