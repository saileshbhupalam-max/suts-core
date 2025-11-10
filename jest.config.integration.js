const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'integration',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  testTimeout: 30000
};
