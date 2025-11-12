module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/bin/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  moduleNameMapper: {
    '^chalk$': '<rootDir>/__mocks__/chalk.ts',
    '^ora$': '<rootDir>/__mocks__/ora.ts',
    '^@rgs/core/(.*)$': '<rootDir>/../core/src/$1',
    '^@rgs/core$': '<rootDir>/../core/src/index.ts',
    '^@rgs/storage/(.*)$': '<rootDir>/../storage/src/$1',
    '^@rgs/storage$': '<rootDir>/../storage/src/index.ts',
    '^@rgs/utils/(.*)$': '<rootDir>/../utils/src/$1',
    '^@rgs/utils$': '<rootDir>/../utils/src/index.ts',
  },
};
