const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'e2e',
  testMatch: ['**/tests/e2e/**/*.test.ts'],
  testTimeout: 60000
};
