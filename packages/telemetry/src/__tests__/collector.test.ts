/**
 * Tests for legacy collector export
 */

describe('Legacy TelemetryCollector', () => {
  it('should export TelemetryCollector class', async () => {
    const { TelemetryCollector } = await import('../collector');
    expect(TelemetryCollector).toBeDefined();
  });

  it('should create TelemetryCollector instance', async () => {
    const { TelemetryCollector } = await import('../collector');
    const collector = new TelemetryCollector();
    expect(collector).toBeDefined();
  });

  it('should have recordEvent method', async () => {
    const { TelemetryCollector } = await import('../collector');
    const collector = new TelemetryCollector();

    // Call the stub method (currently a no-op)
    expect(() => {
      collector.recordEvent('persona-1', 'action', 'install', { frustration: 0.2 }, {});
    }).not.toThrow();
  });

  it('should have recordSessionOutcome method', async () => {
    const { TelemetryCollector } = await import('../collector');
    const collector = new TelemetryCollector();

    // Call the stub method (currently a no-op)
    expect(() => {
      collector.recordSessionOutcome('persona-1', 1, 'success', 120);
    }).not.toThrow();
  });
});
