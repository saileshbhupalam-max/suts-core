const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'unit',
  testMatch: ['**/tests/unit/**/*.test.ts', '**/__tests__/**/*.test.ts']
};
