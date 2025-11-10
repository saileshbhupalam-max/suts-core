/**
 * Tests for core package exports
 */

import * as coreExports from '../index';

describe('index', () => {
  it('should export all types', () => {
    expect(coreExports).toHaveProperty('ActionType');
  });

  it('should export all schemas', () => {
    expect(coreExports).toHaveProperty('EmotionalStateSchema');
    expect(coreExports).toHaveProperty('SimulationEventSchema');
    expect(coreExports).toHaveProperty('PersonaProfileSchema');
  });

  it('should have ActionType enum with correct values', () => {
    expect(coreExports.ActionType.INSTALL).toBe('install');
    expect(coreExports.ActionType.CONFIGURE).toBe('configure');
    expect(coreExports.ActionType.USE_FEATURE).toBe('use_feature');
    expect(coreExports.ActionType.READ_DOCS).toBe('read_docs');
    expect(coreExports.ActionType.SEEK_HELP).toBe('seek_help');
    expect(coreExports.ActionType.CUSTOMIZE).toBe('customize');
    expect(coreExports.ActionType.SHARE).toBe('share');
    expect(coreExports.ActionType.UNINSTALL).toBe('uninstall');
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
