/**
 * Tests for TelemetryCollector
 */

import { TelemetryCollector } from '../collector';

describe('TelemetryCollector', () => {
  it('should create instance', () => {
    const collector = new TelemetryCollector();
    expect(collector).toBeInstanceOf(TelemetryCollector);
  });
});
