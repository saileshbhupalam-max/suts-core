/**
 * Integration Test Setup
 * Runs after Jest environment is set up, before each test file
 */

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test mode
process.env['NODE_ENV'] = 'test';

// Suppress console output in tests unless explicitly needed
// (individual tests can override this with console.log)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Filter out expected warnings/errors in tests
console.error = (...args: unknown[]): void => {
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress expected test warnings
    if (message.includes('Warning: ReactDOM.render')) {
      return;
    }
    if (message.includes('not wrapped in act')) {
      return;
    }
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: unknown[]): void => {
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress expected test warnings
    if (message.includes('componentWillReceiveProps')) {
      return;
    }
  }
  originalConsoleWarn.apply(console, args);
};

// Set longer timeout for integration tests (can be overridden per-test)
jest.setTimeout(30000); // 30 seconds default

// Add custom matchers if needed
// expect.extend({
//   // Custom matchers can go here
// });
