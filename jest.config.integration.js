/**
 * Jest configuration for integration tests
 * Extends base configuration with integration-specific settings
 */

const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'integration',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '\\.d\\.ts$'
  ],
  testTimeout: 30000, // 30s default, individual tests can override
  maxWorkers: 4, // Parallel execution for performance

  // Integration-specific coverage settings
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    'plugins/*/src/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/index.ts', // Index files are just re-exports
  ],

  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    }
  },

  // Setup files
  setupFiles: ['<rootDir>/tests/setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],

  // Global setup/teardown
  globalSetup: '<rootDir>/tests/integration/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/integration/globalTeardown.ts',

  // Disable fake timers for integration tests to test real timing
  fakeTimers: {
    enableGlobally: false
  },

  // Verbose output for integration tests
  verbose: true,

  // Fail fast on first error (optional, can be removed if we want all tests to run)
  // bail: 1,
};
