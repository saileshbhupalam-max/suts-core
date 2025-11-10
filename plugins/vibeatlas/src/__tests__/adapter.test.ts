/**
 * Tests for VibeAtlasAdapter
 */

import { VibeAtlasAdapter } from '../adapter';

describe('VibeAtlasAdapter', () => {
  it('should create instance', () => {
    const adapter = new VibeAtlasAdapter();
    expect(adapter).toBeInstanceOf(VibeAtlasAdapter);
  });

  it('should have convertSession method', () => {
    const adapter = new VibeAtlasAdapter();
    const convertMethod = adapter.convertSession.bind(adapter);
    expect(convertMethod).toBeDefined();
    expect(typeof convertMethod).toBe('function');
  });

  it('should return object from convertSession', () => {
    const adapter = new VibeAtlasAdapter();
    const session = {
      id: 'session-1',
      personaId: 'persona-1',
      sessionNumber: 1,
      startTime: new Date(),
      events: [],
    };
    const result = adapter.convertSession(session);
    expect(typeof result).toBe('object');
    expect(result).toEqual({});
  });

  it('should convert with data', () => {
    const adapter = new VibeAtlasAdapter();
    const session = {
      id: 'session-2',
      personaId: 'persona-2',
      sessionNumber: 2,
      startTime: new Date(),
      endTime: new Date(),
      events: [],
      outcome: 'delighted' as const,
      summary: 'Test summary',
    };
    const result = adapter.convertSession(session);
    expect(typeof result).toBe('object');
  });
});
