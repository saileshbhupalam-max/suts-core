/**
 * Tests for package exports
 */

describe('Package exports', () => {
  it('should export EventCollector', async () => {
    const pkg = await import('../index');
    expect(pkg.EventCollector).toBeDefined();
  });

  it('should export MetricsCalculator', async () => {
    const pkg = await import('../index');
    expect(pkg.MetricsCalculator).toBeDefined();
  });

  it('should export TelemetryCollector', async () => {
    const pkg = await import('../index');
    expect(pkg.TelemetryCollector).toBeDefined();
  });

  it('should export storage classes', async () => {
    const pkg = await import('../index');
    expect(pkg.InMemoryStore).toBeDefined();
    expect(pkg.QueryBuilder).toBeDefined();
  });

  it('should export processing classes', async () => {
    const pkg = await import('../index');
    expect(pkg.EventAggregator).toBeDefined();
    expect(pkg.PatternDetector).toBeDefined();
    expect(pkg.TimeSeriesAnalyzer).toBeDefined();
  });

  it('should export types', async () => {
    const pkg = await import('../index');
    // Just verify the import works without errors
    expect(pkg).toBeDefined();
  });
});
