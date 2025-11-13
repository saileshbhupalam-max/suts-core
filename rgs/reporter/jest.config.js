/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 68,
      functions: 95,
      lines: 92,
      statements: 93
    }
  },
  moduleNameMapper: {
    '^@rgs/core/(.*)$': '<rootDir>/../core/src/$1',
    '^@rgs/core$': '<rootDir>/../core/src/index.ts'
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
