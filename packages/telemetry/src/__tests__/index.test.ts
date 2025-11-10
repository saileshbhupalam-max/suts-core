/**
 * Tests for telemetry package exports
 */

import * as telemetryExports from '../index';

describe('telemetry package exports', () => {
  it('should export TelemetryCollector', () => {
    expect(telemetryExports.TelemetryCollector).toBeDefined();
  });

  it('should create TelemetryCollector instance', () => {
    const collector = new telemetryExports.TelemetryCollector();
    expect(collector).toBeInstanceOf(telemetryExports.TelemetryCollector);
  });
});
