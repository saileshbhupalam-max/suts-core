/**
 * Tests for ProgressBar
 */

import { ProgressBar } from '../../src/progress/ProgressBar';

describe('ProgressBar', () => {
  describe('constructor', () => {
    it('should create progress bar with default enabled setting', () => {
      const bar = new ProgressBar();
      expect(bar.isEnabled()).toBe(true);
    });

    it('should create progress bar with enabled setting', () => {
      const bar = new ProgressBar(true);
      expect(bar.isEnabled()).toBe(true);
    });

    it('should create progress bar with disabled setting', () => {
      const bar = new ProgressBar(false);
      expect(bar.isEnabled()).toBe(false);
    });
  });

  describe('start', () => {
    it('should start progress bar when enabled', () => {
      const bar = new ProgressBar(true);
      expect(() => bar.start(10, 'Test')).not.toThrow();
      bar.stop();
    });

    it('should not throw when disabled', () => {
      const bar = new ProgressBar(false);
      expect(() => bar.start(10, 'Test')).not.toThrow();
    });
  });

  describe('update', () => {
    it('should update progress when enabled', () => {
      const bar = new ProgressBar(true);
      bar.start(10, 'Test');
      expect(() => bar.update(5, 'Half done')).not.toThrow();
      bar.stop();
    });

    it('should not throw when disabled', () => {
      const bar = new ProgressBar(false);
      bar.start(10, 'Test');
      expect(() => bar.update(5, 'Half done')).not.toThrow();
    });

    it('should not throw when not started', () => {
      const bar = new ProgressBar(true);
      expect(() => bar.update(5, 'Test')).not.toThrow();
    });
  });

  describe('increment', () => {
    it('should increment progress when enabled', () => {
      const bar = new ProgressBar(true);
      bar.start(10, 'Test');
      expect(() => bar.increment('Step 1')).not.toThrow();
      bar.stop();
    });

    it('should not throw when disabled', () => {
      const bar = new ProgressBar(false);
      bar.start(10, 'Test');
      expect(() => bar.increment('Step 1')).not.toThrow();
    });

    it('should not throw when not started', () => {
      const bar = new ProgressBar(true);
      expect(() => bar.increment('Test')).not.toThrow();
    });
  });

  describe('stop', () => {
    it('should stop progress bar when enabled', () => {
      const bar = new ProgressBar(true);
      bar.start(10, 'Test');
      expect(() => bar.stop()).not.toThrow();
    });

    it('should not throw when disabled', () => {
      const bar = new ProgressBar(false);
      expect(() => bar.stop()).not.toThrow();
    });

    it('should not throw when not started', () => {
      const bar = new ProgressBar(true);
      expect(() => bar.stop()).not.toThrow();
    });
  });

  describe('setEnabled', () => {
    it('should enable progress bar', () => {
      const bar = new ProgressBar(false);
      bar.setEnabled(true);
      expect(bar.isEnabled()).toBe(true);
    });

    it('should disable progress bar', () => {
      const bar = new ProgressBar(true);
      bar.setEnabled(false);
      expect(bar.isEnabled()).toBe(false);
    });
  });

  describe('isEnabled', () => {
    it('should return enabled state', () => {
      const bar = new ProgressBar(true);
      expect(bar.isEnabled()).toBe(true);

      bar.setEnabled(false);
      expect(bar.isEnabled()).toBe(false);
    });
  });
});
