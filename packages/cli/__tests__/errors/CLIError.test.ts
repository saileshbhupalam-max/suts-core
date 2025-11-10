/**
 * Tests for CLI errors
 */

import {
  CLIError,
  ConfigError,
  FileNotFoundError,
  ValidationError,
  SimulationError,
  ExitCode,
} from '../../src/errors/CLIError';

describe('CLIError', () => {
  it('should create a CLIError with default exit code', () => {
    const error = new CLIError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CLIError);
    expect(error.message).toBe('Test error');
    expect(error.exitCode).toBe(ExitCode.ERROR);
    expect(error.name).toBe('CLIError');
  });

  it('should create a CLIError with custom exit code', () => {
    const error = new CLIError('Test error', ExitCode.CONFIG_ERROR);
    expect(error.exitCode).toBe(ExitCode.CONFIG_ERROR);
  });

  it('should have a stack trace', () => {
    const error = new CLIError('Test error');
    expect(error.stack).toBeDefined();
  });
});

describe('ConfigError', () => {
  it('should create a ConfigError', () => {
    const error = new ConfigError('Config test error');
    expect(error).toBeInstanceOf(CLIError);
    expect(error.message).toBe('Config test error');
    expect(error.exitCode).toBe(ExitCode.CONFIG_ERROR);
    expect(error.name).toBe('ConfigError');
  });
});

describe('FileNotFoundError', () => {
  it('should create a FileNotFoundError', () => {
    const error = new FileNotFoundError('/path/to/file');
    expect(error).toBeInstanceOf(CLIError);
    expect(error.message).toBe('File not found: /path/to/file');
    expect(error.exitCode).toBe(ExitCode.CONFIG_ERROR);
    expect(error.name).toBe('FileNotFoundError');
  });
});

describe('ValidationError', () => {
  it('should create a ValidationError with errors array', () => {
    const errors = ['Error 1', 'Error 2'];
    const error = new ValidationError('Validation failed', errors);
    expect(error).toBeInstanceOf(CLIError);
    expect(error.message).toBe('Validation failed');
    expect(error.exitCode).toBe(ExitCode.CONFIG_ERROR);
    expect(error.name).toBe('ValidationError');
    expect(error.errors).toEqual(errors);
  });

  it('should create a ValidationError with empty errors array', () => {
    const error = new ValidationError('Validation failed', []);
    expect(error.errors).toEqual([]);
  });
});

describe('SimulationError', () => {
  it('should create a SimulationError', () => {
    const error = new SimulationError('Simulation failed');
    expect(error).toBeInstanceOf(CLIError);
    expect(error.message).toBe('Simulation failed');
    expect(error.exitCode).toBe(ExitCode.ERROR);
    expect(error.name).toBe('SimulationError');
  });
});

describe('ExitCode', () => {
  it('should have correct exit code values', () => {
    expect(ExitCode.SUCCESS).toBe(0);
    expect(ExitCode.ERROR).toBe(1);
    expect(ExitCode.CONFIG_ERROR).toBe(2);
  });
});
