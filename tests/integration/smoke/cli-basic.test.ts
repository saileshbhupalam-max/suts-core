/**
 * Smoke Test: CLI Basic Commands
 * Verifies CLI can be loaded and basic commands work
 */

import { describe, it, expect } from '@jest/globals';

describe('Smoke: CLI Basic Commands', () => {
  it('should load CLI module without errors', () => {
    expect(() => require('../../../packages/cli/src/index')).not.toThrow();
    const cli = require('../../../packages/cli/src/index');
    expect(cli.main).toBeDefined();
    expect(typeof cli.main).toBe('function');
  });

  it('should have all command modules', () => {
    const commands = require('../../../packages/cli/src/commands/index');
    expect(commands.registerRunCommand).toBeDefined();
    expect(commands.registerGeneratePersonasCommand).toBeDefined();
    expect(commands.registerAnalyzeCommand).toBeDefined();
  });

  it('should have config module', () => {
    const config = require('../../../packages/cli/src/config/index');
    expect(config.loadConfig).toBeDefined();
    expect(config.validateConfig).toBeDefined();
  });

  it('should have output formatter module', () => {
    const output = require('../../../packages/cli/src/output/index');
    expect(output.OutputFormatter).toBeDefined();
  });

  it('should have progress tracker module', () => {
    const progress = require('../../../packages/cli/src/progress/index');
    expect(progress.ProgressTracker).toBeDefined();
  });

  it('should have error handling module', () => {
    const errors = require('../../../packages/cli/src/errors/index');
    expect(errors.CLIError).toBeDefined();
    expect(errors.ConfigError).toBeDefined();
  });
});

describe('Smoke: CLI Utilities', () => {
  it('should instantiate OutputFormatter', () => {
    const { OutputFormatter } = require('../../../packages/cli/src/output/index');
    expect(() => new OutputFormatter()).not.toThrow();
  });

  it('should instantiate ProgressTracker', () => {
    const { ProgressTracker } = require('../../../packages/cli/src/progress/index');
    expect(() => new ProgressTracker()).not.toThrow();
  });

  it('should create CLIError', () => {
    const { CLIError } = require('../../../packages/cli/src/errors/index');
    const error = new CLIError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
  });

  it('should create ConfigError', () => {
    const { ConfigError } = require('../../../packages/cli/src/errors/index');
    const error = new ConfigError('Test config error');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test config error');
  });
});
