module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    './src/**/*.ts': {
      statements: 95,
      branches: 90,
      functions: 90,
      lines: 95
    }
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '\\.d\\.ts$']
};
