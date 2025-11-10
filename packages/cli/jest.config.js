module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!**/__tests__/**'
  ],
  coverageThreshold: {
    './src/**/*.ts': {
      statements: 95,
      branches: 90,
      functions: 90,
      lines: 95
    }
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '\\.d\\.ts$',
    '__tests__/fixtures/'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/',
    '\\.d\\.ts$'
  ],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/../core/src/$1',
    '^@persona/(.*)$': '<rootDir>/../persona/src/$1',
    '^@simulation/(.*)$': '<rootDir>/../simulation/src/$1',
    '^@telemetry/(.*)$': '<rootDir>/../telemetry/src/$1'
  }
};
