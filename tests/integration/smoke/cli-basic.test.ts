/**
 * Smoke Test: CLI Basic Commands
 * Verifies CLI can be loaded and basic commands work
 */

import { describe, it, expect } from '@jest/globals';
import { main } from '../../../packages/cli/src/index';
import {
  registerRunCommand,
  registerGeneratePersonasCommand,
  registerAnalyzeCommand,
} from '../../../packages/cli/src/commands/index';
import { ConfigLoader } from '../../../packages/cli/src/config/index';
import { ResultsWriter } from '../../../packages/cli/src/output/index';
import { StatusReporter } from '../../../packages/cli/src/progress/index';
import { CLIError, ConfigError } from '../../../packages/cli/src/errors/index';

describe('Smoke: CLI Basic Commands', () => {
  it('should load CLI module without errors', () => {
    expect(main).toBeDefined();
    expect(typeof main).toBe('function');
  });

  it('should have all command modules', () => {
    expect(registerRunCommand).toBeDefined();
    expect(registerGeneratePersonasCommand).toBeDefined();
    expect(registerAnalyzeCommand).toBeDefined();
  });

  it('should have config module', () => {
    expect(ConfigLoader).toBeDefined();
    expect(typeof ConfigLoader.load).toBe('function');
  });

  it('should have output formatter module', () => {
    expect(ResultsWriter).toBeDefined();
  });

  it('should have progress tracker module', () => {
    expect(StatusReporter).toBeDefined();
  });

  it('should have error handling module', () => {
    expect(CLIError).toBeDefined();
    expect(ConfigError).toBeDefined();
  });
});

describe('Smoke: CLI Utilities', () => {
  it('should instantiate ResultsWriter', () => {
    expect(() => new ResultsWriter('./test-output')).not.toThrow();
  });

  it('should instantiate StatusReporter', () => {
    expect(() => new StatusReporter()).not.toThrow();
  });

  it('should create CLIError', () => {
    const error = new CLIError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
  });

  it('should create ConfigError', () => {
    const error = new ConfigError('Test config error');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test config error');
  });
});
