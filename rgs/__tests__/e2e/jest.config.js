/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@rgs/core/(.*)$': '<rootDir>/../../core/src/$1',
    '^@rgs/core$': '<rootDir>/../../core/src/index.ts',
    '^@rgs/storage/(.*)$': '<rootDir>/../../storage/src/$1',
    '^@rgs/storage$': '<rootDir>/../../storage/src/index.ts',
    '^@rgs/utils/(.*)$': '<rootDir>/../../utils/src/$1',
    '^@rgs/utils$': '<rootDir>/../../utils/src/index.ts',
    '^@rgs/pipeline/(.*)$': '<rootDir>/../../pipeline/src/$1',
    '^@rgs/pipeline$': '<rootDir>/../../pipeline/src/index.ts',
    '^@rgs/reporter/(.*)$': '<rootDir>/../../reporter/src/$1',
    '^@rgs/reporter$': '<rootDir>/../../reporter/src/index.ts',
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000,
};
