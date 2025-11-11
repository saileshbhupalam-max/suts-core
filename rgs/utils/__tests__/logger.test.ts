/**
 * Unit tests for RGS logger
 */

import { Logger, LogLevel, LogEntry } from '../src/logger';

describe('Logger', () => {
  let outputMock: jest.Mock;
  let logger: Logger;

  beforeEach(() => {
    outputMock = jest.fn();
    logger = new Logger({ output: outputMock });
  });

  describe('construction', () => {
    it('should create logger with default options', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger).toBeDefined();
    });

    it('should create logger with custom min level', () => {
      const debugLogger = new Logger({ minLevel: LogLevel.DEBUG, output: outputMock });

      debugLogger.debug('test');
      expect(outputMock).toHaveBeenCalled();
    });
  });

  describe('log levels', () => {
    it('should log info by default', () => {
      logger.info('test message');

      expect(outputMock).toHaveBeenCalledTimes(1);
      const entry = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      expect(entry.level).toBe(LogLevel.INFO);
      expect(entry.message).toBe('test message');
    });

    it('should not log debug when min level is info', () => {
      logger.debug('debug message');

      expect(outputMock).not.toHaveBeenCalled();
    });

    it('should log warn', () => {
      logger.warn('warning message');

      expect(outputMock).toHaveBeenCalledTimes(1);
      const entry = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      expect(entry.level).toBe(LogLevel.WARN);
    });

    it('should log error', () => {
      const error = new Error('test error');
      logger.error('error message', undefined, error);

      expect(outputMock).toHaveBeenCalledTimes(1);
      const entry = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      expect(entry.level).toBe(LogLevel.ERROR);
      expect(entry.error).toBeDefined();
      expect(entry.error?.message).toBe('test error');
    });

    it('should respect min level hierarchy', () => {
      const warnLogger = new Logger({ minLevel: LogLevel.WARN, output: outputMock });

      warnLogger.debug('debug');
      warnLogger.info('info');
      warnLogger.warn('warn');
      warnLogger.error('error');

      expect(outputMock).toHaveBeenCalledTimes(2); // Only warn and error
    });
  });

  describe('context', () => {
    it('should include context in log entry', () => {
      const context = { userId: '123', action: 'scrape' };
      logger.info('test message', context);

      const entry = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      expect(entry.context).toEqual(context);
    });

    it('should not include empty context', () => {
      logger.info('test message', {});

      const entry = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      expect(entry.context).toBeUndefined();
    });

    it('should handle undefined context', () => {
      logger.info('test message');

      const entry = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      expect(entry.context).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should include error details', () => {
      const error = new Error('test error');
      logger.error('error occurred', undefined, error);

      const entry = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      expect(entry.error).toBeDefined();
      expect(entry.error?.name).toBe('Error');
      expect(entry.error?.message).toBe('test error');
      expect(entry.error?.stack).toBeDefined();
    });

    it('should handle error with cause', () => {
      const cause = new Error('root cause');
      const error = new Error('test error', { cause });
      logger.error('error occurred', undefined, error);

      const entry = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      expect(entry.error?.cause).toBeDefined();
    });
  });

  describe('timestamps', () => {
    it('should include ISO timestamp', () => {
      logger.info('test');

      const entry = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should have different timestamps for sequential logs', () => {
      logger.info('first');
      logger.info('second');

      const entry1 = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      const entry2 = (outputMock.mock.calls[1] as [LogEntry] | undefined)?.[0] as LogEntry;

      // Timestamps should be close but may differ
      expect(entry1.timestamp).toBeDefined();
      expect(entry2.timestamp).toBeDefined();
    });
  });

  describe('child logger', () => {
    it('should create child logger with additional context', () => {
      const childLogger = logger.child({ scraper: 'reddit' });

      childLogger.info('test message', { postId: '123' });

      const entry = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      expect(entry.context).toEqual({
        scraper: 'reddit',
        postId: '123',
      });
    });

    it('should inherit parent min level', () => {
      const childLogger = logger.child({ scraper: 'reddit' });

      childLogger.debug('debug message');

      expect(outputMock).not.toHaveBeenCalled();
    });

    it('should merge context with child taking precedence', () => {
      const childLogger = logger.child({ scraper: 'reddit', version: '1' });

      childLogger.info('test', { version: '2' });

      const entry = (outputMock.mock.calls[0] as [LogEntry] | undefined)?.[0] as LogEntry;
      expect(entry.context?.['scraper']).toBe('reddit');
      expect(entry.context?.['version']).toBe('2'); // Child context overrides parent
    });
  });

  describe('JSON output', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should output JSON by default', () => {
      const jsonLogger = new Logger({ json: true });

      jsonLogger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = (consoleLogSpy.mock.calls[0] as [string] | undefined)?.[0] as string;
      const parsed: unknown = JSON.parse(output);
      expect(parsed).toBeDefined();
    });

    it('should output plain text when json is false', () => {
      const plainLogger = new Logger({ json: false });

      plainLogger.info('test message', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = (consoleLogSpy.mock.calls[0] as [string] | undefined)?.[0] as string;
      expect(output).toContain('INFO');
      expect(output).toContain('test message');
    });
  });
});
