module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  moduleNameMapper: {
    '^@rgs/core/(.*)$': '<rootDir>/../core/src/$1',
    '^@rgs/calibration/(.*)$': '<rootDir>/src/$1',
    '^@suts/core$': '<rootDir>/../../packages/core/src/index.ts',
  },
};
