module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/plugins', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    'plugins/*/src/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 90,
      functions: 90,
      lines: 95
    }
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/packages/core/src/$1',
    '^@persona/(.*)$': '<rootDir>/packages/persona/src/$1',
    '^@simulation/(.*)$': '<rootDir>/packages/simulation/src/$1',
    '^@telemetry/(.*)$': '<rootDir>/packages/telemetry/src/$1',
    '^@decision/(.*)$': '<rootDir>/packages/decision/src/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 10000,
  globals: {
    'ts-jest': {
      tsconfig: {
        strict: true,
        noUncheckedIndexedAccess: true,
        noImplicitReturns: true
      }
    }
  },
  setupFiles: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  fakeTimers: {
    enableGlobally: true
  }
};
