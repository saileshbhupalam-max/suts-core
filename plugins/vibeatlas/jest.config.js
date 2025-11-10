module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/index.ts',
  ],
  coverageThreshold: {
    './src/**/*.ts': {
      statements: 95,
      branches: 90,
      functions: 90,
      lines: 95,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@suts/core$': '<rootDir>/../../packages/core/src',
    '^@suts/simulation$': '<rootDir>/../../packages/simulation/src',
    '^@suts/telemetry$': '<rootDir>/../../packages/telemetry/src',
    '^@suts/persona$': '<rootDir>/../../packages/persona/src',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
