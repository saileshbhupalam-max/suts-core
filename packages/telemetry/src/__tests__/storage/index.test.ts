/**
 * Tests for storage exports
 */

describe('Storage exports', () => {
  it('should export InMemoryStore', async () => {
    const storage = await import('../../storage');
    expect(storage.InMemoryStore).toBeDefined();
  });

  it('should export QueryBuilder', async () => {
    const storage = await import('../../storage');
    expect(storage.QueryBuilder).toBeDefined();
  });
});
