module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/plugins', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    'plugins/*/src/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/index.ts'
  ],
  coverageThreshold: {
    'packages/simulation/src/**/!(DecisionMaker|SimulationLoop|EventGenerator).ts': {
      statements: 85,
      branches: 75,
      functions: 85,
      lines: 85
    },
    'packages/simulation/src/SimulationLoop.ts': {
      statements: 85,
      branches: 60,
      functions: 69,
      lines: 85
    },
    'packages/simulation/src/state/EventGenerator.ts': {
      statements: 100,
      branches: 66,
      functions: 100,
      lines: 100
    },
    'packages/simulation/src/behavior/DecisionMaker.ts': {
      statements: 50,
      branches: 60,
      functions: 70,
      lines: 50
    }
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/packages/core/src/$1',
    '^@persona/(.*)$': '<rootDir>/packages/persona/src/$1',
    '^@simulation/(.*)$': '<rootDir>/packages/simulation/src/$1',
    '^@telemetry/(.*)$': '<rootDir>/packages/telemetry/src/$1'
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
  // setupFiles: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  fakeTimers: {
    enableGlobally: true
  }
};
