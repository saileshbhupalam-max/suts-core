/**
 * Tests for vibeatlas plugin exports
 */

import * as pluginExports from '../index';

describe('vibeatlas plugin exports', () => {
  it('should export VibeAtlasAdapter', () => {
    expect(pluginExports.VibeAtlasAdapter).toBeDefined();
  });

  it('should create VibeAtlasAdapter instance', () => {
    const adapter = new pluginExports.VibeAtlasAdapter();
    expect(adapter).toBeInstanceOf(pluginExports.VibeAtlasAdapter);
  });
});
