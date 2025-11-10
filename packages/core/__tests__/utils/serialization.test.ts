/**
 * Tests for serialization utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  serialize,
  deserialize,
  safeDeserialize,
  toQueryString,
  fromQueryString,
  deepClone,
  deepEqual,
  sortObjectKeys,
  datesToISOStrings,
  isoStringsToDates,
} from '../../src/utils/serialization';

describe('serialize', () => {
  it('should serialize object to JSON', () => {
    const obj = { name: 'John', age: 30 };
    const result = serialize(obj);
    expect(result).toBe('{"name":"John","age":30}');
  });

  it('should pretty print with option', () => {
    const obj = { name: 'John' };
    const result = serialize(obj, { pretty: true });
    expect(result).toContain('\n');
  });

  it('should sort keys with option', () => {
    const obj = { z: 1, a: 2, m: 3 };
    const result = serialize(obj, { sortKeys: true });
    expect(result).toBe('{"a":2,"m":3,"z":1}');
  });

  it('should throw error for circular references', () => {
    const obj: Record<string, unknown> = { name: 'test' };
    obj['self'] = obj;
    expect(() => serialize(obj)).toThrow('Serialization failed');
  });
});

describe('deserialize', () => {
  it('should deserialize JSON string', () => {
    const json = '{"name":"John","age":30}';
    const result = deserialize(json);
    expect(result).toEqual({ name: 'John', age: 30 });
  });

  it('should throw error for invalid JSON', () => {
    expect(() => deserialize('invalid json')).toThrow('Deserialization failed');
  });

  it('should deserialize arrays', () => {
    const json = '[1,2,3]';
    const result = deserialize<number[]>(json);
    expect(result).toEqual([1, 2, 3]);
  });
});

describe('safeDeserialize', () => {
  it('should return parsed value for valid JSON', () => {
    const json = '{"name":"John"}';
    const result = safeDeserialize(json, {});
    expect(result).toEqual({ name: 'John' });
  });

  it('should return default for invalid JSON', () => {
    const defaultValue = { name: 'default' };
    const result = safeDeserialize('invalid', defaultValue);
    expect(result).toBe(defaultValue);
  });
});

describe('toQueryString', () => {
  it('should convert object to query string', () => {
    const params = { name: 'John', age: 30 };
    const result = toQueryString(params);
    expect(result).toBe('name=John&age=30');
  });

  it('should handle array values', () => {
    const params = { tags: ['a', 'b', 'c'] };
    const result = toQueryString(params);
    expect(result).toBe('tags=a&tags=b&tags=c');
  });

  it('should skip null and undefined values', () => {
    const params = { a: 1, b: null, c: undefined, d: 2 };
    const result = toQueryString(params);
    expect(result).toBe('a=1&d=2');
  });

  it('should encode special characters', () => {
    const params = { text: 'hello world', symbol: '&' };
    const result = toQueryString(params);
    expect(result).toContain('hello%20world');
    expect(result).toContain('%26');
  });
});

describe('fromQueryString', () => {
  it('should parse query string to object', () => {
    const query = 'name=John&age=30';
    const result = fromQueryString(query);
    expect(result).toEqual({ name: 'John', age: '30' });
  });

  it('should handle query string with leading ?', () => {
    const query = '?name=John&age=30';
    const result = fromQueryString(query);
    expect(result).toEqual({ name: 'John', age: '30' });
  });

  it('should handle duplicate keys as arrays', () => {
    const query = 'tag=a&tag=b&tag=c';
    const result = fromQueryString(query);
    expect(result).toEqual({ tag: ['a', 'b', 'c'] });
  });

  it('should decode special characters', () => {
    const query = 'text=hello%20world&symbol=%26';
    const result = fromQueryString(query);
    expect(result).toEqual({ text: 'hello world', symbol: '&' });
  });

  it('should return empty object for empty string', () => {
    expect(fromQueryString('')).toEqual({});
    expect(fromQueryString('?')).toEqual({});
  });
});

describe('deepClone', () => {
  it('should create deep copy of object', () => {
    const obj = { a: { b: { c: 1 } } };
    const clone = deepClone(obj);
    expect(clone).toEqual(obj);
    expect(clone).not.toBe(obj);
    expect(clone.a).not.toBe(obj.a);
  });

  it('should clone arrays', () => {
    const arr = [1, [2, [3, 4]]];
    const clone = deepClone(arr);
    expect(clone).toEqual(arr);
    expect(clone).not.toBe(arr);
    expect(clone[1]).not.toBe(arr[1]);
  });
});

describe('deepEqual', () => {
  it('should return true for equal objects', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { a: 1, b: { c: 2 } };
    expect(deepEqual(obj1, obj2)).toBe(true);
  });

  it('should return false for different objects', () => {
    const obj1 = { a: 1 };
    const obj2 = { a: 2 };
    expect(deepEqual(obj1, obj2)).toBe(false);
  });

  it('should handle key order differences', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 2, a: 1 };
    expect(deepEqual(obj1, obj2)).toBe(true);
  });

  it('should return true for primitives', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('test', 'test')).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
  });

  it('should return false for different types', () => {
    expect(deepEqual(1, '1')).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
  });
});

describe('sortObjectKeys', () => {
  it('should sort object keys', () => {
    const obj = { z: 1, a: 2, m: 3 };
    const sorted = sortObjectKeys(obj);
    expect(Object.keys(sorted as Record<string, unknown>)).toEqual(['a', 'm', 'z']);
  });

  it('should sort nested object keys', () => {
    const obj = { z: { y: 1, x: 2 }, a: 1 };
    const sorted = sortObjectKeys(obj);
    const nested = (sorted as Record<string, unknown>)['z'] as Record<string, unknown>;
    expect(Object.keys(nested)).toEqual(['x', 'y']);
  });

  it('should handle arrays', () => {
    const obj = [{ z: 1, a: 2 }];
    const sorted = sortObjectKeys(obj) as unknown[];
    const firstItem = sorted[0] as Record<string, unknown>;
    expect(Object.keys(firstItem)).toEqual(['a', 'z']);
  });

  it('should handle primitives', () => {
    expect(sortObjectKeys(null)).toBe(null);
    expect(sortObjectKeys(123)).toBe(123);
    expect(sortObjectKeys('test')).toBe('test');
  });
});

describe('datesToISOStrings', () => {
  it('should convert Date to ISO string', () => {
    const date = new Date('2025-01-10T12:00:00.000Z');
    const result = datesToISOStrings(date);
    expect(result).toBe('2025-01-10T12:00:00.000Z');
  });

  it('should convert dates in objects', () => {
    const obj = {
      date: new Date('2025-01-10T12:00:00.000Z'),
      other: 'value',
    };
    const result = datesToISOStrings(obj);
    expect(result.date).toBe('2025-01-10T12:00:00.000Z');
    expect(result.other).toBe('value');
  });

  it('should handle nested objects', () => {
    const obj = {
      nested: {
        date: new Date('2025-01-10T12:00:00.000Z'),
      },
    };
    const result = datesToISOStrings(obj);
    expect(result.nested.date).toBe('2025-01-10T12:00:00.000Z');
  });

  it('should handle arrays', () => {
    const arr = [new Date('2025-01-10T12:00:00.000Z')];
    const result = datesToISOStrings(arr);
    expect(result[0]).toBe('2025-01-10T12:00:00.000Z');
  });
});

describe('isoStringsToDates', () => {
  it('should convert ISO string to Date', () => {
    const isoString = '2025-01-10T12:00:00.000Z';
    const result = isoStringsToDates(isoString) as unknown;
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).toISOString()).toBe(isoString);
  });

  it('should convert dates in objects', () => {
    const obj = {
      date: '2025-01-10T12:00:00.000Z',
      other: 'value',
    };
    const result = isoStringsToDates(obj);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.other).toBe('value');
  });

  it('should handle nested objects', () => {
    const obj = {
      nested: {
        date: '2025-01-10T12:00:00.000Z',
      },
    };
    const result = isoStringsToDates(obj);
    expect(result.nested.date).toBeInstanceOf(Date);
  });

  it('should not convert non-ISO strings', () => {
    const obj = { text: 'not a date' };
    const result = isoStringsToDates(obj);
    expect(result.text).toBe('not a date');
  });
});
