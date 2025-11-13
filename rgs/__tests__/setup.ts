/**
 * Jest setup for RGS E2E tests
 */

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Suppress console logs during tests unless needed
if (process.env['DEBUG'] !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}
