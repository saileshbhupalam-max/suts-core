/**
 * Tests for Logger
 */

import { Logger, LogLevel } from '../../src/progress/Logger';

describe('Logger', () => {
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

  describe('constructor', () => {
    it('should create logger with default verbose setting', () => {
      const logger = new Logger();
      expect(logger.isVerbose()).toBe(false);
    });

    it('should create logger with verbose enabled', () => {
      const logger = new Logger(true);
      expect(logger.isVerbose()).toBe(true);
    });

    it('should create logger with verbose disabled', () => {
      const logger = new Logger(false);
      expect(logger.isVerbose()).toBe(false);
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      const logger = new Logger();
      logger.info('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), 'test message');
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      const logger = new Logger();
      logger.warn('warning message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), 'warning message');
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      const logger = new Logger();
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.anything(), 'error message');
    });
  });

  describe('success', () => {
    it('should log success message', () => {
      const logger = new Logger();
      logger.success('success message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), 'success message');
    });
  });

  describe('debug', () => {
    it('should log debug message when verbose is enabled', () => {
      const logger = new Logger(true);
      logger.debug('debug message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });

    it('should not log debug message when verbose is disabled', () => {
      const logger = new Logger(false);
      logger.debug('debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('log', () => {
    it('should log info level', () => {
      const logger = new Logger();
      logger.log(LogLevel.INFO, 'info');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log warn level', () => {
      const logger = new Logger();
      logger.log(LogLevel.WARN, 'warn');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log error level', () => {
      const logger = new Logger();
      logger.log(LogLevel.ERROR, 'error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log success level', () => {
      const logger = new Logger();
      logger.log(LogLevel.SUCCESS, 'success');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log debug level when verbose', () => {
      const logger = new Logger(true);
      logger.log(LogLevel.DEBUG, 'debug');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log debug level when not verbose', () => {
      const logger = new Logger(false);
      logger.log(LogLevel.DEBUG, 'debug');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('setVerbose', () => {
    it('should enable verbose mode', () => {
      const logger = new Logger(false);
      logger.setVerbose(true);
      expect(logger.isVerbose()).toBe(true);
    });

    it('should disable verbose mode', () => {
      const logger = new Logger(true);
      logger.setVerbose(false);
      expect(logger.isVerbose()).toBe(false);
    });
  });

  describe('isVerbose', () => {
    it('should return verbose state', () => {
      const logger = new Logger(true);
      expect(logger.isVerbose()).toBe(true);

      logger.setVerbose(false);
      expect(logger.isVerbose()).toBe(false);
    });
  });
});
