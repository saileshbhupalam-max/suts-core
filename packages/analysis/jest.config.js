module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    './src/**/*.ts': {
      statements: 95,
      branches: 90,
      functions: 90,
      lines: 95,
    },
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '\\.d\\.ts$'],
  moduleNameMapper: {
    '^@suts/core$': '<rootDir>/../core/src',
    '^@suts/telemetry$': '<rootDir>/../telemetry/src',
  },
  setupFilesAfterEnv: [],
};
