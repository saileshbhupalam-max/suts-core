/**
 * Configuration loader
 */

import * as fs from 'fs';
import * as path from 'path';
import { ZodError } from 'zod';
import { ConfigError, FileNotFoundError, ValidationError } from '../errors';
import { SutsConfig, SutsConfigSchema } from './ConfigSchema';

/**
 * Load and validate simulation configuration
 */
export class ConfigLoader {
  /**
   * Load configuration from a JSON file
   * @param filePath - Path to configuration file
   * @returns Validated configuration object
   * @throws {FileNotFoundError} If file doesn't exist
   * @throws {ConfigError} If file cannot be parsed
   * @throws {ValidationError} If configuration is invalid
   */
  public static load(filePath: string): SutsConfig {
    // Resolve absolute path
    const absolutePath = path.resolve(filePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new FileNotFoundError(absolutePath);
    }

    // Read file content
    let content: string;
    try {
      content = fs.readFileSync(absolutePath, 'utf-8');
    } catch (error) {
      throw new ConfigError(
        `Failed to read configuration file: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Parse JSON
    let rawConfig: unknown;
    try {
      rawConfig = JSON.parse(content);
    } catch (error) {
      throw new ConfigError(
        `Invalid JSON in configuration file: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Validate with Zod schema
    try {
      return SutsConfigSchema.parse(rawConfig);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        throw new ValidationError('Configuration validation failed', errors);
      }
      throw new ConfigError(
        `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if a file exists
   * @param filePath - Path to check
   * @returns True if file exists
   */
  public static exists(filePath: string): boolean {
    return fs.existsSync(path.resolve(filePath));
  }

  /**
   * Validate configuration without loading from file
   * @param config - Configuration object to validate
   * @returns Validated configuration
   * @throws {ValidationError} If configuration is invalid
   */
  public static validate(config: unknown): SutsConfig {
    try {
      return SutsConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        throw new ValidationError('Configuration validation failed', errors);
      }
      throw new ConfigError(
        `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
