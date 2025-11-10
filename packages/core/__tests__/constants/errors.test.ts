/**
 * Tests for error constants
 */

import { describe, it, expect } from '@jest/globals';
import {
  ERROR_CATEGORIES,
  ERROR_CODES,
  ERROR_MESSAGES,
  getErrorCategory,
} from '../../src/constants/errors';

describe('ERROR_CATEGORIES', () => {
  it('should have all expected categories', () => {
    expect(ERROR_CATEGORIES.VALIDATION).toBe('VALIDATION');
    expect(ERROR_CATEGORIES.CONFIGURATION).toBe('CONFIGURATION');
    expect(ERROR_CATEGORIES.SIMULATION).toBe('SIMULATION');
    expect(ERROR_CATEGORIES.PERSONA).toBe('PERSONA');
    expect(ERROR_CATEGORIES.TELEMETRY).toBe('TELEMETRY');
    expect(ERROR_CATEGORIES.ANALYSIS).toBe('ANALYSIS');
    expect(ERROR_CATEGORIES.PRODUCT).toBe('PRODUCT');
    expect(ERROR_CATEGORIES.SYSTEM).toBe('SYSTEM');
    expect(ERROR_CATEGORIES.API).toBe('API');
    expect(ERROR_CATEGORIES.NETWORK).toBe('NETWORK');
  });
});

describe('ERROR_CODES', () => {
  it('should have validation error codes', () => {
    expect(ERROR_CODES.INVALID_SCHEMA).toBe('ERR_1000');
    expect(ERROR_CODES.INVALID_PERSONA).toBe('ERR_1001');
    expect(ERROR_CODES.MISSING_REQUIRED_FIELD).toBe('ERR_1005');
  });

  it('should have simulation error codes', () => {
    expect(ERROR_CODES.SIMULATION_NOT_FOUND).toBe('ERR_1200');
    expect(ERROR_CODES.SIMULATION_FAILED).toBe('ERR_1203');
    expect(ERROR_CODES.SIMULATION_TIMEOUT).toBe('ERR_1204');
  });

  it('should have persona error codes', () => {
    expect(ERROR_CODES.PERSONA_NOT_FOUND).toBe('ERR_1300');
    expect(ERROR_CODES.PERSONA_GENERATION_FAILED).toBe('ERR_1301');
  });
});

describe('ERROR_MESSAGES', () => {
  it('should have message for every error code', () => {
    for (const code of Object.values(ERROR_CODES)) {
      expect(ERROR_MESSAGES[code]).toBeDefined();
      expect(typeof ERROR_MESSAGES[code]).toBe('string');
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });
});

describe('getErrorCategory', () => {
  it('should return VALIDATION for 1000-1099 codes', () => {
    expect(getErrorCategory(ERROR_CODES.INVALID_SCHEMA)).toBe('VALIDATION');
    expect(getErrorCategory(ERROR_CODES.INVALID_PERSONA)).toBe('VALIDATION');
  });

  it('should return CONFIGURATION for 1100-1199 codes', () => {
    expect(getErrorCategory(ERROR_CODES.CONFIG_NOT_FOUND)).toBe('CONFIGURATION');
    expect(getErrorCategory(ERROR_CODES.CONFIG_INVALID)).toBe('CONFIGURATION');
  });

  it('should return SIMULATION for 1200-1299 codes', () => {
    expect(getErrorCategory(ERROR_CODES.SIMULATION_NOT_FOUND)).toBe('SIMULATION');
    expect(getErrorCategory(ERROR_CODES.SIMULATION_FAILED)).toBe('SIMULATION');
  });

  it('should return PERSONA for 1300-1399 codes', () => {
    expect(getErrorCategory(ERROR_CODES.PERSONA_NOT_FOUND)).toBe('PERSONA');
    expect(getErrorCategory(ERROR_CODES.PERSONA_GENERATION_FAILED)).toBe('PERSONA');
  });

  it('should return TELEMETRY for 1400-1499 codes', () => {
    expect(getErrorCategory(ERROR_CODES.TELEMETRY_RECORD_FAILED)).toBe('TELEMETRY');
  });

  it('should return ANALYSIS for 1500-1599 codes', () => {
    expect(getErrorCategory(ERROR_CODES.ANALYSIS_FAILED)).toBe('ANALYSIS');
  });

  it('should return PRODUCT for 1600-1699 codes', () => {
    expect(getErrorCategory(ERROR_CODES.PRODUCT_NOT_CONNECTED)).toBe('PRODUCT');
  });

  it('should return SYSTEM for 1700-1799 codes', () => {
    expect(getErrorCategory(ERROR_CODES.SYSTEM_ERROR)).toBe('SYSTEM');
  });

  it('should return API for 1800-1899 codes', () => {
    expect(getErrorCategory(ERROR_CODES.API_ERROR)).toBe('API');
    expect(getErrorCategory(ERROR_CODES.RATE_LIMIT_EXCEEDED)).toBe('API');
  });

  it('should return NETWORK for 1900-1999 codes', () => {
    expect(getErrorCategory(ERROR_CODES.NETWORK_ERROR)).toBe('NETWORK');
  });
});
