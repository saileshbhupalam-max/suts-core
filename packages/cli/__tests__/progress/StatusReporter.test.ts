/**
 * Tests for StatusReporter
 */

import { StatusReporter } from '../../src/progress/StatusReporter';
import { Logger } from '../../src/progress/Logger';
import { ProgressBar } from '../../src/progress/ProgressBar';

describe('StatusReporter', () => {
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
    it('should create reporter with default settings', () => {
      const reporter = new StatusReporter();
      expect(reporter.getLogger()).toBeInstanceOf(Logger);
      expect(reporter.getProgressBar()).toBeInstanceOf(ProgressBar);
    });

    it('should create reporter with verbose logging', () => {
      const reporter = new StatusReporter(true, true);
      expect(reporter.getLogger().isVerbose()).toBe(true);
      expect(reporter.getProgressBar().isEnabled()).toBe(true);
    });

    it('should create reporter without progress bar', () => {
      const reporter = new StatusReporter(false, false);
      expect(reporter.getProgressBar().isEnabled()).toBe(false);
    });
  });

  describe('getLogger', () => {
    it('should return logger instance', () => {
      const reporter = new StatusReporter();
      const logger = reporter.getLogger();
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('getProgressBar', () => {
    it('should return progress bar instance', () => {
      const reporter = new StatusReporter();
      const bar = reporter.getProgressBar();
      expect(bar).toBeInstanceOf(ProgressBar);
    });
  });

  describe('startOperation', () => {
    it('should start operation with progress', () => {
      const reporter = new StatusReporter(false, true);
      expect(() => reporter.startOperation(10, 'Test Operation')).not.toThrow();
      reporter.completeOperation('Done');
    });

    it('should start operation without progress', () => {
      const reporter = new StatusReporter(false, false);
      expect(() => reporter.startOperation(10, 'Test Operation')).not.toThrow();
    });
  });

  describe('updateProgress', () => {
    it('should update progress', () => {
      const reporter = new StatusReporter(false, true);
      reporter.startOperation(10, 'Test');
      expect(() => reporter.updateProgress(5, 'Half done')).not.toThrow();
      reporter.completeOperation('Done');
    });
  });

  describe('completeOperation', () => {
    it('should complete operation', () => {
      const reporter = new StatusReporter(false, true);
      reporter.startOperation(10, 'Test');
      expect(() => reporter.completeOperation('Completed')).not.toThrow();
    });
  });

  describe('reportError', () => {
    it('should report error', () => {
      const reporter = new StatusReporter(false, true);
      reporter.startOperation(10, 'Test');
      expect(() => reporter.reportError('Error occurred')).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
