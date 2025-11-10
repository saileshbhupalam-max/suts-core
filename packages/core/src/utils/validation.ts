/**
 * Validation Utilities
 * Common validation functions and helpers
 */

import { z } from 'zod';

/**
 * Validate that a value is within a numeric range
 * @param value - Value to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param fieldName - Field name for error messages
 * @returns Validated value
 * @throws Error if validation fails
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'value'
): number {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}, got ${value}`);
  }
  return value;
}

/**
 * Validate that a string is not empty
 * @param value - Value to validate
 * @param fieldName - Field name for error messages
 * @returns Validated value
 * @throws Error if validation fails
 */
export function validateNonEmpty(value: string, fieldName: string = 'value'): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  return value;
}

/**
 * Validate that an array has minimum length
 * @param arr - Array to validate
 * @param minLength - Minimum required length
 * @param fieldName - Field name for error messages
 * @returns Validated array
 * @throws Error if validation fails
 */
export function validateArrayLength<T>(
  arr: T[],
  minLength: number,
  fieldName: string = 'array'
): T[] {
  if (!Array.isArray(arr)) {
    throw new Error(`${fieldName} must be an array`);
  }
  if (arr.length < minLength) {
    throw new Error(`${fieldName} must have at least ${minLength} items, got ${arr.length}`);
  }
  return arr;
}

/**
 * Validate that a date is valid and in ISO 8601 format
 * @param value - Date string to validate
 * @param fieldName - Field name for error messages
 * @returns Validated date string
 * @throws Error if validation fails
 */
export function validateISODate(value: string, fieldName: string = 'date'): string {
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!dateRegex.test(value)) {
    throw new Error(`${fieldName} must be a valid ISO 8601 date string, got ${value}`);
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName} is not a valid date: ${value}`);
  }

  return value;
}

/**
 * Validate that a value is one of allowed values
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @param fieldName - Field name for error messages
 * @returns Validated value
 * @throws Error if validation fails
 */
export function validateEnum<T>(
  value: T,
  allowedValues: readonly T[],
  fieldName: string = 'value'
): T {
  if (!allowedValues.includes(value)) {
    throw new Error(
      `${fieldName} must be one of [${allowedValues.join(', ')}], got ${value}`
    );
  }
  return value;
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns Validated email
 * @throws Error if validation fails
 */
export function validateEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error(`Invalid email format: ${email}`);
  }
  return email;
}

/**
 * Validate that a string contains only ASCII characters
 * @param value - String to validate
 * @param fieldName - Field name for error messages
 * @returns Validated string
 * @throws Error if validation fails
 */
export function validateASCIIOnly(value: string, fieldName: string = 'value'): string {
  const asciiRegex = /^[\x00-\x7F]*$/;
  if (!asciiRegex.test(value)) {
    throw new Error(`${fieldName} must contain only ASCII characters`);
  }
  return value;
}

/**
 * Validate UUID format
 * @param uuid - UUID to validate
 * @returns Validated UUID
 * @throws Error if validation fails
 */
export function validateUUID(uuid: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error(`Invalid UUID format: ${uuid}`);
  }
  return uuid;
}

/**
 * Validate object against Zod schema with detailed error messages
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data
 * @throws Error with formatted error messages if validation fails
 */
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      throw new Error(`Validation failed:\n${messages.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Safe validation that returns success/error result
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Result object with success flag and data or errors
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.errors.map(err => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    });
    return { success: false, errors };
  }
}

/**
 * Validate percentage (0-100)
 * @param value - Value to validate
 * @param fieldName - Field name for error messages
 * @returns Validated value
 * @throws Error if validation fails
 */
export function validatePercentage(value: number, fieldName: string = 'percentage'): number {
  return validateRange(value, 0, 100, fieldName);
}

/**
 * Validate probability (0-1)
 * @param value - Value to validate
 * @param fieldName - Field name for error messages
 * @returns Validated value
 * @throws Error if validation fails
 */
export function validateProbability(value: number, fieldName: string = 'probability'): number {
  return validateRange(value, 0, 1, fieldName);
}
