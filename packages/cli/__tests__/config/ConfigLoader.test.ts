/**
 * Tests for ConfigLoader
 */

import * as path from 'path';
import { ConfigLoader } from '../../src/config/ConfigLoader';
import {
  FileNotFoundError,
  ConfigError,
  ValidationError,
} from '../../src/errors';

const FIXTURES_DIR = path.join(__dirname, '../fixtures');

describe('ConfigLoader', () => {
  describe('load', () => {
    it('should load valid configuration', () => {
      const configPath = path.join(FIXTURES_DIR, 'valid-config.json');
      const config = ConfigLoader.load(configPath);

      expect(config.simulation.personas).toBe(50);
      expect(config.simulation.days).toBe(3);
      expect(config.simulation.product).toBe('test-product');
      expect(config.personas?.diversity).toBe(0.7);
      expect(config.output?.directory).toBe('./test-output');
      expect(config.thresholds?.positioning).toBe(0.5);
    });

    it('should throw FileNotFoundError for non-existent file', () => {
      const configPath = path.join(FIXTURES_DIR, 'non-existent.json');

      expect(() => ConfigLoader.load(configPath)).toThrow(FileNotFoundError);
    });

    it('should throw ConfigError for malformed JSON', () => {
      const configPath = path.join(FIXTURES_DIR, 'malformed.json');

      expect(() => ConfigLoader.load(configPath)).toThrow(ConfigError);
      expect(() => ConfigLoader.load(configPath)).toThrow(/Invalid JSON/);
    });

    it('should throw ValidationError for invalid config', () => {
      const configPath = path.join(FIXTURES_DIR, 'invalid-config.json');

      expect(() => ConfigLoader.load(configPath)).toThrow(ValidationError);
    });

    it('should resolve relative paths', () => {
      const configPath = './__tests__/fixtures/valid-config.json';
      const config = ConfigLoader.load(configPath);

      expect(config.simulation.product).toBe('test-product');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', () => {
      const configPath = path.join(FIXTURES_DIR, 'valid-config.json');
      expect(ConfigLoader.exists(configPath)).toBe(true);
    });

    it('should return false for non-existent file', () => {
      const configPath = path.join(FIXTURES_DIR, 'non-existent.json');
      expect(ConfigLoader.exists(configPath)).toBe(false);
    });
  });

  describe('validate', () => {
    it('should validate valid config object', () => {
      const config = {
        simulation: {
          personas: 100,
          days: 7,
          product: 'test',
        },
      };

      const result = ConfigLoader.validate(config);
      expect(result.simulation.personas).toBe(100);
    });

    it('should apply defaults when validating', () => {
      const config = {
        simulation: {
          product: 'test',
        },
      };

      const result = ConfigLoader.validate(config);
      expect(result.simulation.personas).toBe(100);
      expect(result.simulation.days).toBe(7);
    });

    it('should throw ValidationError for invalid config', () => {
      const config = {
        simulation: {
          personas: -1,
          product: 'test',
        },
      };

      expect(() => ConfigLoader.validate(config)).toThrow(ValidationError);
    });

    it('should throw ValidationError for missing required fields', () => {
      const config = {
        simulation: {},
      };

      expect(() => ConfigLoader.validate(config)).toThrow(ValidationError);
    });

    it('should throw ConfigError for non-object input', () => {
      expect(() => ConfigLoader.validate(null)).toThrow();
      expect(() => ConfigLoader.validate(undefined)).toThrow();
      expect(() => ConfigLoader.validate('string')).toThrow();
      expect(() => ConfigLoader.validate(123)).toThrow();
    });
  });
});
