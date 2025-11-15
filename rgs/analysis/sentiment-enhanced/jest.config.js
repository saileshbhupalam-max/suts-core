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
      branches: 85,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  moduleNameMapper: {
    '^@rgs/core/(.*)$': '<rootDir>/../../core/src/$1',
    '^@rgs/storage/(.*)$': '<rootDir>/../../storage/src/$1',
    '^@rgs/utils/(.*)$': '<rootDir>/../../utils/src/$1'
  }
};
