/**
 * Tests for validation utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateRange,
  validateNonEmpty,
  validateArrayLength,
  validateISODate,
  validateEnum,
  validateEmail,
  validateASCIIOnly,
  validateUUID,
  validatePercentage,
  validateProbability,
  validateWithSchema,
  safeValidate,
} from '../../src/utils/validation';
import { z } from 'zod';

describe('validateRange', () => {
  it('should accept values within range', () => {
    expect(validateRange(5, 0, 10)).toBe(5);
    expect(validateRange(0, 0, 10)).toBe(0);
    expect(validateRange(10, 0, 10)).toBe(10);
  });

  it('should reject values below minimum', () => {
    expect(() => validateRange(-1, 0, 10)).toThrow('must be between 0 and 10');
  });

  it('should reject values above maximum', () => {
    expect(() => validateRange(11, 0, 10)).toThrow('must be between 0 and 10');
  });

  it('should use custom field name in error', () => {
    expect(() => validateRange(-1, 0, 10, 'age')).toThrow('age must be between');
  });
});

describe('validateNonEmpty', () => {
  it('should accept non-empty strings', () => {
    expect(validateNonEmpty('hello')).toBe('hello');
    expect(validateNonEmpty(' hello ')).toBe(' hello ');
  });

  it('should reject empty strings', () => {
    expect(() => validateNonEmpty('')).toThrow('cannot be empty');
    expect(() => validateNonEmpty('   ')).toThrow('cannot be empty');
  });

  it('should use custom field name in error', () => {
    expect(() => validateNonEmpty('', 'name')).toThrow('name cannot be empty');
  });
});

describe('validateArrayLength', () => {
  it('should accept arrays with sufficient length', () => {
    expect(validateArrayLength([1, 2, 3], 2)).toEqual([1, 2, 3]);
    expect(validateArrayLength([1], 1)).toEqual([1]);
  });

  it('should reject arrays below minimum length', () => {
    expect(() => validateArrayLength([], 1)).toThrow('must have at least 1 items');
    expect(() => validateArrayLength([1], 2)).toThrow('must have at least 2 items');
  });

  it('should reject non-arrays', () => {
    expect(() => validateArrayLength('not array' as never, 1)).toThrow('must be an array');
  });
});

describe('validateISODate', () => {
  it('should accept valid ISO 8601 dates', () => {
    const dates = [
      '2025-01-10T12:00:00.000Z',
      '2025-01-10T12:00:00Z',
      '2025-01-10T12:00:00.123Z',
    ];

    for (const date of dates) {
      expect(validateISODate(date)).toBe(date);
    }
  });

  it('should reject invalid date formats', () => {
    const invalid = [
      '2025-01-10',
      '2025/01/10',
      'invalid',
      '2025-13-01T00:00:00Z',
    ];

    for (const date of invalid) {
      expect(() => validateISODate(date)).toThrow();
    }
  });
});

describe('validateEnum', () => {
  it('should accept values in enum', () => {
    const allowed = ['red', 'green', 'blue'] as const;
    expect(validateEnum('red', allowed)).toBe('red');
    expect(validateEnum('green', allowed)).toBe('green');
  });

  it('should reject values not in enum', () => {
    const allowed = ['red', 'green', 'blue'] as const;
    expect(() => validateEnum('yellow' as never, allowed)).toThrow('must be one of');
  });
});

describe('validateEmail', () => {
  it('should accept valid emails', () => {
    const emails = [
      'test@example.com',
      'user.name@example.co.uk',
      'user+tag@example.com',
    ];

    for (const email of emails) {
      expect(validateEmail(email)).toBe(email);
    }
  });

  it('should reject invalid emails', () => {
    const invalid = [
      'notanemail',
      '@example.com',
      'user@',
      'user @example.com',
    ];

    for (const email of invalid) {
      expect(() => validateEmail(email)).toThrow('Invalid email format');
    }
  });
});

describe('validateASCIIOnly', () => {
  it('should accept ASCII-only strings', () => {
    expect(validateASCIIOnly('hello world')).toBe('hello world');
    expect(validateASCIIOnly('123!@#')).toBe('123!@#');
  });

  it('should reject non-ASCII characters', () => {
    expect(() => validateASCIIOnly('hello\u00A9')).toThrow('must contain only ASCII');
  });
});

describe('validateUUID', () => {
  it('should accept valid UUIDs', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(validateUUID(uuid)).toBe(uuid);
  });

  it('should accept uppercase UUIDs', () => {
    const uuid = '123E4567-E89B-12D3-A456-426614174000';
    expect(validateUUID(uuid)).toBe(uuid);
  });

  it('should reject invalid UUIDs', () => {
    const invalid = [
      'not-a-uuid',
      '123e4567-e89b-12d3-a456',
      '123e4567e89b12d3a456426614174000',
    ];

    for (const uuid of invalid) {
      expect(() => validateUUID(uuid)).toThrow('Invalid UUID format');
    }
  });
});

describe('validatePercentage', () => {
  it('should accept values 0-100', () => {
    expect(validatePercentage(0)).toBe(0);
    expect(validatePercentage(50)).toBe(50);
    expect(validatePercentage(100)).toBe(100);
  });

  it('should reject values outside 0-100', () => {
    expect(() => validatePercentage(-1)).toThrow();
    expect(() => validatePercentage(101)).toThrow();
  });
});

describe('validateProbability', () => {
  it('should accept values 0-1', () => {
    expect(validateProbability(0)).toBe(0);
    expect(validateProbability(0.5)).toBe(0.5);
    expect(validateProbability(1)).toBe(1);
  });

  it('should reject values outside 0-1', () => {
    expect(() => validateProbability(-0.1)).toThrow();
    expect(() => validateProbability(1.1)).toThrow();
  });
});

describe('validateWithSchema', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().min(0).max(120),
  });

  it('should return validated data for valid input', () => {
    const data = { name: 'John', age: 30 };
    const result = validateWithSchema(schema, data);
    expect(result).toEqual(data);
  });

  it('should throw error for invalid input', () => {
    const data = { name: '', age: 30 };
    expect(() => validateWithSchema(schema, data)).toThrow('Validation failed');
  });

  it('should include field paths in error message', () => {
    const data = { name: 'John', age: -1 };
    expect(() => validateWithSchema(schema, data)).toThrow('age:');
  });
});

describe('safeValidate', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().min(0),
  });

  it('should return success for valid data', () => {
    const data = { name: 'John', age: 30 };
    const result = safeValidate(schema, data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('should return errors for invalid data', () => {
    const data = { name: '', age: 30 };
    const result = safeValidate(schema, data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
