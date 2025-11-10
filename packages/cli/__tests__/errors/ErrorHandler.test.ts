/**
 * Tests for ErrorHandler
 */

import { ErrorHandler } from '../../src/errors/ErrorHandler';
import {
  CLIError,
  ConfigError,
  ValidationError,
  ExitCode,
} from '../../src/errors/CLIError';

describe('ErrorHandler', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`process.exit: ${code}`);
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('handle', () => {
    it('should handle ValidationError', () => {
      const errors = ['Error 1', 'Error 2'];
      const error = new ValidationError('Validation failed', errors);

      expect(() => ErrorHandler.handle(error)).toThrow('process.exit: 2');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.CONFIG_ERROR);
    });

    it('should handle ValidationError with empty errors', () => {
      const error = new ValidationError('Validation failed', []);

      expect(() => ErrorHandler.handle(error)).toThrow('process.exit: 2');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.CONFIG_ERROR);
    });

    it('should handle ConfigError', () => {
      const error = new ConfigError('Config error');

      expect(() => ErrorHandler.handle(error)).toThrow('process.exit: 2');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.CONFIG_ERROR);
    });

    it('should handle generic CLIError', () => {
      const error = new CLIError('Test error');

      expect(() => ErrorHandler.handle(error)).toThrow('process.exit: 1');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.ERROR);
    });

    it('should handle CLIError in verbose mode', () => {
      const error = new CLIError('Test error');

      expect(() => ErrorHandler.handle(error, true)).toThrow('process.exit: 1');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.ERROR);
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error');

      expect(() => ErrorHandler.handle(error)).toThrow('process.exit: 1');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.ERROR);
    });

    it('should handle generic Error in verbose mode', () => {
      const error = new Error('Generic error');

      expect(() => ErrorHandler.handle(error, true)).toThrow('process.exit: 1');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.ERROR);
    });

    it('should handle unknown error', () => {
      const error = 'string error';

      expect(() => ErrorHandler.handle(error)).toThrow('process.exit: 1');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.ERROR);
    });

    it('should handle null error', () => {
      const error = null;

      expect(() => ErrorHandler.handle(error)).toThrow('process.exit: 1');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.ERROR);
    });

    it('should handle undefined error', () => {
      const error = undefined;

      expect(() => ErrorHandler.handle(error)).toThrow('process.exit: 1');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(ExitCode.ERROR);
    });
  });

  describe('format', () => {
    it('should format CLIError', () => {
      const error = new CLIError('Test error');
      expect(ErrorHandler.format(error)).toBe('CLIError: Test error');
    });

    it('should format ConfigError', () => {
      const error = new ConfigError('Config error');
      expect(ErrorHandler.format(error)).toBe('ConfigError: Config error');
    });

    it('should format generic Error', () => {
      const error = new Error('Generic error');
      expect(ErrorHandler.format(error)).toBe('Error: Generic error');
    });

    it('should format string error', () => {
      expect(ErrorHandler.format('string error')).toBe('string error');
    });

    it('should format null error', () => {
      expect(ErrorHandler.format(null)).toBe('null');
    });

    it('should format undefined error', () => {
      expect(ErrorHandler.format(undefined)).toBe('undefined');
    });

    it('should format number error', () => {
      expect(ErrorHandler.format(42)).toBe('42');
    });
  });
});
