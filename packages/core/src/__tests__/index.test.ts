/**
 * Tests for core package exports
 */

import * as coreExports from '../index';

describe('index', () => {
  it('should export all types', () => {
    expect(coreExports).toHaveProperty('ACTION_TYPES');
  });

  it('should export all schemas', () => {
    expect(coreExports).toHaveProperty('EmotionalStateSchema');
    expect(coreExports).toHaveProperty('SimulationEventSchema');
    expect(coreExports).toHaveProperty('PersonaProfileSchema');
  });

  it('should have ACTION_TYPES enum with correct values', () => {
    expect(coreExports.ACTION_TYPES.INSTALL).toBe('install');
    expect(coreExports.ACTION_TYPES.CONFIGURE).toBe('configure');
    expect(coreExports.ACTION_TYPES.USE_FEATURE).toBe('use_feature');
    expect(coreExports.ACTION_TYPES.READ_DOCS).toBe('read_docs');
    expect(coreExports.ACTION_TYPES.SEEK_HELP).toBe('seek_help');
    expect(coreExports.ACTION_TYPES.CUSTOMIZE).toBe('customize');
    expect(coreExports.ACTION_TYPES.SHARE).toBe('share');
    expect(coreExports.ACTION_TYPES.UNINSTALL).toBe('uninstall');
  });

  it('should export schemas that can parse valid data', () => {
    const validEmotionalState = {
      frustration: 0.5,
      confidence: 0.8,
      delight: 0.3,
      confusion: 0.2,
    };
    const result = coreExports.EmotionalStateSchema.safeParse(validEmotionalState);
    expect(result.success).toBe(true);
  });
});
