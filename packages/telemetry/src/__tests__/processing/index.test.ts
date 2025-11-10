/**
 * Tests for processing exports
 */

describe('Processing exports', () => {
  it('should export EventAggregator', async () => {
    const processing = await import('../../processing');
    expect(processing.EventAggregator).toBeDefined();
  });

  it('should export PatternDetector', async () => {
    const processing = await import('../../processing');
    expect(processing.PatternDetector).toBeDefined();
  });

  it('should export TimeSeriesAnalyzer', async () => {
    const processing = await import('../../processing');
    expect(processing.TimeSeriesAnalyzer).toBeDefined();
  });
});
