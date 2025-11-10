/**
 * Custom error types for CLI
 */

/**
 * Exit codes for CLI
 */
export enum ExitCode {
  SUCCESS = 0,
  ERROR = 1,
  CONFIG_ERROR = 2,
}

/**
 * Base CLI error class
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public readonly exitCode: ExitCode = ExitCode.ERROR
  ) {
    super(message);
    this.name = 'CLIError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration-related errors
 */
export class ConfigError extends CLIError {
  constructor(message: string) {
    super(message, ExitCode.CONFIG_ERROR);
    this.name = 'ConfigError';
  }
}

/**
 * File not found errors
 */
export class FileNotFoundError extends CLIError {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`, ExitCode.CONFIG_ERROR);
    this.name = 'FileNotFoundError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends CLIError {
  constructor(
    message: string,
    public readonly errors: string[]
  ) {
    super(message, ExitCode.CONFIG_ERROR);
    this.name = 'ValidationError';
  }
}

/**
 * Simulation execution errors
 */
export class SimulationError extends CLIError {
  constructor(message: string) {
    super(message, ExitCode.ERROR);
    this.name = 'SimulationError';
  }
}
